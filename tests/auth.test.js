import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { makeAuth, _sha256Hex, passwordStrength, validEmail, MAX_TRIES } from '../src/auth.js';

const mem = () => { const m = new Map(); return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) }; };
const fresh = () => { const local = mem(), session = mem(); return { local, session, auth: makeAuth(local, session) }; };
const user = { name: 'Aarav', email: 'Aarav@Example.com', password: 'correct horse 9', country: 'IN' };

test('fallback SHA-256 matches Node crypto (empty, short, 55/56/64/200 byte inputs)', () => {
  for (const s of ['', 'abc', 'a'.repeat(55), 'a'.repeat(56), 'a'.repeat(64), 'héllo wörld ✓'.repeat(20)])
    assert.equal(_sha256Hex(s), createHash('sha256').update(s).digest('hex'));
});
test('signup stores a hash, never the password', async () => {
  const { auth, local } = fresh(); const r = await auth.signup(user); assert.ok(r.ok);
  const raw = local.getItem('scamwise:accounts'); assert.ok(!raw.includes(user.password)); assert.ok(raw.includes('"hash"') && raw.includes('"salt"'));
  assert.equal(r.account.email, 'aarav@example.com'); assert.equal(r.account.hash, undefined);
});
test('signup validates input and rejects duplicates (case-insensitive)', async () => {
  const { auth } = fresh();
  assert.equal((await auth.signup({ ...user, name: ' ' })).ok, false);
  assert.equal((await auth.signup({ ...user, email: 'nope' })).ok, false);
  assert.equal((await auth.signup({ ...user, password: 'short' })).ok, false);
  assert.equal((await auth.signup({ ...user, password: 'aarav@example.com' })).ok, false);
  assert.ok((await auth.signup(user)).ok);
  assert.equal((await auth.signup({ ...user, email: 'AARAV@example.COM' })).ok, false);
});
test('login works with right password, fails with wrong one / unknown email (same message)', async () => {
  const { auth } = fresh(); await auth.signup(user);
  assert.ok((await auth.login(' aarav@example.com ', user.password)).ok);
  const wrong = await auth.login(user.email, 'bad password 1'), unknown = await auth.login('who@nowhere.com', 'whatever123');
  assert.equal(wrong.ok, false); assert.equal(wrong.error, unknown.error);
});
test('account locks after repeated failures, even for the right password', async () => {
  const { auth } = fresh(); await auth.signup(user);
  for (let i = 0; i < MAX_TRIES; i++) await auth.login(user.email, 'wrong-' + i);
  const r = await auth.login(user.email, user.password); assert.equal(r.ok, false); assert.ok(r.locked);
});
test('success resets the failure counter', async () => {
  const { auth } = fresh(); await auth.signup(user);
  for (let i = 0; i < MAX_TRIES - 1; i++) await auth.login(user.email, 'wrong-' + i);
  assert.ok((await auth.login(user.email, user.password)).ok);
  for (let i = 0; i < MAX_TRIES - 1; i++) await auth.login(user.email, 'wrong-' + i);
  assert.ok((await auth.login(user.email, user.password)).ok);
});
test('sessions: remember-me persists in localStorage, otherwise sessionStorage only', async () => {
  const { auth, local, session } = fresh(); const { account } = await auth.signup(user);
  auth.setSession(account.id, false); assert.ok(session.getItem('scamwise:session')); assert.equal(local.getItem('scamwise:session'), null); assert.equal(auth.getSession().id, account.id);
  auth.setSession(account.id, true); assert.equal(session.getItem('scamwise:session'), null); assert.ok(local.getItem('scamwise:session'));
  auth.clearSession(); assert.equal(auth.getSession(), null);
});
test('a session for a deleted account is not valid', async () => {
  const { auth } = fresh(); const { account } = await auth.signup(user); auth.setSession(account.id, true);
  assert.ok((await auth.deleteAccount(account.id, user.password)).ok); assert.equal(auth.getSession(), null);
});
test('change password: needs the current one, old stops working', async () => {
  const { auth } = fresh(); const { account } = await auth.signup(user);
  assert.equal((await auth.changePassword(account.id, 'nope nope 1', 'brand new pass 7')).ok, false);
  assert.ok((await auth.changePassword(account.id, user.password, 'brand new pass 7')).ok);
  assert.equal((await auth.login(user.email, user.password)).ok, false); assert.ok((await auth.login(user.email, 'brand new pass 7')).ok);
});
test('delete account needs the password and removes the data', async () => {
  const { auth, local } = fresh(); const { account } = await auth.signup(user); local.setItem('scamwise:data:' + account.id, '{}');
  assert.equal((await auth.deleteAccount(account.id, 'wrong')).ok, false); assert.ok(local.getItem('scamwise:data:' + account.id));
  assert.ok((await auth.deleteAccount(account.id, user.password)).ok); assert.equal(local.getItem('scamwise:data:' + account.id), null);
  assert.equal((await auth.login(user.email, user.password)).ok, false);
});
test('two accounts are independent', async () => {
  const { auth } = fresh(); await auth.signup(user); await auth.signup({ ...user, name: 'Meera', email: 'meera@example.com', password: 'another pass 42' });
  assert.ok((await auth.login('meera@example.com', 'another pass 42')).ok); assert.equal((await auth.login('meera@example.com', user.password)).ok, false);
});
test('password strength meter and email validator', () => {
  assert.equal(passwordStrength('short'), 0); assert.equal(passwordStrength('password'), 1); assert.ok(passwordStrength('Tr0ub4dor&3xyz') >= 3);
  assert.ok(validEmail('a@b.co')); assert.ok(!validEmail('a@b')); assert.ok(!validEmail('a b@c.com'));
});
