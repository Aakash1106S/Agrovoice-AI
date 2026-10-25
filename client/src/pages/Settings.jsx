import React, { useState, useEffect } from 'react';
import { settingsApi } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import {
  Sliders,
  Radio,
  Server,
  Users,
  Shield,
  Save,
  Clock,
  PhoneCall,
  Check,
} from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingRules, setSavingRules] = useState(false);
  const [savingGeneral, setSavingGeneral] = useState(false);

  // Editable rules state
  const [rules, setRules] = useState({
    heavy_rain: { rainfall24hMm: 45, enabled: true },
    strong_wind: { gustKmh: 45, enabled: true },
    drought: { rainfall7dMaxMm: 5, tempMaxCelsius: 38, enabled: true },
  });

  // General settings state
  const [general, setGeneral] = useState({
    webhookBaseUrl: 'http://localhost:5001',
    callsPerSecond: 2,
    maxRetries: 2,
    weatherCron: '*/30 * * * *',
  });

  const { success, error } = useNotification();

  useEffect(() => {
    settingsApi.getSettings()
      .then((res) => {
        setSettings(res.data.data);
        if (res.data.data?.rules) {
          setRules(res.data.data.rules);
        }
        if (res.data.data?.general) {
          setGeneral(res.data.data.general);
        }
      })
      .catch((err) => {
        error('Failed to load system settings.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSaveRules = async (e) => {
    e.preventDefault();
    setSavingRules(true);
    try {
      await settingsApi.updateRules(rules);
      success('Meteorological anomaly thresholds updated.');
    } catch (err) {
      error('Failed to update thresholds.');
    } finally {
      setSavingRules(false);
    }
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setSavingGeneral(true);
    try {
      await settingsApi.updateGeneral(general);
      success('System settings saved successfully.');
    } catch (err) {
      error('Failed to update settings.');
    } finally {
      setSavingGeneral(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xs text-agro-sand-500 font-medium">Loading system configurations...</div>
      </div>
    );
  }

  const { telephony, adminUsers } = settings;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-agro-sand-900 tracking-tight">System & Telephony Settings</h2>
        <p className="text-sm text-agro-sand-600 mt-0.5">
          Configure rule-based meteorological triggers, telephony rate parameters, and view security postures.
        </p>
      </div>

      {/* Telephony Status Strip (Read-Only Security Posture) */}
      <div className="bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-agro-sand-100">
          <Radio className="w-5 h-5 text-agro-forest-700" />
          <h3 className="text-base font-bold text-agro-sand-900">Telephony Provider Status</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 bg-agro-sand-50 rounded-xl border border-agro-sand-200">
            <span className="text-[11px] font-semibold text-agro-sand-500 uppercase">Configured Mode</span>
            <div className="text-base font-bold text-agro-sand-900 mt-1 uppercase font-mono">
              {telephony.mode === 'real' ? 'LIVE CARRIER (EXOTEL)' : 'TEST MODE (SIMULATED)'}
            </div>
            <div className="text-[11px] text-agro-sand-500 mt-0.5">
              Set via TELEPHONY_MODE environment variable
            </div>
          </div>

          <div className="p-3.5 bg-agro-sand-50 rounded-xl border border-agro-sand-200">
            <span className="text-[11px] font-semibold text-agro-sand-500 uppercase">Virtual Caller ID</span>
            <div className="text-base font-mono font-bold text-agro-sand-800 mt-1">
              {telephony.callerIdMasked}
            </div>
            <div className="text-[11px] text-agro-sand-500 mt-0.5">
              Strictly masked to prevent credential exposure
            </div>
          </div>

          <div className="p-3.5 bg-agro-sand-50 rounded-xl border border-agro-sand-200">
            <span className="text-[11px] font-semibold text-agro-sand-500 uppercase">Account SID</span>
            <div className="text-base font-mono font-bold text-agro-sand-800 mt-1">
              {telephony.accountSidMasked}
            </div>
            <div className="text-[11px] text-agro-sand-500 mt-0.5">
              Encrypted in backend environment
            </div>
          </div>
        </div>
      </div>

      {/* Anomaly Detection Rules Editor */}
      <div className="bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-agro-sand-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-agro-earth-700" />
            <h3 className="text-base font-bold text-agro-sand-900">Meteorological Anomaly Triggers</h3>
          </div>
          <span className="text-xs text-agro-sand-500 font-medium">Persisted in MongoDB</span>
        </div>

        <form onSubmit={handleSaveRules} className="space-y-4 text-xs text-agro-sand-700">
          {/* Heavy Rain Rule */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-blue-900">Heavy Rainfall Advisory Rule</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.heavy_rain?.enabled}
                  onChange={(e) => setRules({ ...rules, heavy_rain: { ...rules.heavy_rain, enabled: e.target.checked } })}
                  className="rounded text-agro-forest-700"
                />
                <span className="text-xs font-semibold text-blue-950">Active Rule</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold mb-1">Precipitation Threshold (mm in 24h)</label>
                <input
                  type="number"
                  value={rules.heavy_rain?.rainfall24hMm || 45}
                  onChange={(e) => setRules({ ...rules, heavy_rain: { ...rules.heavy_rain, rainfall24hMm: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 rounded-lg border border-agro-sand-300 text-sm bg-white"
                />
              </div>
              <div className="text-[11px] text-blue-800 flex items-center">
                Advice: Immediate field drainage for low-lying paddy & crops.
              </div>
            </div>
          </div>

          {/* Strong Wind Rule */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-emerald-900">Strong Wind Gust Advisory Rule</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.strong_wind?.enabled}
                  onChange={(e) => setRules({ ...rules, strong_wind: { ...rules.strong_wind, enabled: e.target.checked } })}
                  className="rounded text-agro-forest-700"
                />
                <span className="text-xs font-semibold text-emerald-950">Active Rule</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold mb-1">Wind Gust Peak Threshold (km/h)</label>
                <input
                  type="number"
                  value={rules.strong_wind?.gustKmh || 45}
                  onChange={(e) => setRules({ ...rules, strong_wind: { ...rules.strong_wind, gustKmh: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 rounded-lg border border-agro-sand-300 text-sm bg-white"
                />
              </div>
              <div className="text-[11px] text-emerald-800 flex items-center">
                Advice: Bamboo staking for banana crops & bundle sugarcane stalks.
              </div>
            </div>
          </div>

          {/* Drought Rule */}
          <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-amber-900">Drought & Heatwave Advisory Rule</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.drought?.enabled}
                  onChange={(e) => setRules({ ...rules, drought: { ...rules.drought, enabled: e.target.checked } })}
                  className="rounded text-agro-forest-700"
                />
                <span className="text-xs font-semibold text-amber-950">Active Rule</span>
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold mb-1">7-Day Cumulative Max Rain (mm)</label>
                <input
                  type="number"
                  value={rules.drought?.rainfall7dMaxMm || 5}
                  onChange={(e) => setRules({ ...rules, drought: { ...rules.drought, rainfall7dMaxMm: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 rounded-lg border border-agro-sand-300 text-sm bg-white"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Peak Temperature Threshold (°C)</label>
                <input
                  type="number"
                  value={rules.drought?.tempMaxCelsius || 38}
                  onChange={(e) => setRules({ ...rules, drought: { ...rules.drought, tempMaxCelsius: parseFloat(e.target.value) || 0 } })}
                  className="w-full p-2 rounded-lg border border-agro-sand-300 text-sm bg-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingRules}
              className="flex items-center gap-2 px-5 py-2.5 bg-agro-forest-700 hover:bg-agro-forest-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{savingRules ? 'Updating...' : 'Save Anomaly Thresholds'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* General Telephony & Queue Parameters */}
      <div className="bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-agro-sand-100">
          <Server className="w-5 h-5 text-agro-forest-700" />
          <h3 className="text-base font-bold text-agro-sand-900">Telephony Queue & Webhook Configuration</h3>
        </div>

        <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs text-agro-sand-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold block mb-1">Webhook Base URL (for ExoML & Status callbacks)</label>
              <input
                type="text"
                value={general.webhookBaseUrl || 'http://localhost:5001'}
                onChange={(e) => setGeneral({ ...general, webhookBaseUrl: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-agro-sand-300 font-mono text-sm bg-white"
              />
              <span className="text-[11px] text-agro-sand-400">Must be port 5001 or ngrok tunnel</span>
            </div>

            <div>
              <label className="font-semibold block mb-1">Outbound Calls Throttling (Calls / Second)</label>
              <input
                type="number"
                value={general.callsPerSecond || 2}
                onChange={(e) => setGeneral({ ...general, callsPerSecond: parseInt(e.target.value, 10) || 1 })}
                className="w-full p-2.5 rounded-xl border border-agro-sand-300 text-sm bg-white"
              />
              <span className="text-[11px] text-agro-sand-400">Respects Exotel CPS rate bounds</span>
            </div>

            <div>
              <label className="font-semibold block mb-1">Background Weather Cron Expression</label>
              <input
                type="text"
                value={general.weatherCron || '*/30 * * * *'}
                onChange={(e) => setGeneral({ ...general, weatherCron: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-agro-sand-300 font-mono text-sm bg-white"
              />
              <span className="text-[11px] text-agro-sand-400">Default: every 30 minutes</span>
            </div>

            <div>
              <label className="font-semibold block mb-1">Max Call Retry Count on Failure</label>
              <input
                type="number"
                value={general.maxRetries || 2}
                onChange={(e) => setGeneral({ ...general, maxRetries: parseInt(e.target.value, 10) || 0 })}
                className="w-full p-2.5 rounded-xl border border-agro-sand-300 text-sm bg-white"
              />
              <span className="text-[11px] text-agro-sand-400">Automatic exponential backoff</span>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={savingGeneral}
              className="flex items-center gap-2 px-5 py-2.5 bg-agro-sand-800 hover:bg-agro-sand-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{savingGeneral ? 'Saving...' : 'Update Queue Settings'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Authorized Administrators */}
      <div className="bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-agro-sand-100">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-agro-forest-700" />
            <h3 className="text-base font-bold text-agro-sand-900">Authorized Human-In-The-Loop Administrators</h3>
          </div>
          <span className="text-xs font-mono text-agro-sand-500">Seed Admin: admin@agrovoice.org</span>
        </div>

        <div className="divide-y divide-agro-sand-100">
          {adminUsers?.map((admin) => (
            <div key={admin._id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-agro-sand-900">{admin.name}</span>
                <span className="text-agro-sand-500 ml-2 font-mono">({admin.email})</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono bg-agro-forest-50 text-agro-forest-800 border border-agro-forest-200">
                {admin.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
