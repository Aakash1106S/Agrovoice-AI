import cron from 'node-cron';
import { WeatherService } from '../services/WeatherService.js';
import { logger } from '../utils/logger.js';

let cronTask = null;

export function startWeatherCron() {
  const cronExpression = process.env.WEATHER_CRON || '*/30 * * * *';

  if (!cron.validate(cronExpression)) {
    logger.error(`Invalid WEATHER_CRON expression: ${cronExpression}. Falling back to default '*/30 * * * *'`);
  }

  const validExpression = cron.validate(cronExpression) ? cronExpression : '*/30 * * * *';

  logger.info(`Starting weather monitoring cron job with schedule: "${validExpression}"`);

  cronTask = cron.schedule(validExpression, async () => {
    logger.info('Executing scheduled weather check for agricultural districts in Tamil Nadu...');
    try {
      const createdAlerts = await WeatherService.checkAllDistrictsForAnomalies();
      logger.info(`Scheduled weather check completed. ${createdAlerts.length} new alert(s) generated.`);
    } catch (err) {
      logger.error('Error during scheduled weather monitoring run:', err.message);
    }
  });

  return cronTask;
}

export function stopWeatherCron() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    logger.info('Weather monitoring cron job stopped.');
  }
}
