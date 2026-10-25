import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/database.js';
import { ensureInitialSeedData } from './scripts/autoSeed.js';
import { startWeatherCron } from './jobs/weatherCron.js';
import { logger } from './utils/logger.js';

const PORT = process.env.PORT || 5001;

async function bootstrap() {
  try {
    await connectDB();
    await ensureInitialSeedData();
    startWeatherCron();

    app.listen(PORT, () => {
      logger.info(`====================================================`);
      logger.info(`AgroVoice AI Server running on http://localhost:${PORT}`);
      logger.info(`Telephony Mode: ${(process.env.TELEPHONY_MODE || 'test').toUpperCase()}`);
      logger.info(`Health check: http://localhost:${PORT}/api/health`);
      logger.info(`====================================================`);
    });
  } catch (err) {
    logger.error('Failed to start AgroVoice AI server:', err);
    process.exit(1);
  }
}

bootstrap();
