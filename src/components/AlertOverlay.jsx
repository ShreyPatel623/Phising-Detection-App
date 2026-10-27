import Icon from './Icon.jsx';

/** Full-screen warning for Dangerous content (SRS FR-10, section 6.1) */
export default function AlertOverlay({ r, who, onReport, onClose }) {
  return (
    <div className="overlay" role="alertdialog" aria-label="Dangerous content blocked">
      <div className="in">
        <Icon name="Dangerous" />
        <h2>Dangerous: do not open this</h2>
        <p>{who}</p>
        <div className="prev">{r.preview}</div>
        <b>Why we blocked it</b>
        <ul>{r.signals.slice(0, 3).map((s, i) => <li key={i}>{s.t}</li>)}</ul>
        <div className="stack">
          <button className="btn" autoFocus onClick={onReport}>Block and report</button>
          <button className="btn ghost" onClick={onClose}>Dismiss</button>
        </div>
      </div>
    </div>
  );
}
