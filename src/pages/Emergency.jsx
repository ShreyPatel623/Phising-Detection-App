import { useApp } from '../context.js';
import { EMERG } from '../data/content.js';

/** FR-15: immediate remediation checklist + official reporting links by country */
export default function Emergency() {
  const { S, actions, toast } = useApp();
  const e = EMERG[S.settings.country] || EMERG.IN;
  return (
    <>
      <h1>If you think you have been scammed</h1>
      <p className="muted">Act in this order. Speed matters most in the first hour.</p>
      <section className="card stack">
        <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li><b>Stop.</b> Do not send more money, codes or documents.</li>
          <li><b>Call your bank or card issuer</b> now (number on the back of your card) and ask to freeze the card, account or UPI.</li>
          <li><b>Change passwords</b>, starting with your email and banking, and turn on 2-step verification.</li>
          <li><b>Remove any app</b> the scammer asked you to install (AnyDesk, TeamViewer or an .apk file).</li>
          <li><b>Keep proof:</b> screenshots, numbers, links, payment receipts.</li>
          <li><b>Report it</b> to the authorities ({e.n}):</li>
        </ol>
        <div className="stack">
          {e.links.map(([label, href]) => <a key={href} className="btn" style={{ textDecoration: 'none', textAlign: 'center' }} href={href} target="_blank" rel="noopener noreferrer">{label}</a>)}
        </div>
        <button className="btn danger" onClick={() => { actions.submitReport('emergency', `User-reported incident (${S.settings.country})`, 'Emergency report', { priority: 'high' }); toast('Incident logged.'); }}>Log this incident in the app</button>
        <p className="notice">Always confirm helpline numbers on the official government website.</p>
      </section>
    </>
  );
}
