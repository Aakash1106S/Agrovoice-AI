import axios from 'axios';
import { DISTRICTS } from '../config/constants.js';
import { getActiveRules, evaluateForecastAgainstRules } from '../config/rules.js';
import { Alert } from '../models/Alert.js';
import { GeminiService } from './GeminiService.js';
import { logger } from '../utils/logger.js';

// 10 minute in-memory cache to respect Open-Meteo free API rate limits
const weatherCache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

export class WeatherService {
  /**
   * Fetches weather data for a district from Open-Meteo API using real coordinates.
   * Never fabricates fake weather.
   */
  static async fetchDistrictWeather(districtId) {
    const district = DISTRICTS.find((d) => d.id.toLowerCase() === districtId.toLowerCase());
    if (!district) {
      throw new Error(`District '${districtId}' not found in configuration.`);
    }

    const cached = weatherCache.get(district.id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return {
        ...cached.data,
        cached: true,
        cachedAt: new Date(cached.timestamp).toISOString(),
      };
    }

    const url = 'https://api.open-meteo.com/v1/forecast';
    const params = {
      latitude: district.lat,
      longitude: district.lon,
      current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m',
      hourly: 'precipitation,temperature_2m',
      daily: 'precipitation_sum,wind_gusts_10m_max,temperature_2m_max,temperature_2m_min',
      timezone: 'Asia/Kolkata',
    };

    try {
      const response = await axios.get(url, { params, timeout: 10000 });
      const data = {
        districtId: district.id,
        districtName: district.name,
        districtNameTa: district.nameTa,
        coordinates: { lat: district.lat, lon: district.lon },
        current: response.data.current,
        daily: response.data.daily,
        hourly: {
          time: response.data.hourly.time.slice(0, 24),
          precipitation: response.data.hourly.precipitation.slice(0, 24),
          temperature_2m: response.data.hourly.temperature_2m.slice(0, 24),
        },
        attribution: 'Weather data by Open-Meteo.com under CC BY 4.0',
        fetchedAt: new Date().toISOString(),
      };

      weatherCache.set(district.id, {
        timestamp: Date.now(),
        data,
      });

      return { ...data, cached: false };
    } catch (err) {
      logger.error(`Open-Meteo API error for ${district.name}:`, err.message);
      throw new Error(`Failed to fetch live weather from Open-Meteo for ${district.name}: ${err.message}`);
    }
  }

  /**
   * Checks all configured districts, compares with thresholds,
   * and creates pending_review alerts for detected anomalies.
   */
  static async checkAllDistrictsForAnomalies() {
    const rules = await getActiveRules();
    const results = [];

    for (const district of DISTRICTS) {
      try {
        const weather = await this.fetchDistrictWeather(district.id);
        const anomalies = evaluateForecastAgainstRules(weather, rules);

        for (const anomaly of anomalies) {
          // Check for existing pending or approved alert for same district + type within last 24h
          const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
          const existingAlert = await Alert.findOne({
            district: district.name,
            type: anomaly.type,
            status: { $in: ['pending_review', 'approved', 'sending', 'sent'] },
            createdAt: { $gte: oneDayAgo },
          });

          if (existingAlert) {
            logger.info(`Alert for ${district.name} (${anomaly.type}) already exists (ID: ${existingAlert._id}), skipping duplicate.`);
            continue;
          }

          // Generate draft advisory voice scripts using Gemini or template fallback
          const scripts = await GeminiService.generateAdvisoryScripts({
            districtName: district.name,
            districtNameTa: district.nameTa,
            type: anomaly.type,
            severity: anomaly.severity,
            evidence: anomaly.evidence,
            crops: anomaly.affectedCrops,
          });

          const newAlert = await Alert.create({
            district: district.name,
            type: anomaly.type,
            severity: anomaly.severity,
            forecastEvidence: anomaly.evidence,
            affectedCrops: anomaly.affectedCrops,
            tamilScript: scripts.tamilScript,
            englishScript: scripts.englishScript,
            status: 'pending_review',
            windowStart: new Date(),
            windowEnd: new Date(Date.now() + 48 * 60 * 60 * 1000),
          });

          logger.info(`Created pending_review alert for ${district.name} (${anomaly.type})`);
          results.push(newAlert);
        }
      } catch (err) {
        logger.error(`Error checking weather for district ${district.name}:`, err.message);
      }
    }

    return results;
  }
}
