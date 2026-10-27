import { useState } from 'react';
import { useApp } from '../context.js';
import Icon from '../components/Icon.jsx';
import ResultView from '../components/ResultView.jsx';
import useQrScanner from '../hooks/useQrScanner.js';
import { CH, SAMPLES, URL_SAMPLES, QR_SAMPLES } from '../data/content.js';

/** One screen, seven channels (FR-2 ... FR-8). Each channel has its own small form. */
export default function Scan() {
  const { engine, toast, record, demoIdx } = useApp();
  const [ch, setCh] = useState('sms'), [f, setF] = useState({}), [res, setRes] = useState(null);
  const v = k => f[k] || '';
  const bind = k => ({ value: v(k), onChange: e => setF(p => ({ ...p, [k]: e.target.value })) });
  const show = r => { record(r); setRes(r); };

  const runQR = code => { setF(p => ({ ...p, text: code })); show(engine.scanQR(code)); };
  const qr = useQrScanner(runQR, m => toast(m, 4000));

  const pick = c => { qr.stop(); setCh(c); setF({}); setRes(null); };
  const need = (ok, msg) => { if (!ok) toast(msg); return ok; };

  const run = () => {
    if (ch === 'sms') return need(v('text').trim(), 'Paste the message first.') && show(engine.scanMessage(v('text'), v('from'), 'sms'));
    if (ch === 'email') return need(v('text').trim() || v('sub').trim(), 'Paste the email text first.') && show(engine.scanEmail({ from: v('from'), subject: v('sub'), body: v('text'), attach: v('att'), auth: v('auth') }));
    if (ch === 'url') return need(v('url').trim(), 'Enter a link first.') && show(engine.scanURLInput(v('url')));
    if (ch === 'call') return need(v('num').trim(), 'Enter a number first.') && show(engine.scanCall(v('num')));
    if (ch === 'notif') { if (!need(v('text').trim(), 'Paste the notification text first.')) return; const r = engine.scanMessage(v('text'), '', 'notif'); if (v('app')) r.preview = v('app') + ': ' + r.preview; return show(r); }
    if (ch === 'ad') return need(v('text').trim() || v('url').trim(), 'Add the ad text or link first.') && show(engine.scanAd({ text: v('text'), url: v('url'), chain: v('chain') }));
    if (ch === 'qr') return need(v('text').trim(), 'Scan a code or paste its content first.') && show(engine.scanQR(v('text')));
  };

  const sample = () => {
    const i = demoIdx.current++;
    if (ch === 'qr') return setF({ text: QR_SAMPLES[i % QR_SAMPLES.length] });
    if (ch === 'url') return setF({ url: URL_SAMPLES[i % URL_SAMPLES.length] });
    const pool = SAMPLES.filter(s => s.ch === ch), s = pool[i % pool.length];
    setF({ from: s.from, text: s.text || s.body, sub: s.subject, att: s.attach, auth: s.auth, url: s.url, num: s.num, app: s.app, chain: s.chain });
  };

  const actions = (label) => (
    <div className="row"><button className="btn primary" onClick={run}>{label}</button><button className="btn ghost" onClick={sample}>Use an example</button></div>
  );

  return (
    <>
      <h1>What do you want to check?</h1>
      <div className="chips" role="group" aria-label="Channel">
        {Object.entries(CH).map(([k, [label, icon]]) => <button key={k} className="chip" aria-pressed={ch === k} onClick={() => pick(k)}><Icon name={icon} />{label}</button>)}
      </div>

      <section className="card stack">
        {ch === 'sms' && <>
          <label className="f">Sender<span className="hint">Name or number, if you know it</span><input type="text" placeholder="VM-HDFCBK or +91…" {...bind('from')} /></label>
          <label className="f">Message<textarea placeholder="Paste the text message" {...bind('text')} /></label>
          {actions('Check message')}</>}
        {ch === 'email' && <>
          <label className="f">From<input type="text" placeholder="Name <address@domain.com>" {...bind('from')} /></label>
          <label className="f">Subject<input type="text" {...bind('sub')} /></label>
          <label className="f">Body<textarea placeholder="Paste the email text" {...bind('text')} /></label>
          <label className="f">Attachment names<span className="hint">Optional, separated by commas</span><input type="text" {...bind('att')} /></label>
          <label className="f">Authentication results<span className="hint">Optional. Paste the “Authentication-Results” header (SPF / DKIM / DMARC)</span><input type="text" {...bind('auth')} /></label>
          {actions('Check email')}</>}
        {ch === 'url' && <>
          <label className="f">Link<input type="text" inputMode="url" autoCapitalize="off" placeholder="https://…" {...bind('url')} /></label>
          {actions('Check link')}</>}
        {ch === 'call' && <>
          <label className="f">Phone number<input type="text" inputMode="tel" placeholder="+91 …" {...bind('num')} /></label>
          {actions('Check number')}</>}
        {ch === 'notif' && <>
          <label className="f">App name<span className="hint">Which app showed it</span><input type="text" placeholder="e.g. WhatsApp" {...bind('app')} /></label>
          <label className="f">Notification text<textarea {...bind('text')} /></label>
          {actions('Check notification')}</>}
        {ch === 'ad' && <>
          <label className="f">Ad text<textarea placeholder="What the ad says" {...bind('text')} /></label>
          <label className="f">Where the ad leads<input type="text" autoCapitalize="off" placeholder="https://…" {...bind('url')} /></label>
          <label className="f">Redirect steps<span className="hint">Optional, one link per line</span><textarea style={{ minHeight: 64 }} {...bind('chain')} /></label>
          {actions('Check ad')}</>}
        {ch === 'qr' && <>
          <div className="qrbox" hidden={!qr.active}><video ref={qr.videoRef} playsInline muted /></div>
          <div className="row">
            <button className="btn primary" onClick={qr.start}>Open camera</button>
            <label className="btn" style={{ cursor: 'pointer' }}>Upload a photo<input type="file" accept="image/*" className="sr" onChange={e => { qr.decodeFile(e.target.files[0]); e.target.value = ''; }} /></label>
          </div>
          <label className="f">Or paste what the QR says<textarea style={{ minHeight: 64 }} placeholder="https://… or upi://pay?…" {...bind('text')} /></label>
          {actions('Check QR content')}
          <p className="notice">If the camera is blocked in this window, upload a photo of the QR code or paste its content.</p></>}
      </section>

      {res && <ResultView r={res} />}
    </>
  );
}
