import { useState } from 'react';
import { useApp } from '../context.js';
import { REPORT_AUTO } from '../store.js';

const fmt = ts => new Date(ts).toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** FR-11 / FR-12: report a scam; repeated reports auto-promote to the shared blocklist */
export default function Report() {
  const { S, actions, toast } = useApp();
  const [cat, setCat] = useState('sms'), [val, setVal] = useState(''), [desc, setDesc] = useState('');
  const mine = S.reports.slice(0, 15);
  const send = () => {
    if (!val.trim()) return toast('Add the link, number or message first.');
    const r = actions.submitReport(cat, val, desc);
    toast(r.status === 'auto-blocked' ? 'Thanks. This is now on the blocklist.' : 'Report sent. Thank you.');
    setVal(''); setDesc('');
  };
  return (
    <>
      <h1>Report a scam</h1>
      <section className="card stack">
        <label className="f">What kind?
          <select value={cat} onChange={e => setCat(e.target.value)}>
            <option value="sms">Text message</option><option value="email">Email</option><option value="url">Link / website</option>
            <option value="call">Phone number</option><option value="ad">Advertisement</option><option value="other">Something else</option>
          </select>
        </label>
        <label className="f">The scam content<span className="hint">Paste the link, phone number or message</span><textarea value={val} onChange={e => setVal(e.target.value)} /></label>
        <label className="f">Anything else we should know?<input type="text" value={desc} onChange={e => setDesc(e.target.value)} /></label>
        <button className="btn primary" onClick={send}>Send report</button>
        <p className="notice">When {REPORT_AUTO} reports match the same link or number, it is added to the blocklist automatically.</p>
      </section>
      <h2>Your reports</h2>
      {mine.length ? (
        <div className="stack">
          {mine.map(r => (
            <div className="card flat row" style={{ justifyContent: 'space-between' }} key={r.id}>
              <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{r.value.slice(0, 70)}<br /><span className="muted small">{fmt(r.ts)}</span></span>
              <span className="tag">{r.status}</span>
            </div>
          ))}
        </div>
      ) : <p className="muted">No reports yet.</p>}
    </>
  );
}
