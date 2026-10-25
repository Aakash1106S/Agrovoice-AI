import bcrypt from 'bcrypt';
import { AdminUser } from '../models/AdminUser.js';
import { Farmer } from '../models/Farmer.js';
import { Alert } from '../models/Alert.js';
import { CallLog } from '../models/CallLog.js';
import { logger } from '../utils/logger.js';

export async function ensureInitialSeedData() {
  try {
    const adminCount = await AdminUser.countDocuments();
    let admin = null;

    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('AgroAdmin@2026!', salt);
      admin = await AdminUser.create({
        name: 'AgroVoice SuperAdmin',
        email: 'admin@agrovoice.org',
        passwordHash,
        role: 'super_admin',
      });
      logger.info('Auto-seeded default admin: admin@agrovoice.org / AgroAdmin@2026!');
    } else {
      admin = await AdminUser.findOne({ email: 'admin@agrovoice.org' });
    }

    const farmerCount = await Farmer.countDocuments();
    if (farmerCount === 0) {
      logger.info('Empty database detected. Auto-seeding realistic Tamil Nadu farmers & demo alerts...');

      const demoFarmers = [
        // Thanjavur
        { name: 'Murugan S.', phone: '+919842100001', village: 'Thiruvaiyaru', district: 'Thanjavur', crops: ['Paddy', 'Sugarcane'], language: 'ta', consent: true, optedOut: false, active: true },
        { name: 'Selvam K.', phone: '+919842100002', village: 'Orathanadu', district: 'Thanjavur', crops: ['Paddy', 'Banana'], language: 'ta', consent: true, optedOut: false, active: true },
        { name: 'Dr. R. Ramanathan', phone: '+919842100003', village: 'Kumbakonam', district: 'Thanjavur', crops: ['Paddy'], language: 'en', consent: true, optedOut: false, active: true },
        { name: 'Govindasamy N. (Opted Out)', phone: '+919842100004', village: 'Papanasam', district: 'Thanjavur', crops: ['Paddy'], language: 'ta', consent: true, optedOut: true, optedOutAt: new Date(), active: true },
        { name: 'Annamalai T. (No Consent)', phone: '+919842100005', village: 'Budalur', district: 'Thanjavur', crops: ['Sugarcane'], language: 'ta', consent: false, optedOut: false, active: false },

        // Madurai
        { name: 'Palanisamy M.', phone: '+919842200001', village: 'Melur', district: 'Madurai', crops: ['Cotton', 'Paddy'], language: 'ta', consent: true, optedOut: false, active: true },
        { name: 'Subramanian V.', phone: '+919842200002', village: 'Vadipatti', district: 'Madurai', crops: ['Paddy', 'Sugarcane'], language: 'ta', consent: true, optedOut: false, active: true },
        { name: 'Kavitha Devi', phone: '+919842200003', village: 'Usilampatti', district: 'Madurai', crops: ['Cotton'], language: 'en', consent: true, optedOut: false, active: true },

        // Tiruchirappalli
        { name: 'Marimuthu P.', phone: '+919842300001', village: 'Lalgudi', district: 'Tiruchirappalli', crops: ['Banana', 'Paddy'], language: 'ta', consent: true, optedOut: false, active: true },
        { name: 'Rajendran G.', phone: '+919842300002', village: 'Manachanallur', district: 'Tiruchirappalli', crops: ['Banana', 'Sugarcane'], language: 'ta', consent: true, optedOut: false, active: true },

        // Coimbatore
        { name: 'Kandasamy R.', phone: '+919842400001', village: 'Pollachi', district: 'Coimbatore', crops: ['Cotton', 'Banana'], language: 'ta', consent: true, optedOut: false, active: true },
        { name: 'Velusamy K.', phone: '+919842400002', village: 'Thondamuthur', district: 'Coimbatore', crops: ['Sugarcane', 'Cotton'], language: 'ta', consent: true, optedOut: false, active: true },

        // Nagapattinam
        { name: 'Thangavel A.', phone: '+919842500001', village: 'Kilvelur', district: 'Nagapattinam', crops: ['Paddy', 'Banana'], language: 'ta', consent: true, optedOut: false, active: true },
        { name: 'Senthil Nathan P.', phone: '+919842500002', village: 'Vedaranyam', district: 'Nagapattinam', crops: ['Paddy'], language: 'ta', consent: true, optedOut: false, active: true },
      ];

      const inserted = await Farmer.insertMany(demoFarmers.map((f) => ({ ...f, consentAt: f.consent ? new Date() : null, consentSource: 'admin' })));

      // Sample Pending Review Alert
      await Alert.create({
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
      });

      // Sample Sent Alert and calls
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
        approvedBy: admin?._id,
        approvedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        sentAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
        recipientCount: 2,
        successfulCalls: 2,
        acknowledgedCalls: 2,
      });

      const nagapattinamFarmers = inserted.filter((f) => f.district === 'Nagapattinam');
      if (nagapattinamFarmers.length >= 2) {
        await CallLog.create([
          {
            alert: sentAlert._id,
            farmer: nagapattinamFarmers[0]._id,
            language: 'ta',
            provider: 'simulated',
            providerCallSid: `sim_auto_${Date.now()}_1`,
            status: 'answered',
            dtmfResult: 'acknowledged',
            durationSec: 26,
            simulated: true,
            mode: 'test',
            scriptSpoken: sentAlert.tamilScript,
            answeredAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 20 * 60 * 60 * 1000 + 26000),
            createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000),
          },
          {
            alert: sentAlert._id,
            farmer: nagapattinamFarmers[1]._id,
            language: 'ta',
            provider: 'simulated',
            providerCallSid: `sim_auto_${Date.now()}_2`,
            status: 'answered',
            dtmfResult: 'acknowledged',
            durationSec: 30,
            simulated: true,
            mode: 'test',
            scriptSpoken: sentAlert.tamilScript,
            answeredAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
            completedAt: new Date(Date.now() - 18 * 60 * 60 * 1000 + 30000),
            createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
          },
        ]);
      }

      logger.info('Auto-seeded demo data completed successfully!');
    }
  } catch (err) {
    logger.error('Auto-seed check failed:', err.message);
  }
}
