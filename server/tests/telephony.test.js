import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import axios from 'axios';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { CallLog } from '../src/models/CallLog.js';
import { Farmer } from '../src/models/Farmer.js';
import { WebhookEvent } from '../src/models/WebhookEvent.js';
import { TelephonyService } from '../src/services/TelephonyService.js';
import { CALL_STATUSES, DTMF_RESULTS } from '../src/config/constants.js';

describe('Telephony & Webhooks Integration Tests (6 tests)', () => {
  let testFarmer = null;

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await CallLog.deleteMany({});
    await WebhookEvent.deleteMany({});
    await Farmer.deleteMany({});

    testFarmer = await Farmer.create({
      name: 'Telephony Test Farmer',
      phone: '+919842188881',
      village: 'Thiruvaiyaru',
      district: 'Thanjavur',
      crops: ['Paddy'],
      language: 'ta',
      consent: true,
      active: true,
      optedOut: false,
    });
  });

  // Test 1: Simulated call lifecycle
  it('1. should execute simulated call lifecycle (queued -> ringing -> answered)', async () => {
    const callLog = await CallLog.create({
      farmer: testFarmer._id,
      language: 'ta',
      provider: 'simulated',
      status: CALL_STATUSES.QUEUED,
      simulated: true,
      mode: 'test',
      providerCallSid: `sim_test_${Date.now()}`,
    });

    expect(callLog.status).toBe(CALL_STATUSES.QUEUED);
    expect(callLog.simulated).toBe(true);

    // Dispatch simulated call
    await TelephonyService.dispatchSimulatedCall(callLog);

    const updated = await CallLog.findById(callLog._id);
    expect(updated.status).toBe(CALL_STATUSES.ANSWERED);
    expect(updated.durationSec).toBeGreaterThan(0);
    expect(updated.answeredAt).toBeDefined();
    expect(updated.dtmfResult).toBe(DTMF_RESULTS.ACKNOWLEDGED);
  });

  // Test 2: Exotel request construction (mocked)
  it('2. should properly construct Exotel outbound call request headers and payload', async () => {
    const originalEnv = { ...process.env };
    process.env.TELEPHONY_MODE = 'real';
    process.env.EXOTEL_ACCOUNT_SID = 'test_acc_123';
    process.env.EXOTEL_API_KEY = 'test_key_456';
    process.env.EXOTEL_API_TOKEN = 'test_token_789';
    process.env.EXOTEL_CALLER_ID = '08047100000';
    process.env.WEBHOOK_BASE_URL = 'https://demo.ngrok-free.app';
    process.env.WEBHOOK_SHARED_SECRET = 'secret123';

    const axiosPostSpy = vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: {
        Call: {
          Sid: 'exotel_call_sid_99999',
          Status: 'in-progress',
        },
      },
    });

    const callLog = await CallLog.create({
      farmer: testFarmer._id,
      language: 'en',
      provider: 'exotel',
      status: CALL_STATUSES.QUEUED,
      simulated: false,
      mode: 'real',
    });

    await TelephonyService.dispatchExotelCall(callLog, testFarmer);

    expect(axiosPostSpy).toHaveBeenCalledTimes(1);
    const [calledUrl, calledBody, calledConfig] = axiosPostSpy.mock.calls[0];

    expect(calledUrl).toContain('/v1/Accounts/test_acc_123/Calls/connect.json');
    expect(calledConfig.headers.Authorization).toBeDefined();
    expect(calledConfig.headers['Content-Type']).toBe('application/x-www-form-urlencoded');

    const bodyParams = new URLSearchParams(calledBody);
    expect(bodyParams.get('From')).toBe('08047100000');
    expect(bodyParams.get('CallerId')).toBe('08047100000');
    expect(bodyParams.get('To')).toBe('+919842188881');
    expect(bodyParams.get('Url')).toContain('/api/webhooks/exotel/voice');

    axiosPostSpy.mockRestore();
    process.env = originalEnv;
  });

  // Test 3: Webhook idempotency
  it('3. should handle duplicate webhook events idempotently without duplicating counts', async () => {
    const callLog = await CallLog.create({
      farmer: testFarmer._id,
      language: 'ta',
      provider: 'exotel',
      providerCallSid: 'sid_idempotent_123',
      status: CALL_STATUSES.RINGING,
      simulated: false,
      mode: 'real',
    });

    const secret = process.env.WEBHOOK_SHARED_SECRET || 'agrovoice_webhook_secret_key_tn_2026';

    const payload = {
      CallSid: 'sid_idempotent_123',
      Status: 'completed',
      DialCallDuration: '30',
    };

    // First webhook delivery
    const res1 = await request(app)
      .post(`/api/webhooks/exotel/status?secret=${secret}`)
      .send(payload);
    expect(res1.status).toBe(200);

    // Duplicate webhook delivery (retransmission)
    const res2 = await request(app)
      .post(`/api/webhooks/exotel/status?secret=${secret}`)
      .send(payload);
    expect(res2.status).toBe(200);

    const callAfter = await CallLog.findById(callLog._id);
    expect(callAfter.status).toBe(CALL_STATUSES.ANSWERED);
    expect(callAfter.durationSec).toBe(30);

    // Two audit events logged, but call status remains consistent
    const auditCount = await WebhookEvent.countDocuments({ callSid: 'sid_idempotent_123' });
    expect(auditCount).toBe(2);
  });

  // Test 4: DTMF 1 marks acknowledged
  it('4. should map DTMF digit "1" to acknowledged status', async () => {
    const callLog = await CallLog.create({
      farmer: testFarmer._id,
      language: 'ta',
      provider: 'exotel',
      providerCallSid: 'sid_dtmf_1',
      status: CALL_STATUSES.ANSWERED,
      simulated: false,
    });

    const secret = process.env.WEBHOOK_SHARED_SECRET || 'agrovoice_webhook_secret_key_tn_2026';

    const res = await request(app)
      .post(`/api/webhooks/exotel/dtmf?callLogId=${callLog._id}&secret=${secret}`)
      .send({ Digits: '1' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);

    const updated = await CallLog.findById(callLog._id);
    expect(updated.dtmfResult).toBe(DTMF_RESULTS.ACKNOWLEDGED);
  });

  // Test 5: DTMF 2 marks replay_requested
  it('5. should map DTMF digit "2" to replay_requested status', async () => {
    const callLog = await CallLog.create({
      farmer: testFarmer._id,
      language: 'en',
      provider: 'exotel',
      providerCallSid: 'sid_dtmf_2',
      status: CALL_STATUSES.ANSWERED,
      simulated: false,
    });

    const secret = process.env.WEBHOOK_SHARED_SECRET || 'agrovoice_webhook_secret_key_tn_2026';

    const res = await request(app)
      .post(`/api/webhooks/exotel/dtmf?callLogId=${callLog._id}&secret=${secret}`)
      .send({ Digits: '2' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);

    const updated = await CallLog.findById(callLog._id);
    expect(updated.dtmfResult).toBe(DTMF_RESULTS.REPLAY_REQUESTED);
  });

  // Test 6: Invalid webhook signature/secret rejected
  it('6. should reject webhook requests with invalid or missing secret', async () => {
    const res = await request(app)
      .post('/api/webhooks/exotel/status?secret=wrong_invalid_secret')
      .send({
        CallSid: 'unauthorized_sid',
        Status: 'completed',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
