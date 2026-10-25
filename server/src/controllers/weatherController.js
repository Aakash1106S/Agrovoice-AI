import { DISTRICTS } from '../config/constants.js';
import { getActiveRules } from '../config/rules.js';
import { WeatherService } from '../services/WeatherService.js';

export async function getDistrictWeather(req, res, next) {
  try {
    const { districtId } = req.params;
    const weatherData = await WeatherService.fetchDistrictWeather(districtId);
    const rules = await getActiveRules();

    return res.json({
      success: true,
      data: {
        ...weatherData,
        thresholds: rules,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getAllDistrictsOverview(req, res, next) {
  try {
    const rules = await getActiveRules();
    const overview = [];

    for (const district of DISTRICTS) {
      try {
        const weather = await WeatherService.fetchDistrictWeather(district.id);
        const rain24h = weather.daily?.precipitation_sum?.[0] || 0;
        const maxGust = Math.max(...(weather.daily?.wind_gusts_10m_max || [0]));

        const rainThreshold = rules.heavy_rain?.rainfall24hMm || 45;
        const gustThreshold = rules.strong_wind?.gustKmh || 45;

        overview.push({
          districtId: district.id,
          name: district.name,
          nameTa: district.nameTa,
          current: weather.current,
          rain24hMm: Math.round(rain24h * 10) / 10,
          maxGustKmh: Math.round(maxGust * 10) / 10,
          thresholds: {
            rain24h: rainThreshold,
            gustKmh: gustThreshold,
          },
          status:
            rain24h >= rainThreshold || maxGust >= gustThreshold
              ? 'warning'
              : rain24h >= rainThreshold * 0.75 || maxGust >= gustThreshold * 0.75
              ? 'watch'
              : 'normal',
          attribution: 'Open-Meteo.com',
        });
      } catch (err) {
        overview.push({
          districtId: district.id,
          name: district.name,
          nameTa: district.nameTa,
          error: err.message,
          status: 'error',
        });
      }
    }

    return res.json({
      success: true,
      data: overview,
      configuredDistricts: DISTRICTS,
    });
  } catch (err) {
    next(err);
  }
}

export async function runWeatherCheckNow(req, res, next) {
  try {
    const createdAlerts = await WeatherService.checkAllDistrictsForAnomalies();
    return res.json({
      success: true,
      message: `Weather scan completed. ${createdAlerts.length} anomaly alert(s) created in pending_review status.`,
      detectedAlerts: createdAlerts,
    });
  } catch (err) {
    next(err);
  }
}
