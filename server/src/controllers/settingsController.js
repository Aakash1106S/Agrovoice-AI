import { getActiveRules, updateActiveRules } from '../config/rules.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { AdminUser } from '../models/AdminUser.js';

export async function getSettings(req, res, next) {
  try {
    const rules = await getActiveRules();
    const generalSetting = await SystemSetting.findOne({ key: 'general_settings' });
    const adminUsers = await AdminUser.find().select('-passwordHash').sort({ createdAt: -1 });

    const generalConfig = generalSetting?.value || {
      webhookBaseUrl: process.env.WEBHOOK_BASE_URL || 'http://localhost:5001',
      callsPerSecond: parseInt(process.env.CALLS_PER_SECOND || '2', 10),
      maxRetries: parseInt(process.env.MAX_CALL_RETRIES || '2', 10),
      weatherCron: process.env.WEATHER_CRON || '*/30 * * * *',
      allowListedTestNumbers: ['+91 98765 43210', '+91 94440 12345'],
    };

    return res.json({
      success: true,
      data: {
        rules,
        telephony: {
          mode: (process.env.TELEPHONY_MODE || 'test').toLowerCase(),
          callerIdMasked: process.env.EXOTEL_CALLER_ID ? `080****${process.env.EXOTEL_CALLER_ID.slice(-4)}` : 'Not Set',
          accountSidMasked: process.env.EXOTEL_ACCOUNT_SID ? `${process.env.EXOTEL_ACCOUNT_SID.slice(0, 4)}****` : 'Not Set',
          isLiveCarrier: (process.env.TELEPHONY_MODE || 'test').toLowerCase() === 'real',
        },
        general: generalConfig,
        adminUsers,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateRulesSettings(req, res, next) {
  try {
    const updated = await updateActiveRules(req.body.rules);
    return res.json({
      success: true,
      message: 'Meteorological anomaly thresholds updated successfully.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateGeneralSettings(req, res, next) {
  try {
    const setting = await SystemSetting.findOneAndUpdate(
      { key: 'general_settings' },
      { key: 'general_settings', value: req.body, description: 'General system configuration' },
      { upsert: true, new: true }
    );
    return res.json({
      success: true,
      message: 'System settings updated successfully.',
      data: setting.value,
    });
  } catch (err) {
    next(err);
  }
}
