import { useState } from 'react';
import { useApp } from '../context.js';
import Icon from '../components/Icon.jsx';
import { CH } from '../data/content.js';

const fmt = ts => new Date(ts).toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** FR-13: chronological, filterable log of every scan */
export default function History() {
  const { S, go } = useApp();
  const [ch, setCh] = useState('all'), [lb, setLb] = useState('all'), [open, setOpen] = useState(null);
  const rows = S.history.filter(h => (ch === 'all' || h.channel === ch) && (lb === 'all' || h.label === lb));
  return (
    <>
      <h1>Threat history</h1>
      <div className="row">
        <label className="sr" htmlFor="fch">Channel</label>
        <select id="fch" style={{ flex: 1 }} value={ch} onChange={e => setCh(e.target.value)}>
          <option value="all">All channels</option>{Object.entries(CH).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}
        </select>
        <label className="sr" htmlFor="flb">Risk</label>
        <select id="flb" style={{ flex: 1 }} value={lb} onChange={e => setLb(e.target.value)}>
          <option value="all">Any risk</option>{['Safe', 'Suspicious', 'Dangerous'].map(l => <option key={l}>{l}</option>)}
        </select>
      </div>
      {rows.length ? (
        <div className="card" style={{ padding: '4px 14px' }}>
          {rows.map(h => (
            <div key={h.id}>
              <button className="hrow" aria-expanded={open === h.id} onClick={() => setOpen(open === h.id ? null : h.id)}>
                <span className="ico"><Icon name={CH[h.channel][1]} /></span>
                <span className="tx"><b>{h.preview || '(no preview)'}</b><span className="muted small">{CH[h.channel][0]} · {fmt(h.ts)}</span></span>
                <span className={'pill ' + h.label.toLowerCase()}>{h.label} {h.score}</span>
              </button>
              {open === h.id && (
                <div className="hdetail"><ul className="sgs">{h.signals.map((s, i) => <li key={i} className={s.lvl}><span className="dot" /><span>{s.t}</span></li>)}</ul></div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty">
          <p><b>{S.history.length ? 'Nothing matches those filters.' : 'Nothing checked yet.'}</b></p>
          <p className="muted small">Paste something on Home to run your first check.</p>
          <button className="btn primary" onClick={() => go('home')}>Check something</button>
        </div>
      )}
    </>
  );
}
