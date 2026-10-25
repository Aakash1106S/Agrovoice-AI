import { Farmer } from '../models/Farmer.js';
import { validateAndNormalizePhone } from '../utils/phoneValidator.js';

export async function publicRegisterFarmer(req, res, next) {
  try {
    const { name, phone, village, district, crops, language = 'ta', consent } = req.body;

    // Validate phone
    const phoneValidation = validateAndNormalizePhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: phoneValidation.error,
      });
    }

    // Consent is mandatory
    if (consent !== true && consent !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'You must provide consent to receive emergency weather phone calls.',
      });
    }

    if (!name || !village || !district) {
      return res.status(400).json({
        success: false,
        error: 'Name, village, and district are required.',
      });
    }

    const cropList = Array.isArray(crops) ? crops : crops ? [crops] : ['Paddy'];

    // Privacy-preserving duplicate handling: if farmer exists, update or refresh consent without leaking existence
    const existing = await Farmer.findOne({ phone: phoneValidation.normalized });
    if (existing) {
      existing.name = name;
      existing.village = village;
      existing.district = district;
      existing.crops = cropList;
      existing.language = language;
      existing.consent = true;
      existing.consentAt = new Date();
      existing.optedOut = false;
      existing.active = true;
      await existing.save();

      return res.status(200).json({
        success: true,
        messageEn: 'Registration successful. You will get a call when weather danger is near.',
        messageTa: 'பதிவு வெற்றிகரமாக முடிந்தது. தீவிர வானிலை ஏற்படும் போது உங்களுக்கு குரல் அழைப்பு வரும்.',
      });
    }

    await Farmer.create({
      name,
      phone: phoneValidation.normalized,
      village,
      district,
      crops: cropList,
      language,
      consent: true,
      consentAt: new Date(),
      consentSource: 'self_registration',
      active: true,
      optedOut: false,
    });

    return res.status(201).json({
      success: true,
      messageEn: 'Registration successful. You will get a call when weather danger is near.',
      messageTa: 'பதிவு வெற்றிகரமாக முடிந்தது. தீவிர வானிலை ஏற்படும் போது உங்களுக்கு குரல் அழைப்பு வரும்.',
    });
  } catch (err) {
    next(err);
  }
}
