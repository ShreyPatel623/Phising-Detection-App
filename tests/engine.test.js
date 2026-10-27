// Run with:  npm test      (Node's built-in test runner, nothing to install)
import test from 'node:test';
import assert from 'node:assert/strict';
import { createEngine, fnv } from '../src/engine/detection.js';
import { SEED_BLACK } from '../src/data/seed.js';

const env = {
  BL: new Map(SEED_BLACK.map(([t, v]) => [fnv(t + ':' + v), { type: t, v }])),
  WL: new Set(), reports: [], settings: { strict: false, autoLinks: true, country: 'IN' },
};
const E = createEngine(() => env);

/* ---------- 1. Legitimate links must NEVER be Suspicious/Dangerous ---------- */
const LEGIT_URLS = [
  'https://www.google.com/search?q=weather', 'https://www.google.com.au/', 'https://accounts.google.com/signin/v2', 'https://fonts.googleapis.com/css2?family=Roboto',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'https://youtu.be/dQw4w9WgXcQ', 'https://meet.google.com/abc-defg-hij', 'https://mail.google.com/mail/u/0/',
  'https://login.microsoftonline.com/common/oauth2/authorize', 'https://www.microsoft.com/en-in/', 'https://outlook.live.com/mail/', 'https://teams.microsoft.com/l/meetup-join/x',
  'https://www.amazon.in/gp/your-account/order-history', 'https://www.amazon.co.uk/gp/css/order-history', 'https://www.amazon.de/', 'https://www.amazon.com/dp/B08N5WRWNW', 'https://aws.amazon.com/console/',
  'https://www.flipkart.com/account/login', 'https://www.myntra.com/', 'https://www.swiggy.com/restaurants', 'https://www.zomato.com/ahmedabad',
  'https://onlinesbi.sbi/', 'https://bank.sbi/', 'https://www.sbicard.com/', 'https://sbi.co.in/web/personal-banking', 'https://www.sbilife.co.in/',
  'https://netbanking.hdfcbank.com/netbanking/', 'https://alerts.hdfcbank.net/', 'https://www.hdfclife.com/', 'https://www.icicibank.com/personal-banking', 'https://www.icicidirect.com/', 'https://www.axisbank.com/',
  'https://paytm.com/recharge', 'https://www.paytmbank.com/', 'https://www.phonepe.com/', 'https://www.irctc.co.in/nget/train-search',
  'https://www.facebook.com/login', 'https://www.instagram.com/accounts/login/', 'https://web.whatsapp.com/', 'https://www.whatsapp.net/', 'https://www.linkedin.com/in/someone', 'https://zoom.us/j/123456789',
  'https://www.paypal.com/signin', 'https://www.paypalobjects.com/webstatic/mktg/logo/pp_cc_mark_111x69.jpg', 'https://www.netflix.com/browse', 'https://appleid.apple.com/', 'https://www.apple.com/in/iphone/',
  'https://incometax.gov.in/iec/foportal', 'https://www.uidai.gov.in/', 'https://myaadhaar.uidai.gov.in/', 'https://www.india.gov.in/', 'https://www.epfindia.gov.in/', 'https://nptel.ac.in/courses', 'https://www.iitb.ac.in/',
  'https://github.com/user/repo', 'https://stackoverflow.com/questions/1', 'https://en.wikipedia.org/wiki/Phishing', 'https://www.thehindu.com/news/national/', 'https://www.bbc.com/news',
  'https://www.applebees.com/en', 'https://www.maple.com/', 'https://www.bigbasket.com/offers/', 'https://www.dominos.co.in/',
  'github.com/user/repo', 'www.google.com', 'amazon.in',
  'https://news.example-daily.co.in/politics/amazon-refund-scam-explained', 'https://blog.example.com/how-to-contact-paytm-support',
];
for (const u of LEGIT_URLS) test('LEGIT link stays Safe: ' + u, () => { const r = E.scanURLInput(u); assert.equal(r.label, 'Safe', `${u} scored ${r.score}: ${r.signals[0].t}`); });

/* ---------- 2. Real phishing links must still be flagged ---------- */
const PHISH_URLS = [
  'https://amazon.com.account-verify.xyz/login', 'http://amaz0n-login-secure.com/signin', 'http://paytm-kyc-update.top/verify', 'http://sbi-online-verify.xyz/netbanking',
  'http://secure-hdfc-bank.click/login', 'http://microsoft-support-login.work/', 'https://netflix-billing-update.xyz/login', 'http://paypa1.com/signin', 'http://gooogle.com/accounts',
  'http://flipcart-offers.top/win', 'http://rto-challan-pay.top/RTO_Challan.apk', 'http://192.168.4.5/login.php', 'http://paytmreward.xyz/claim', 'http://securesbi.top/kyc',
  'https://login.verify-account.paypal.com.evil-site.xyz/', 'http://xn--pple-43d.com/appleid',
];
for (const u of PHISH_URLS) test('PHISHING link flagged: ' + u, () => { const r = E.scanURLInput(u); assert.notEqual(r.label, 'Safe', `${u} only scored ${r.score}`); });

/* ---------- 3. Legitimate messages stay Safe ---------- */
const LEGIT_MSGS = [
  ['VM-HDFCBK', 'Rs 1,250.00 debited from a/c XX4821 on 10-Oct at Swiggy. If this was not you, call the number on the back of your card. -HDFC Bank'],
  ['VM-SBIINB', 'Rs. 2,000 credited to your A/c XX1234 on 11-Oct. Avl bal Rs 15,230. -SBI'],
  ['AX-HDFCBK', 'Your OTP for HDFC Bank NetBanking is 482913. Do not share it with anyone. Valid for 10 minutes.'],
  ['AX-AMAZON', '123456 is your OTP for login. Do not share this OTP with anyone. -Amazon'],
  ['', 'Your Amazon order has shipped. Track it here: https://www.amazon.in/gp/your-account/order-history'],
  ['', 'Join the meeting: https://meet.google.com/abc-defg-hij'],
  ['', 'Your Swiggy order is on the way! Track: https://www.swiggy.com/track/123'],
  ['', 'Hey, check this article: https://www.thehindu.com/news/national/some-story/article123.ece'],
  ['', 'I bought it on Amazon, here is the review: https://blog.example.com/best-headphones-2026'],
  ['', 'Your PhonePe payment of Rs 250 to Ramesh Tea Stall was successful.'],
  ['', 'Your Paytm KYC is complete. Thank you.'],
  ['', 'Please complete your KYC at your nearest SBI branch with your Aadhaar and PAN.'],
  ['Mom', 'Hi, I will reach by 6. Can you pick up some milk on the way home?'],
  ['', 'Reminder: electricity bill due on 15 Oct. You can pay in the BESCOM app.'],
  ['', 'Your Uber ride is arriving. Driver Ramesh, KA01AB1234.'],
];
for (const [from, text] of LEGIT_MSGS) test('LEGIT message stays Safe: ' + text.slice(0, 55), () => { const r = E.scanMessage(text, from); assert.equal(r.label, 'Safe', `scored ${r.score}: ${r.signals[0].t}`); });

/* ---------- 4. Scam messages are still caught ---------- */
const SCAM_MSGS = [
  ['+91 98XXXXXX21', 'Dear customer, your SBI YONO account will be BLOCKED today. Update KYC immediately: http://sbi-kyc-update.xyz/login', 'Dangerous'],
  ['', 'Dear customer your HDFC credit card reward points worth Rs 9,850 expire today. Redeem now: http://hdfc-rewards-redeem.top', 'Dangerous'],
  ['', 'Your Netflix subscription has expired. Update payment details immediately: https://netflix-billing-update.xyz/login', 'Dangerous'],
  ['', 'Congratulations! You won Rs 50,00,000 in the KBC lucky draw. Share your UPI PIN to receive the prize and pay Rs 5,000 processing fee.', 'Dangerous'],
  ['+91 70XXXXXX11', 'This is CBI officer. A parcel in your name has drugs. You are under digital arrest. Stay on video call and do not tell anyone. Pay Rs 50000 to clear your name.', 'Dangerous'],
  ['', 'To process your refund please install AnyDesk and tell me the 9 digit code', 'Dangerous'],
  ['', 'Congratulations! You have been selected for a work from home job. Earn Rs 5000 daily. Contact on WhatsApp +91 98765 43210', 'Dangerous'],
  ['+91 90XXXXXX55', 'Your parcel is held at the depot due to an incomplete address. Reschedule here: bit.ly/3xKz9Q', 'Suspicious'],
  ['', 'URGENT: Your electricity will be disconnected tonight at 9:30 pm. Call 9876543210 immediately', 'Suspicious'],
];
for (const [from, text, min] of SCAM_MSGS) test(`SCAM message caught (${min}+): ` + text.slice(0, 50), () => {
  const r = E.scanMessage(text, from), rank = { Safe: 0, Suspicious: 1, Dangerous: 2 };
  assert.ok(rank[r.label] >= rank[min], `expected ${min}+, got ${r.label} ${r.score}`);
});

/* ---------- 5. Email, ads, calls, QR ---------- */
const email = f => E.scanEmail(f);
test('genuine Amazon email is Safe', () => assert.equal(email({ from: 'Amazon <order-update@amazon.co.uk>', subject: 'Your order has shipped', body: 'Track your package at https://www.amazon.co.uk/orders. Thanks for shopping.' }).label, 'Safe'));
test('genuine HDFC alert email is Safe', () => assert.equal(email({ from: 'HDFC Bank <alerts@hdfcbank.net>', subject: 'Transaction alert', body: 'Rs 500 spent on your card.' }).label, 'Safe'));
test('genuine Google security email is Safe', () => assert.equal(email({ from: 'Google <no-reply@accounts.google.com>', subject: 'Security alert', body: 'New sign-in on your account. Review: https://myaccount.google.com/notifications' }).label, 'Safe'));
test('spoofed Amazon email is Dangerous', () => assert.equal(email({ from: 'Amazon Support <refunds@amazon-secure-help.top>', subject: 'Refund pending - verify your card', body: 'Dear customer, your refund is pending. Verify your card details within 24 hours or your account will be suspended: https://amazon-secure-help.top/refund', attach: 'refund_form.html', auth: 'spf=fail; dkim=none; dmarc=fail' }).label, 'Dangerous'));
test('fake giveaway ad with redirects is Dangerous', () => assert.equal(E.scanAd({ text: 'FREE iPhone 15 giveaway! Only 2 left. Claim now!!!', url: 'http://iphone-giveaway-claim.top/win?id=88', chain: 'http://bit.ly/ipx15\nhttp://ad-track-redirect.click/r?u=1\nhttp://iphone-giveaway-claim.top/win?id=88' }).label, 'Dangerous'));
test('normal ad to a trusted shop is Safe', () => assert.equal(E.scanAd({ text: 'Big Billion sale starts tomorrow', url: 'https://www.flipkart.com/sale' }).label, 'Safe'));
test('blocklisted phone number is Dangerous', () => assert.equal(E.scanCall('+91 98765 00000').label, 'Dangerous'));
test('ordinary phone number is Safe', () => assert.equal(E.scanCall('+91 98123 45678').label, 'Safe'));
test('QR with blocklisted URL is Dangerous', () => assert.equal(E.scanQR('http://paytm-reward-claim.click/collect?amt=5000').label, 'Dangerous'));
test('QR UPI "prize desk" is Suspicious', () => assert.equal(E.scanQR('upi://pay?pa=rewards@fakebank&pn=Lucky%20Prize%20Desk&am=5000').label, 'Suspicious'));
test('QR UPI tea stall is Safe', () => assert.equal(E.scanQR('upi://pay?pa=raju@okaxis&pn=Raju%20Tea%20Stall&am=40').label, 'Safe'));
test('QR to trusted site is Safe', () => assert.equal(E.scanQR('https://www.irctc.co.in/').label, 'Safe'));

/* ---------- 6. Behaviour ---------- */
test('user-publishable platforms get a small caution, not Dangerous', () => {
  const r = E.scanURLInput('https://docs.google.com/forms/d/e/abc/viewform'); assert.equal(r.label, 'Safe'); assert.ok(r.score > 0);
});
test('a link the user marked safe is trusted', () => {
  env.WL = new Set([fnv('domain:my-college-portal.xyz')]);
  assert.equal(E.scanURLInput('http://my-college-portal.xyz/login').label, 'Safe'); env.WL = new Set();
});
test('score bands follow the SRS (0-39 / 40-69 / 70-100)', () => { const r = E.scanURLInput('http://192.168.4.5/login.php'); assert.ok(r.score >= 40 && r.score < 70, 'got ' + r.score); });
test('detect() routes numbers, links and text', () => {
  assert.equal(E.detect('+91 98765 00000').channel, 'call'); assert.equal(E.detect('sbi-kyc-update.xyz').channel, 'url'); assert.equal(E.detect('hello there friend').channel, 'sms');
});
test('strict mode raises scores', () => {
  const base = E.scanURLInput('http://192.168.4.5/login.php').score; env.settings.strict = true;
  const strict = E.scanURLInput('http://192.168.4.5/login.php').score; env.settings.strict = false; assert.ok(strict > base);
});
test('community reports raise the risk of a phone number', () => {
  env.reports = Array(3).fill({ entityType: 'phone', entity: '9812300000' });
  assert.equal(E.scanCall('+91 98123 00000').label, 'Suspicious'); env.reports = [];
});
