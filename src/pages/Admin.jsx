import { useApp } from '../context.js';

const fmt = ts => new Date(ts).toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

/** FR-19: analyst console - triage reports, curate blocklist, audit log */
export default function Admin() {
  const { S, actions } = useApp();
  const pending = S.reports.filter(r => r.status === 'pending' || r.status === 'escalated');
  return (
    <>
      <h1>Admin console</h1>
      <p className="muted">Triage reports and curate the shared blocklist.</p>
      <section className="stack">
        <h2>Reports to review ({pending.length})</h2>
        {pending.length ? pending.map(r => (
          <div className="card stack" key={r.id}>
            <div style={{ overflowWrap: 'anywhere' }}><b>{r.value.slice(0, 100)}</b><br /><span className="muted small">{r.cat} · {fmt(r.ts)}{r.entity ? ' · entity: ' + r.entity : ''}{r.status === 'escalated' ? ' · escalated' : ''}</span></div>
            {r.desc && <p className="small">{r.desc}</p>}
            <div className="row">
              <button className="btn sm primary" onClick={() => actions.adminAct(r.id, 'approved')}>Approve and block</button>
              <button className="btn sm" onClick={() => actions.adminAct(r.id, 'rejected')}>Reject</button>
              <button className="btn sm" onClick={() => actions.adminAct(r.id, 'escalated')}>Escalate</button>
            </div>
          </div>
        )) : <div className="card empty"><p className="muted">Nothing waiting. Submit a report from “Report a scam” to see it here.</p></div>}
      </section>
      <section className="stack">
        <h2>Blocklist</h2>
        <div className="card stack">
          {S.blacklist.map(b => (
            <div className="linkrow" key={b.id}><span>{b.v} <span className="muted">({b.type} · {b.source})</span></span><button className="btn sm" aria-label={'Remove ' + b.v} onClick={() => actions.removeBlack(b.id)}>Remove</button></div>
          ))}
        </div>
      </section>
      <section className="stack">
        <h2>Audit log</h2>
        <div className="card stack small">{S.audit.length ? S.audit.slice(0, 12).map((a, i) => <div key={i}>{fmt(a.ts)} – {a.t}</div>) : <span className="muted">No actions yet.</span>}</div>
      </section>
    </>
  );
}
