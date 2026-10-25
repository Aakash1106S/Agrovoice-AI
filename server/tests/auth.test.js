import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { AdminUser } from '../src/models/AdminUser.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('Authentication & Security Tests (5 tests)', () => {
  const adminEmail = 'auth_test_admin@agrovoice.org';
  const adminPassword = 'AgroTestPassword@2026!';

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  beforeEach(async () => {
    await AdminUser.deleteMany({});
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);
    await AdminUser.create({
      name: 'Auth Test Admin',
      email: adminEmail,
      passwordHash,
      role: 'super_admin',
    });
  });

  // Test 1: Successful login
  it('1. should login successfully with valid credentials and return JWT token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: adminPassword,
    });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(adminEmail);
  });

  // Test 2: Wrong password rejected
  it('2. should reject login with invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: adminEmail,
      password: 'WrongPassword!',
    });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid email or password/i);
  });

  // Test 3: Protected route without token rejected (401)
  it('3. should reject access to protected route when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/token required/i);
  });

  // Test 4: Invalid/expired token rejected
  it('4. should reject access with an invalid or expired token', async () => {
    const fakeToken = jwt.sign(
      { id: '507f1f77bcf86cd799439011', role: 'admin' },
      'wrong_secret_signature'
    );

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${fakeToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid or expired token/i);
  });

  // Test 5: Password hashing
  it('5. should ensure stored passwords are salted and hashed with bcrypt', async () => {
    const user = await AdminUser.findOne({ email: adminEmail });
    expect(user).toBeDefined();
    expect(user.passwordHash).toBeDefined();
    expect(user.passwordHash).not.toBe(adminPassword);
    // Bcrypt hash starts with $2a$ or $2b$
    expect(user.passwordHash).toMatch(/^\$2[ab]\$\d+\$/);
    const matches = await bcrypt.compare(adminPassword, user.passwordHash);
    expect(matches).toBe(true);
  });
});
