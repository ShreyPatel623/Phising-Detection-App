import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useStore } from './store.js';
import { makeAuth } from './auth.js';
import { useThemeState } from './theme.js';
import { AppCtx, ThemeCtx } from './context.js';
import { SAMPLES } from './data/content.js';
import { uid } from './engine/detection.js';
import Icon from './components/Icon.jsx';
import ThemeToggle from './components/ThemeToggle.jsx';
import AlertOverlay from './components/AlertOverlay.jsx';
import AuthScreen from './pages/Auth.jsx';
import Home from './pages/Home.jsx';
import Scan from './pages/Scan.jsx';
import History from './pages/History.jsx';
import Learn from './pages/Learn.jsx';
import More from './pages/More.jsx';

const NAV = [['home', 'Home'], ['scan', 'Scan'], ['history', 'History'], ['learn', 'Learn'], ['more', 'More']];
const PAGES = { home: Home, scan: Scan, history: History, learn: Learn, more: More };
const Logo = () => <span className="logo"><Icon name="shield" />Scamwise</span>;

export default function App() {
  const theme = useThemeState();
  const auth = useMemo(() => makeAuth(), []);
  const [account, setAccount] = useState(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => auth.observe(user => {
    setAccount(user);
    setAuthReady(true);
  }), [auth]);

  const logout = useCallback(async () => {
    try { await auth.clearSession(); }
    catch (error) { console.error('Logout failed:', error); }
    window.scrollTo(0, 0);
  }, [auth]);

  const login = acc => setAccount(acc);

  return (
    <ThemeCtx.Provider value={theme}>
      {!authReady ? (
        <div id="app"><header className="top"><Logo /></header><main id="view"><p className="muted">Connecting to Scamwise…</p></main></div>
      ) : account ? (
        <Workspace key={account.id} account={account} auth={auth} setAccount={setAccount} logout={logout} />
      ) : (
        <div id="app">
          <header className="top"><Logo /><div className="right"><ThemeToggle /></div></header>
          <main id="view"><AuthScreen auth={auth} onAuthed={login} /></main>
        </div>
      )}
    </ThemeCtx.Provider>
  );
}

function Workspace({ account, auth, setAccount, logout }) {
  const { S, engine, actions } = useStore(account);
  const [nav, setNav] = useState({ route: 'home', sub: null });
  const [toasts, setToasts] = useState([]);
  const [banner, setBanner] = useState(null);
  const [alert, setAlert] = useState(null);
  const results = useRef({});
  const demoIdx = useRef(0);

  const go = useCallback((route, sub = null) => { setNav({ route, sub }); window.scrollTo(0, 0); }, []);
  const toast = useCallback((m, ms = 2600) => { const id = uid(); setToasts(t => [...t, { id, m }]); setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), ms); }, []);
  const record = useCallback(r => {
    results.current[r.id] = r;
    actions.record(r);
    if (S.settings.keepHistory) auth.saveScan(r, account.id).catch(error => {
      console.error('Could not sync scan to Firestore:', error);
      toast('Scan saved on this device; cloud sync failed.');
    });
  }, [actions, S.settings.keepHistory, auth, account.id, toast]);

  const accountApi = useMemo(() => ({
    updateName: async name => { const a = await auth.updateName(account.id, name); if (a) setAccount(a); },
    changePassword: (oldPw, newPw) => auth.changePassword(account.id, oldPw, newPw),
    deleteAccount: async pw => { const r = await auth.deleteAccount(account.id, pw); if (r.ok) await logout(); return r; },
  }), [auth, account.id, setAccount, logout]);

  const simulate = useCallback(() => {
    const s = SAMPLES[demoIdx.current++ % SAMPLES.length];
    const run = {
      sms: () => engine.scanMessage(s.text, s.from, 'sms'),
      notif: () => { const x = engine.scanMessage(s.text, '', 'notif'); x.preview = s.app + ': ' + x.preview; return x; },
      ad: () => engine.scanAd(s), email: () => engine.scanEmail(s), call: () => engine.scanCall(s.num),
    }[s.ch];
    const who = { sms: 'Text from ' + s.from, notif: 'Notification from ' + s.app, ad: 'Ad shown in an app', email: 'Email from ' + s.from, call: 'Incoming call ' + s.num }[s.ch];
    const r = run();
    setBanner(who);
    setTimeout(() => {
      setBanner(null); record(r);
      if (r.label === 'Dangerous') { setAlert({ r, who }); navigator.vibrate?.([200, 80, 200]); }
      else if (r.label === 'Suspicious') toast('Suspicious: ' + r.signals[0].t + ' See History for details.', 5000);
      else toast('Checked: looks safe.');
    }, 1100);
  }, [engine, record, toast]);

  const ctx = useMemo(() => ({ S, engine, actions, go, toast, record, results, demoIdx, simulate, nav, account, accountApi, logout }),
    [S, engine, actions, go, toast, record, simulate, nav, account, accountApi, logout]);
  const Page = PAGES[nav.route] || Home;

  return (
    <AppCtx.Provider value={ctx}>
      <div id="app" className="has-nav">
        <header className="top">
          <Logo />
          <div className="right"><button className="sos" onClick={() => go('more', 'emergency')}>Been scammed?</button><ThemeToggle /></div>
        </header>
        <main id="view" aria-live="polite"><Page /></main>
        <nav className="nav" aria-label="Main">
          {NAV.map(([k, l]) => <button key={k} onClick={() => go(k)} aria-current={nav.route === k ? 'page' : undefined}><Icon name={k} />{l}</button>)}
        </nav>
      </div>
      {banner && <div className="banner" role="status"><b>{banner}</b><div className="small muted">Scanning…</div></div>}
      {alert && <AlertOverlay r={alert.r} who={alert.who} onClose={() => setAlert(null)}
        onReport={() => { actions.submitReport(alert.r.channel, alert.r.input || alert.r.preview, 'Blocked by live alert'); actions.blockFromResult(alert.r, 'user-feedback'); setAlert(null); toast('Blocked and reported.'); }} />}
      {toasts.slice(-1).map(t => <div key={t.id} className="toast" role="status">{t.m}</div>)}
    </AppCtx.Provider>
  );
}
