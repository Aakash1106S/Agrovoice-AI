import { Farmer } from '../models/Farmer.js';
import { CallLog } from '../models/CallLog.js';
import { DTMF_RESULTS } from '../config/constants.js';

export async function getAnalytics(req, res, next) {
  try {
    // 1. Acknowledgment rate by District
    const districtStats = await CallLog.aggregate([
      {
        $lookup: {
          from: 'farmers',
          localField: 'farmer',
          foreignField: '_id',
          as: 'farmerDoc',
        },
      },
      { $unwind: '$farmerDoc' },
      {
        $group: {
          _id: '$farmerDoc.district',
          totalCalls: { $sum: 1 },
          acknowledged: {
            $sum: {
              $cond: [{ $eq: ['$dtmfResult', DTMF_RESULTS.ACKNOWLEDGED] }, 1, 0],
            },
          },
          answered: {
            $sum: {
              $cond: [{ $eq: ['$status', 'answered'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          district: '$_id',
          totalCalls: 1,
          acknowledged: 1,
          answered: 1,
          rate: {
            $cond: [
              { $gt: ['$totalCalls', 0] },
              { $multiply: [{ $divide: ['$acknowledged', '$totalCalls'] }, 100] },
              0,
            ],
          },
        },
      },
      { $sort: { district: 1 } },
    ]);

    // 2. Language Split (Pie chart)
    const languageSplit = await Farmer.aggregate([
      {
        $group: {
          _id: '$language',
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          language: '$_id',
          label: {
            $cond: [{ $eq: ['$_id', 'ta'] }, 'Tamil (தமிழ்)', 'Indian English'],
          },
          count: 1,
        },
      },
    ]);

    // 3. Calls over time (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
    fourteenDaysAgo.setHours(0, 0, 0, 0);

    const callsOverTimeAgg = await CallLog.aggregate([
      { $match: { createdAt: { $gte: fourteenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          totalCalls: { $sum: 1 },
          acknowledged: {
            $sum: {
              $cond: [{ $eq: ['$dtmfResult', DTMF_RESULTS.ACKNOWLEDGED] }, 1, 0],
            },
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ['$status', 'failed'] }, 1, 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // 4. Crop-wise reach
    const cropReach = await Farmer.aggregate([
      { $unwind: '$crops' },
      {
        $group: {
          _id: '$crops',
          registeredFarmers: { $sum: 1 },
        },
      },
      {
        $project: {
          crop: '$_id',
          registeredFarmers: 1,
        },
      },
      { $sort: { registeredFarmers: -1 } },
    ]);

    return res.json({
      success: true,
      data: {
        districtStats,
        languageSplit,
        callsOverTime: callsOverTimeAgg,
        cropReach,
      },
    });
  } catch (err) {
    next(err);
  }
}
