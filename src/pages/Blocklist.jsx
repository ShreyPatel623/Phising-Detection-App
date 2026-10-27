import { useApp } from '../context.js';
import { TRUSTED_DOMAINS } from '../data/brands.js';

/** FR-16: the on-device blocklist / trusted list that powers offline detection */
export default function Blocklist() {
  const { S } = useApp();
  return (
    <>
      <h1>Offline blocklist</h1>
      <p className="muted">These lists live on your device, so the main checks work with no internet.</p>
      <section className="card stack">
        <div className="row"><span className="tag">{S.blacklist.length} blocked</span><span className="tag">{TRUSTED_DOMAINS.length} built-in trusted sites</span><span className="tag">{S.whitelist.length} trusted by you</span><span className="tag">Last sync: built-in list</span></div>
        <h3>Blocked</h3>
        <div className="stack">{S.blacklist.map(b => <div className="linkrow" key={b.id}><span>{b.v} <span className="muted">({b.type})</span></span><span className="tag">{b.source}</span></div>)}</div>
        <h3>Trusted by you</h3>
        <div className="stack">{S.whitelist.length ? S.whitelist.slice(-8).map(b => <div className="linkrow" key={b.id}><span>{b.v}</span></div>) : <p className="muted small">Nothing yet. When a result says “No, it is safe”, that site is added here.</p>}</div>
      </section>
    </>
  );
}
