import mongoose from 'mongoose';
import { ALERT_TYPES, ALERT_STATUSES } from '../config/constants.js';

const alertSchema = new mongoose.Schema(
  {
    district: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ALERT_TYPES),
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ['watch', 'warning', 'critical'],
      default: 'warning',
    },
    forecastEvidence: {
      metric: String,
      value: Number,
      threshold: Number,
      unit: String,
      timeWindow: String,
      description: String,
      rawForecast: mongoose.Schema.Types.Mixed,
    },
    affectedCrops: {
      type: [String],
      default: [],
    },
    tamilScript: {
      type: String,
      required: true,
    },
    englishScript: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(ALERT_STATUSES),
      default: ALERT_STATUSES.PENDING_REVIEW,
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminUser',
    },
    approvedAt: {
      type: Date,
    },
    sentAt: {
      type: Date,
    },
    dismissedAt: {
      type: Date,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    successfulCalls: {
      type: Number,
      default: 0,
    },
    failedCalls: {
      type: Number,
      default: 0,
    },
    acknowledgedCalls: {
      type: Number,
      default: 0,
    },
    windowStart: {
      type: Date,
    },
    windowEnd: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to help avoid duplicate alerts in overlapping windows
alertSchema.index({ district: 1, type: 1, status: 1, createdAt: -1 });

export const Alert = mongoose.model('Alert', alertSchema);
