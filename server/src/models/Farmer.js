import mongoose from 'mongoose';
import { maskPhone } from '../utils/phoneValidator.js';
import { CROPS } from '../config/constants.js';

const farmerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    village: {
      type: String,
      required: true,
      trim: true,
    },
    district: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    crops: {
      type: [String],
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'At least one crop must be selected',
      },
    },
    language: {
      type: String,
      enum: ['ta', 'en'],
      default: 'ta',
    },
    consent: {
      type: Boolean,
      required: true,
      default: false,
    },
    consentAt: {
      type: Date,
    },
    consentSource: {
      type: String,
      enum: ['admin', 'self_registration'],
      default: 'admin',
    },
    optedOut: {
      type: Boolean,
      default: false,
      index: true,
    },
    optedOutAt: {
      type: Date,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.maskedPhone = maskPhone(ret.phone);
        ret.phone = maskPhone(ret.phone);
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.maskedPhone = maskPhone(ret.phone);
        return ret;
      },
    },
  }
);

// Helper method to get the unmasked phone for dialing
farmerSchema.methods.getRawPhone = function () {
  return this.get('phone', null, { getters: false });
};

export const Farmer = mongoose.model('Farmer', farmerSchema);
