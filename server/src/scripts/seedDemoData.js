import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from '../config/database.js';
import { Farmer } from '../models/Farmer.js';
import { Alert } from '../models/Alert.js';
import { CallLog } from '../models/CallLog.js';
import { AdminUser } from '../models/AdminUser.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcrypt';

const DEMO_FARMERS = [
  // Thanjavur (Delta paddy & sugarcane)
  {
    name: 'Murugan S.',
    phone: '+919842100001',
    village: 'Thiruvaiyaru',
    district: 'Thanjavur',
    crops: ['Paddy', 'Sugarcane'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Selvam K.',
    phone: '+919842100002',
    village: 'Orathanadu',
    district: 'Thanjavur',
    crops: ['Paddy', 'Banana'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Dr. R. Ramanathan',
    phone: '+919842100003',
    village: 'Kumbakonam',
    district: 'Thanjavur',
    crops: ['Paddy'],
    language: 'en',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Govindasamy N. (Opted Out Demo)',
    phone: '+919842100004',
    village: 'Papanasam',
    district: 'Thanjavur',
    crops: ['Paddy'],
    language: 'ta',
    consent: true,
    optedOut: true, // EXCLUDED TO PROVE OPT-OUT LOGIC
    optedOutAt: new Date(),
    active: true,
  },
  {
    name: 'Annamalai T. (No Consent Demo)',
    phone: '+919842100005',
    village: 'Budalur',
    district: 'Thanjavur',
    crops: ['Sugarcane'],
    language: 'ta',
    consent: false, // EXCLUDED TO PROVE CONSENT ENFORCEMENT
    optedOut: false,
    active: false,
  },

  // Madurai (Paddy, Cotton, Sugarcane)
  {
    name: 'Palanisamy M.',
    phone: '+919842200001',
    village: 'Melur',
    district: 'Madurai',
    crops: ['Cotton', 'Paddy'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Subramanian V.',
    phone: '+919842200002',
    village: 'Vadipatti',
    district: 'Madurai',
    crops: ['Paddy', 'Sugarcane'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Kavitha Devi',
    phone: '+919842200003',
    village: 'Usilampatti',
    district: 'Madurai',
    crops: ['Cotton'],
    language: 'en',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Chidambaram C. (Opted Out Demo)',
    phone: '+919842200004',
    village: 'Thirumangalam',
    district: 'Madurai',
    crops: ['Cotton'],
    language: 'ta',
    consent: true,
    optedOut: true,
    optedOutAt: new Date(),
    active: true,
  },

  // Tiruchirappalli (Banana & Paddy)
  {
    name: 'Marimuthu P.',
    phone: '+919842300001',
    village: 'Lalgudi',
    district: 'Tiruchirappalli',
    crops: ['Banana', 'Paddy'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Rajendran G.',
    phone: '+919842300002',
    village: 'Manachanallur',
    district: 'Tiruchirappalli',
    crops: ['Banana', 'Sugarcane'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Suresh Kumar B.',
    phone: '+919842300003',
    village: 'Musiri',
    district: 'Tiruchirappalli',
    crops: ['Paddy'],
    language: 'en',
    consent: true,
    optedOut: false,
    active: true,
  },

  // Coimbatore (Cotton, Sugarcane, Banana)
  {
    name: 'Kandasamy R.',
    phone: '+919842400001',
    village: 'Pollachi',
    district: 'Coimbatore',
    crops: ['Cotton', 'Banana'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Velusamy K.',
    phone: '+919842400002',
    village: 'Thondamuthur',
    district: 'Coimbatore',
    crops: ['Sugarcane', 'Cotton'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Meenakshi Sundaram',
    phone: '+919842400003',
    village: 'Sulur',
    district: 'Coimbatore',
    crops: ['Banana'],
    language: 'en',
    consent: true,
    optedOut: false,
    active: true,
  },

  // Nagapattinam (Coastal paddy & banana)
  {
    name: 'Thangavel A.',
    phone: '+919842500001',
    village: 'Kilvelur',
    district: 'Nagapattinam',
    crops: ['Paddy', 'Banana'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Senthil Nathan P.',
    phone: '+919842500002',
    village: 'Vedaranyam',
    district: 'Nagapattinam',
    crops: ['Paddy'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
  {
    name: 'Ganesan Muthu',
    phone: '+919842500003',
    village: 'Thirukkuvalai',
    district: 'Nagapattinam',
    crops: ['Paddy'],
    language: 'ta',
    consent: true,
    optedOut: false,
    active: true,
  },
];

async function seedDemoData() {
  try {
    await connectDB();

    logger.info('Seeding AgroVoice AI demo data...');

    // 1. Ensure SuperAdmin exists
    const adminEmail = 'admin@agrovoice.org';
    let admin = await AdminUser.findOne({ email: adminEmail });
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('AgroAdmin@2026!', salt);
      admin = await AdminUser.create({
        name: 'AgroVoice SuperAdmin',
        email: adminEmail,
        passwordHash,
        role: 'super_admin',
      });
      logger.info('Admin user created');
    }

    // 2. Clear existing demo farmers and recreate
    await Farmer.deleteMany({});
    const insertedFarmers = await Farmer.insertMany(
      DEMO_FARMERS.map((f) => ({
        ...f,
        consentAt: f.consent ? new Date() : null,
        consentSource: 'admin',
      }))
    );
    logger.info(`Inserted ${insertedFarmers.length} farmers across 5 Tamil Nadu districts.`);

    // 3. Clear existing alerts and create sample alerts in various statuses
    await Alert.deleteMany({});

    // Pending Review Alert
    const pendingAlert = await Alert.create({
      district: 'Thanjavur',
      type: 'heavy_rain',
      severity: 'warning',
      forecastEvidence: {
        metric: 'precipitation_24h',
        value: 58.4,
        threshold: 45,
        unit: 'mm',
        timeWindow: 'Next 24-48 hours',
        description: 'Predicted rainfall of 58.4 mm exceeds heavy rain threshold of 45 mm (DEMO DATA).',
      },
      affectedCrops: ['Paddy', 'Sugarcane', 'Banana'],
      tamilScript: 'வணக்கம் விவசாய தோழரே, தஞ்சாவூர் மாவட்டத்திற்கான அவசர வானிலை எச்சரிக்கை: அடுத்த 24 முதல் 48 மணி நேரத்தில் சுமார் 58 மில்லிமீட்டர் கனமழை பெய்ய வாய்ப்புள்ளது. நெல் மற்றும் கரும்புப் பயிர்களில் நீர் தேங்காமல் தடுக்க, உடனடியாக வயல் வடிகால்களை சரிசெய்து நீரை வடிய வையுங்கள். மழை நிற்கும் வரை உரம் தெளிப்பதை தள்ளிப்போடுங்கள். இந்த அறிவிப்பை உறுதிப்படுத்த 1-ஐ அழுத்தவும், மீண்டும் கேட்க 2-ஐ அழுத்தவும்.',
      englishScript: 'Urgent weather advisory for Thanjavur farmers: Heavy rainfall of around 58 mm is predicted in the next 24 to 48 hours. Please inspect and clear field drainage channels immediately to prevent waterlogging and root rot in Paddy and Sugarcane. Postpone fertilizer and pesticide spraying until fields drain. Press 1 to acknowledge this advisory, or press 2 to replay.',
      status: 'pending_review',
      windowStart: new Date(),
      windowEnd: new Date(Date.now() + 48 * 60 * 60 * 1000),
    });

    // Approved Alert
    const approvedAlert = await Alert.create({
      district: 'Coimbatore',
      type: 'strong_wind',
      severity: 'warning',
      forecastEvidence: {
        metric: 'wind_gusts_max',
        value: 52.0,
        threshold: 45,
        unit: 'km/h',
        timeWindow: 'Peak over next 36 hours',
        description: 'Cyclonic wind gusts reaching 52 km/h detected in Coimbatore rural belt (DEMO DATA).',
      },
      affectedCrops: ['Banana', 'Sugarcane'],
      tamilScript: 'வணக்கம் விவசாய தோழரே, கோயம்புத்தூர் மாவட்டத்திற்கான பலத்த காற்று எச்சரிக்கை: மணிக்கு 52 கி.மீ வேகத்தில் காற்று வீச வாய்ப்புள்ளது. வாழை மரங்களுக்கு மூங்கில் முட்டுக் கொடுங்கள் மற்றும் கரும்புப் பயிர்களை பிணைத்துக் கட்டுங்கள். இந்த அறிவிப்பை உறுதிப்படுத்த 1-ஐ அழுத்தவும், மீண்டும் கேட்க 2-ஐ அழுத்தவும்.',
      englishScript: 'Critical wind alert for Coimbatore farmers: Strong cyclonic wind gusts up to 52 km per hour are expected. Provide immediate bamboo staking and propping for banana trees, and tie sugarcane stalks in bundles. Press 1 to acknowledge this advisory, or press 2 to replay.',
      status: 'approved',
      approvedBy: admin._id,
      approvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      windowStart: new Date(),
      windowEnd: new Date(Date.now() + 36 * 60 * 60 * 1000),
    });

    // Sent Alert with Call History
    const sentAlert = await Alert.create({
      district: 'Nagapattinam',
      type: 'heavy_rain',
      severity: 'critical',
      forecastEvidence: {
        metric: 'precipitation_24h',
        value: 72.5,
        threshold: 45,
        unit: 'mm',
        timeWindow: 'Past 24 hours',
        description: 'Coastal depression generated 72.5 mm rainfall (DEMO DATA).',
      },
      affectedCrops: ['Paddy', 'Banana'],
      tamilScript: 'நாகப்பட்டினம் மாவட்டத்திற்கான அவசர எச்சரிக்கை: 72 மி.மீ கனமழை பெய்துள்ளது. வடிகால் அமைப்பை உடனடியாக கவனியுங்கள். இந்த அறிவிப்பை உறுதிப்படுத்த 1-ஐ அழுத்தவும்.',
      englishScript: 'Nagapattinam alert: 72 mm heavy rain. Open field drainage immediately. Press 1 to acknowledge.',
      status: 'sent',
      approvedBy: admin._id,
      approvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      sentAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      recipientCount: 3,
      successfulCalls: 3,
      acknowledgedCalls: 2,
    });

    // 4. Create realistic Call History (all flagged simulated: true)
    await CallLog.deleteMany({});

    const nagapattinamFarmers = insertedFarmers.filter(
      (f) => f.district === 'Nagapattinam' && f.active && f.consent && !f.optedOut
    );

    const callLogs = [
      {
        alert: sentAlert._id,
        farmer: nagapattinamFarmers[0]._id,
        language: nagapattinamFarmers[0].language,
        provider: 'simulated',
        providerCallSid: `sim_demo_${Date.now()}_1`,
        status: 'answered',
        dtmfResult: 'acknowledged',
        durationSec: 28,
        simulated: true,
        mode: 'test',
        scriptSpoken: sentAlert.tamilScript,
        answeredAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 22 * 60 * 60 * 1000 + 28000),
        createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
      },
      {
        alert: sentAlert._id,
        farmer: nagapattinamFarmers[1]._id,
        language: nagapattinamFarmers[1].language,
        provider: 'simulated',
        providerCallSid: `sim_demo_${Date.now()}_2`,
        status: 'answered',
        dtmfResult: 'acknowledged',
        durationSec: 32,
        simulated: true,
        mode: 'test',
        scriptSpoken: sentAlert.tamilScript,
        answeredAt: new Date(Date.now() - 21 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 21 * 60 * 60 * 1000 + 32000),
        createdAt: new Date(Date.now() - 21 * 60 * 60 * 1000),
      },
      {
        alert: sentAlert._id,
        farmer: nagapattinamFarmers[2]._id,
        language: nagapattinamFarmers[2].language,
        provider: 'simulated',
        providerCallSid: `sim_demo_${Date.now()}_3`,
        status: 'answered',
        dtmfResult: 'replay_requested',
        durationSec: 45,
        simulated: true,
        mode: 'test',
        scriptSpoken: sentAlert.tamilScript,
        answeredAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 20 * 60 * 60 * 1000 + 45000),
        createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
      },
      // Additional past simulated calls across days for trend graphs
      {
        alert: null,
        farmer: insertedFarmers[0]._id,
        language: 'ta',
        provider: 'simulated',
        providerCallSid: `sim_demo_${Date.now()}_4`,
        status: 'answered',
        dtmfResult: 'acknowledged',
        durationSec: 25,
        simulated: true,
        mode: 'test',
        scriptSpoken: 'Test advisory call',
        answeredAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        completedAt: new Date(Date.now() - 48 * 60 * 60 * 1000 + 25000),
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      },
      {
        alert: null,
        farmer: insertedFarmers[5]._id,
        language: 'ta',
        provider: 'simulated',
        providerCallSid: `sim_demo_${Date.now()}_5`,
        status: 'no_answer',
        dtmfResult: 'no_response',
        durationSec: 0,
        simulated: true,
        mode: 'test',
        scriptSpoken: 'Test advisory call',
        createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
      },
    ];

    await CallLog.insertMany(callLogs);
    logger.info(`Inserted ${callLogs.length} simulated call logs for demo analytics and history.`);

    logger.info('Demo data seeded successfully!');
    await disconnectDB();
    process.exit(0);
  } catch (err) {
    logger.error('Failed to seed demo data:', err);
    process.exit(1);
  }
}

seedDemoData();
