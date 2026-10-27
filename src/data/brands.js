/**
 * Reference data for the detection engine.
 *
 * BRANDS   – companies that scammers impersonate. Each lists every OFFICIAL domain
 *            (so real sites are never flagged as fakes). `lbl` means "<lbl>.<any established
 *            country domain>" is official too (amazon.in, amazon.co.uk, google.com.au …).
 * TRUSTED_DOMAINS / TRUSTED_SUFFIXES – sites that are scored 0 (Safe).
 * CAUTION_*– trusted platforms where ANYONE can publish a page or file; these get a
 *            small caution instead of a free pass, because phishing is often hosted there.
 */
export const BRANDS = [
  { n: 'SBI', tk: ['sbi', 'yono', 'onlinesbi'], ok: ['sbi', 'sbi.co.in', 'onlinesbi.com', 'sbi.bank.in', 'sbicard.com', 'sbilife.co.in', 'sbimf.com', 'sbigeneral.in'] },
  { n: 'HDFC Bank', tk: ['hdfc', 'hdfcbank'], ok: ['hdfcbank.com', 'hdfcbank.net', 'hdfc.com', 'hdfclife.com', 'hdfcergo.com', 'hdfcsec.com'] },
  { n: 'ICICI Bank', tk: ['icici', 'icicibank'], ok: ['icicibank.com', 'icicidirect.com', 'iciciprulife.com', 'icicilombard.com', 'icicipruamc.com', 'icici.com'] },
  { n: 'Axis Bank', tk: ['axisbank'], ok: ['axisbank.com', 'axismf.com', 'axisdirect.in'] },
  { n: 'Kotak', tk: ['kotak'], ok: ['kotak.com', 'kotaksecurities.com', 'kotakmf.com'] },
  { n: 'Punjab National Bank', tk: ['pnbindia'], ok: ['pnbindia.in', 'netpnb.com'] },
  { n: 'Bank of Baroda', tk: ['bankofbaroda', 'bobibanking'], ok: ['bankofbaroda.in', 'bankofbaroda.com', 'bobibanking.com'] },
  { n: 'Canara Bank', tk: ['canarabank'], ok: ['canarabank.com', 'canarabank.in'] },
  { n: 'Paytm', tk: ['paytm'], ok: ['paytm.com', 'paytm.in', 'paytmbank.com', 'paytmmoney.com'] },
  { n: 'PhonePe', tk: ['phonepe'], ok: ['phonepe.com'] },
  { n: 'Google', tk: ['google', 'gmail', 'googlepay', 'gpay'], lbl: 'google', ok: ['google.com', 'gmail.com', 'googlemail.com', 'googleapis.com', 'gstatic.com', 'googleusercontent.com', 'googlevideo.com', 'ggpht.com', 'youtube.com', 'youtu.be', 'g.co', 'withgoogle.com', 'android.com'] },
  { n: 'Amazon', tk: ['amazon', 'amazonpay'], lbl: 'amazon', ok: ['amazon.com', 'amazon.in', 'amazonaws.com', 'amazon.jobs', 'primevideo.com', 'amazonpay.in', 'aboutamazon.com', 'a.co'] },
  { n: 'Flipkart', tk: ['flipkart'], ok: ['flipkart.com'] },
  { n: 'Myntra', tk: ['myntra'], ok: ['myntra.com'] },
  { n: 'Swiggy', tk: ['swiggy'], ok: ['swiggy.com', 'swiggy.in'] },
  { n: 'Zomato', tk: ['zomato'], ok: ['zomato.com'] },
  { n: 'Jio', tk: ['jio', 'jiomart', 'jiofiber'], ok: ['jio.com', 'jiomart.com', 'jiocinema.com', 'ril.com', 'reliancedigital.in'] },
  { n: 'Airtel', tk: ['airtel'], ok: ['airtel.in', 'airtel.com', 'airtelbank.com'] },
  { n: 'Microsoft', tk: ['microsoft', 'outlook', 'office365', 'onedrive'], ok: ['microsoft.com', 'microsoftonline.com', 'outlook.com', 'live.com', 'office.com', 'office365.com', 'windows.com', 'windows.net', 'azure.com', 'azureedge.net', 'sharepoint.com', 'onedrive.com', 'skype.com', 'bing.com', 'msn.com', 'xbox.com', 'microsoftstore.com', 'hotmail.com'] },
  { n: 'Apple', tk: ['apple', 'icloud', 'appleid'], ok: ['apple.com', 'icloud.com', 'me.com', 'mzstatic.com', 'cdn-apple.com'] },
  { n: 'PayPal', tk: ['paypal'], lbl: 'paypal', ok: ['paypal.com', 'paypal.me', 'paypalobjects.com', 'paypal-community.com'] },
  { n: 'Netflix', tk: ['netflix'], ok: ['netflix.com', 'nflxso.net', 'nflximg.net', 'nflxext.com'] },
  { n: 'Meta (Facebook / Instagram)', tk: ['facebook', 'instagram'], ok: ['facebook.com', 'fb.com', 'instagram.com', 'fbcdn.net', 'cdninstagram.com', 'meta.com', 'messenger.com'] },
  { n: 'WhatsApp', tk: ['whatsapp'], ok: ['whatsapp.com', 'whatsapp.net', 'wa.me'] },
  { n: 'IRCTC', tk: ['irctc'], ok: ['irctc.co.in', 'irctctourism.com', 'irctc.com'] },
  { n: 'India Post', tk: ['indiapost'], ok: ['indiapost.gov.in'] },
  { n: 'Income Tax Dept', tk: ['incometax', 'incometaxindia'], ok: ['incometax.gov.in', 'incometaxindia.gov.in'] },
  { n: 'UIDAI / Aadhaar', tk: ['uidai', 'aadhaar', 'aadhar'], ok: ['uidai.gov.in'] },
  { n: 'EPFO', tk: ['epfo', 'epfindia'], ok: ['epfindia.gov.in', 'epfindia.com'] },
  { n: 'DHL', tk: ['dhl'], lbl: 'dhl', ok: ['dhl.com'] },
  { n: 'FedEx', tk: ['fedex'], lbl: 'fedex', ok: ['fedex.com'] },
  { n: 'Blue Dart', tk: ['bluedart'], ok: ['bluedart.com'] },
  { n: 'Delhivery', tk: ['delhivery'], ok: ['delhivery.com'] },
];

/** Established country / generic endings that count as "<lbl>.<ending>" for global brands */
export const ESTABLISHED_TLDS = new Set(['com', 'net', 'org', 'in', 'co.in', 'uk', 'co.uk', 'de', 'fr', 'it', 'es', 'ca', 'au', 'com.au', 'jp', 'co.jp', 'br', 'com.br', 'mx', 'com.mx', 'ae', 'sa', 'sg', 'com.sg', 'nl', 'se', 'pl', 'ie', 'ch', 'be', 'at', 'dk', 'no', 'fi', 'pt', 'tr', 'com.tr', 'za', 'co.za', 'nz', 'co.nz', 'kr', 'co.kr', 'cn', 'com.cn', 'hk', 'com.hk', 'tw', 'com.tw', 'id', 'co.id', 'ph', 'com.ph', 'vn', 'com.vn', 'th', 'co.th', 'my', 'com.my', 'eg', 'com.eg', 'ng', 'com.ng', 'ke', 'co.ke', 'pk', 'com.pk', 'bd', 'com.bd', 'lk', 'ru', 'ua', 'cz', 'gr', 'hu', 'ro', 'il', 'co.il', 'ar', 'com.ar', 'cl', 'pe', 'com.pe']);

/** Endings only real institutions can register (government, universities, verified banks) */
export const TRUSTED_SUFFIXES = ['gov', 'edu', 'mil', 'gov.in', 'nic.in', 'ac.in', 'edu.in', 'res.in', 'mil.in', 'gov.uk', 'ac.uk', 'gov.au', 'edu.au', 'bank.in', 'fin.in', 'sbi', 'bank'];

const EXTRA_TRUSTED = [
  // global tech, social, reference
  'youtube.com', 'github.com', 'gitlab.com', 'stackoverflow.com', 'stackexchange.com', 'npmjs.com', 'python.org', 'nodejs.org', 'react.dev', 'reactjs.org', 'mozilla.org', 'firefox.com',
  'linkedin.com', 'twitter.com', 'x.com', 'pinterest.com', 'reddit.com', 'snapchat.com', 'tiktok.com', 'discord.com', 'telegram.org', 't.me', 'zoom.us', 'slack.com', 'dropbox.com', 'notion.so', 'atlassian.com', 'canva.com', 'figma.com', 'adobe.com',
  'wikipedia.org', 'wikimedia.org', 'archive.org', 'w3schools.com', 'medium.com', 'quora.com', 'openai.com', 'anthropic.com', 'claude.ai', 'cloudflare.com', 'wordpress.com', 'shopify.com', 'speedtest.net',
  'spotify.com', 'hotstar.com', 'sonyliv.com', 'zee5.com', 'imdb.com', 'goodreads.com', 'audible.com', 'stripe.com', 'ebay.com', 'aliexpress.com', 'walmart.com', 'bestbuy.com',
  'coursera.org', 'udemy.com', 'edx.org', 'khanacademy.org',
  // news
  'bbc.com', 'bbc.co.uk', 'cnn.com', 'nytimes.com', 'theguardian.com', 'reuters.com', 'bloomberg.com', 'forbes.com', 'thehindu.com', 'hindustantimes.com', 'indiatimes.com', 'timesofindia.com', 'ndtv.com', 'indianexpress.com', 'livemint.com', 'economictimes.com', 'moneycontrol.com', 'business-standard.com', 'news18.com',
  // India: shopping, travel, services, telecom, payments
  'ajio.com', 'meesho.com', 'nykaa.com', 'bigbasket.com', 'blinkit.com', 'dominos.co.in', 'olacabs.com', 'uber.com', 'makemytrip.com', 'goibibo.com', 'cleartrip.com', 'ixigo.com', 'redbus.in', 'goindigo.in', 'airindia.com', 'spicejet.com', 'bookmyshow.com', 'justdial.com', 'olx.in', 'tatacliq.com', 'croma.com',
  'bsnl.co.in', 'myvi.in', 'freecharge.in', 'mobikwik.com', 'cred.club', 'razorpay.com', 'npci.org.in', 'bhimupi.org.in',
  // India: banks, markets, insurance
  'rbi.org.in', 'nseindia.com', 'bseindia.com', 'zerodha.com', 'groww.in', 'upstox.com', 'angelone.in', 'licindia.in', 'unionbankofindia.co.in', 'idfcfirstbank.com', 'yesbank.in', 'indusind.com', 'bankofindia.co.in', 'centralbankofindia.co.in', 'indianbank.in',
  // courier
  'ups.com', 'dtdc.in', 'ecomexpress.in', 'xpressbees.com',
];

export const TRUSTED_DOMAINS = [...new Set([...BRANDS.flatMap(b => b.ok), ...EXTRA_TRUSTED])].filter(d => d.includes('.'));

/** Trusted platforms where anyone can publish content: score a small caution, not a free pass */
export const CAUTION_HOSTS = new Set(['sites.google.com', 'docs.google.com', 'forms.gle', 'drive.google.com', 'script.google.com', 'storage.googleapis.com', 'forms.office.com', 'onedrive.live.com', 't.me', 'wa.me']);
export const CAUTION_RD = new Set(['amazonaws.com', 'sharepoint.com', 'dropbox.com', 'notion.so', 'canva.com', 'googleusercontent.com']);
