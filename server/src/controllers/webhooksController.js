import { WebhookEvent } from '../models/WebhookEvent.js';
import { CallLog } from '../models/CallLog.js';
import { TelephonyService } from '../services/TelephonyService.js';
import { TtsService } from '../services/TtsService.js';
import { logger } from '../utils/logger.js';

function verifyWebhookAuth(req) {
  const configuredSecret = process.env.WEBHOOK_SHARED_SECRET;
  if (!configuredSecret) return true; // If no secret configured, allow (dev mode)

  const headerSecret = req.headers['x-webhook-secret'];
  const querySecret = req.query.secret;

  return headerSecret === configuredSecret || querySecret === configuredSecret;
}

export async function handleExotelVoice(req, res, next) {
  try {
    if (!verifyWebhookAuth(req)) {
      return res.status(403).set('Content-Type', 'text/plain').send('Forbidden: Invalid Webhook Secret');
    }

    const { callLogId } = req.query;
    const payload = { ...req.query, ...req.body };
    const callSid = payload.CallSid || payload.Sid;

    // Persist raw webhook event
    await WebhookEvent.create({
      provider: 'exotel',
      eventType: 'voice',
      callSid: callSid || 'unknown',
      rawPayload: payload,
      receivedAt: new Date(),
      processed: true,
      processedAt: new Date(),
    });

    let callLog = null;
    if (callLogId) {
      callLog = await CallLog.findById(callLogId);
    }
    if (!callLog && callSid) {
      callLog = await CallLog.findOne({ providerCallSid: callSid });
    }

    const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:5001';
    const secret = process.env.WEBHOOK_SHARED_SECRET || '';
    const dtmfActionUrl = `${baseUrl}/api/webhooks/exotel/dtmf?callLogId=${callLog?._id || ''}&secret=${secret}`;

    const language = callLog?.language || 'ta';
    const scriptText = callLog?.scriptSpoken || 'AgroVoice agricultural emergency weather notification.';

    let exoml = '';

    if (language === 'ta') {
      // Synthesize or get cached audio for Tamil voice
      const audioInfo = await TtsService.synthesizeAdvisoryAudio(scriptText, 'ta');
      exoml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioInfo.audioUrl}</Play>
  <Gather finishOnKey="#" numDigits="1" action="${dtmfActionUrl}" method="POST" timeout="10">
    <Play>${audioInfo.audioUrl}</Play>
  </Gather>
  <Say voice="female" language="en-IN">No input received. Thank you.</Say>
</Response>`;
    } else {
      exoml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="female" language="en-IN">${scriptText}</Say>
  <Gather finishOnKey="#" numDigits="1" action="${dtmfActionUrl}" method="POST" timeout="10">
    <Say voice="female" language="en-IN">Press 1 to acknowledge this advisory, or press 2 to replay.</Say>
  </Gather>
  <Say voice="female" language="en-IN">No input received. Thank you.</Say>
</Response>`;
    }

    res.set('Content-Type', 'application/xml');
    return res.send(exoml);
  } catch (err) {
    next(err);
  }
}

export async function handleExotelStatus(req, res, next) {
  try {
    if (!verifyWebhookAuth(req)) {
      return res.status(403).json({ success: false, error: 'Forbidden: Invalid Webhook Secret' });
    }

    const payload = { ...req.query, ...req.body };
    const callSid = payload.CallSid || payload.Sid;
    const status = payload.Status || payload.CallStatus;
    const duration = payload.Legs?.[0]?.Duration || payload.DialCallDuration || payload.Duration;

    // Idempotent audit: save raw event
    const event = await WebhookEvent.create({
      provider: 'exotel',
      eventType: 'status',
      callSid: callSid || 'unknown',
      rawPayload: payload,
      receivedAt: new Date(),
    });

    const callLog = await TelephonyService.handleStatusCallback({
      callSid,
      callLogId: req.query.callLogId,
      status,
      durationSec: duration,
    });

    event.processed = true;
    event.processedAt = new Date();
    event.processingResult = { status, callLogId: callLog?._id };
    await event.save();

    return res.json({ success: true, message: 'Status processed', callSid });
  } catch (err) {
    next(err);
  }
}

export async function handleExotelDtmf(req, res, next) {
  try {
    if (!verifyWebhookAuth(req)) {
      return res.status(403).set('Content-Type', 'text/plain').send('Forbidden: Invalid Webhook Secret');
    }

    const payload = { ...req.query, ...req.body };
    const callSid = payload.CallSid || payload.Sid;
    const digits = payload.Digits || payload.digits;
    const callLogId = req.query.callLogId;

    // Audit raw event
    const event = await WebhookEvent.create({
      provider: 'exotel',
      eventType: 'dtmf',
      callSid: callSid || 'unknown',
      rawPayload: payload,
      receivedAt: new Date(),
    });

    let targetCallId = callLogId;
    if (!targetCallId && callSid) {
      const call = await CallLog.findOne({ providerCallSid: callSid });
      if (call) targetCallId = call._id;
    }

    if (targetCallId) {
      await TelephonyService.handleDtmfInput(targetCallId, digits);
    }

    event.processed = true;
    event.processedAt = new Date();
    event.processingResult = { digits, targetCallId };
    await event.save();

    // Respond with ExoML acknowledgment message
    let responseText = 'Thank you. Your acknowledgment has been recorded.';
    if (String(digits).trim() === '2') {
      responseText = 'Replaying advisory shortly. Thank you.';
    }

    const exoml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="female" language="en-IN">${responseText}</Say>
  <Hangup/>
</Response>`;

    res.set('Content-Type', 'application/xml');
    return res.send(exoml);
  } catch (err) {
    next(err);
  }
}
