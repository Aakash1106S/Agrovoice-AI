import { DEFAULT_RULES, ALERT_TYPES } from './constants.js';
import { SystemSetting } from '../models/SystemSetting.js';
import { logger } from '../utils/logger.js';

export async function getActiveRules() {
  try {
    const setting = await SystemSetting.findOne({ key: 'rules_config' });
    if (setting && setting.value) {
      return { ...DEFAULT_RULES, ...setting.value };
    }
  } catch (err) {
    logger.warn('Could not load rules from DB, using defaults:', err.message);
  }
  return DEFAULT_RULES;
}

export async function updateActiveRules(newRules) {
  const merged = { ...DEFAULT_RULES, ...newRules };
  await SystemSetting.findOneAndUpdate(
    { key: 'rules_config' },
    { key: 'rules_config', value: merged, description: 'Configurable anomaly detection thresholds' },
    { upsert: true, new: true }
  );
  return merged;
}

/**
 * Evaluates weather forecast metrics against active rules for a district.
 * Returns an array of detected anomalies: [{ type, severity, evidence, affectedCrops }]
 */
export function evaluateForecastAgainstRules(weatherData, rules = DEFAULT_RULES) {
  const anomalies = [];

  if (!weatherData || !weatherData.daily) {
    return anomalies;
  }

  const { daily, hourly } = weatherData;

  // 1. Heavy Rain Evaluation: next 24h or max 1-day rainfall sum in forecast
  const rainRule = rules.heavy_rain || DEFAULT_RULES.heavy_rain;
  if (rainRule.enabled) {
    // 24h precipitation: examine today's daily precipitation or sum of next 24 hourly
    let max24hRain = daily.precipitation_sum?.[0] || 0;
    if (daily.precipitation_sum?.[1] && daily.precipitation_sum[1] > max24hRain) {
      max24hRain = daily.precipitation_sum[1];
    }

    if (max24hRain >= rainRule.rainfall24hMm) {
      const severity = max24hRain >= rainRule.rainfall24hMm * 1.5 ? 'critical' : rainRule.severity;
      anomalies.push({
        type: ALERT_TYPES.HEAVY_RAIN,
        severity,
        evidence: {
          metric: 'precipitation_24h',
          value: Math.round(max24hRain * 10) / 10,
          threshold: rainRule.rainfall24hMm,
          unit: 'mm',
          timeWindow: 'Next 24-48 hours',
          description: `Predicted rainfall of ${Math.round(max24hRain)} mm exceeds threshold of ${rainRule.rainfall24hMm} mm.`,
        },
        affectedCrops: rainRule.targetCrops || ['Paddy', 'Banana', 'Sugarcane'],
      });
    }
  }

  // 2. Strong Wind Evaluation: max wind gusts
  const windRule = rules.strong_wind || DEFAULT_RULES.strong_wind;
  if (windRule.enabled) {
    const maxGust = Math.max(...(daily.wind_gusts_10m_max || [0]));
    if (maxGust >= windRule.gustKmh) {
      const severity = maxGust >= windRule.gustKmh * 1.4 ? 'critical' : windRule.severity;
      anomalies.push({
        type: ALERT_TYPES.STRONG_WIND,
        severity,
        evidence: {
          metric: 'wind_gusts_max',
          value: Math.round(maxGust * 10) / 10,
          threshold: windRule.gustKmh,
          unit: 'km/h',
          timeWindow: 'Peak over next 48 hours',
          description: `Predicted wind gusts of ${Math.round(maxGust)} km/h exceed threshold of ${windRule.gustKmh} km/h.`,
        },
        affectedCrops: windRule.targetCrops || ['Banana', 'Sugarcane'],
      });
    }
  }

  // 3. Drought Evaluation: 7-day cumulative rainfall < threshold and high temperature
  const droughtRule = rules.drought || DEFAULT_RULES.drought;
  if (droughtRule.enabled && daily.precipitation_sum) {
    const sum7dRain = daily.precipitation_sum.slice(0, 7).reduce((acc, val) => acc + (val || 0), 0);
    const maxTemp = Math.max(...(daily.temperature_2m_max || [0]));

    if (sum7dRain <= droughtRule.rainfall7dMaxMm && maxTemp >= droughtRule.tempMaxCelsius) {
      anomalies.push({
        type: ALERT_TYPES.DROUGHT,
        severity: droughtRule.severity,
        evidence: {
          metric: 'drought_index',
          value: Math.round(sum7dRain * 10) / 10,
          threshold: droughtRule.rainfall7dMaxMm,
          unit: 'mm / 7 days',
          timeWindow: '7-Day Outlook',
          description: `7-day rainfall sum is only ${Math.round(sum7dRain * 10) / 10} mm with peak temperatures reaching ${Math.round(maxTemp)}°C.`,
        },
        affectedCrops: droughtRule.targetCrops || ['Paddy', 'Cotton', 'Sugarcane'],
      });
    }
  }

  return anomalies;
}
