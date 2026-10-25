import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { Farmer } from '../src/models/Farmer.js';
import { AdminUser } from '../src/models/AdminUser.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Farmer Management & Consent Tests (5 tests)', () => {
  let authToken = '';

  beforeAll(async () => {
    await connectDB();

    // Create an admin user and generate auth token
    await AdminUser.deleteMany({});
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('TestAdmin@123', salt);
    const admin = await AdminUser.create({
      name: 'Test Admin',
      email: 'farmer_test_admin@agrovoice.org',
      passwordHash,
      role: 'super_admin',
    });

    authToken = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET || 'agrovoice_dev_secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await Farmer.deleteMany({});
  });

  // Test 1: Phone validation
  it('1. should validate Indian mobile format and reject invalid numbers', async () => {
    const invalidRes = await request(app)
      .post('/api/farmers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Invalid Farmer',
        phone: '12345', // invalid
        village: 'Test Village',
        district: 'Thanjavur',
        crops: ['Paddy'],
        consent: true,
      });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);

    const validRes = await request(app)
      .post('/api/farmers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Valid Farmer',
        phone: '9842199991', // valid 10-digit Indian mobile
        village: 'Thiruvaiyaru',
        district: 'Thanjavur',
        crops: ['Paddy'],
        consent: true,
      });

    expect(validRes.status).toBe(201);
    expect(validRes.body.success).toBe(true);
  });

  // Test 2: Consent required
  it('2. should reject farmer registration if consent is false or missing', async () => {
    const res = await request(app)
      .post('/api/farmers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'No Consent Farmer',
        phone: '9842199992',
        village: 'Orathanadu',
        district: 'Thanjavur',
        crops: ['Paddy'],
        consent: false, // Rejected!
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/consent is mandatory/i);
  });

  // Test 3: Duplicate phone rejected
  it('3. should reject duplicate mobile numbers', async () => {
    await request(app)
      .post('/api/farmers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Farmer Original',
        phone: '9842199993',
        village: 'Melur',
        district: 'Madurai',
        crops: ['Paddy'],
        consent: true,
      });

    const duplicateRes = await request(app)
      .post('/api/farmers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Farmer Duplicate',
        phone: '+919842199993', // same number in E.164
        village: 'Vadipatti',
        district: 'Madurai',
        crops: ['Cotton'],
        consent: true,
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.error).toMatch(/already registered/i);
  });

  // Test 4: Opt-out toggle
  it('4. should toggle farmer opt-out status correctly', async () => {
    const createRes = await request(app)
      .post('/api/farmers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'OptOut Test Farmer',
        phone: '9842199994',
        village: 'Lalgudi',
        district: 'Tiruchirappalli',
        crops: ['Banana'],
        consent: true,
      });

    const farmerId = createRes.body.data._id;

    // Toggle opt-out to TRUE
    const optOutRes = await request(app)
      .patch(`/api/farmers/${farmerId}/opt-out`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(optOutRes.status).toBe(200);
    expect(optOutRes.body.data.optedOut).toBe(true);
    expect(optOutRes.body.message).toMatch(/opted out/i);

    // Toggle opt-out back to FALSE
    const optInRes = await request(app)
      .patch(`/api/farmers/${farmerId}/opt-out`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(optInRes.status).toBe(200);
    expect(optInRes.body.data.optedOut).toBe(false);
  });

  // Test 5: Phone masking
  it('5. should mask phone numbers in all API responses', async () => {
    const createRes = await request(app)
      .post('/api/farmers')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Masking Farmer',
        phone: '9842199995',
        village: 'Pollachi',
        district: 'Coimbatore',
        crops: ['Sugarcane'],
        consent: true,
      });

    expect(createRes.status).toBe(201);
    // Response must format phone as masked: +91 98*** **995
    expect(createRes.body.data.phone).toBe('+91 98*** **995');

    const listRes = await request(app)
      .get('/api/farmers')
      .set('Authorization', `Bearer ${authToken}`);

    expect(listRes.status).toBe(200);
    const found = listRes.body.data.find((f) => f.name === 'Masking Farmer');
    expect(found.phone).toBe('+91 98*** **995');
    // Raw phone must not be exposed
    expect(found.phone).not.toBe('+919842199995');
  });
});
