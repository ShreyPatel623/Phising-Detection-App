// Static content: channels, sample inputs, lessons, quiz, emergency help
export const CH = { sms: ['Text message', 'sms'], email: ['Email', 'email'], url: ['Link', 'url'], qr: ['QR code', 'qr'], call: ['Phone call', 'call'], notif: ['Notification', 'notif'], ad: ['Advertisement', 'ad'] };
export const callLabel = L => ({ Safe: 'No reports', Suspicious: 'Spam likely', Dangerous: 'Fraud reported' }[L]);
export const NEXT = {
  Safe: 'No scam patterns found. That is not a guarantee, so if anything still feels off, check with the company through its official app or website.',
  Suspicious: 'Be careful. Do not tap links or reply yet. Check with the company using its official app, website or the number on your card.',
  Dangerous: 'Do not click, reply, call back or share any code. Block the sender, then report it so others are protected.'
};

/* ---------- samples (for the demo / testing) ---------- */
export const SAMPLES = [
  { ch: 'sms', from: '+91 98XXXXXX21', text: 'Dear customer, your SBI YONO account will be BLOCKED today. Update KYC immediately: http://sbi-kyc-update.xyz/login' },
  { ch: 'sms', from: 'VM-HDFCBK', text: 'Rs 1,250.00 debited from a/c XX4821 on 10-Oct at Swiggy. If this was not you, call the number on the back of your card. -HDFC Bank' },
  { ch: 'sms', from: '+91 90XXXXXX55', text: 'Your parcel is held at the depot due to an incomplete address. Reschedule here: bit.ly/3xKz9Q' },
  { ch: 'notif', app: 'WhatsApp', text: 'Congratulations! You won Rs 50,00,000 in the KBC lucky draw. Share your UPI PIN to receive the prize and pay Rs 5,000 processing fee.' },
  { ch: 'ad', text: 'FREE iPhone 15 giveaway! Only 2 left. Claim now!!!', url: 'http://iphone-giveaway-claim.top/win?id=88', chain: 'http://bit.ly/ipx15\nhttp://ad-track-redirect.click/r?u=1\nhttp://iphone-giveaway-claim.top/win?id=88' },
  { ch: 'email', from: 'Amazon Support <refunds@amazon-secure-help.top>', subject: 'Refund of Rs 4,999 pending – verify your card', body: 'Dear customer, your refund is pending. Verify your card details within 24 hours or your account will be suspended: https://amazon-secure-help.top/refund', attach: 'refund_form.html', auth: 'spf=fail; dkim=none; dmarc=fail' },
  { ch: 'call', num: '+91 98765 00000' },
  { ch: 'sms', from: 'Mom', text: 'Hi, I will reach by 6. Can you pick up some milk on the way home?' },
  { ch: 'call', num: '+91 140 5551234' },
];
export const URL_SAMPLES = ['https://amazon.com.account-verify.xyz/login', 'http://rto-challan-pay.top/RTO_Challan.apk', 'https://www.google.com/search?q=weather'];
export const QR_SAMPLES = ['http://paytm-reward-claim.click/collect?amt=5000', 'upi://pay?pa=rewards@fakebank&pn=Lucky%20Prize%20Desk&am=5000'];

/* ---------- lessons / quiz ---------- */
export const LESSONS = [
  { id: 'phish', t: 'Phishing and smishing', s: 'Fake messages that pretend to be your bank, delivery company or government.', f: ['Urgent threats such as "account blocked today"', 'A link that is not the company\'s own website', 'Asks for OTP, PIN or password'], d: ['Do not tap the link', 'Open the official app or type the website yourself', 'Report and delete the message'] },
  { id: 'kyc', t: 'KYC and account-block scams', s: 'A text says your KYC, PAN or Aadhaar link has expired and your account will close.', f: ['Comes from a normal mobile number', 'Link ends in .xyz, .top or has the bank name plus extra words', 'Gives you a few hours to act'], d: ['Real KYC updates happen in the bank\'s app or branch, not through a text link', 'Call the number printed on your card'] },
  { id: 'parcel', t: 'Fake delivery and fee scams', s: 'A "missed delivery" text asks for a small fee to reschedule.', f: ['Shortened links (bit.ly)', 'You are not expecting a parcel', 'Small payment to "release" it'], d: ['Track parcels only in the courier\'s official app', 'Never enter card details through a text link'] },
  { id: 'upi', t: 'UPI and QR scams', s: 'You only scan a QR code or enter your UPI PIN to PAY someone. Never to receive money.', f: ['"Scan this to receive your refund or prize"', 'A collect request you did not expect', 'Buyer on a marketplace sends a QR "to pay you"'], d: ['Decline unknown collect requests', 'Never share your UPI PIN with anyone'] },
  { id: 'arrest', t: 'Fake officials and "digital arrest"', s: 'Callers pose as police, CBI, customs or TRAI and keep you on a video call.', f: ['Says you are under arrest or a parcel with drugs was found', 'Asks you to stay on camera and tell nobody', 'Demands money to "clear your name"'], d: ['Hang up. No agency arrests or investigates people over a video call', 'Report it to your national cybercrime helpline'] },
  { id: 'remote', t: 'Remote-access apps', s: 'A "support agent" asks you to install AnyDesk or TeamViewer to fix a refund or problem.', f: ['Caller guides you step by step to install an app', 'Asks for the 9-digit code the app shows', 'Tells you to open your banking app afterwards'], d: ['Refuse and hang up', 'If you already did it, uninstall the app and call your bank immediately'] },
  { id: 'job', t: 'Job and investment scams', s: 'Easy money for simple tasks, or guaranteed returns on trading and crypto.', f: ['Pay first to earn later', 'Small early payouts to build trust', 'Pressure to deposit more'], d: ['No real employer asks you to pay to start work', 'Check the company on its official website and registries'] },
  { id: 'prize', t: 'Fake prizes and giveaways', s: 'If you did not enter, you did not win.', f: ['Fee needed to "release" the prize', 'Countdown timers and "only 2 left"', 'Asks for card or bank details'], d: ['Ignore and close it', 'Report the ad'] },
  { id: 'lookalike', t: 'Spotting lookalike links', s: 'Read the part of the address just before the first single "/".', f: ['amazon.com.evil.xyz is really evil.xyz', 'Extra words and hyphens: sbi-kyc-update.xyz', 'Zero for o, or l for i'], d: ['Type the website yourself or use the official app', 'Look for the real company name directly before .com / .in / .co.in'] },
];
export const CH_LESSON = { sms: 'phish', email: 'phish', url: 'lookalike', qr: 'upi', call: 'arrest', notif: 'prize', ad: 'prize' };
export const QUIZ = [
  { q: 'A text says your KYC expires today and gives a link. What is the best move?', o: ['Tap the link and update quickly', 'Reply STOP', 'Ignore the link and check in the official bank app'], a: 2, e: 'Banks do not ask for KYC through text links. Use the official app or branch.' },
  { q: 'A stranger says you will get a refund if you enter your UPI PIN. What do you do?', o: ['Enter it, the refund is coming', 'Refuse. A PIN is only for paying, never receiving', 'Enter it just once'], a: 1, e: 'You never need a PIN to receive money. Entering it authorises a payment OUT of your account.' },
  { q: 'A caller says you are under "digital arrest" and must stay on video call. This is…', o: ['A real police procedure', 'A scam', 'Only a scam if they ask for money'], a: 1, e: 'No agency arrests anyone over a video call. Hang up and report it.' },
  { q: 'Which link is most likely fake?', o: ['https://www.amazon.in/orders', 'https://amazon-refund-help.top/login', 'https://www.flipkart.com'], a: 1, e: 'The real domain is "amazon-refund-help.top". Amazon\'s name is only a decoration.' },
  { q: 'A "support agent" asks you to install AnyDesk to fix a payment issue.', o: ['Install it, they are helping', 'Install it but do not open the banking app', 'Refuse and hang up'], a: 2, e: 'Remote-access apps give them full control of your phone, including banking.' },
];
export const EMERG = {
  IN: { n: 'India', links: [['Call the national cybercrime helpline: 1930', 'tel:1930'], ['Report online: cybercrime.gov.in', 'https://cybercrime.gov.in'], ['Report spam calls and texts: sancharsaathi.gov.in', 'https://sancharsaathi.gov.in']] },
  US: { n: 'United States', links: [['Report fraud: reportfraud.ftc.gov', 'https://reportfraud.ftc.gov'], ['Internet crime: ic3.gov', 'https://www.ic3.gov']] },
  UK: { n: 'United Kingdom', links: [['Action Fraud: 0300 123 2040', 'tel:03001232040'], ['Forward scam texts to 7726', 'sms:7726']] },
};

