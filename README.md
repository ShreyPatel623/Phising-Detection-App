# Scamwise – Fraud & Phishing Detection (React + Vite)

College project implementing the SRS "Fraud and Phishing Detection Mobile Application".
Runs fully on-device: no backend, no API keys.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173  (open on your phone with the Network URL)
npm test           # 138 tests: detection accuracy + login security (Node's built-in runner)
npm run build      # production build in dist/
```
Needs Node 18+. Camera QR scanning needs HTTPS or localhost.

## Desktop (PC) app – Electron

The same code runs as a Windows / macOS / Linux desktop app. On wide screens the
layout switches to a sidebar (phones keep the bottom tab bar).

```bash
npm install
npm run desktop     # builds the web app, then opens it in a desktop window
npm run dist:win    # makes an installer + a single portable .exe in release/
```
`dist:mac` and `dist:linux` exist too, but must be run on that operating system.

Troubleshooting `dist:win`:
* First run downloads Electron and the NSIS tools, so it needs internet.
* If it fails with a "symbolic link" / permission error, open the terminal as
  Administrator or switch on Windows Developer Mode, then run it again.
* The app uses Electron's default icon. To use your own, add `build/icon.ico`
  (256x256) and remove `"signAndEditExecutable": false` from `package.json`.
* Fonts load from Google Fonts when online and fall back to system fonts offline.

## Project structure (layered, as required by SRS 4.7)

```
src/
  engine/detection.js   Pure detection logic, no React. Risk scoring (FR-2..FR-9)
  auth.js               Accounts: salted PBKDF2 hashing, sessions, lockout (FR-1)
  theme.js              YouTube-style Device / Dark / Light theme
  data/brands.js        Trusted sites + official domains of impersonated brands
  data/                 seed blocklist, sample inputs, lessons, quiz, helplines, icons
  store.js              Data layer: per-account localStorage + actions (reports, feedback, admin)
  context.js            React context so pages can reach the store/engine
  hooks/useQrScanner.js Camera + photo QR decoding (FR-5)
  components/           ResultCard, ResultView, AlertOverlay, Icon
  pages/                Onboarding, Home, Scan, History, Learn, More(+Report,
                        Emergency, Blocklist, Settings, Admin)
  App.jsx               Shell, navigation, toasts, live-alert simulation
electron/main.cjs       Desktop window (Electron main process)
tests/engine.test.js    Unit tests for the engine
```

## Login

Nothing in the app is reachable until you log in. Accounts are stored on the device only.
Passwords are never saved, only a random salt and a PBKDF2-SHA256 hash. Five wrong
passwords lock that email for 30 seconds. "Keep me logged in" keeps the session across
restarts; without it the session ends when the tab/window closes. Each account has its
own history, reports and lists.

## Themes

Same idea as YouTube: **Use device theme** (default), **Dark theme**, **Light theme**.
Quick sun/moon button in the header (also on the login screen); full choice in
Settings → Appearance. Saved per device and applied before first paint (no flash).

## How detection works

Each red flag (urgent wording, KYC/OTP requests, lookalike domain, shortened link,
risky TLD, `.apk` download, spoofed sender, failed SPF/DKIM, blocklisted number …)
has a weight between 0 and 1. Signals are combined with a noisy-OR:

    risk = 1 − Π(1 − wᵢ)     →  score 0–100

Bands (SRS FR-9): **Safe 0–39 · Suspicious 40–69 · Dangerous 70–100**.
Every verdict comes with a plain-language list of reasons (explainable by design).

### Avoiding false alarms on trusted links

* `data/brands.js` holds ~200 trusted sites plus every official domain of each
  impersonated brand (amazon.in / amazon.co.uk / amazonaws.com, bank.sbi, googleapis.com …).
  Government, university and verified-bank endings (.gov.in, .ac.in, .bank.in …) are trusted.
* A brand name only counts as impersonation when it appears in the **site name** and the
  site is not official ("applebees.com" and "googleapis.com" are fine). A brand word that
  appears only in the page path (a news article about Amazon) is a weak signal.
* "Mentions SBI but links elsewhere" only counts when something else also looks wrong.
* Sites where anyone can publish (Google Forms, S3, Dropbox …) get a small caution, not a pass.
* A user can tap "No, it is safe" on a result and that site is trusted from then on.

To trust another site permanently, add its registered domain to `EXTRA_TRUSTED` in
`data/brands.js` (or to a brand's `ok` list) and run `npm test`.

## SRS coverage

| SRS | Status |
|---|---|
| FR-1 Login | Implemented locally: sign up / log in / log out, change password, delete account, lockout after 5 failures. App is unreachable until logged in. Each account has its own data. No server (so no password recovery) |
| FR-2..FR-8 SMS, email, URL, QR, call, notification, ad | Implemented (manual / pasted / simulated input) |
| FR-9 Risk scoring, FR-10 alerts | Implemented (rule-based, not TF Lite) |
| FR-11/12 Reporting + community auto-block | Implemented locally (3 matching reports → blocklist) |
| FR-13 History, FR-17 dashboard | Implemented |
| FR-14 Education + quiz, FR-15 Emergency | Implemented (IN / US / UK helplines) |
| FR-16 Offline blocklist | Implemented (localStorage, hashed lookup) |
| FR-18 Settings, FR-19 Admin, FR-21 Feedback | Implemented (admin is a demo toggle) |
| FR-20 Model updates | Not implemented |

## Known limitations (say these in your viva)

* A web app cannot read incoming SMS, calls or other apps' notifications. Those
  channels are checked from pasted text or the live-demo simulator. Real
  interception needs native Android code (see below).
* Detection is heuristic; there is no trained ML model and no measured accuracy. The test
  suite checks 60+ legitimate links/messages stay Safe and 30+ scams are still caught, but
  that is a regression suite, not a statistical accuracy figure.
* Accounts are local to the device: no password recovery, no sync between devices.
* No domain-age/SSL/Safe Browsing/VirusTotal checks (need a server to hold API keys).
* Community reports come only from this device.

## Next steps

1. **Android app**: wrap this build with Capacitor
   `npm i @capacitor/core @capacitor/cli @capacitor/android && npx cap init && npx cap add android && npm run build && npx cap sync && npx cap open android`
   then add native plugins for SMS / call screening / notification listener.
2. **ML**: train a classifier on a public SMS-spam dataset in Python and add its
   probability as one more weighted signal in `engine/detection.js`.
3. **Cloud**: Firebase Auth + Firestore for shared reports; a small function that
   calls Safe Browsing / VirusTotal with server-side keys.
