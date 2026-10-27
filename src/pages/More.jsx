import { useApp } from '../context.js';
import { VERSION } from '../engine/detection.js';
import Report from './Report.jsx';
import Emergency from './Emergency.jsx';
import Blocklist from './Blocklist.jsx';
import Settings from './Settings.jsx';
import Admin from './Admin.jsx';

export function BackLink() {
  const { go } = useApp();
  return <button className="back" onClick={() => go('more')}>← Back to More</button>;
}

const SUBPAGES = { report: Report, emergency: Emergency, blocklist: Blocklist, settings: Settings, admin: Admin };

export default function More() {
  const { S, nav, go, account, logout } = useApp();
  const Sub = SUBPAGES[nav.sub];
  if (Sub) return <><BackLink /><Sub /></>;
  const items = [
    ['report', 'Report a scam', 'Help protect others'],
    ['emergency', 'I think I have been scammed', 'Step-by-step help and official helplines'],
    ['blocklist', 'Offline blocklist', 'Check what is stored on this device'],
    ['settings', 'Settings and privacy', 'Features, theme, your data'],
    ...(S.settings.admin ? [['admin', 'Admin console', 'Review reports, manage blocklist']] : []),
  ];
  return (
    <>
      <h1>More</h1>
      <div className="card row" style={{ flexWrap: 'nowrap' }}>
        <span className="avatar" aria-hidden="true">{(account.name || '?')[0].toUpperCase()}</span>
        <div style={{ minWidth: 0, flex: 1 }}><b style={{ display: 'block' }}>{account.name}</b><span className="muted small" style={{ overflowWrap: 'anywhere' }}>{account.email}</span></div>
        <button className="btn sm" onClick={logout}>Log out</button>
      </div>
      <div className="stack">
        {items.map(([k, t, d]) => <button key={k} className="list-btn" onClick={() => go('more', k)}><span style={{ flex: 1 }}>{t}<small>{d}</small></span></button>)}
      </div>
      <p className="notice">Scamwise v{VERSION} · College project demo. Detection runs fully on this device.</p>
    </>
  );
}
