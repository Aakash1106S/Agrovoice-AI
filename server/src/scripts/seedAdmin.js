import dotenv from 'dotenv';
dotenv.config();

import bcrypt from 'bcrypt';
import { connectDB, disconnectDB } from '../config/database.js';
import { AdminUser } from '../models/AdminUser.js';
import { logger } from '../utils/logger.js';

async function seedAdmin() {
  try {
    await connectDB();

    const adminEmail = 'admin@agrovoice.org';
    const adminPassword = 'AgroAdmin@2026!';

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const existingAdmin = await AdminUser.findOne({ email: adminEmail });
    if (existingAdmin) {
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.role = 'super_admin';
      existingAdmin.name = 'AgroVoice SuperAdmin';
      await existingAdmin.save();
      logger.info(`Updated existing admin: ${adminEmail}`);
    } else {
      await AdminUser.create({
        name: 'AgroVoice SuperAdmin',
        email: adminEmail,
        passwordHash,
        role: 'super_admin',
      });
      logger.info(`Created default admin user: ${adminEmail}`);
    }

    logger.info('====================================================');
    logger.info(`Admin Credentials:`);
    logger.info(`Email:    ${adminEmail}`);
    logger.info(`Password: ${adminPassword}`);
    logger.info('====================================================');

    await disconnectDB();
    process.exit(0);
  } catch (err) {
    logger.error('Failed to seed admin user:', err);
    process.exit(1);
  }
}

seedAdmin();
