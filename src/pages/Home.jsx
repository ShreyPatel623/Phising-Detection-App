import { useState } from 'react';
import { useApp } from '../context.js';
import ResultView from '../components/ResultView.jsx';
import { CH, SAMPLES, LESSONS, CH_LESSON } from '../data/content.js';

/** Quick check (auto-detects text / link / number) + dashboard (FR-17) */
export default function Home() {
  const { S, engine, record, go, toast, simulate } = useApp();
  const [text, setText] = useState(''), [res, setRes] = useState(null);

  const h = S.history;
  const dangerous = h.filter(x => x.label === 'Dangerous').length, warnings = h.filter(x => x.label === 'Suspicious').length;
  const byCh = {}; h.filter(x => x.label !== 'Safe').forEach(x => { byCh[x.channel] = (byCh[x.channel] || 0) + 1; });
  const top = Object.entries(byCh).sort((a, b) => b[1] - a[1])[0];
  const last = h.slice(0, 14).reverse();
  const lastBad = h.find(x => x.label !== 'Safe');
  const lesson = lastBad && LESSONS.find(l => l.id === CH_LESSON[lastBad.channel]);

  const check = () => {
    if (!text.trim()) return toast('Paste something to check first.');
    const r = engine.detect(text); record(r); setRes(r);
  };
  const paste = async () => { try { setText(await navigator.clipboard.readText()); } catch { toast('Could not read the clipboard. Paste manually instead.'); } };

  return (
    <>
      <section className="hero">
        <h1>Hi {S.user.name}, got something you are unsure about?</h1>
        <p>Paste a message, link, email text or phone number. We will tell you if it looks like a scam.</p>
        <label className="sr" htmlFor="qc">Paste here</label>
        <textarea id="qc" value={text} onChange={e => setText(e.target.value)} placeholder="Paste a text, link or number here" />
        <div className="row">
          <button className="btn primary" onClick={check}>Check it</button>
          <button className="btn ghost" onClick={paste}>Paste from clipboard</button>
        </div>
        <div className="chips">
          <span className="chip" style={{ border: 0, paddingLeft: 0 }}>Try:</span>
          {[[0, 'Bank KYC text'], [2, 'Parcel link'], [7, 'Normal text']].map(([i, l]) => <button key={i} className="chip" onClick={() => setText(SAMPLES[i].text)}>{l}</button>)}
        </div>
      </section>

      {res && <ResultView r={res} />}

      <section className="card stack">
        <h2>See it protect you live</h2>
        <p className="muted small">Simulates incoming texts, notifications, ads and calls arriving on a phone, with real-time alerts.</p>
        <button className="btn primary" onClick={simulate}>Simulate an incoming message</button>
      </section>

      <section className="stack">
        <h2>Your protection</h2>
        <div className="stats">
          <div className="stat"><b>{h.length}</b><span className="muted small">Items checked</span></div>
          <div className="stat"><b style={{ color: 'var(--bad)' }}>{dangerous}</b><span className="muted small">Dangerous caught</span></div>
          <div className="stat"><b style={{ color: 'var(--warn)' }}>{warnings}</b><span className="muted small">Suspicious warnings</span></div>
          <div className="stat"><b style={{ fontSize: '1.1rem', padding: '.3rem 0', display: 'block' }}>{top ? CH[top[0]][0] : 'None yet'}</b><span className="muted small">Most targeted channel</span></div>
        </div>
        <div className="card stack">
          <h3>Risk of your last {last.length || 14} checks</h3>
          {last.length ? (
            <>
              <div className="trend" role="img" aria-label="Bar chart of recent risk scores">
                {last.map(x => <i key={x.id} className={x.label.toLowerCase()} style={{ height: Math.max(6, x.score) + '%' }} title={x.label + ' ' + x.score} />)}
              </div>
              <div className="scale"><span>Oldest</span><span>Newest</span></div>
            </>
          ) : <p className="muted small">Your checks will show up here as a chart.</p>}
        </div>
      </section>

      {lesson && (
        <section className="card stack">
          <h3>Recommended for you</h3>
          <p className="small">Your last warning was about a {CH[lastBad.channel][0].toLowerCase()}. Learn how to spot it.</p>
          <button className="btn" onClick={() => go('learn', lesson.id)}>{lesson.t}</button>
        </section>
      )}
    </>
  );
}
