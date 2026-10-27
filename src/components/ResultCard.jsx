import { useEffect, useRef } from 'react';
import Icon from './Icon.jsx';
import { labelOf } from '../engine/detection.js';
import { NEXT, callLabel } from '../data/content.js';

const SR = { high: 'High concern: ', med: 'Some concern: ', low: 'Minor: ', good: 'Good sign: ', info: '' };

/** Verdict stamp + 0-100 meter + explanation + feedback (SRS FR-9, FR-10, FR-21) */
export default function ResultCard({ r, noFeedback, onFeedback, onReport, onLearn }) {
  const ref = useRef(null);
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ref.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
    if (r.label === 'Dangerous' && !r.invalid) navigator.vibrate?.([120, 60, 120]);
  }, [r.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (r.invalid) return <div className="card flat" role="alert">{r.signals[0].t}</div>;
  const L = r.label, c = L.toLowerCase(), stamp = r.channel === 'call' ? callLabel(L) : L;
  const links = (r.urls || []).filter(u => u.valid && r.channel !== 'url');

  return (
    <article className="card res" aria-label="Scan result" ref={ref}>
      <div className="head">
        <span className={'stamp ' + c} key={r.id}><Icon name={L} />{stamp}</span>
        <div className="score">{r.score}<small>/100</small></div>
      </div>
      <div>
        <div className="meter" style={{ '--s': r.score }}><i /></div>
        <div className="scale"><span>Safe</span><span>Suspicious</span><span>Dangerous</span></div>
      </div>
      <p className={'next ' + c}>{NEXT[L]}</p>
      <div className="stack">
        <h3>Why we say this</h3>
        <ul className="sgs">
          {r.signals.map((s, i) => <li key={i} className={s.lvl}><span className="dot" /><span><span className="sr">{SR[s.lvl]}</span>{s.t}</span></li>)}
        </ul>
      </div>
      {links.length > 0 && (
        <div className="stack">
          <h3>Links found</h3>
          {links.map((u, i) => <div className="linkrow" key={i}><span>{u.host || u.url}</span><span className={'pill ' + labelOf(u.score).toLowerCase()}>{labelOf(u.score)} {u.score}</span></div>)}
        </div>
      )}
      {!noFeedback && (
        <div className="stack">
          <h3>Was this right?</h3>
          <div className="row">
            <button className="btn sm" onClick={() => onFeedback('ok')}>Yes</button>
            <button className="btn sm" onClick={() => onFeedback('fp')}>No, it is safe</button>
            <button className="btn sm" onClick={() => onFeedback('fn')}>No, it is a scam</button>
            <button className="btn sm ghost" onClick={onReport}>Report it</button>
          </div>
        </div>
      )}
      {L !== 'Safe' && <button className="btn ghost" onClick={onLearn}>Learn about this scam type</button>}
      <p className="notice">Checked on your device using address patterns, wording and the offline blocklist. Domain age and live reputation checks (Safe Browsing, VirusTotal) need the cloud service.</p>
    </article>
  );
}
