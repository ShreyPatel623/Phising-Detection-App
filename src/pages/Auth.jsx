import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { EMERG } from '../data/content.js';
import { passwordStrength, MIN_PASSWORD } from '../auth.js';

function guessCountry() {
  try { const z = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; if (/Calcutta|Kolkata/.test(z)) return 'IN'; if (/London/.test(z)) return 'UK'; if (/^America\//.test(z)) return 'US'; } catch { /* ignore */ }
  return 'IN';
}
const STRENGTH = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

/** Log in / create account. Nothing in the app is reachable until this succeeds (FR-1). */
export default function AuthScreen({ auth, onAuthed }) {
  const [mode, setMode] = useState(auth.accounts().length ? 'login' : 'signup');
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '', country: guessCountry(), remember: true });
  const [show, setShow] = useState(false), [err, setErr] = useState(''), [busy, setBusy] = useState(false);
  const set = k => e => { const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value; setF(p => ({ ...p, [k]: v })); setErr(''); };
  const signup = mode === 'signup', strength = passwordStrength(f.password);

  const submit = async e => {
    e.preventDefault(); setErr('');
    if (!f.email.trim() || !f.password) return setErr('Enter your email and password.');
    if (signup && f.password !== f.confirm) return setErr('The two passwords do not match.');
    setBusy(true);
    try {
      const r = signup ? await auth.signup(f) : await auth.login(f.email, f.password);
      r.ok ? onAuthed(r.account, f.remember) : setErr(r.error);
    } catch { setErr('Something went wrong. Please try again.'); }
    setBusy(false);
  };
  const switchMode = m => { setMode(m); setErr(''); setF(p => ({ ...p, password: '', confirm: '' })); };

  return (
    <section className="auth">
      <div className="stack" style={{ gap: 6 }}>
        <h1>{signup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">{signup ? 'Sign up to start checking messages, links, emails, QR codes and calls.' : 'Log in to open Scamwise.'}</p>
      </div>

      <div className="tabs" role="tablist" aria-label="Log in or sign up">
        <button role="tab" aria-selected={!signup} onClick={() => switchMode('login')}>Log in</button>
        <button role="tab" aria-selected={signup} onClick={() => switchMode('signup')}>Sign up</button>
      </div>

      <form className="card stack" onSubmit={submit} noValidate>
        {signup && <label className="f">Your name<input type="text" autoComplete="name" value={f.name} onChange={set('name')} placeholder="e.g. Aarav Shah" /></label>}
        <label className="f">Email<input type="email" autoComplete="email" inputMode="email" autoCapitalize="off" value={f.email} onChange={set('email')} placeholder="you@example.com" /></label>
        <label className="f">Password
          <span className="pw">
            <input type={show ? 'text' : 'password'} autoComplete={signup ? 'new-password' : 'current-password'} value={f.password} onChange={set('password')} placeholder={signup ? `At least ${MIN_PASSWORD} characters` : 'Your password'} />
            <button type="button" className="iconbtn" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}><Icon name={show ? 'eyeoff' : 'eye'} /></button>
          </span>
          {signup && f.password && <><span className="strength" data-s={strength} aria-hidden="true"><i /><i /><i /><i /></span><span className="hint">Strength: {STRENGTH[strength]}</span></>}
        </label>
        {signup && <>
          <label className="f">Confirm password<input type={show ? 'text' : 'password'} autoComplete="new-password" value={f.confirm} onChange={set('confirm')} /></label>
          <label className="f">Country<span className="hint">Used to show the right helplines</span>
            <select value={f.country} onChange={set('country')}>{Object.entries(EMERG).map(([k, e]) => <option key={k} value={k}>{e.n}</option>)}</select>
          </label>
        </>}
        <label className="check"><input type="checkbox" checked={f.remember} onChange={set('remember')} />Keep me logged in on this device</label>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="btn primary" type="submit" disabled={busy}>{busy ? 'Please wait…' : signup ? 'Create account' : 'Log in'}</button>
        <p className="notice">
          {signup ? 'Your account and everything you scan are stored only on this device. Your password is never saved, only a salted hash of it.'
            : 'Accounts live on this device only, so a forgotten password cannot be recovered.'}
        </p>
      </form>
    </section>
  );
}
