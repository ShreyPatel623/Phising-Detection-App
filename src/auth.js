import {
  browserLocalPersistence, browserSessionPersistence, createUserWithEmailAndPassword,
  deleteUser, EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential,
  setPersistence, signInWithEmailAndPassword, signOut, updateEmail, updatePassword, updateProfile,
} from 'firebase/auth';
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { auth, db, firebaseConfigured } from './firebase.js';

export const MIN_PASSWORD = 8;
export const validEmail = e => /^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/.test(e);
export function passwordStrength(p) {
  if (p.length < MIN_PASSWORD) return 0;
  let s = 1;
  const kinds = [/[a-z]/, /[A-Z]/, /\\d/, /[^A-Za-z0-9]/].filter(r => r.test(p)).length;
  if (kinds >= 2) s++;
  if (kinds >= 3 && p.length >= 10) s++;
  if (kinds === 4 && p.length >= 12) s++;
  if (/^(password|12345678|qwertyui|11111111)/i.test(p)) s = 1;
  return s;
}
const publicAccount = (user, profile = {}) => user ? ({
  id: user.uid, name: profile.name || user.displayName || user.email?.split('@')[0] || 'Scamwise user',
  email: user.email || '', country: profile.country || 'IN',
  created: profile.createdAt?.toMillis?.() || Date.now(),
}) : null;

async function saveProfile(user, fields = {}) {
  const ref = doc(db, 'users', user.uid);
  const existing = await getDoc(ref);
  const old = existing.exists() ? existing.data() : {};
  const payload = {
    uid: user.uid, email: user.email || '',
    name: fields.name || user.displayName || old.name || 'Scamwise user',
    country: fields.country || old.country || 'IN', updatedAt: serverTimestamp(),
  };
  if (!existing.exists()) payload.createdAt = serverTimestamp();
  await setDoc(ref, payload, { merge: true });
  return publicAccount(user, { ...old, ...payload });
}

export function makeAuth() {
  return {
    defaultMode: 'signup',
    accounts: () => [],
    observe(callback) {
      if (!firebaseConfigured) { callback(null); return () => {}; }
      return onAuthStateChanged(auth, async user => {
        if (!user) return callback(null);
        try {
          const snap = await getDoc(doc(db, 'users', user.uid));
          callback(publicAccount(user, snap.exists() ? snap.data() : {}));
        } catch (error) {
          console.error('Could not load Scamwise profile:', error);
          callback(publicAccount(user));
        }
      });
    },
    async signup({ name, email, password, country }, remember = true) {
      if (!firebaseConfigured) return { ok: false, error: 'Firebase is not configured. Add your Firebase values to .env.local and restart the app.' };
      name = String(name || '').trim(); email = String(email || '').trim().toLowerCase();
      if (!name) return { ok: false, error: 'Enter your name.' };
      if (name.length > 60) return { ok: false, error: 'Name is too long.' };
      if (!validEmail(email)) return { ok: false, error: 'Enter a valid email address.' };
      if ((password || '').length < MIN_PASSWORD) return { ok: false, error: `Password must be at least ${MIN_PASSWORD} characters.` };
      try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(credential.user, { displayName: name });
        const account = await saveProfile(credential.user, { name, country });
        return { ok: true, account };
      } catch (error) { return { ok: false, error: friendlyAuthError(error) }; }
    },
    async login(email, password, remember = true) {
      if (!firebaseConfigured) return { ok: false, error: 'Firebase is not configured. Add your Firebase values to .env.local and restart the app.' };
      try {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
        const credential = await signInWithEmailAndPassword(auth, String(email || '').trim().toLowerCase(), password || '');
        const snap = await getDoc(doc(db, 'users', credential.user.uid));
        const account = snap.exists() ? publicAccount(credential.user, snap.data()) : await saveProfile(credential.user);
        return { ok: true, account };
      } catch (error) { return { ok: false, error: friendlyAuthError(error) }; }
    },
    async clearSession() { await signOut(auth); },
    async updateName(id, name) {
      const user = auth.currentUser;
      if (!user || user.uid !== id) return null;
      name = String(name || '').trim().slice(0, 60);
      if (!name) return null;
      await updateProfile(user, { displayName: name });
      return saveProfile(user, { name });
    },
    async changePassword(id, oldPassword, newPassword) {
      const user = auth.currentUser;
      if (!user || user.uid !== id) return { ok: false, error: 'Please log in again.' };
      if ((newPassword || '').length < MIN_PASSWORD) return { ok: false, error: `New password must be at least ${MIN_PASSWORD} characters.` };
      try {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, oldPassword || ''));
        await updatePassword(user, newPassword);
        return { ok: true };
      } catch (error) { return { ok: false, error: friendlyAuthError(error) }; }
    },
    async deleteAccount(id, password) {
      const user = auth.currentUser;
      if (!user || user.uid !== id) return { ok: false, error: 'Please log in again.' };
      try {
        await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password || ''));
        const scans = await getDocs(collection(db, 'users', id, 'scans'));
        for (let i = 0; i < scans.docs.length; i += 400) {
          const batch = writeBatch(db);
          scans.docs.slice(i, i + 400).forEach(scan => batch.delete(scan.ref));
          await batch.commit();
        }
        await deleteDoc(doc(db, 'users', id));
        await deleteUser(user);
        return { ok: true };
      } catch (error) { return { ok: false, error: friendlyAuthError(error) }; }
    },
    async saveScan(result, userId) {
      if (!firebaseConfigured || !auth.currentUser || auth.currentUser.uid !== userId || result.invalid) return;
      const signals = (result.signals || []).slice(0, 6).map(s => ({
        text: String(s.t || '').slice(0, 240), level: String(s.lvl || '').slice(0, 24),
      }));
      await setDoc(doc(db, 'users', userId, 'scans', String(result.id)), {
        channel: String(result.channel || 'unknown').slice(0, 24),
        score: Math.max(0, Math.min(100, Number(result.score) || 0)),
        label: ['Safe', 'Suspicious', 'Dangerous'].includes(result.label) ? result.label : 'Suspicious',
        signals, createdAt: serverTimestamp(), scannedAt: Number(result.ts) || Date.now(),
      });
    },
  };
}

function friendlyAuthError(error) {
  const messages = {
    'auth/email-already-in-use': 'An account with this email already exists. Log in instead.',
    'auth/invalid-email': 'Enter a valid email address.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-not-found': 'No account was found for this email.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/weak-password': 'Choose a stronger password (at least 8 characters).',
    'auth/too-many-requests': 'Too many attempts. Please wait and try again.',
    'auth/requires-recent-login': 'Please log in again before doing this.',
    'auth/network-request-failed': 'Network error. Check your internet connection.',
    'permission-denied': 'Firebase denied this operation. Check that Firestore rules are deployed.',
  };
  return messages[error?.code] || error?.message || 'Something went wrong. Please try again.';
}
