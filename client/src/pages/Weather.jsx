import React, { useState, useEffect } from 'react';
import { weatherApi } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import {
  CloudRain,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  MapPin,
  CheckCircle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

const DISTRICTS_CONFIG = [
  { id: 'thanjavur', name: 'Thanjavur', nameTa: 'தஞ்சாவூர்', delta: 'Cauvery Delta Rice Bowl' },
  { id: 'madurai', name: 'Madurai', nameTa: 'மதுரை', delta: 'Vaigai Basin Agrarian Zone' },
  { id: 'tiruchirappalli', name: 'Tiruchirappalli', nameTa: 'திருச்சிராப்பள்ளி', delta: 'Central Delta Banana Belt' },
  { id: 'coimbatore', name: 'Coimbatore', nameTa: 'கோயம்புத்தூர்', delta: 'Kongu Agro-Climatic Zone' },
  { id: 'nagapattinam', name: 'Nagapattinam', nameTa: 'நாகப்பட்டினம்', delta: 'Coastal Cyclonic Lowlands' },
];

export default function Weather() {
  const [selectedDistrict, setSelectedDistrict] = useState(DISTRICTS_CONFIG[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);
  const [scanning, setScanning] = useState(false);

  const { success, error } = useNotification();

  const fetchWeather = (districtId) => {
    setLoading(true);
    setErrorMsg(null);
    weatherApi.getDistrict(districtId)
      .then((res) => {
        setWeatherData(res.data.data);
      })
      .catch((err) => {
        const msg = err.response?.data?.error || err.message || 'Failed to fetch weather from Open-Meteo';
        setErrorMsg(msg);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWeather(selectedDistrict.id);
  }, [selectedDistrict]);

  const handleRunCheckNow = async () => {
    setScanning(true);
    try {
      const res = await weatherApi.checkNow();
      success(res.data.message || 'Weather anomaly check completed.');
      fetchWeather(selectedDistrict.id);
    } catch (err) {
      error('Failed to run weather check.');
    } finally {
      setScanning(false);
    }
  };

  // Format 7-day daily data for Recharts
  const chartData = weatherData?.daily?.time?.map((timeStr, idx) => {
    const d = new Date(timeStr);
    return {
      date: timeStr,
      day: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      precipitation: weatherData.daily.precipitation_sum?.[idx] || 0,
      maxGust: weatherData.daily.wind_gusts_10m_max?.[idx] || 0,
      maxTemp: weatherData.daily.temperature_2m_max?.[idx] || 0,
      minTemp: weatherData.daily.temperature_2m_min?.[idx] || 0,
    };
  }) || [];

  const rainThreshold = weatherData?.thresholds?.heavy_rain?.rainfall24hMm || 45;
  const gustThreshold = weatherData?.thresholds?.strong_wind?.gustKmh || 45;

  const currentRain = weatherData?.current?.precipitation || 0;
  const currentTemp = weatherData?.current?.temperature_2m || 0;
  const currentHumidity = weatherData?.current?.relative_humidity_2m || 0;
  const currentWindSpeed = weatherData?.current?.wind_speed_10m || 0;
  const currentWindGust = weatherData?.current?.wind_gusts_10m || 0;

  const max24hRainForecast = weatherData?.daily?.precipitation_sum?.[0] || 0;
  const rainProximity = Math.min(100, Math.round((max24hRainForecast / rainThreshold) * 100));

  const maxGustForecast = Math.max(...(weatherData?.daily?.wind_gusts_10m_max || [0]));
  const gustProximity = Math.min(100, Math.round((maxGustForecast / gustThreshold) * 100));

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-agro-sand-900 tracking-tight">Meteorological Monitoring Station</h2>
          <p className="text-sm text-agro-sand-600 mt-0.5">
            Real-time coordinates telemetry via Open-Meteo Forecast API with calibrated anomaly thresholds.
          </p>
        </div>
        <button
          onClick={handleRunCheckNow}
          disabled={scanning}
          className="flex items-center gap-2 px-4 py-2.5 bg-agro-forest-700 hover:bg-agro-forest-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Evaluating Rules...' : 'Run Anomaly Scan Now'}</span>
        </button>
      </div>

      {/* District Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {DISTRICTS_CONFIG.map((dist) => {
          const isSelected = selectedDistrict.id === dist.id;
          return (
            <button
              key={dist.id}
              onClick={() => setSelectedDistrict(dist)}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-agro-forest-800 text-white border-agro-forest-900 shadow-sm'
                  : 'bg-white text-agro-sand-700 hover:bg-agro-sand-100 border-agro-sand-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-agro-leaf-300' : 'text-agro-sand-400'}`} />
                <span>{dist.name}</span>
                <span className={`text-xs font-tamil ${isSelected ? 'text-agro-leaf-200' : 'text-agro-sand-400'}`}>
                  ({dist.nameTa})
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">Live Meteorological Fetch Failed</h4>
            <p className="text-xs text-rose-700 mt-0.5">{errorMsg}</p>
            <p className="text-xs text-rose-600 mt-1">
              Per strict system specifications, AgroVoice AI never fabricates fake meteorological telemetry. Please verify network connectivity to Open-Meteo.
            </p>
          </div>
        </div>
      )}

      {/* Live Conditions Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl border border-agro-sand-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-agro-sand-500 uppercase">
            <Thermometer className="w-4 h-4 text-amber-600" />
            <span>Temperature</span>
          </div>
          <div className="text-2xl font-black text-agro-sand-900 mt-1">
            {loading ? '...' : `${currentTemp}°C`}
          </div>
          <div className="text-[11px] text-agro-sand-500 mt-1">Surface 2m observation</div>
        </div>

        <div className="bg-white rounded-xl border border-agro-sand-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-agro-sand-500 uppercase">
            <Droplets className="w-4 h-4 text-sky-600" />
            <span>Relative Humidity</span>
          </div>
          <div className="text-2xl font-black text-agro-sand-900 mt-1">
            {loading ? '...' : `${currentHumidity}%`}
          </div>
          <div className="text-[11px] text-agro-sand-500 mt-1">Atmospheric vapor</div>
        </div>

        <div className="bg-white rounded-xl border border-agro-sand-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-agro-sand-500 uppercase">
            <CloudRain className="w-4 h-4 text-blue-600" />
            <span>Current Rain</span>
          </div>
          <div className="text-2xl font-black text-agro-sand-900 mt-1">
            {loading ? '...' : `${currentRain} mm`}
          </div>
          <div className="text-[11px] text-agro-sand-500 mt-1">Live precipitation rate</div>
        </div>

        <div className="bg-white rounded-xl border border-agro-sand-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-agro-sand-500 uppercase">
            <Wind className="w-4 h-4 text-emerald-600" />
            <span>Sustained Wind</span>
          </div>
          <div className="text-2xl font-black text-agro-sand-900 mt-1">
            {loading ? '...' : `${currentWindSpeed} km/h`}
          </div>
          <div className="text-[11px] text-agro-sand-500 mt-1">10m anemometer</div>
        </div>

        <div className="bg-white rounded-xl border border-agro-sand-200 p-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-agro-sand-500 uppercase">
            <Wind className="w-4 h-4 text-agro-crimson-600" />
            <span>Wind Gusts</span>
          </div>
          <div className="text-2xl font-black text-agro-crimson-700 mt-1">
            {loading ? '...' : `${currentWindGust} km/h`}
          </div>
          <div className="text-[11px] text-agro-sand-500 mt-1">Peak instantaneous gust</div>
        </div>
      </div>

      {/* Threshold Proximity Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rainfall Threshold Proximity */}
        <div className="bg-white rounded-2xl border border-agro-sand-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-agro-sand-900">24-Hour Rainfall Alert Threshold</h4>
              <p className="text-xs text-agro-sand-500">
                Trigger rule: ≥ {rainThreshold} mm in 24h window
              </p>
            </div>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full ${
                max24hRainForecast >= rainThreshold
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {max24hRainForecast} mm / {rainThreshold} mm ({rainProximity}%)
            </span>
          </div>
          <div className="w-full bg-agro-sand-100 h-3 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-500 ${
                max24hRainForecast >= rainThreshold
                  ? 'bg-rose-600'
                  : max24hRainForecast >= rainThreshold * 0.75
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${rainProximity}%` }}
            />
          </div>
          <p className="text-xs text-agro-sand-500 mt-2">
            {max24hRainForecast >= rainThreshold
              ? '⚠️ Anomaly condition met. System will draft a pending_review advisory for admin approval.'
              : 'Safe baseline: Rainfall levels do not exceed drainage threshold for paddy fields.'}
          </p>
        </div>

        {/* Wind Gust Threshold Proximity */}
        <div className="bg-white rounded-2xl border border-agro-sand-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-agro-sand-900">Wind Gust Propping Threshold</h4>
              <p className="text-xs text-agro-sand-500">
                Trigger rule: ≥ {gustThreshold} km/h (Banana/Sugarcane propping alert)
              </p>
            </div>
            <span
              className={`text-xs font-black px-2.5 py-1 rounded-full ${
                maxGustForecast >= gustThreshold
                  ? 'bg-rose-100 text-rose-800 border border-rose-300'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {maxGustForecast} km/h / {gustThreshold} km/h ({gustProximity}%)
            </span>
          </div>
          <div className="w-full bg-agro-sand-100 h-3 rounded-full overflow-hidden mt-3">
            <div
              className={`h-full transition-all duration-500 ${
                maxGustForecast >= gustThreshold
                  ? 'bg-rose-600'
                  : maxGustForecast >= gustThreshold * 0.75
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${gustProximity}%` }}
            />
          </div>
          <p className="text-xs text-agro-sand-500 mt-2">
            {maxGustForecast >= gustThreshold
              ? '⚠️ Anomaly condition met. Cyclonic gusts require immediate bamboo propping advice.'
              : 'Safe baseline: Wind speeds are within tolerant ranges for tall standing crops.'}
          </p>
        </div>
      </div>

      {/* 7-Day Rainfall Forecast Bar Chart */}
      <div className="bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-bold text-agro-sand-900">7-Day Rainfall Forecast (mm)</h3>
            <p className="text-xs text-agro-sand-500">
              Daily cumulative precipitation forecast with red reference threshold marker at {rainThreshold} mm
            </p>
          </div>
          <div className="text-xs font-mono text-agro-sand-400">
            Coordinates: {selectedDistrict.name} ({weatherData?.coordinates?.lat}°N, {weatherData?.coordinates?.lon}°E)
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
              <XAxis dataKey="day" stroke="#78716c" fontSize={12} />
              <YAxis stroke="#78716c" fontSize={12} unit="mm" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '12px',
                  border: '1px solid #e7e5e4',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
              />
              <ReferenceLine y={rainThreshold} stroke="#dc2626" strokeDasharray="4 4" strokeWidth={2} label={{ value: `Heavy Rain Threshold: ${rainThreshold}mm`, fill: '#dc2626', fontSize: 11 }} />
              <Bar dataKey="precipitation" fill="#2563eb" radius={[6, 6, 0, 0]} name="Precipitation Sum (mm)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Attribution Mandatory Notice */}
        <div className="mt-4 pt-3 border-t border-agro-sand-100 flex items-center justify-between text-xs text-agro-sand-500">
          <span>
            {weatherData?.cached ? `⚡ Served from 10-minute cache (${weatherData.cachedAt})` : 'Live telemetry freshly queried.'}
          </span>
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-semibold text-agro-forest-700 hover:underline"
          >
            <span>Weather data by Open-Meteo.com (CC BY 4.0)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
