import { CallLog } from '../models/CallLog.js';
import { Farmer } from '../models/Farmer.js';
import { TelephonyService } from '../services/TelephonyService.js';
import { maskPhone } from '../utils/phoneValidator.js';

export async function placeCall(req, res, next) {
  try {
    const { farmerId, testPhone, language = 'ta', scriptText, alertId } = req.body;

    const callLog = await TelephonyService.placeSingleCall({
      farmerId,
      testPhone,
      language,
      scriptText,
      alertId,
    });

    const populated = await CallLog.findById(callLog._id).populate('farmer alert');
    return res.status(201).json({
      success: true,
      data: populated,
      message: `Call initiated in ${populated.mode.toUpperCase()} mode`,
    });
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function listCallHistory(req, res, next) {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      dtmfResult,
      simulated,
      district,
      language,
    } = req.query;

    const filter = {};

    if (status) filter.status = status;
    if (dtmfResult) filter.dtmfResult = dtmfResult;
    if (simulated !== undefined && simulated !== '') filter.simulated = simulated === 'true';
    if (language) filter.language = language;

    if (district) {
      const farmersInDistrict = await Farmer.find({
        district: { $regex: new RegExp(`^${district}$`, 'i') },
      }).select('_id');
      filter.farmer = { $in: farmersInDistrict.map((f) => f._id) };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [calls, total] = await Promise.all([
      CallLog.find(filter)
        .populate('farmer', 'name phone village district crops language')
        .populate('alert', 'district type severity createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      CallLog.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      data: calls,
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

export async function getCallDetails(req, res, next) {
  try {
    const call = await CallLog.findById(req.params.id)
      .populate('farmer', 'name phone village district crops language')
      .populate('alert');

    if (!call) {
      return res.status(404).json({ success: false, error: 'Call log not found' });
    }

    return res.json({ success: true, data: call });
  } catch (err) {
    next(err);
  }
}

export async function simulateDtmfPress(req, res, next) {
  try {
    const { digit } = req.body;
    const { id } = req.params;

    if (!digit) {
      return res.status(400).json({ success: false, error: 'Digit is required (e.g. 1 or 2)' });
    }

    const result = await TelephonyService.handleDtmfInput(id, digit);
    const updated = await CallLog.findById(id).populate('farmer alert');

    return res.json({
      success: true,
      data: updated,
      result,
      message: `Simulated keypad input '${digit}' processed.`,
    });
  } catch (err) {
    next(err);
  }
}

export async function exportCsvHistory(req, res, next) {
  try {
    const calls = await CallLog.find()
      .populate('farmer', 'name phone village district language')
      .populate('alert', 'district type severity')
      .sort({ createdAt: -1 })
      .limit(2000);

    const headers = [
      'Call ID',
      'Date & Time',
      'Farmer Name',
      'Masked Phone',
      'District',
      'Language',
      'Alert Type',
      'Status',
      'DTMF Result',
      'Duration (sec)',
      'Provider',
      'Simulated',
    ];

    const rows = calls.map((c) => [
      c._id.toString(),
      c.createdAt.toISOString(),
      `"${c.farmer?.name || 'Unknown'}"`,
      `"${c.farmer?.phone || 'N/A'}"`,
      `"${c.farmer?.district || c.alert?.district || 'N/A'}"`,
      c.language || 'ta',
      c.alert?.type || 'Direct Test Call',
      c.status,
      c.dtmfResult || 'None',
      c.durationSec || 0,
      c.provider,
      c.simulated ? 'YES' : 'NO',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=agrovoice-calls-${new Date().toISOString().slice(0, 10)}.csv`);
    return res.send(csvContent);
  } catch (err) {
    next(err);
  }
}
