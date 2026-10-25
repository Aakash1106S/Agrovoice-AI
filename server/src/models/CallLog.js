import mongoose from 'mongoose';
import { CALL_STATUSES, DTMF_RESULTS } from '../config/constants.js';

const callLogSchema = new mongoose.Schema(
  {
    alert: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Alert',
      index: true,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Farmer',
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['ta', 'en'],
      default: 'ta',
    },
    provider: {
      type: String,
      enum: ['exotel', 'simulated'],
      default: 'simulated',
    },
    providerCallSid: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(CALL_STATUSES),
      default: CALL_STATUSES.QUEUED,
      index: true,
    },
    dtmfResult: {
      type: String,
      enum: [...Object.values(DTMF_RESULTS), null],
      default: null,
      index: true,
    },
    durationSec: {
      type: Number,
      default: 0,
    },
    simulated: {
      type: Boolean,
      default: true,
      index: true,
    },
    mode: {
      type: String,
      enum: ['test', 'real'],
      default: 'test',
    },
    attempts: {
      type: Number,
      default: 1,
    },
    error: {
      type: String,
    },
    scriptSpoken: {
      type: String,
    },
    answeredAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index on alert + farmer to prevent duplicate calls per alert
callLogSchema.index(
  { alert: 1, farmer: 1 },
  {
    unique: true,
    partialFilterExpression: { alert: { $type: 'objectId' } },
  }
);

export const CallLog = mongoose.model('CallLog', callLogSchema);
