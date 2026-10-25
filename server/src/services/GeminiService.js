import axios from 'axios';
import { ALERT_TYPES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export class GeminiService {
  /**
   * Generates colloquial Tamil and English voice scripts for an alert.
   * Uses Gemini API if GEMINI_API_KEY is set, otherwise falls back to deterministic,
   * high quality colloquial templates.
   */
  static async generateAdvisoryScripts({ districtName, districtNameTa, type, severity, evidence, crops }) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      try {
        const response = await this.callGemini({ districtName, districtNameTa, type, severity, evidence, crops }, apiKey);
        if (response && response.tamilScript && response.englishScript) {
          return response;
        }
      } catch (err) {
        logger.warn('Gemini API call failed, using deterministic templates:', err.message);
      }
    }

    return this.getFallbackScripts({ districtName, districtNameTa, type, severity, evidence, crops });
  }

  static async callGemini(alertData, apiKey) {
    const prompt = `
You are an agricultural voice alert assistant for Tamil Nadu farmers.
Generate two voice scripts (one in colloquial Tamil, one in Indian English) for a weather emergency.
Keep them concise, urgent yet calm, practical, and conversational for an IVR voice call.

Context:
District: ${alertData.districtName} (${alertData.districtNameTa})
Alert Type: ${alertData.type}
Severity: ${alertData.severity}
Evidence: ${alertData.evidence.description} (${alertData.evidence.value} ${alertData.evidence.unit})
Affected Crops: ${alertData.crops.join(', ')}

Rules:
1. Tamil script must be in colloquial spoken Tamil (பேச்சுத் தமிழ் / Kongu/Delta friendly), easy for rural farmers to understand over phone.
2. At the end of BOTH scripts, include the standard DTMF prompt:
   - English: "Press 1 to acknowledge this advisory, or press 2 to replay."
   - Tamil: "இந்த அறிவிப்பை உறுதிப்படுத்த 1-ஐ அழுத்தவும், மீண்டும் கேட்க 2-ஐ அழுத்தவும்."
3. Return ONLY a valid JSON object with keys: "tamilScript" and "englishScript". No markdown formatting or extra text.
`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };

    const res = await axios.post(url, payload, { timeout: 8000 });
    const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (text) {
      return JSON.parse(text);
    }
    throw new Error('Empty response from Gemini');
  }

  static getFallbackScripts({ districtName, districtNameTa, type, severity, evidence, crops }) {
    const cropStr = crops && crops.length > 0 ? crops.join(', ') : 'crops';
    const districtDisplay = districtNameTa || districtName;

    if (type === ALERT_TYPES.HEAVY_RAIN) {
      return {
        englishScript: `Urgent weather advisory for ${districtName} farmers: Heavy rainfall of around ${evidence?.value || 45} mm is predicted in the next 24 to 48 hours. Please inspect and clear field drainage channels immediately to prevent waterlogging and root damage in ${cropStr}. Postpone fertilizer and pesticide spraying until fields drain. Press 1 to acknowledge this advisory, or press 2 to replay.`,
        tamilScript: `வணக்கம் விவசாய தோழரே, ${districtDisplay} மாவட்டத்திற்கான அவசர வானிலை எச்சரிக்கை: அடுத்த 24 முதல் 48 மணி நேரத்தில் சுமார் ${evidence?.value || 45} மில்லிமீட்டர் கனமழை பெய்ய வாய்ப்புள்ளது. ${cropStr} பயிர்களில் நீர் தேங்காமல் தடுக்க, உடனடியாக வயல் வடிகால்களை சரிசெய்து நீரை வடிய வையுங்கள். மழை நிற்கும் வரை உரம் மற்றும் மருந்து தெளிப்பதை தள்ளிப்போடுங்கள். இந்த அறிவிப்பை உறுதிப்படுத்த 1-ஐ அழுத்தவும், மீண்டும் கேட்க 2-ஐ அழுத்தவும்.`,
      };
    }

    if (type === ALERT_TYPES.STRONG_WIND) {
      return {
        englishScript: `Critical wind alert for ${districtName} farmers: Strong cyclonic wind gusts up to ${evidence?.value || 50} km per hour are expected. Provide immediate bamboo staking and propping for banana trees, and tie sugarcane stalks in bundles to prevent lodging. Secure all farm equipment and nursery sheds. Press 1 to acknowledge this advisory, or press 2 to replay.`,
        tamilScript: `வணக்கம் விவசாய தோழரே, ${districtDisplay} மாவட்டத்திற்கான சூறாவளிக் காற்று எச்சரிக்கை: மணிக்கு சுமார் ${evidence?.value || 50} கிலோமீட்டர் வேகத்தில் பலத்த காற்று வீசக்கூடும். வாழை மரங்கள் சாயாமல் இருக்க மூங்கில் முட்டுக் கொடுங்கள் மற்றும் கரும்புப் பயிர்களை ஒன்றாகச் சேர்த்து பிணைத்துக் கட்டுங்கள். கொட்டகைகளையும் பண்ணைக் கருவிகளையும் பாதுகாப்பாக வையுங்கள். இந்த அறிவிப்பை உறுதிப்படுத்த 1-ஐ அழுத்தவும், மீண்டும் கேட்க 2-ஐ அழுத்தவும்.`,
      };
    }

    // Default / Drought
    return {
      englishScript: `Agricultural advisory for ${districtName} farmers: Severe heatwave conditions and dry weather are forecast over the coming week with temperatures reaching peak levels. Apply organic mulching around ${cropStr} to conserve soil moisture, and switch to late evening or night-time micro-irrigation. Press 1 to acknowledge this advisory, or press 2 to replay.`,
      tamilScript: `வணக்கம் விவசாய தோழரே, ${districtDisplay} மாவட்டத்திற்கான வறட்சி மற்றும் வெப்ப அலை ஆலோசனை: அடுத்த ஒரு வாரத்திற்கு கடும் வெயிலும் வறண்ட வானிலையும் நிலவும். ${cropStr} பயிர்களின் ஈரப்பதம் குறையாமல் இருக்க நிலப்போர்வை அமையுங்கள். இரவு அல்லது அதிகாலை வேளையில் சொட்டு நீர்ப்பாசனம் செய்யுங்கள். இந்த அறிவிப்பை உறுதிப்படுத்த 1-ஐ அழுத்தவும், மீண்டும் கேட்க 2-ஐ அழுத்தவும்.`,
    };
  }
}
