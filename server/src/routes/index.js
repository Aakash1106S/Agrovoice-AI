import { Router } from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import { authenticateToken, requireSuperAdmin } from '../middleware/auth.js';
import { authLimiter, publicRegLimiter } from '../middleware/rateLimiter.js';
import { TtsService } from '../services/TtsService.js';

// Controllers
import * as authController from '../controllers/authController.js';
import * as farmerController from '../controllers/farmerController.js';
import * as weatherController from '../controllers/weatherController.js';
import * as alertController from '../controllers/alertController.js';
import * as callsController from '../controllers/callsController.js';
import * as webhooksController from '../controllers/webhooksController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as analyticsController from '../controllers/analyticsController.js';
import * as settingsController from '../controllers/settingsController.js';
import * as publicController from '../controllers/publicController.js';

const router = Router();

// ==========================================
// 1. Health Check
// ==========================================
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AgroVoice AI API',
    uptime: process.uptime(),
    telephonyMode: process.env.TELEPHONY_MODE || 'test',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// 2. Audio Streaming for Telephony & UI
// ==========================================
router.get('/audio/tts/:hash', (req, res) => {
  const filePath = TtsService.getAudioFilePath(req.params.hash);
  if (!filePath || !fs.existsSync(filePath)) {
    return res.status(404).send('Audio not found');
  }
  res.setHeader('Content-Type', 'audio/wav');
  fs.createReadStream(filePath).pipe(res);
});

// ==========================================
// 3. Authentication Routes
// ==========================================
router.post('/auth/login', authLimiter, authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);
router.post('/auth/register-admin', authenticateToken, requireSuperAdmin, authController.registerAdmin);

// ==========================================
// 4. Farmer Management & Consent Vault
// ==========================================
router.get('/farmers', authenticateToken, farmerController.listFarmers);
router.get('/farmers/:id', authenticateToken, farmerController.getFarmer);
router.post('/farmers', authenticateToken, farmerController.createFarmer);
router.put('/farmers/:id', authenticateToken, farmerController.updateFarmer);
router.patch('/farmers/:id/opt-out', authenticateToken, farmerController.toggleOptOut);
router.delete('/farmers/:id', authenticateToken, farmerController.deleteFarmer);

// ==========================================
// 5. Weather Monitoring Routes
// ==========================================
router.get('/weather/overview', authenticateToken, weatherController.getAllDistrictsOverview);
router.get('/weather/district/:districtId', authenticateToken, weatherController.getDistrictWeather);
router.post('/weather/check', authenticateToken, weatherController.runWeatherCheckNow);

// ==========================================
// 6. Alerts & Human-In-The-Loop Approval
// ==========================================
router.get('/alerts', authenticateToken, alertController.listAlerts);
router.get('/alerts/:id', authenticateToken, alertController.getAlert);
router.get('/alerts/:id/preview-recipients', authenticateToken, alertController.previewAlertRecipients);
router.put('/alerts/:id/scripts', authenticateToken, alertController.updateAlertScripts);
router.post('/alerts/:id/approve', authenticateToken, alertController.approveAlert);
router.post('/alerts/:id/dismiss', authenticateToken, alertController.dismissAlert);
router.post('/alerts/:id/send', authenticateToken, alertController.sendAlertCalls);

// ==========================================
// 7. Voice Calls & History
// ==========================================
router.post('/calls', authenticateToken, callsController.placeCall);
router.get('/calls/history', authenticateToken, callsController.listCallHistory);
router.get('/calls/export-csv', authenticateToken, callsController.exportCsvHistory);
router.get('/calls/:id', authenticateToken, callsController.getCallDetails);
router.post('/calls/:id/simulate-dtmf', authenticateToken, callsController.simulateDtmfPress);

// ==========================================
// 8. Exotel Webhooks (ExoML, Status, DTMF)
// ==========================================
router.get('/webhooks/exotel/voice', webhooksController.handleExotelVoice);
router.post('/webhooks/exotel/voice', webhooksController.handleExotelVoice);
router.post('/webhooks/exotel/status', webhooksController.handleExotelStatus);
router.post('/webhooks/exotel/dtmf', webhooksController.handleExotelDtmf);

// ==========================================
// 9. Dashboard & Analytics
// ==========================================
router.get('/dashboard/stats', authenticateToken, dashboardController.getDashboardStats);
router.get('/analytics', authenticateToken, analyticsController.getAnalytics);

// ==========================================
// 10. System Settings & Anomaly Thresholds
// ==========================================
router.get('/settings', authenticateToken, settingsController.getSettings);
router.put('/settings/rules', authenticateToken, settingsController.updateRulesSettings);
router.put('/settings/general', authenticateToken, settingsController.updateGeneralSettings);

// ==========================================
// 11. Public Registration Portal (/register)
// ==========================================
router.post('/public/register', publicRegLimiter, publicController.publicRegisterFarmer);

export default router;
