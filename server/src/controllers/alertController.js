import { Alert } from '../models/Alert.js';
import { Farmer } from '../models/Farmer.js';
import { TelephonyService } from '../services/TelephonyService.js';
import { ALERT_STATUSES } from '../config/constants.js';

export async function listAlerts(req, res, next) {
  try {
    const { status, district, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (district) {
      filter.district = { $regex: new RegExp(`^${district}$`, 'i') };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [alerts, total] = await Promise.all([
      Alert.find(filter)
        .populate('approvedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Alert.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: alerts,
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

export async function getAlert(req, res, next) {
  try {
    const alert = await Alert.findById(req.params.id).populate('approvedBy', 'name email');
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }
    return res.json({ success: true, data: alert });
  } catch (err) {
    next(err);
  }
}

export async function updateAlertScripts(req, res, next) {
  try {
    const { tamilScript, englishScript } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    if (alert.status === ALERT_STATUSES.SENT) {
      return res.status(400).json({
        success: false,
        error: 'Cannot edit voice scripts of an already dispatched alert.',
      });
    }

    if (tamilScript) alert.tamilScript = tamilScript;
    if (englishScript) alert.englishScript = englishScript;

    await alert.save();
    return res.json({
      success: true,
      data: alert,
      message: 'Advisory voice scripts updated successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function approveAlert(req, res, next) {
  try {
    const { tamilScript, englishScript } = req.body;
    const alert = await Alert.findById(req.params.id);

    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    if (alert.status === ALERT_STATUSES.APPROVED) {
      return res.json({ success: true, data: alert, message: 'Alert is already approved.' });
    }

    // Optionally allow editing scripts upon approval
    if (tamilScript) alert.tamilScript = tamilScript;
    if (englishScript) alert.englishScript = englishScript;

    alert.status = ALERT_STATUSES.APPROVED;
    alert.approvedBy = req.user._id;
    alert.approvedAt = new Date();

    await alert.save();
    await alert.populate('approvedBy', 'name email');

    return res.json({
      success: true,
      data: alert,
      message: 'Alert advisory approved by administrator.',
    });
  } catch (err) {
    next(err);
  }
}

export async function dismissAlert(req, res, next) {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    alert.status = ALERT_STATUSES.DISMISSED;
    alert.dismissedAt = new Date();
    await alert.save();

    return res.json({
      success: true,
      data: alert,
      message: 'Alert advisory has been dismissed.',
    });
  } catch (err) {
    next(err);
  }
}

export async function sendAlertCalls(req, res, next) {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    // STRICT SERVER-SIDE ENFORCEMENT: ONLY APPROVED ALERTS CAN BE DISPATCHED
    if (alert.status !== ALERT_STATUSES.APPROVED) {
      return res.status(409).json({
        success: false,
        error: `Cannot trigger voice calls: Alert status is '${alert.status}'. An admin must review and approve first.`,
      });
    }

    const result = await TelephonyService.triggerAlertCalls(alert._id);

    return res.json({
      success: true,
      message: `Outbound voice campaign initiated in ${result.mode.toUpperCase()} mode.`,
      ...result,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function previewAlertRecipients(req, res, next) {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({ success: false, error: 'Alert not found' });
    }

    // Total in district
    const totalInDistrict = await Farmer.countDocuments({
      district: { $regex: new RegExp(`^${alert.district}$`, 'i') },
    });

    // Eligible
    const eligibleFilter = {
      active: true,
      consent: true,
      optedOut: false,
      district: { $regex: new RegExp(`^${alert.district}$`, 'i') },
    };
    if (alert.affectedCrops && alert.affectedCrops.length > 0) {
      eligibleFilter.crops = { $in: alert.affectedCrops };
    }
    const eligibleCount = await Farmer.countDocuments(eligibleFilter);

    // Excluded breakdown
    const optedOutCount = await Farmer.countDocuments({
      district: { $regex: new RegExp(`^${alert.district}$`, 'i') },
      optedOut: true,
    });

    const noConsentCount = await Farmer.countDocuments({
      district: { $regex: new RegExp(`^${alert.district}$`, 'i') },
      consent: false,
    });

    const languageBreakdown = await Farmer.aggregate([
      { $match: eligibleFilter },
      { $group: { _id: '$language', count: { $sum: 1 } } },
    ]);

    const tamilCount = languageBreakdown.find((l) => l._id === 'ta')?.count || 0;
    const englishCount = languageBreakdown.find((l) => l._id === 'en')?.count || 0;

    return res.json({
      success: true,
      data: {
        district: alert.district,
        totalInDistrict,
        eligibleCount,
        excludedCount: Math.max(0, totalInDistrict - eligibleCount),
        breakdown: {
          optedOut: optedOutCount,
          noConsent: noConsentCount,
          tamilRecipients: tamilCount,
          englishRecipients: englishCount,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}
