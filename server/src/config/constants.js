export const DISTRICTS = [
  {
    id: 'thanjavur',
    name: 'Thanjavur',
    nameTa: 'தஞ்சாவூர்',
    lat: 10.7870,
    lon: 79.1378,
    primaryCrops: ['Paddy', 'Sugarcane', 'Banana'],
  },
  {
    id: 'madurai',
    name: 'Madurai',
    nameTa: 'மதுரை',
    lat: 9.9252,
    lon: 78.1198,
    primaryCrops: ['Paddy', 'Cotton', 'Sugarcane'],
  },
  {
    id: 'tiruchirappalli',
    name: 'Tiruchirappalli',
    nameTa: 'திருச்சிராப்பள்ளி',
    lat: 10.7905,
    lon: 78.7047,
    primaryCrops: ['Banana', 'Paddy', 'Sugarcane'],
  },
  {
    id: 'coimbatore',
    name: 'Coimbatore',
    nameTa: 'கோயம்புத்தூர்',
    lat: 11.0168,
    lon: 76.9558,
    primaryCrops: ['Cotton', 'Sugarcane', 'Banana'],
  },
  {
    id: 'nagapattinam',
    name: 'Nagapattinam',
    nameTa: 'நாகப்பட்டினம்',
    lat: 10.7672,
    lon: 79.8449,
    primaryCrops: ['Paddy', 'Banana'],
  },
];

export const CROPS = ['Paddy', 'Sugarcane', 'Banana', 'Cotton'];

export const LANGUAGES = [
  { code: 'ta', label: 'தமிழ் (Tamil)' },
  { code: 'en', label: 'English' },
];

export const ALERT_TYPES = {
  HEAVY_RAIN: 'heavy_rain',
  STRONG_WIND: 'strong_wind',
  DROUGHT: 'drought',
};

export const ALERT_STATUSES = {
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  SENDING: 'sending',
  SENT: 'sent',
  DISMISSED: 'dismissed',
  PARTIALLY_FAILED: 'partially_failed',
};

export const CALL_STATUSES = {
  QUEUED: 'queued',
  RINGING: 'ringing',
  ANSWERED: 'answered',
  NO_ANSWER: 'no_answer',
  FAILED: 'failed',
  BUSY: 'busy',
};

export const DTMF_RESULTS = {
  ACKNOWLEDGED: 'acknowledged',
  REPLAY_REQUESTED: 'replay_requested',
  NO_RESPONSE: 'no_response',
  OPT_OUT: 'opt_out',
};

export const DEFAULT_RULES = {
  heavy_rain: {
    enabled: true,
    rainfall24hMm: 45,
    severity: 'warning',
    adviceEn: 'Heavy rain predicted in the next 24 hours. Ensure drainage in low-lying paddy and crop fields immediately to prevent root rot.',
    adviceTa: 'அடுத்த 24 மணி நேரத்தில் கனமழை பெய்ய வாய்ப்புள்ளது. வயல்களில் அதிகப்படியான நீரை உடனடியாக வடிய வைக்க வடிகால் வசதி செய்யுங்கள்.',
    targetCrops: ['Paddy', 'Banana', 'Sugarcane'],
  },
  strong_wind: {
    enabled: true,
    gustKmh: 45,
    severity: 'warning',
    adviceEn: 'Strong cyclonic wind gusts predicted. Provide bamboo staking or propping for banana trees and tie sugarcane crops.',
    adviceTa: 'பலத்த காற்று வீசக்கூடும் என்பதால், வாழை மரங்களுக்கு மூங்கில் முட்டுக் கொடுங்கள் மற்றும் கரும்புப் பயிர்களை சாயாமல் பிணைத்துக் கட்டுங்கள்.',
    targetCrops: ['Banana', 'Sugarcane'],
  },
  drought: {
    enabled: true,
    rainfall7dMaxMm: 5,
    tempMaxCelsius: 38,
    severity: 'watch',
    adviceEn: 'High temperatures and dry conditions ahead. Apply mulching to retain soil moisture and schedule night-time micro-irrigation.',
    adviceTa: 'கடும் வெப்பம் மற்றும் வறண்ட வானிலை நிலவும். மண்ணின் ஈரப்பதத்தை காக்க நிலப்போர்வை அமைத்து, இரவு நேர நுண்ணீர்ப்பாசனம் மேற்கொள்ளுங்கள்.',
    targetCrops: ['Paddy', 'Cotton', 'Sugarcane', 'Banana'],
  },
};
