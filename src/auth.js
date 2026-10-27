/**
 * Authentication (SRS FR-1) - local, on-device accounts.
 *
 * - Passwords are never stored. Only a random salt + a slow hash (PBKDF2-SHA256).
 *   If the browser has no WebCrypto (plain-http page opened over a LAN address) a
 *   salted, iterated SHA-256 fallback is used; the algorithm is saved with the account
 *   so both kinds keep working.
 * - 5 wrong passwords lock that email for 30 seconds.
 * - "Remember me" keeps the session in localStorage, otherwise in sessionStorage
 *   (cleared when the tab / window closes).
 * - Each account has its own data (history, reports, blocklist) under its own key.
 *
 * Honest limit: with no server, accounts exist only on this device and a forgotten
 * password cannot be recovered. A real deployment would use a backend (e.g. Firebase Auth).
 */
const ACC = 'scamwise:accounts', SES = 'scamwise:session', LOCK = 'scamwise:lock';
export const dataKey = id => 'scamwise:data:' + id;
export const MAX_TRIES = 5, LOCK_MS = 30_000, MIN_PASSWORD = 8;

/* ---------- tiny pure-JS SHA-256 (fallback only) ---------- */
const K = new Uint32Array([0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2]);
function sha256Bytes(msg) {
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  const l = msg.length, padded = new Uint8Array(((l + 9 + 63) >> 6) << 6);
  padded.set(msg); padded[l] = 0x80;
  const dv = new DataView(padded.buffer); dv.setUint32(padded.length - 4, (l * 8) >>> 0); dv.setUint32(padded.length - 8, Math.floor(l / 0x20000000));
  let h = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const w = new Uint32Array(64);
  for (let o = 0; o < padded.length; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + i * 4);
    for (let i = 16; i < 64; i++) { const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3), s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10); w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0; }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25), ch = (e & f) ^ (~e & g), t1 = (hh + S1 + ch + K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22), mj = (a & b) ^ (a & c) ^ (b & c), t2 = (S0 + mj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h = [h[0] + a, h[1] + b, h[2] + c, h[3] + d, h[4] + e, h[5] + f, h[6] + g, h[7] + hh].map(x => x >>> 0);
  }
  const out = new Uint8Array(32); const o = new DataView(out.buffer); h.forEach((x, i) => o.setUint32(i * 4, x)); return out;
}

const enc = new TextEncoder();
const toHex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
const fromHex = h => Uint8Array.from(h.match(/../g) || [], x => parseInt(x, 16));
const randomHex = n => { const a = new Uint8Array(n); (globalThis.crypto || {}).getRandomValues ? crypto.getRandomValues(a) : a.forEach((_, i) => (a[i] = Math.floor(Math.random() * 256))); return toHex(a); };
const ALGO_SUBTLE = 'pbkdf2-sha256-150000', ALGO_JS = 'sha256-x20000';

async function derive(password, saltHex, algo) {
  if (algo === ALGO_SUBTLE) {
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    return toHex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: fromHex(saltHex), iterations: 150000 }, key, 256));
  }
  let h = sha256Bytes(new Uint8Array([...fromHex(saltHex), ...enc.encode(password)]));
  for (let i = 0; i < 20000; i++) h = sha256Bytes(new Uint8Array([...h, ...enc.encode(password)]));
  return toHex(h);
}
const bestAlgo = () => (globalThis.crypto && crypto.subtle ? ALGO_SUBTLE : ALGO_JS);
const sameHex = (a, b) => { if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; };

/* ---------- validation helpers (exported for the UI) ---------- */
export const validEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
/** 0 = too short, 1 = weak, 2 = fair, 3 = good, 4 = strong */
export function passwordStrength(p) {
  if (p.length < MIN_PASSWORD) return 0;
  let s = 1; const kinds = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter(r => r.test(p)).length;
  if (kinds >= 2) s++; if (kinds >= 3 && p.length >= 10) s++; if (kinds === 4 && p.length >= 12) s++;
  if (/^(password|12345678|qwertyui|11111111)/i.test(p)) s = 1;
  return s;
}

/** Create the auth API. Storage objects are injectable so it can be unit-tested in Node. */
export function makeAuth(local = globalThis.localStorage, session = globalThis.sessionStorage) {
  const read = (st, k, d) => { try { return JSON.parse(st.getItem(k)) ?? d; } catch { return d; } };
  const write = (st, k, v) => { try { st.setItem(k, JSON.stringify(v)); } catch { /* storage full or blocked */ } };
  const accounts = () => read(local, ACC, []);
  const pub = a => (a ? { id: a.id, name: a.name, email: a.email, country: a.country, created: a.created } : null);
  const norm = e => String(e || '').trim().toLowerCase();

  return {
    accounts,
    async signup({ name, email, password, country }) {
      name = String(name || '').trim(); email = norm(email);
      if (!name) return { ok: false, error: 'Enter your name.' };
      if (name.length > 60) return { ok: false, error: 'Name is too long.' };
      if (!validEmail(email)) return { ok: false, error: 'Enter a valid email address.' };
      if ((password || '').length < MIN_PASSWORD) return { ok: false, error: `Password must be at least ${MIN_PASSWORD} characters.` };
      if (norm(password) === email) return { ok: false, error: 'Password cannot be the same as your email.' };
      const list = accounts();
      if (list.some(a => a.email === email)) return { ok: false, error: 'An account with this email already exists. Log in instead.' };
      const algo = bestAlgo(), salt = randomHex(16);
      const acc = { id: randomHex(8), name, email, country: country || 'IN', algo, salt, hash: await derive(password, salt, algo), created: Date.now() };
      write(local, ACC, [...list, acc]);
      return { ok: true, account: pub(acc) };
    },

    async login(email, password) {
      email = norm(email);
      const locks = read(local, LOCK, {}), lk = locks[email];
      if (lk && lk.until > Date.now()) return { ok: false, error: `Too many attempts. Try again in ${Math.ceil((lk.until - Date.now()) / 1000)} seconds.`, locked: true };
      const acc = accounts().find(a => a.email === email);
      // Always do the slow hash, so an unknown email takes as long as a wrong password
      const probe = await derive(password || '', acc ? acc.salt : '00'.repeat(16), acc ? acc.algo : bestAlgo());
      if (acc && sameHex(probe, acc.hash)) { if (locks[email]) { delete locks[email]; write(local, LOCK, locks); } return { ok: true, account: pub(acc) }; }
      const n = (lk && lk.until <= Date.now() && lk.n >= MAX_TRIES ? 0 : lk?.n || 0) + 1;
      locks[email] = n >= MAX_TRIES ? { n, until: Date.now() + LOCK_MS } : { n, until: 0 };
      write(local, LOCK, locks);
      return { ok: false, error: n >= MAX_TRIES ? `Too many attempts. Try again in ${LOCK_MS / 1000} seconds.` : 'Incorrect email or password.', locked: n >= MAX_TRIES };
    },

    getSession() {
      const s = read(session, SES, null) || read(local, SES, null);
      return s ? pub(accounts().find(a => a.id === s.id)) : null;
    },
    setSession(id, remember) { this.clearSession(); write(remember ? local : session, SES, { id }); },
    clearSession() { try { local.removeItem(SES); } catch { /* ignore */ } try { session.removeItem(SES); } catch { /* ignore */ } },

    async changePassword(id, oldPw, newPw) {
      const list = accounts(), acc = list.find(a => a.id === id);
      if (!acc) return { ok: false, error: 'Account not found.' };
      if (!sameHex(await derive(oldPw || '', acc.salt, acc.algo), acc.hash)) return { ok: false, error: 'Current password is incorrect.' };
      if ((newPw || '').length < MIN_PASSWORD) return { ok: false, error: `New password must be at least ${MIN_PASSWORD} characters.` };
      acc.algo = bestAlgo(); acc.salt = randomHex(16); acc.hash = await derive(newPw, acc.salt, acc.algo);
      write(local, ACC, list); return { ok: true };
    },
    updateName(id, name) {
      const list = accounts(), acc = list.find(a => a.id === id); if (!acc) return null;
      acc.name = String(name || '').trim().slice(0, 60) || acc.name; write(local, ACC, list); return pub(acc);
    },
    async deleteAccount(id, password) {
      const list = accounts(), acc = list.find(a => a.id === id);
      if (!acc) return { ok: false, error: 'Account not found.' };
      if (!sameHex(await derive(password || '', acc.salt, acc.algo), acc.hash)) return { ok: false, error: 'Password is incorrect.' };
      write(local, ACC, list.filter(a => a.id !== id)); try { local.removeItem(dataKey(id)); } catch { /* ignore */ }
      this.clearSession(); return { ok: true };
    },
  };
}

/** exported only so the unit tests can check the fallback hash against Node's crypto */
export const _sha256Hex = s => toHex(sha256Bytes(enc.encode(s)));
