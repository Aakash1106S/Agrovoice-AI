import { Farmer } from '../models/Farmer.js';
import { CallLog } from '../models/CallLog.js';
import { Alert } from '../models/Alert.js';
import { DISTRICTS, CALL_STATUSES, DTMF_RESULTS } from '../config/constants.js';
import { WeatherService } from '../services/WeatherService.js';
import { getActiveRules } from '../config/rules.js';

export async function getDashboardStats(req, res, next) {
  try {
    const [
      totalFarmers,
      consentedFarmers,
      optedOutFarmers,
      totalCalls,
      answeredCalls,
      acknowledgedCalls,
      pendingAlerts,
      recentCalls,
    ] = await Promise.all([
      Farmer.countDocuments({ active: true }),
      Farmer.countDocuments({ active: true, consent: true, optedOut: false }),
      Farmer.countDocuments({ optedOut: true }),
      CallLog.countDocuments(),
      CallLog.countDocuments({ status: CALL_STATUSES.ANSWERED }),
      CallLog.countDocuments({ dtmfResult: DTMF_RESULTS.ACKNOWLEDGED }),
      Alert.find({ status: 'pending_review' }).sort({ createdAt: -1 }),
      CallLog.find()
        .populate('farmer', 'name phone village district')
        .populate('alert', 'district type severity')
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

    const acknowledgmentRate = totalCalls > 0
      ? Math.round((acknowledgedCalls / totalCalls) * 1000) / 10
      : 0;

    const answerRate = totalCalls > 0
      ? Math.round((answeredCalls / totalCalls) * 1000) / 10
      : 0;

    // 7-day Acknowledgment trend aggregation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendAggregation = await CallLog.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalCalls: { $sum: 1 },
          acknowledged: {
            $sum: {
              $cond: [{ $eq: ['$dtmfResult', DTMF_RESULTS.ACKNOWLEDGED] }, 1, 0],
            },
          },
          answered: {
            $sum: {
              $cond: [{ $eq: ['$status', CALL_STATUSES.ANSWERED] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing dates in 7-day range
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
      const found = trendAggregation.find((item) => item._id === dateStr);

      trendData.push({
        date: dateStr,
        day: dayName,
        totalCalls: found ? found.totalCalls : 0,
        acknowledged: found ? found.acknowledged : 0,
        answered: found ? found.answered : 0,
        rate: found && found.totalCalls > 0
          ? Math.round((found.acknowledged / found.totalCalls) * 100)
          : 0,
      });
    }

    // Districts-at-risk quick calculation
    const rules = await getActiveRules();
    const districtsAtRisk = [];

    for (const dist of DISTRICTS) {
      try {
        const weather = await WeatherService.fetchDistrictWeather(dist.id);
        const rain24h = weather.daily?.precipitation_sum?.[0] || 0;
        const maxGust = Math.max(...(weather.daily?.wind_gusts_10m_max || [0]));

        const rainThreshold = rules.heavy_rain?.rainfall24hMm || 45;
        const gustThreshold = rules.strong_wind?.gustKmh || 45;

        const isRisk = rain24h >= rainThreshold || maxGust >= gustThreshold;
        const isWatch = !isRisk && (rain24h >= rainThreshold * 0.75 || maxGust >= gustThreshold * 0.75);

        if (isRisk || isWatch) {
          districtsAtRisk.push({
            districtId: dist.id,
            name: dist.name,
            nameTa: dist.nameTa,
            riskLevel: isRisk ? 'CRITICAL' : 'WATCH',
            rain24h: Math.round(rain24h * 10) / 10,
            maxGust: Math.round(maxGust * 10) / 10,
            primaryMetric: rain24h >= rainThreshold ? `${Math.round(rain24h)}mm Rain` : `${Math.round(maxGust)}km/h Gusts`,
          });
        }
      } catch (err) {
        // District weather error
      }
    }

    return res.json({
      success: true,
      data: {
        stats: {
          totalRegisteredFarmers: totalFarmers,
          consentedFarmers,
          optedOutFarmers,
          totalCallsPlaced: totalCalls,
          totalCallsAnswered: answeredCalls,
          totalAcknowledged: acknowledgedCalls,
          acknowledgmentRate,
          answerRate,
        },
        pendingAlerts: {
          count: pendingAlerts.length,
          latest: pendingAlerts[0] || null,
          all: pendingAlerts,
        },
        districtsAtRisk,
        recentCalls,
        acknowledgmentTrend: trendData,
        telephonyMode: process.env.TELEPHONY_MODE || 'test',
      },
    });
  } catch (err) {
    next(err);
  }
}
