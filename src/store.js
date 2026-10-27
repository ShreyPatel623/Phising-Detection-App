/**
 * Data layer (SRS section 5). Everything lives on-device in localStorage, one
 * separate record per logged-in account (see auth.js dataKey):
 * ThreatHistory, ThreatReport, Feedback, Blacklist, Whitelist (user's own), audit log.
 * Built-in trusted sites live in data/brands.js, not here.
 *
 * useStore() keeps the state in a ref (so actions can read the latest value
 * synchronously) and bumps a version counter to re-render React.
 */
import { useRef, useState, useMemo, useCallback } from 'react';
import { createEngine, fnv, uid } from './engine/detection.js';
import { SEED_BLACK } from './data/seed.js';
import { dataKey } from './auth.js';

export const REPORT_AUTO = 3; // identical reports within 24h before auto-block (SRS FR-12 suggests 5)

const DEFAULT = {
  user: null, history: [], reports: [], blacklist: [], whitelist: [], feedback: [], audit: [], quizBest: 0, seeded: false,
  settings: { strict: false, autoLinks: true, keepHistory: true, country: 'IN', admin: false },
};

function seed(s) {
  s.blacklist = SEED_BLACK.map(([type, v]) => ({ id: uid(), type, v, h: fnv(type + ':' + v), source: 'seed', conf: 95, added: Date.now() }));
  s.whitelist = []; // the user's own "this is safe" list; built-in trusted sites are in data/brands.js
  s.seeded = true;
}
function loadState(account) {
  let s = null;
  try { s = JSON.parse(localStorage.getItem(dataKey(account.id))); } catch { /* storage unavailable or corrupt */ }
  if (!s) { s = JSON.parse(JSON.stringify(DEFAULT)); s.settings.country = account.country || 'IN'; }
  s.settings = { ...DEFAULT.settings, ...s.settings }; delete s.settings.theme;
  if (!s.seeded) seed(s);
  s.user = { id: account.id, name: account.name, email: account.email };
  return s;
}
const persist = (id, s) => { try { localStorage.setItem(dataKey(id), JSON.stringify(s)); } catch { /* ignore */ } };

export function useStore(account) {
  const ref = useRef(null);
  if (!ref.current) ref.current = loadState(account);
  if (ref.current.user.name !== account.name) ref.current.user = { ...ref.current.user, name: account.name }; // name edited in Settings
  const [version, setVersion] = useState(0);
  const verRef = useRef(0);
  const envCache = useRef({ v: -1, env: null });

  // Engine reads the latest lists/settings through this cached getter.
  const engine = useMemo(() => createEngine(() => {
    if (envCache.current.v !== verRef.current) {
      const s = ref.current;
      envCache.current = { v: verRef.current, env: { BL: new Map(s.blacklist.map(e => [e.h, e])), WL: new Set(s.whitelist.map(e => e.h)), reports: s.reports, settings: s.settings } };
    }
    return envCache.current.env;
  }), []);

  /** Apply a mutation to a copy of the state, persist, re-render. Returns fn's result. */
  const commit = useCallback(fn => {
    const next = structuredClone(ref.current);
    const out = fn(next);
    ref.current = next; verRef.current += 1; persist(account.id, next); setVersion(verRef.current);
    return out;
  }, [account.id]);

  const S = ref.current;
  const addBlackD = (d, type, v, source) => { const h = fnv(type + ':' + v); if (d.blacklist.some(e => e.h === h)) return false; d.blacklist.push({ id: uid(), type, v, h, source, conf: 80, added: Date.now() }); return true; };
  const addWhiteD = (d, v) => { const h = fnv('domain:' + v); if (d.whitelist.some(e => e.h === h)) return false; d.whitelist.push({ id: uid(), type: 'domain', v, h, added: Date.now() }); return true; };

  const actions = useMemo(() => ({
    setSetting: (k, v) => commit(d => { d.settings[k] = v; }),
    record: res => { if (res.invalid) return; commit(d => { if (!d.settings.keepHistory) return; d.history.unshift({ id: res.id, ts: res.ts, channel: res.channel, preview: res.preview, score: res.score, label: res.label, signals: res.signals.slice(0, 6).map(({ t, lvl }) => ({ t, lvl })) }); d.history = d.history.slice(0, 300); }); },
    addBlack: (type, v, source) => commit(d => addBlackD(d, type, v, source)),
    /** Block every link domain / phone number found in a scan result */
    blockFromResult: (r, source) => commit(d => { (r.urls || []).forEach(u => u.rd && !u.trusted && addBlackD(d, 'domain', u.rd, source)); if (r.entity) addBlackD(d, r.entityType, r.entity, source); }),
    removeBlack: id => commit(d => { d.blacklist = d.blacklist.filter(b => b.id !== id); d.audit.unshift({ ts: Date.now(), t: 'Removed a blocklist entry' }); }),
    /** FR-11 + FR-12: store a report; auto-promote to blocklist when corroborated */
    submitReport: (cat, value, desc, extra = {}) => commit(d => {
      value = value.trim(); if (!value) return null;
      let entity = null, entityType = null;
      if (cat === 'call' || /^\+?[\d\s().-]{7,17}$/.test(value)) { entity = value.replace(/\D/g, '').slice(-10); entityType = 'phone'; }
      else { const u = engine.extractUrls(value)[0]; if (u) { const a = engine.analyzeURL(u); if (a.valid && a.rd) { entity = a.rd; entityType = 'domain'; } } }
      const rep = { id: uid(), cat, value, desc, entity, entityType, status: 'pending', ts: Date.now(), ...extra };
      d.reports.unshift(rep);
      if (entity) {
        const n = d.reports.filter(r => r.entity === entity && Date.now() - r.ts < 864e5).length;
        if (n >= REPORT_AUTO && addBlackD(d, entityType, entity, 'community')) { rep.status = 'auto-blocked'; d.audit.unshift({ ts: Date.now(), t: `Auto-blocked ${entity} after ${n} reports` }); }
      }
      return rep;
    }),
    /** FR-19: admin triage */
    adminAct: (id, status) => commit(d => { const r = d.reports.find(x => x.id === id); if (!r) return; r.status = status; r.resolvedAt = Date.now(); if (status === 'approved' && r.entity) addBlackD(d, r.entityType, r.entity, 'admin'); d.audit.unshift({ ts: Date.now(), t: `${status}: ${r.entity || r.value.slice(0, 40)}` }); }),
    /** FR-21: user feedback loop. Returns a message for the toast. */
    feedback: (r, v) => commit(d => {
      d.feedback.push({ id: uid(), ref: r.id, type: v === 'ok' ? 'correct' : v === 'fp' ? 'false_positive' : 'false_negative', ts: Date.now() });
      if (v === 'fp') { const doms = (r.urls || []).filter(u => u.rd && !u.trusted).map(u => u.rd); doms.forEach(x => addWhiteD(d, x)); return doms.length ? `Thanks. We will trust ${doms.join(', ')} on this device.` : 'Thanks. Marked as safe.'; }
      if (v === 'fn') { (r.urls || []).forEach(u => u.rd && addBlackD(d, 'domain', u.rd, 'user-feedback')); if (r.entity) addBlackD(d, r.entityType, r.entity, 'user-feedback'); return 'Thanks. Added to your blocklist.'; }
      return 'Thanks for confirming.';
    }),
    setQuizBest: n => commit(d => { if (n > d.quizBest) d.quizBest = n; }),
    /** Clear history, reports, feedback and custom lists (the account stays) */
    resetData: () => commit(d => { const { user, settings } = d; Object.keys(d).forEach(k => delete d[k]); Object.assign(d, JSON.parse(JSON.stringify(DEFAULT)), { user, settings }); seed(d); }),
  }), [commit, engine]);

  return { S, version, engine, actions };
}
