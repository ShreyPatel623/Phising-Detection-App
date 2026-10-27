/**
 * DETECTION ENGINE (pure logic, no React, no DOM)  -  SRS FR-2 ... FR-9
 *
 * Weighted-signal risk model. Every red flag has a weight (0-1) and the
 * signals are combined with a "noisy-OR":   risk = 1 - PROD(1 - w_i)
 * so several weak signals add up and one strong signal can dominate.
 * Score 0-100  ->  Safe 0-39, Suspicious 40-69, Dangerous 70-100.
 *
 * createEngine(env) takes a getter returning
 *   { BL: Map(hash -> entry), WL: Set(hash), reports: [], settings: {} }
 * so the engine always sees the latest blocklist / settings from the store.
 */
import { BRANDS, ESTABLISHED_TLDS, TRUSTED_DOMAINS, TRUSTED_SUFFIXES, CAUTION_HOSTS, CAUTION_RD } from '../data/brands.js';

export const VERSION = '1.1.0';
export const fnv = s => { let h = 0x811c9dc5; s = String(s).toLowerCase().trim(); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16).padStart(8, '0'); };
export const labelOf = s => s >= 70 ? 'Dangerous' : s >= 40 ? 'Suspicious' : 'Safe';
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const noisyOr = ws => Math.round(100 * (1 - ws.reduce((p, w) => p * (1 - Math.min(w, .97)), 1)));
const lvl = w => w >= .4 ? 'high' : w >= .2 ? 'med' : w > 0 ? 'low' : 'info';

export function createEngine(env) {
/* ---------- reference data ---------- */
const SLD = new Set(['co','com','org','net','gov','ac','edu','nic','res']);
const SHORT = new Set(['bit.ly','tinyurl.com','t.co','goo.gl','is.gd','cutt.ly','rb.gy','shorturl.at','ow.ly','tiny.cc','t.ly','rebrand.ly']);
const BADTLD = new Set(['xyz','top','tk','ml','ga','cf','gq','click','work','zip','mov','icu','vip','buzz','rest','cyou','sbs','monster','loan','country','stream','download','bid','win']);
const FREEMAIL = new Set(['gmail.com','yahoo.com','yahoo.in','outlook.com','hotmail.com','rediffmail.com','proton.me','protonmail.com','aol.com','icloud.com','mail.com']);
const KW = ['login','signin','verify','verification','update','secure','account','kyc','wallet','confirm','password','otp','refund','claim','reward','bonus','prize','gift','free','win','offer','giveaway'];
const RISKY_EXT = new Set(['exe','scr','js','vbs','bat','cmd','msi','apk','jar','iso','img','lnk','ps1','html','htm','docm','xlsm','pptm']);
const ARCH_EXT = new Set(['zip','rar','7z']);

const regDomain = host => { const p = host.split('.'); if (p.length <= 2) return host; const tld = p[p.length - 1], sl = p[p.length - 2]; return (tld.length === 2 && SLD.has(sl)) ? p.slice(-3).join('.') : p.slice(-2).join('.'); };
const leet = s => s.replace(/0/g,'o').replace(/1/g,'l').replace(/3/g,'e').replace(/5/g,'s').replace(/\$/g,'s').replace(/rn/g,'m');
function lev(a, b) { const m = a.length, n = b.length; if (!m) return n; if (!n) return m; let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[n]; }
const TRUSTED = new Set(TRUSTED_DOMAINS);
const tldPart = rd => rd.slice(rd.indexOf('.') + 1);
/** Is `host` one of the brand's genuine domains? (exact list, or <lbl>.<established ending>) */
const isOfficial = (b, host) => {
  if (b.ok.some(d => host === d || host.endsWith('.' + d))) return true;
  if (b.lbl) { const rd = regDomain(host); return rd.split('.')[0] === b.lbl && ESTABLISHED_TLDS.has(tldPart(rd)); }
  return false;
};
const isWhite = host => { const rd = regDomain(host); return TRUSTED.has(rd) || env().WL.has(fnv('domain:' + rd)) || TRUSTED_SUFFIXES.some(x => host === x || host.endsWith('.' + x)); };
// "paytmreward", "amazon-secure", "mypaytm" count as brand words; "applebees", "googleapis" do not
const LURE = new Set(['login', 'secure', 'verify', 'update', 'support', 'care', 'help', 'reward', 'rewards', 'refund', 'kyc', 'pay', 'payment', 'wallet', 'account', 'alert', 'alerts', 'service', 'services', 'online', 'customer', 'offer', 'offers', 'claim', 'bonus', 'gift', 'cashback', 'netbanking', 'banking', 'recharge', 'center', 'portal', 'team', 'official', 'india', 'verification', 'card', 'cards', 'loan', 'loans', 'bank']);
const PRE = new Set(['my', 'the', 'get', 'go', 'secure', 'login', 'verify', 'update', 'new', 'online', 'official']);
const mentionsBrand = (w, t) => w === t || (w.startsWith(t) && LURE.has(w.slice(t.length))) || (w.endsWith(t) && PRE.has(w.slice(0, -t.length)));

/* ---------- URL analysis (FR-4) ---------- */
function analyzeURL(raw) {
  raw = String(raw).trim().replace(/[)\],.;!?'"]+$/, '');
  const bad = t => ({ url: raw, valid: false, score: 0, signals: [{ w: 0, t, lvl: 'info' }] });
  if (!raw) return bad('Enter a link to check.');
  if (/^(javascript|data|vbscript):/i.test(raw)) return { url: raw, valid: true, host: 'script', score: 90, signals: [{ w: .9, t: 'This link runs code instead of opening a website.', lvl: 'high' }] };
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw);
  let u; try { u = new URL(hasScheme ? raw : 'http://' + raw); } catch (e) { return bad('This does not look like a valid link.'); }
  const host = u.hostname.toLowerCase().replace(/\.$/, '');
  if (!host.includes('.') && !/^\[/.test(host)) return bad('This does not look like a valid link.');
  const rd = regDomain(host), path = (u.pathname + u.search).toLowerCase();
  const sig = []; const add = (w, t) => sig.push({ w, t, lvl: lvl(w) });
  if (isWhite(host)) {
    const caution = CAUTION_HOSTS.has(host) || CAUTION_RD.has(rd);
    return { url: raw, host, rd, valid: true, trusted: true, caution, score: caution ? 15 : 0, signals: caution
      ? [{ w: .15, t: rd + ' is a well-known platform, but anyone can publish pages or files there. Open it only if you expected it from this sender.', lvl: 'low' }]
      : [{ w: 0, t: rd + ' is a well-known, trusted website.', lvl: 'good' }] };
  }
  if (env().BL.has(fnv('domain:' + rd)) || env().BL.has(fnv('domain:' + host))) add(.95, rd + ' is on the scam blocklist.');
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) add(.45, 'Uses a raw number address instead of a normal website name.');
  if (u.username || u.password) add(.4, 'Contains "name@" before the site address – a trick to hide where the link really goes.');
  if (host.includes('xn--')) add(.4, 'Uses disguised look-alike characters in the domain name.');
  if (hasScheme && u.protocol === 'http:') add(.12, 'Not encrypted (starts with http, not https).');
  if (u.port && !['80', '443'].includes(u.port)) add(.15, 'Uses an unusual network port (' + u.port + ').');
  const subs = host.split('.').length - rd.split('.').length;
  if (subs >= 3) add(.2, 'Has many sub-parts in the address (' + host + ') to look official.');
  if (raw.length > 90) add(.1, 'Very long link.');
  if ((rd.match(/-/g) || []).length >= 2) add(.15, 'Several hyphens in the domain name – common in fake sites.');
  if (((rd.split('.')[0]).match(/\d/g) || []).length >= 4) add(.1, 'Lots of digits in the domain name.');
  if (SHORT.has(rd)) add(.25, 'Shortened link – it hides the real destination.');
  const tld = host.split('.').pop();
  if (BADTLD.has(tld)) add(.25, 'Unusual domain ending (.' + tld + ') often used for throw-away scam sites.');
  // brand impersonation: the BRAND WORD must be in the site name (strong) or only in the page path (weak)
  const split = x => x.split(/[^a-z0-9]+/).filter(Boolean);
  const hostSegs = [split(host), split(leet(host))], pathSegs = [...split(path), ...split(leet(path))];
  const label = leet(rd.split('.')[0].replace(/-/g, ''));
  let brandHit = null, weak = null;
  for (const b of BRANDS) {
    if (isOfficial(b, host)) continue;
    const inHost = b.tk.some(t => hostSegs.some(sg => sg.some(w => mentionsBrand(w, t))));
    const typo = b.tk.some(t => t.length >= 6 && label.length >= 6 && label !== t && lev(label, t) === 1);
    if (inHost || typo) { brandHit = b; add(.5, 'Pretends to be ' + b.n + ', but the real site is not ' + rd + '.'); break; }
    if (!weak && b.tk.some(t => pathSegs.includes(t))) weak = b;
  }
  if (!brandHit && weak) add(.2, 'The page address mentions ' + weak.n + ', but this site is not ' + weak.n + '.');
  const kw = new Set(split(host + '/' + path).filter(w => KW.includes(w)));
  if (kw.size >= 3) add(.25, 'Packed with pressure words (' + [...kw].slice(0, 4).join(', ') + ').');
  else if (kw.size >= 1) add(.1, 'Contains words like "' + [...kw][0] + '" often used in phishing pages.');
  const ext = path.match(/\.(apk|exe|scr|msi|bat|jar|vbs|ps1|dmg)(\?|$)/);
  if (ext) add(.55, 'The link downloads a program/app file (.' + ext[1] + ').');
  if (!sig.length) add(0, 'No suspicious patterns found in the address.'), sig[0].lvl = 'good';
  return { url: raw, host, rd, valid: true, brand: brandHit && brandHit.n, score: noisyOr(sig.map(s => s.w)), signals: sig };
}

/* ---------- text analysis (SMS / email / notification / ad) ---------- */
function extractUrls(t) {
  const re = /((?:https?:\/\/|www\.)[^\s<>"']+|\b(?:[a-z0-9-]+\.)+(?:com|in|net|org|xyz|top|click|info|co|link|site|online|live|cc|tk|ml|ga|cf|gq|work|shop|icu|vip|me|ly|gl|is|app|bank|store|biz|buzz|cn|ru)\b(?:\/[^\s<>"']*)?)/gi;
  const out = []; let m;
  while ((m = re.exec(t))) { if (t[m.index - 1] === '@') continue; const x = m[0].replace(/[)\],.;!?'"]+$/, ''); if (x && !out.includes(x)) out.push(x); }
  return out;
}
const PATTERNS = [
  [/\b(share|send|tell|provide|enter|confirm|forward)\b[^.\n]{0,35}\b(otp|pin|cvv|password|passcode|upi pin|card number)\b/i, .5, 'Asks you to share a code, PIN or password. Real companies never do this.'],
  [/\b(urgent|immediately|within \d+ ?(hours?|hrs?|mins?|minutes?)|expires? (today|soon|tonight)|last (chance|warning)|final notice|act now|today only|asap|right away)\b/i, .2, 'Creates pressure to act fast.'],
  [/(account|a\/c|card|sim|number|wallet|upi|service|e-?sewa).{0,45}(blocked|suspended|deactivated|frozen|closed|disconnected|restricted|will be (blocked|suspended))/i, .3, 'Threatens to block or close your account.'],
  [/\b(kyc|pan card|pan|aadhaar|aadhar)\b.{0,45}(update|expire|expired|verify|pending|link|mandatory)/i, .35, 'Says your KYC / PAN / Aadhaar needs updating through a link.'],
  [/(you (have )?won|you('| a)?re (a )?winner|congratulations|lucky (draw|winner)|lottery|prize|reward points|cashback of|free (gift|iphone|recharge|laptop)|giveaway|kbc)/i, .35, 'Claims you won a prize or gift you never entered for.'],
  [/(processing fee|registration fee|customs (fee|duty)|clearance (fee|charge)|delivery (fee|charge)|redelivery|pay (a )?(small )?(fee|charge)|pay.{0,18}(rs\.?|₹|inr|\$|usd))/i, .25, 'Asks you to pay a fee or money to receive something.'],
  [/\b(click|tap|open|visit|login at|log in at|follow)\b.{0,25}(link|here|below|http|www)/i, .15, 'Pushes you to tap a link.'],
  [/(anydesk|teamviewer|quicksupport|rustdesk|alpemix|airdroid)/i, .7, 'Asks you to install a remote-control app. This gives a stranger full access to your phone.'],
  [/(arrest|warrant|cbi\b|narcotics|money laundering|police (case|complaint)|legal action|court (notice|case)|digital arrest|cyber ?crime branch|customs officer|trai\b)/i, .45, 'Claims to be police/government and threatens legal trouble.'],
  [/(do not|don't|dont) tell (anyone|anybody|your family)|keep (this|it) (a )?(secret|confidential)|stay on (the )?(video )?call/i, .35, 'Tells you to keep it secret or stay on the call. Scammers isolate victims this way.'],
  [/(electricity|power|bijli).{0,45}(disconnect|cut|off tonight|bill (not )?paid)/i, .4, 'Threatens to cut your electricity – a very common scam.'],
  [/(work from home|part[- ]time job|earn .{0,18}(per day|daily|weekly)|guaranteed returns?|double your money|crypto|trading tips|\d+% (daily|weekly|monthly) (profit|returns?)|like (and|&) (subscribe|share).{0,20}earn|task.{0,15}earn)/i, .35, 'Offers easy money, a job or an investment with guaranteed returns.'],
  [/(refund|reversal|cashback).{0,45}(click|link|upi|bank details|card|verify)/i, .3, 'Offers a refund but wants your details or a click first.'],
  [/(upi pin|collect request|to receive (money|payment|the amount).{0,30}(pin|scan)|scan (this )?qr.{0,30}(receive|get|claim))/i, .5, 'Asks for your UPI PIN or a QR scan to RECEIVE money. You only ever enter a PIN to pay.'],
  [/(parcel|package|courier|delivery|shipment|consignment).{0,45}(held|failed|pending|address|incomplete|reschedule|stuck|on hold|undelivered)/i, .3, 'Fake-delivery style message about a held parcel.'],
  [/(only \d+ (left|remaining)|hurry|claim (it )?now|claim your|you('| ha)?ve been selected|spin (the )?wheel|limited (time )?offer|exclusive deal)/i, .25, 'Uses pushy sales-lure language.'],
  [/\b(dear (customer|user|sir|madam|account holder|valued))\b/i, .1, 'Generic greeting – it does not use your name.'],
  [/(call|contact|whatsapp).{0,25}\+?\d[\d\s-]{8,}/i, .2, 'Asks you to call or message an unknown number.'],
  [/(verify|confirm|validate).{0,25}(identity|account|details|card|payment)/i, .2, 'Asks you to verify your identity or card details.'],
];
function textSignals(text, opts = {}) {
  const sig = []; const add = (w, t) => sig.push({ w, t, lvl: lvl(w) });
  const clean = text.replace(/(do not|don't|dont|never)\s+(share|disclose|give|reveal)[^.\n]*[.\n]?/gi, ' ');
  for (const [re, w, t] of PATTERNS) if (re.test(clean)) add(w, t);
  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length > 25 && (text.replace(/[^A-Z]/g, '').length / letters.length) > .5) add(.1, 'LOTS OF CAPITAL LETTERS to shout for attention.');
  if (/!{3,}/.test(text)) add(.08, 'Too many exclamation marks.');
  const urls = opts.links === false ? [] : extractUrls(text);
  const ua = urls.map(analyzeURL).filter(a => a.valid);
  ua.forEach(a => {
    if (a.caution) add(.15, 'Link goes to ' + a.rd + ', a trusted platform where anyone can publish pages. Check who sent it.');
    else if (a.trusted) add(0, 'Link goes to ' + a.rd + ' (trusted site).'), sig[sig.length - 1].lvl = 'good';
    else if (a.score >= 20) add(Math.min(.95, a.score / 100 * .95), 'Link to ' + a.host + ' looks ' + labelOf(a.score).toLowerCase() + ': ' + a.signals.slice().sort((x, y) => y.w - x.w)[0].t);
  });
  // brand named in text, but the link goes elsewhere. Only counts if the message or link ALSO looks bad,
  // so an ordinary chat ("bought it on Amazon, see this review: https://blog.com/x") is left alone.
  const untrusted = ua.filter(a => !a.trusted);
  const somethingElseWrong = sig.some(x => x.w >= .2) || untrusted.some(a => a.score >= 20);
  if (untrusted.length && somethingElseWrong) for (const b of BRANDS) {
    const rx = new RegExp('\\b(' + b.tk.join('|') + ')\\b', 'i');
    if (rx.test(text) && !untrusted.some(a => isOfficial(b, a.host)) && !untrusted.every(a => a.brand === b.n)) { add(.4, 'Mentions ' + b.n + ', but the link goes to ' + untrusted[0].rd + '.'); break; }
  }
  const s = (opts.sender || '').trim();
  if (/^\+?\d[\d\s-]{8,}$/.test(s) && /(bank|a\/c|account|card|upi|sbi|hdfc|icici|axis|paytm|kyc)/i.test(text)) add(.3, 'A "bank" message from an ordinary mobile number. Banks use sender names like VM-HDFCBK.');
  return { sig, urls: ua };
}
function finish(channel, sig, urls, extra = {}) {
  let score = noisyOr(sig.map(s => s.w));
  if (env().settings.strict && score > 0) score = Math.min(100, Math.round(score * 1.25));
  if (!sig.length || sig.every(s => s.w === 0)) { if (!sig.length) sig.push({ w: 0, t: 'No known scam patterns found.', lvl: 'good' }); }
  return Object.assign({ id: uid(), channel, score, label: labelOf(score), signals: sig.sort((a, b) => b.w - a.w), urls: urls || [], ts: Date.now() }, extra);
}
function scanMessage(text, sender, channel = 'sms') {
  const { sig, urls } = textSignals(text, { sender, links: env().settings.autoLinks });
  return finish(channel, sig, urls, { input: text, preview: text.replace(/\s+/g, ' ').slice(0, 80) });
}
function scanEmail(f) {
  const text = (f.subject || '') + '\n' + (f.body || '');
  const { sig, urls } = textSignals(text, { links: env().settings.autoLinks });
  const add = (w, t) => sig.push({ w, t, lvl: lvl(w) });
  const m = (f.from || '').match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/); const name = m ? m[1] : '', addr = (m ? m[2] : (f.from || '')).trim().toLowerCase();
  const dom = addr.includes('@') ? addr.split('@').pop() : '';
  if (dom) {
    const ref = (name + ' ' + (f.subject || ''));
    const b = BRANDS.find(b => new RegExp('\\b(' + b.tk.join('|') + ')\\b', 'i').test(name));
    if (b && !isOfficial(b, dom)) add(.5, 'Sender name says "' + b.n + '", but the email comes from ' + dom + '.');
    else if (FREEMAIL.has(dom) && /(bank|support|security|team|care|service|helpdesk|accounts?)/i.test(name)) add(.3, 'A company-style sender using a free email address (' + dom + ').');
    const da = analyzeURL(dom); if (da.valid && !da.trusted && da.score >= 40) add(Math.min(.9, da.score / 100 * .85), 'The sender domain ' + dom + ' looks ' + labelOf(da.score).toLowerCase() + ': ' + da.signals.slice().sort((x, y) => y.w - x.w)[0].t);
  }
  (f.attach || '').split(/[,\n]/).map(s => s.trim().toLowerCase()).filter(Boolean).forEach(a => {
    const ext = a.split('.').pop();
    if (/\.(pdf|docx?|jpe?g|png|xlsx?)\.(exe|scr|js|bat|apk|vbs)$/.test(a)) add(.6, 'Attachment "' + a + '" hides a program behind a fake document name.');
    else if (RISKY_EXT.has(ext)) add(.5, 'Attachment "' + a + '" is a file type that can run code or open fake login pages.');
    else if (ARCH_EXT.has(ext)) add(.25, 'Attachment "' + a + '" is a compressed archive – scammers use these to hide malware.');
  });
  if (/(spf|dkim|dmarc)\s*=\s*(fail|softfail)/i.test(f.auth || '')) add(.4, 'Email security checks (SPF/DKIM/DMARC) failed – the sender may be forged.');
  return finish('email', sig, urls, { input: text, preview: ((f.subject || '(no subject)') + ' – ' + (f.from || '')).slice(0, 80) });
}
function scanURLInput(u) { const a = analyzeURL(u); const r = finish('url', a.signals.slice(), [], { input: u, preview: u.slice(0, 80), urls: a.valid ? [a] : [] }); if (!a.valid) { r.score = 0; r.label = 'Safe'; r.invalid = true; } return r; }
function scanAd(f) {
  const { sig, urls } = textSignals(f.text || '', { links: false });
  const add = (w, t) => sig.push({ w, t, lvl: lvl(w) });
  const chain = [...(f.chain || '').split('\n').map(s => s.trim()).filter(Boolean)]; if (f.url && !chain.includes(f.url)) chain.push(f.url);
  const ua = chain.map(analyzeURL).filter(a => a.valid); let worst = null;
  ua.forEach(a => { if (!worst || a.score > worst.score) worst = a; });
  if (worst && !worst.trusted && worst.score >= 20) add(Math.min(.95, worst.score / 100 * .95), 'Destination ' + worst.host + ' looks ' + labelOf(worst.score).toLowerCase() + ': ' + worst.signals.slice().sort((x, y) => y.w - x.w)[0].t);
  if (chain.length >= 3) add(.25, 'The ad bounces through ' + chain.length + ' links before landing – a way to hide the real site.');
  return finish('ad', sig, ua, { input: (f.text || '') + ' ' + chain.join(' '), preview: (f.text || chain[chain.length - 1] || '').slice(0, 80) });
}
const DIAL = { IN: '91', US: '1', UK: '44' };
function scanCall(num) {
  const raw = String(num).trim(), digits = raw.replace(/\D/g, '');
  if (digits.length < 6) return { invalid: true, channel: 'call', score: 0, label: 'Safe', signals: [{ w: 0, t: 'Enter a full phone number.', lvl: 'info' }], urls: [], id: uid(), ts: Date.now(), preview: raw };
  const key = digits.slice(-10); const sig = []; const add = (w, t) => sig.push({ w, t, lvl: lvl(w) });
  if (env().BL.has(fnv('phone:' + key))) add(.95, 'This number is on the fraud blocklist.');
  const reps = env().reports.filter(r => r.entityType === 'phone' && r.entity === key).length;
  if (reps) add(Math.min(.2 * reps, .6), 'Reported ' + reps + ' time' + (reps > 1 ? 's' : '') + ' by users on this device/community.');
  if (/^(\+?91|0)?140\d{7}$/.test(digits) || /^(91)?140/.test(digits)) add(.25, '140-series numbers are used for sales calls; scammers use them too.');
  if (/(\d)\1{5,}/.test(digits)) add(.1, 'Number has a suspicious repeated-digit pattern.');
  if (raw.startsWith('+') && !digits.startsWith(DIAL[env().settings.country] || '91')) add(.1, 'International number you may not know.');
  return finish('call', sig, [], { input: raw, preview: raw, entity: key, entityType: 'phone' });
}
function scanQR(payload) {
  const p = String(payload).trim();
  if (/^upi:\/\//i.test(p)) {
    const q = new URLSearchParams(p.split('?')[1] || ''); const pn = q.get('pn') || '', pa = q.get('pa') || '', am = q.get('am');
    const sig = []; const add = (w, t) => sig.push({ w, t, lvl: lvl(w) });
    add(.15, 'This is a payment request for ' + (pn || pa || 'someone') + (am ? ' – amount ' + am : '') + '. Scan only to PAY a person you know, never to receive money.');
    if (/(prize|reward|refund|lottery|cashback|winner|lucky|kyc|gift|offer)/i.test(pn + ' ' + pa)) add(.45, 'The payee name uses prize/refund wording – a common QR trick.');
    if (am && Number(am) >= 5000) add(.15, 'The request is for a large amount (' + am + ').');
    return finish('qr', sig, [], { input: p, preview: 'UPI payment: ' + (pn || pa) });
  }
  if (/^(https?:\/\/|www\.)/i.test(p) || (!/\s/.test(p) && /\./.test(p))) { const r = scanURLInput(p); r.channel = 'qr'; return r; }
  if (/^(tel:|sms:|smsto:|mailto:)/i.test(p)) { const r = finish('qr', [{ w: .2, t: 'This QR will start a call, text or email as soon as you confirm.', lvl: 'med' }], [], { input: p, preview: p.slice(0, 80) }); return r; }
  const r = scanMessage(p, '', 'qr'); return r;
}

  /** Auto-detect what the user pasted (used by the Home quick-check box) */
  function detect(txt) {
    const t = txt.trim();
    if (/^\+?[\d\s().-]{7,17}$/.test(t)) return scanCall(t);
    if (!/\s/.test(t) && /\.[a-z]{2,}/i.test(t)) return scanURLInput(t);
    return scanMessage(t, '', 'sms');
  }
  return { analyzeURL, extractUrls, scanMessage, scanEmail, scanURLInput, scanAd, scanCall, scanQR, detect };
}
