import axios from 'axios';
import { CallLog } from '../models/CallLog.js';
import { Farmer } from '../models/Farmer.js';
import { Alert } from '../models/Alert.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { CALL_STATUSES, DTMF_RESULTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';

// Controlled Rate Queue for Outbound Calls
class CallQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  enqueue(task) {
    this.queue.push(task);
    this.processNext();
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    const rateLimitPerSec = parseInt(process.env.CALLS_PER_SECOND || '2', 10);
    const delayMs = Math.max(100, Math.floor(1000 / rateLimitPerSec));

    const task = this.queue.shift();
    try {
      await task();
    } catch (err) {
      logger.error('Error executing queued call task:', err.message);
    } finally {
      setTimeout(() => {
        this.isProcessing = false;
        this.processNext();
      }, delayMs);
    }
  }
}

const outboundQueue = new CallQueue();

export class TelephonyService {
  /**
   * Returns whether telephony is configured in test or real carrier mode.
   */
  static getMode() {
    return (process.env.TELEPHONY_MODE || 'test').toLowerCase() === 'real' ? 'real' : 'test';
  }

  /**
   * Triggers outbound calls for an approved alert.
   * Enforces recipient filtering, duplicate call prevention, and rate-controlled queuing.
   */
  static async triggerAlertCalls(alertId) {
    const alert = await Alert.findById(alertId);
    if (!alert) {
      throw new Error('Alert not found');
    }

    if (alert.status !== 'approved') {
      const err = new Error(`Cannot trigger calls: Alert is in '${alert.status}' status. Only 'approved' alerts can be dispatched.`);
      err.statusCode = 409;
      throw err;
    }

    // Recipient pipeline: active = true, consent = true, optedOut = false, district matches alert
    const filter = {
      active: true,
      consent: true,
      optedOut: false,
      district: { $regex: new RegExp(`^${alert.district}$`, 'i') },
    };

    // If alert has specific target crops, filter by crop intersection
    if (alert.affectedCrops && alert.affectedCrops.length > 0) {
      filter.crops = { $in: alert.affectedCrops };
    }

    const eligibleFarmers = await Farmer.find(filter);

    alert.status = 'sending';
    alert.sentAt = new Date();
    alert.recipientCount = eligibleFarmers.length;
    await alert.save();

    let callsQueued = 0;
    const mode = this.getMode();

    for (const farmer of eligibleFarmers) {
      // Check duplicate call prevention: one CallLog per (alert, farmer)
      const existingCall = await CallLog.findOne({ alert: alert._id, farmer: farmer._id });
      if (existingCall) {
        logger.info(`Call already exists for farmer ${farmer._id} and alert ${alert._id}, skipping.`);
        continue;
      }

      const scriptToSpeak = farmer.language === 'en' ? alert.englishScript : alert.tamilScript;

      try {
        const callLog = await CallLog.create({
          alert: alert._id,
          farmer: farmer._id,
          language: farmer.language || 'ta',
          provider: mode === 'real' ? 'exotel' : 'simulated',
          status: CALL_STATUSES.QUEUED,
          simulated: mode !== 'real',
          mode,
          scriptSpoken: scriptToSpeak,
          providerCallSid: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        });

        callsQueued++;

        // Enqueue call dispatch
        outboundQueue.enqueue(async () => {
          await this.dispatchCall(callLog, farmer);
        });
      } catch (err) {
        // Catch duplicate key errors gracefully
        if (err.code === 11000) {
          logger.warn(`Duplicate call attempt caught by unique index for farmer ${farmer._id}`);
        } else {
          logger.error('Failed to create call log:', err.message);
        }
      }
    }

    if (callsQueued === 0 && eligibleFarmers.length === 0) {
      alert.status = 'sent';
      await alert.save();
    }

    return {
      alertId: alert._id,
      totalEligible: eligibleFarmers.length,
      callsQueued,
      mode,
    };
  }

  /**
   * Places a single ad-hoc or test call to a farmer or allow-listed number.
   * Consent and opt-out checks are strictly enforced.
   */
  static async placeSingleCall({ farmerId, testPhone, language = 'ta', scriptText, alertId = null }) {
    let farmer = null;
    if (farmerId) {
      farmer = await Farmer.findById(farmerId);
      if (!farmer) throw new Error('Farmer not found');
      if (farmer.optedOut || !farmer.consent || !farmer.active) {
        const err = new Error('Farmer is either opted out, inactive, or has not provided consent.');
        err.statusCode = 403;
        throw err;
      }
    } else if (testPhone) {
      // Look up or verify test phone against consented farmers
      farmer = await Farmer.findOne({ phone: testPhone });
      if (!farmer) {
        throw new Error('Test phone must belong to an active, consented registered farmer.');
      }
      if (farmer.optedOut || !farmer.consent || !farmer.active) {
        const err = new Error('Destination number has opted out or lacks active voice consent.');
        err.statusCode = 403;
        throw err;
      }
    } else {
      throw new Error('Either farmerId or testPhone is required.');
    }

    const mode = this.getMode();
    const script = scriptText || (language === 'en'
      ? 'AgroVoice test advisory: Weather sensors are active. Press 1 to acknowledge, or press 2 to replay.'
      : 'அக்ரோவாய்ஸ் சோதனை அறிவிப்பு: வானிலை கண்காணிப்பு இயங்குகிறது. இந்த அறிவிப்பை உறுதிப்படுத்த 1-ஐ அழுத்தவும், மீண்டும் கேட்க 2-ஐ அழுத்தவும்.');

    const callLog = await CallLog.create({
      alert: alertId,
      farmer: farmer._id,
      language,
      provider: mode === 'real' ? 'exotel' : 'simulated',
      status: CALL_STATUSES.QUEUED,
      simulated: mode !== 'real',
      mode,
      scriptSpoken: script,
      providerCallSid: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    });

    outboundQueue.enqueue(async () => {
      await this.dispatchCall(callLog, farmer);
    });

    return callLog;
  }

  /**
   * Dispatches the call via real Exotel API or Simulated Telephony Provider
   */
  static async dispatchCall(callLog, farmer) {
    const mode = this.getMode();

    if (mode === 'real') {
      return this.dispatchExotelCall(callLog, farmer);
    } else {
      return this.dispatchSimulatedCall(callLog);
    }
  }

  /**
   * Simulated call lifecycle: transitions queued -> ringing -> answered
   */
  static async dispatchSimulatedCall(callLog) {
    try {
      callLog.status = CALL_STATUSES.RINGING;
      await callLog.save();

      // Simulate network ringing duration
      await new Promise((res) => setTimeout(res, 400));

      callLog.status = CALL_STATUSES.ANSWERED;
      callLog.answeredAt = new Date();
      callLog.durationSec = 22;
      // In simulated calls, auto-set acknowledged for demo realism or leave open for manual DTMF
      // Default to auto-acknowledgment after short simulated playback
      callLog.dtmfResult = DTMF_RESULTS.ACKNOWLEDGED;
      callLog.completedAt = new Date();
      await callLog.save();

      // Update parent alert counters if associated
      if (callLog.alert) {
        await Alert.findByIdAndUpdate(callLog.alert, {
          $inc: { successfulCalls: 1, acknowledgedCalls: 1 },
          $set: { status: 'sent' },
        });
      }

      logger.info(`Simulated call completed successfully for CallLog ${callLog._id}`);
      return callLog;
    } catch (err) {
      logger.error('Error during simulated call dispatch:', err.message);
      callLog.status = CALL_STATUSES.FAILED;
      callLog.error = err.message;
      await callLog.save();
    }
  }

  /**
   * Builds and executes real Exotel outbound call HTTP request
   */
  static async dispatchExotelCall(callLog, farmer) {
    const accountSid = process.env.EXOTEL_ACCOUNT_SID;
    const apiKey = process.env.EXOTEL_API_KEY;
    const apiToken = process.env.EXOTEL_API_TOKEN;
    const callerId = process.env.EXOTEL_CALLER_ID;
    const subdomain = process.env.EXOTEL_SUBDOMAIN || 'api.exotel.com';
    const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:5001';
    const secret = process.env.WEBHOOK_SHARED_SECRET || '';

    const rawPhone = farmer.getRawPhone ? farmer.getRawPhone() : farmer.phone;
    const requestPayload = {
      From: callerId,
      To: rawPhone,
      CallerId: callerId,
      Url: `${baseUrl}/api/webhooks/exotel/voice?callLogId=${callLog._id}&secret=${secret}`,
      StatusCallback: `${baseUrl}/api/webhooks/exotel/status?secret=${secret}`,
      'StatusCallbackEvents[0]': 'terminal',
      CallType: 'trans',
    };

    const exotelUrl = `https://${subdomain}/v1/Accounts/${accountSid}/Calls/connect.json`;
    const authHeader = `Basic ${Buffer.from(`${apiKey}:${apiToken}`).toString('base64')}`;

    try {
      const response = await axios.post(
        exotelUrl,
        new URLSearchParams(requestPayload).toString(),
        {
          headers: {
            Authorization: authHeader,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }
      );

      const callSid = response.data?.Call?.Sid || response.data?.Sid;
      callLog.providerCallSid = callSid;
      callLog.status = CALL_STATUSES.RINGING;
      await callLog.save();
      logger.info(`Exotel outbound call queued: SID ${callSid}`);
      return response.data;
    } catch (err) {
      logger.error('Exotel outbound call request failed:', err.response?.data || err.message);
      callLog.status = CALL_STATUSES.FAILED;
      callLog.error = err.response?.data?.RestException?.Message || err.message;
      await callLog.save();
      if (callLog.alert) {
        await Alert.findByIdAndUpdate(callLog.alert, { $inc: { failedCalls: 1 } });
      }
      throw err;
    }
  }

  /**
   * Processes DTMF digit from Exotel webhook or simulator
   * 1 = acknowledged, 2 = replay_requested, timeout/none = no_response
   */
  static async handleDtmfInput(callLogId, digits) {
    const callLog = await CallLog.findById(callLogId);
    if (!callLog) {
      throw new Error(`CallLog ${callLogId} not found`);
    }

    let dtmfResult = DTMF_RESULTS.NO_RESPONSE;
    const digitStr = String(digits || '').trim();

    if (digitStr === '1') {
      dtmfResult = DTMF_RESULTS.ACKNOWLEDGED;
    } else if (digitStr === '2') {
      dtmfResult = DTMF_RESULTS.REPLAY_REQUESTED;
    } else if (digitStr === '9' || digitStr === '0') {
      dtmfResult = DTMF_RESULTS.OPT_OUT;
      // Mark farmer opted-out
      if (callLog.farmer) {
        await Farmer.findByIdAndUpdate(callLog.farmer, {
          optedOut: true,
          optedOutAt: new Date(),
        });
      }
    }

    const previousResult = callLog.dtmfResult;
    callLog.dtmfResult = dtmfResult;
    await callLog.save();

    // Idempotent alert counters: only increment if not already acknowledged
    if (callLog.alert && dtmfResult === DTMF_RESULTS.ACKNOWLEDGED && previousResult !== DTMF_RESULTS.ACKNOWLEDGED) {
      await Alert.findByIdAndUpdate(callLog.alert, {
        $inc: { acknowledgedCalls: 1 },
      });
    }

    return {
      callLogId: callLog._id,
      dtmfResult,
      digits: digitStr,
    };
  }

  /**
   * Updates call status from Exotel callback or simulator
   */
  static async handleStatusCallback({ callSid, callLogId, status, durationSec }) {
    let callLog = null;
    if (callLogId) {
      callLog = await CallLog.findById(callLogId);
    }
    if (!callLog && callSid) {
      callLog = await CallLog.findOne({ providerCallSid: callSid });
    }
    if (!callLog) {
      logger.warn(`No CallLog found for SID: ${callSid} or ID: ${callLogId}`);
      return null;
    }

    const normalizedStatus = (status || '').toLowerCase();
    if (normalizedStatus.includes('completed') || normalizedStatus.includes('answered')) {
      callLog.status = CALL_STATUSES.ANSWERED;
      callLog.completedAt = new Date();
      if (!callLog.answeredAt) callLog.answeredAt = new Date();
      if (durationSec) callLog.durationSec = parseInt(durationSec, 10);
    } else if (normalizedStatus.includes('busy')) {
      callLog.status = CALL_STATUSES.BUSY;
    } else if (normalizedStatus.includes('no-answer') || normalizedStatus.includes('no_answer')) {
      callLog.status = CALL_STATUSES.NO_ANSWER;
    } else if (normalizedStatus.includes('failed')) {
      callLog.status = CALL_STATUSES.FAILED;
    }

    await callLog.save();
    return callLog;
  }
}
