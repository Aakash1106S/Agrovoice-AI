import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { Alert } from '../src/models/Alert.js';
import { Farmer } from '../src/models/Farmer.js';
import { CallLog } from '../src/models/CallLog.js';
import { AdminUser } from '../src/models/AdminUser.js';
import { TelephonyService } from '../src/services/TelephonyService.js';
import { evaluateForecastAgainstRules } from '../src/config/rules.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Alert Anomaly & Human-In-The-Loop Approval Tests (5 tests)', () => {
  let authToken = '';
  let adminUser = null;

  beforeAll(async () => {
    await connectDB();

    await AdminUser.deleteMany({});
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('AlertAdminPass@123', salt);
    adminUser = await AdminUser.create({
      name: 'Alert SuperAdmin',
      email: 'alert_admin@agrovoice.org',
      passwordHash,
      role: 'super_admin',
    });

    authToken = jwt.sign(
      { id: adminUser._id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'agrovoice_dev_secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await Alert.deleteMany({});
    await Farmer.deleteMany({});
    await CallLog.deleteMany({});
  });

  // Test 1: Anomaly creates pending_review alert
  it('1. should detect weather anomaly above threshold and create a pending_review alert', async () => {
    const mockWeather = {
      daily: {
        precipitation_sum: [52.5, 10.0], // Exceeds 45mm threshold
        wind_gusts_10m_max: [30.0],
      },
    };

    const anomalies = evaluateForecastAgainstRules(mockWeather);
    expect(anomalies.length).toBeGreaterThan(0);
    expect(anomalies[0].type).toBe('heavy_rain');

    // Create alert from anomaly
    const createdAlert = await Alert.create({
      district: 'Thanjavur',
      type: anomalies[0].type,
      severity: anomalies[0].severity,
      forecastEvidence: anomalies[0].evidence,
      affectedCrops: anomalies[0].affectedCrops,
      tamilScript: 'தஞ்சாவூர் கனமழை எச்சரிக்கை...',
      englishScript: 'Thanjavur heavy rain advisory...',
      status: 'pending_review',
    });

    expect(createdAlert.status).toBe('pending_review');
    expect(createdAlert.approvedBy).toBeUndefined();
    expect(createdAlert.forecastEvidence.value).toBe(52.5);
  });

  // Test 2: Cannot send unapproved alert (rejection)
  it('2. should reject outbound call dispatch for unapproved alerts with 409 Conflict', async () => {
    const alert = await Alert.create({
      district: 'Thanjavur',
      type: 'heavy_rain',
      tamilScript: 'Tamil script',
      englishScript: 'English script',
      status: 'pending_review', // NOT approved
    });

    const res = await request(app)
      .post(`/api/alerts/${alert._id}/send`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/only 'approved' alerts can be dispatched|admin must review/i);
  });

  // Test 3: Approval records admin and timestamp
  it('3. should transition status to approved and record approving admin and timestamp', async () => {
    const alert = await Alert.create({
      district: 'Madurai',
      type: 'strong_wind',
      tamilScript: 'Initial Tamil Script',
      englishScript: 'Initial English Script',
      status: 'pending_review',
    });

    const res = await request(app)
      .post(`/api/alerts/${alert._id}/approve`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        tamilScript: 'Edited Tamil Script by Admin',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('approved');
    expect(res.body.data.approvedBy).toBeDefined();
    expect(res.body.data.approvedAt).toBeDefined();
    expect(res.body.data.tamilScript).toBe('Edited Tamil Script by Admin');
  });

  // Test 4: Recipient filtering excludes opted-out, non-consented, or other districts
  it('4. should strictly exclude opted-out, non-consented, or mismatched district farmers from calls', async () => {
    // 1. Eligible Farmer (Thanjavur, Active, Consent, Not Opted Out)
    const eligibleFarmer = await Farmer.create({
      name: 'Eligible Farmer',
      phone: '+919842177771',
      village: 'Thiruvaiyaru',
      district: 'Thanjavur',
      crops: ['Paddy'],
      consent: true,
      active: true,
      optedOut: false,
    });

    // 2. Opted-Out Farmer (Thanjavur) -> MUST BE EXCLUDED
    await Farmer.create({
      name: 'Opted Out Farmer',
      phone: '+919842177772',
      village: 'Orathanadu',
      district: 'Thanjavur',
      crops: ['Paddy'],
      consent: true,
      active: true,
      optedOut: true,
      optedOutAt: new Date(),
    });

    // 3. No-Consent Farmer (Thanjavur) -> MUST BE EXCLUDED
    await Farmer.create({
      name: 'No Consent Farmer',
      phone: '+919842177773',
      village: 'Papanasam',
      district: 'Thanjavur',
      crops: ['Paddy'],
      consent: false,
      active: false,
      optedOut: false,
    });

    // 4. Other District Farmer (Madurai) -> MUST BE EXCLUDED
    await Farmer.create({
      name: 'Other District Farmer',
      phone: '+919842177774',
      village: 'Melur',
      district: 'Madurai',
      crops: ['Paddy'],
      consent: true,
      active: true,
      optedOut: false,
    });

    const approvedAlert = await Alert.create({
      district: 'Thanjavur',
      type: 'heavy_rain',
      tamilScript: 'Tamil text',
      englishScript: 'English text',
      status: 'approved',
      affectedCrops: ['Paddy'],
      approvedBy: adminUser._id,
      approvedAt: new Date(),
    });

    // Preview recipients endpoint check
    const previewRes = await request(app)
      .get(`/api/alerts/${approvedAlert._id}/preview-recipients`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(previewRes.status).toBe(200);
    expect(previewRes.body.data.eligibleCount).toBe(1);
    expect(previewRes.body.data.excludedCount).toBe(2);

    // Trigger calls
    const triggerResult = await TelephonyService.triggerAlertCalls(approvedAlert._id);
    expect(triggerResult.callsQueued).toBe(1);

    const callLogs = await CallLog.find({ alert: approvedAlert._id });
    expect(callLogs.length).toBe(1);
    expect(callLogs[0].farmer.toString()).toBe(eligibleFarmer._id.toString());
  });

  // Test 5: Duplicate call prevention
  it('5. should prevent duplicate calls to the same farmer for the same alert', async () => {
    const farmer = await Farmer.create({
      name: 'Duplicate Test Farmer',
      phone: '+919842177775',
      village: 'Pollachi',
      district: 'Coimbatore',
      crops: ['Cotton'],
      consent: true,
      active: true,
      optedOut: false,
    });

    const alert = await Alert.create({
      district: 'Coimbatore',
      type: 'strong_wind',
      tamilScript: 'Tamil text',
      englishScript: 'English text',
      status: 'approved',
      affectedCrops: ['Cotton'],
      approvedBy: adminUser._id,
      approvedAt: new Date(),
    });

    // First trigger: queues 1 call
    const firstRun = await TelephonyService.triggerAlertCalls(alert._id);
    expect(firstRun.callsQueued).toBe(1);

    // Wait for the async simulated call dispatch to settle
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Reset status to approved to attempt re-trigger
    await Alert.findByIdAndUpdate(alert._id, { status: 'approved' });

    // Second trigger: duplicate call must be prevented
    const secondRun = await TelephonyService.triggerAlertCalls(alert._id);
    expect(secondRun.callsQueued).toBe(0);

    const totalCalls = await CallLog.countDocuments({ alert: alert._id, farmer: farmer._id });
    expect(totalCalls).toBe(1);
  });
});
