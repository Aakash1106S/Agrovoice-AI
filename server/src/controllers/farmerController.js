import { Farmer } from '../models/Farmer.js';
import { validateAndNormalizePhone } from '../utils/phoneValidator.js';

export async function listFarmers(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      district = '',
      crop = '',
      language = '',
      consent,
      optedOut,
      active,
    } = req.query;

    const filter = {};

    if (district) {
      filter.district = { $regex: new RegExp(`^${district}$`, 'i') };
    }

    if (crop) {
      filter.crops = crop;
    }

    if (language) {
      filter.language = language;
    }

    if (consent !== undefined && consent !== '') {
      filter.consent = consent === 'true';
    }

    if (optedOut !== undefined && optedOut !== '') {
      filter.optedOut = optedOut === 'true';
    }

    if (active !== undefined && active !== '') {
      filter.active = active === 'true';
    }

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { village: searchRegex },
        { district: searchRegex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [farmers, total] = await Promise.all([
      Farmer.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Farmer.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: farmers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getFarmer(req, res, next) {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }
    return res.json({ success: true, data: farmer });
  } catch (err) {
    next(err);
  }
}

export async function createFarmer(req, res, next) {
  try {
    const { name, phone, village, district, crops, language = 'ta', consent, consentSource = 'admin' } = req.body;

    // Validate phone
    const phoneValidation = validateAndNormalizePhone(phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: phoneValidation.error,
      });
    }

    // Consent check: registering without consent must be rejected
    if (consent !== true && consent !== 'true') {
      return res.status(400).json({
        success: false,
        error: 'Explicit consent is mandatory to register a farmer for automated voice advisories',
      });
    }

    // Check duplicate phone
    const existing = await Farmer.findOne({ phone: phoneValidation.normalized });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'A farmer with this mobile number is already registered',
      });
    }

    const farmer = await Farmer.create({
      name,
      phone: phoneValidation.normalized,
      village,
      district,
      crops: Array.isArray(crops) ? crops : [crops],
      language,
      consent: true,
      consentAt: new Date(),
      consentSource,
      active: true,
      optedOut: false,
    });

    return res.status(201).json({
      success: true,
      data: farmer,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateFarmer(req, res, next) {
  try {
    const { name, village, district, crops, language, consent, active } = req.body;
    const farmer = await Farmer.findById(req.params.id);

    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }

    // If attempting to enable without consent
    if (active === true && consent === false) {
      return res.status(400).json({
        success: false,
        error: 'Cannot activate a farmer without active consent',
      });
    }

    if (name) farmer.name = name;
    if (village) farmer.village = village;
    if (district) farmer.district = district;
    if (crops) farmer.crops = Array.isArray(crops) ? crops : [crops];
    if (language) farmer.language = language;
    if (active !== undefined) farmer.active = active;
    if (consent !== undefined) {
      farmer.consent = consent;
      if (consent) farmer.consentAt = new Date();
    }

    await farmer.save();
    return res.json({ success: true, data: farmer });
  } catch (err) {
    next(err);
  }
}

export async function toggleOptOut(req, res, next) {
  try {
    const farmer = await Farmer.findById(req.params.id);
    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }

    const newOptOutStatus = !farmer.optedOut;
    farmer.optedOut = newOptOutStatus;
    farmer.optedOutAt = newOptOutStatus ? new Date() : null;
    await farmer.save();

    return res.json({
      success: true,
      data: farmer,
      message: newOptOutStatus
        ? 'Farmer has been successfully opted out and will be excluded from all voice calls.'
        : 'Farmer opt-out removed. Farmer is now eligible for voice advisories.',
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteFarmer(req, res, next) {
  try {
    const farmer = await Farmer.findByIdAndDelete(req.params.id);
    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Farmer not found' });
    }
    return res.json({ success: true, message: 'Farmer removed successfully' });
  } catch (err) {
    next(err);
  }
}
