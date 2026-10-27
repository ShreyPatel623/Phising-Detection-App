import { useState } from 'react';
import { useApp, useTheme } from '../context.js';
import { EMERG } from '../data/content.js';
import { MIN_PASSWORD } from '../auth.js';

/** Defined at module level so it is not re-created (and re-mounted) on every render */
function Switch({ k, checked, title, desc }) {
  const { actions, toast } = useApp();
  return (
    <label className="sw">
      <span>{title}<br /><span className="muted small">{desc}</span></span>
      <input type="checkbox" checked={checked} onChange={e => { actions.setSetting(k, e.target.checked); if (k === 'admin') toast(e.target.checked ? 'Admin console added to More.' : 'Admin console hidden.'); }} />
    </label>
  );
}

/** Log out, change password, delete account (FR-1) */
function AccountCard() {
  const { account, accountApi, logout, toast } = useApp();
  const [panel, setPanel] = useState(null);           // null | 'pw' | 'delete'
  const [f, setF] = useState({ old: '', next: '', del: '' }), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const set = k => e => { setF(p => ({ ...p, [k]: e.target.value })); setErr(''); };
  const open = p => { setPanel(panel === p ? null : p); setF({ old: '', next: '', del: '' }); setErr(''); };

  const changePw = async () => {
    setBusy(true); const r = await accountApi.changePassword(f.old, f.next); setBusy(false);
    if (!r.ok) return setErr(r.error); setPanel(null); toast('Password changed.');
  };
  const del = async () => {
    if (!window.confirm('Permanently delete your account and everything stored for it on this device?')) return;
    setBusy(true); const r = await accountApi.deleteAccount(f.del); setBusy(false); if (!r.ok) setErr(r.error);
  };

  return (
    <section className="card stack">
      <div className="row" style={{ flexWrap: 'nowrap' }}>
        <span className="avatar" aria-hidden="true">{(account.name || '?')[0].toUpperCase()}</span>
        <div style={{ minWidth: 0 }}><b style={{ display: 'block' }}>{account.name}</b><span className="muted small" style={{ overflowWrap: 'anywhere' }}>{account.email}</span></div>
      </div>
      <label className="f">Display name<input type="text" defaultValue={account.name} maxLength={60} onBlur={e => e.target.value.trim() && e.target.value.trim() !== account.name && accountApi.updateName(e.target.value)} /></label>
      <div className="row">
        <button className="btn" onClick={logout}>Log out</button>
        <button className="btn" onClick={() => open('pw')} aria-expanded={panel === 'pw'}>Change password</button>
        <button className="btn ghost" onClick={() => open('delete')} aria-expanded={panel === 'delete'}>Delete account</button>
      </div>
      {panel === 'pw' && (
        <div className="stack">
          <label className="f">Current password<input type="password" autoComplete="current-password" value={f.old} onChange={set('old')} /></label>
          <label className="f">New password<span className="hint">At least {MIN_PASSWORD} characters</span><input type="password" autoComplete="new-password" value={f.next} onChange={set('next')} /></label>
          {err && <div className="err" role="alert">{err}</div>}
          <button className="btn primary" disabled={busy || !f.old || !f.next} onClick={changePw}>Save new password</button>
        </div>
      )}
      {panel === 'delete' && (
        <div className="stack">
          <p className="small muted">This removes your account, scan history, reports and lists from this device. It cannot be undone. Enter your password to confirm.</p>
          <label className="f">Password<input type="password" autoComplete="current-password" value={f.del} onChange={set('del')} /></label>
          {err && <div className="err" role="alert">{err}</div>}
          <button className="btn danger" disabled={busy || !f.del} onClick={del}>Delete my account</button>
        </div>
      )}
    </section>
  );
}

/** YouTube-style appearance picker */
function Appearance() {
  const { theme, setTheme } = useTheme();
  const opts = [['auto', 'Use device theme', 'Matches your phone or computer setting'], ['dark', 'Dark theme', 'Easier on the eyes at night'], ['light', 'Light theme', 'Bright and high-contrast']];
  return (
    <fieldset className="card radios">
      <legend>Appearance</legend>
      {opts.map(([k, t, d]) => (
        <label className="radio" key={k}><input type="radio" name="theme" checked={theme === k} onChange={() => setTheme(k)} /><span>{t}<small>{d}</small></span></label>
      ))}
    </fieldset>
  );
}

/** FR-18 + privacy requirements (SRS 4.3): account, theme, detection options, export / clear data */
export default function Settings() {
  const { S, actions, toast } = useApp();
  const s = S.settings, [json, setJson] = useState('');
  const sw = k => ({ k, checked: !!s[k] });
  return (
    <>
      <h1>Settings and privacy</h1>
      <AccountCard />
      <Appearance />
      <section className="card stack">
        <label className="f">Country<span className="hint">Decides which helplines are shown</span>
          <select value={s.country} onChange={e => actions.setSetting('country', e.target.value)}>{Object.entries(EMERG).map(([k, e]) => <option key={k} value={k}>{e.n}</option>)}</select>
        </label>
      </section>
      <section className="card">
        <Switch {...sw('autoLinks')} title="Check links inside messages" desc="Turn off and links are ignored (less accurate)." />
        <Switch {...sw('strict')} title="Strict mode" desc="Raises every risk score a little. More warnings, some false alarms." />
        <Switch {...sw('keepHistory')} title="Save my history on this device" desc="Turn off and nothing is saved after you scan." />
        <Switch {...sw('admin')} title="Admin console (demo)" desc="Shows the analyst tools in More." />
      </section>
      <section className="card stack">
        <h3>Your data</h3>
        <button className="btn" onClick={() => setJson(JSON.stringify({ user: S.user, history: S.history, reports: S.reports, feedback: S.feedback }, null, 2))}>Show my data (JSON)</button>
        {json && <textarea readOnly value={json} style={{ minHeight: 140, fontSize: '.75rem' }} onFocus={e => e.target.select()} />}
        <button className="btn danger" onClick={() => { if (window.confirm('Clear your scan history, reports and custom lists? Your account stays.')) { actions.resetData(); setJson(''); toast('Your scan data was cleared.'); } }}>Clear my scan data</button>
      </section>
    </>
  );
}
