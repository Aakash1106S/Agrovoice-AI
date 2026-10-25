import React, { useState, useEffect } from 'react';
import { dashboardApi, weatherApi, alertsApi } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import StatCard from '../components/StatCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import {
  Users,
  PhoneCall,
  CheckCircle2,
  Percent,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  MapPin,
  Flame,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [selectedAlertForSend, setSelectedAlertForSend] = useState(null);
  const [recipientPreview, setRecipientPreview] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { success, error, info } = useNotification();
  const navigate = useNavigate();

  const fetchDashboard = () => {
    dashboardApi.getStats()
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        console.error('Failed to load dashboard:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 4000); // 4s real-time polling
    return () => clearInterval(interval);
  }, []);

  const handleScanNow = async () => {
    setScanning(true);
    try {
      const res = await weatherApi.checkNow();
      success(res.data.message || 'Weather scan completed.');
      fetchDashboard();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to scan weather.');
    } finally {
      setScanning(false);
    }
  };

  const handleOpenApproveModal = async (alert) => {
    setSelectedAlertForSend(alert);
    setConfirmModalOpen(true);
    try {
      const previewRes = await alertsApi.previewRecipients(alert._id);
      setRecipientPreview(previewRes.data.data);
    } catch (err) {
      error('Failed to calculate recipient counts.');
    }
  };

  const handleConfirmApprovalAndSend = async () => {
    if (!selectedAlertForSend) return;
    setActionLoading(true);
    try {
      // Step 1: Approve if still pending
      if (selectedAlertForSend.status === 'pending_review') {
        await alertsApi.approve(selectedAlertForSend._id);
      }
      // Step 2: Trigger Outbound Calls
      const sendRes = await alertsApi.send(selectedAlertForSend._id);
      success(sendRes.data.message || 'Outbound voice calls queued successfully!');
      setConfirmModalOpen(false);
      fetchDashboard();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to dispatch calls.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-agro-forest-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-agro-sand-600 font-medium">Loading live meteorological operations...</p>
        </div>
      </div>
    );
  }

  const { stats, pendingAlerts, districtsAtRisk, recentCalls, acknowledgmentTrend, telephonyMode } = data || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Quick Trigger */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-agro-sand-900 tracking-tight">Agricultural Voice Relay Console</h2>
          <p className="text-sm text-agro-sand-600 mt-0.5">
            Real-time weather surveillance & automated colloquial Tamil/English voice alerts for Tamil Nadu.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleScanNow}
            disabled={scanning}
            className="flex items-center gap-2 px-4 py-2.5 bg-agro-forest-700 hover:bg-agro-forest-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning Weather...' : 'Run Weather Check Now'}</span>
          </button>
        </div>
      </div>

      {/* PENDING REVIEW ALERT BANNER (CRITICAL WORKFLOW) */}
      {pendingAlerts?.count > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-5 rounded-2xl shadow-md border border-amber-400 animate-in fade-in slide-in-from-top-2">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-white/20 backdrop-blur-md rounded-xl text-white">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-white text-amber-900 text-xs font-black rounded uppercase tracking-wider">
                    {pendingAlerts.count} Alert(s) Pending Human Approval
                  </span>
                  <span className="text-xs text-amber-100 font-medium">Automatic calling is strictly paused</span>
                </div>
                <h4 className="text-lg font-bold mt-1 text-white leading-tight">
                  {pendingAlerts.latest?.district} District: {pendingAlerts.latest?.type?.replace('_', ' ').toUpperCase()} Warning
                </h4>
                <p className="text-xs text-amber-100 mt-1 max-w-2xl">
                  {pendingAlerts.latest?.forecastEvidence?.description || 'Meteorological anomaly detected above configured threshold.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
              <button
                onClick={() => handleOpenApproveModal(pendingAlerts.latest)}
                className="px-4 py-2.5 bg-white hover:bg-amber-50 text-amber-900 rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5"
              >
                <span>Review & Approve</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <Link
                to="/alerts"
                className="px-3 py-2 bg-amber-700/60 hover:bg-amber-700 text-white rounded-xl font-medium text-xs transition-colors"
              >
                View All
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Primary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Farmers"
          value={stats?.totalRegisteredFarmers || 0}
          subtitle={`${stats?.consentedFarmers || 0} voice-consented • ${stats?.optedOutFarmers || 0} opted-out`}
          icon={Users}
          color="forest"
          trend={<span className="text-emerald-700 font-medium">Consent Vault Enforced</span>}
        />
        <StatCard
          title="Outbound Calls Placed"
          value={stats?.totalCallsPlaced || 0}
          subtitle={`Telephony Mode: ${(telephonyMode || 'test').toUpperCase()}`}
          icon={PhoneCall}
          color="leaf"
          trend={<span className="text-agro-sand-600 font-mono">100% masked numbers</span>}
        />
        <StatCard
          title="Calls Answered"
          value={stats?.totalCallsAnswered || 0}
          subtitle={`Answer Rate: ${stats?.answerRate || 0}%`}
          icon={CheckCircle2}
          color="earth"
          trend={<span className="text-amber-800 font-medium">Spoken advisory delivered</span>}
        />
        <StatCard
          title="Farmer Acknowledgment"
          value={`${stats?.acknowledgmentRate || 0}%`}
          subtitle={`${stats?.totalAcknowledged || 0} Pressed '1' to confirm`}
          icon={Percent}
          color="crimson"
          trend={<span className="text-agro-crimson-700 font-bold">Keypad 1 DTMF Rate</span>}
        />
      </div>

      {/* Districts at Risk Strip */}
      <div className="bg-white rounded-2xl border border-agro-sand-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-agro-crimson-600" />
            <h3 className="text-sm font-bold text-agro-sand-900 uppercase tracking-wide">
              District Surveillance Strip (5 Core Agricultural Basins)
            </h3>
          </div>
          <Link to="/weather" className="text-xs font-semibold text-agro-forest-700 hover:text-agro-forest-900 flex items-center gap-1">
            <span>Detailed Weather Radar</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {districtsAtRisk && districtsAtRisk.length > 0 ? (
            districtsAtRisk.map((dist) => (
              <div
                key={dist.districtId}
                className={`p-3 rounded-xl border transition-all ${
                  dist.riskLevel === 'CRITICAL'
                    ? 'bg-rose-50 border-rose-200 text-rose-900'
                    : 'bg-amber-50 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{dist.name}</span>
                  <span
                    className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                      dist.riskLevel === 'CRITICAL' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                    }`}
                  >
                    {dist.riskLevel}
                  </span>
                </div>
                <div className="text-xs font-tamil text-agro-sand-600 mt-0.5">{dist.nameTa}</div>
                <div className="mt-2 text-xs font-semibold flex items-center justify-between">
                  <span className="text-agro-sand-500 font-normal">Rain/Gusts:</span>
                  <span>{dist.primaryMetric}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-3 text-center text-xs text-agro-sand-500 bg-emerald-50 rounded-xl border border-emerald-200 font-medium">
              ✓ All 5 agricultural districts are currently below warning thresholds. Live Open-Meteo polling active.
            </div>
          )}
        </div>
      </div>

      {/* Charts & Call Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Acknowledgment Trend Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-agro-sand-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-agro-sand-900">Farmer Acknowledgment Trend</h3>
              <p className="text-xs text-agro-sand-500">Daily DTMF Keypad '1' confirmations over the last 7 days</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium text-agro-sand-600">
              <span className="w-3 h-3 rounded-full bg-agro-forest-600"></span>
              <span>Acknowledged</span>
              <span className="w-3 h-3 rounded-full bg-agro-sand-300 ml-2"></span>
              <span>Total Calls</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={acknowledgmentTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAck" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#15803d" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#15803d" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#78716c" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#78716c" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="day" stroke="#a8a29e" fontSize={12} />
                <YAxis stroke="#a8a29e" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Area type="monotone" dataKey="totalCalls" stroke="#78716c" fillOpacity={1} fill="url(#colorTotal)" name="Total Calls" />
                <Area type="monotone" dataKey="acknowledged" stroke="#15803d" strokeWidth={2} fillOpacity={1} fill="url(#colorAck)" name="Acknowledged (Key 1)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Col: Recent Call Activity Feed */}
        <div className="bg-white rounded-2xl border border-agro-sand-200 p-5 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-agro-sand-900">Recent Voice Activity</h3>
            <Link to="/history" className="text-xs font-semibold text-agro-forest-700 hover:text-agro-forest-900">
              Full Logs
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto max-h-[290px] pr-1">
            {recentCalls && recentCalls.length > 0 ? (
              recentCalls.map((call) => (
                <div key={call._id} className="p-3 bg-agro-sand-50 rounded-xl border border-agro-sand-200 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-agro-sand-900">{call.farmer?.name || 'Farmer'}</span>
                    <StatusBadge status={call.status} type="callStatus" />
                  </div>
                  <div className="flex items-center justify-between text-agro-sand-500 text-[11px]">
                    <span className="flex items-center gap-1 font-mono">
                      <MapPin className="w-3 h-3 text-agro-sand-400" />
                      {call.farmer?.district || 'Tamil Nadu'}
                    </span>
                    <span>{new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-agro-sand-200/60">
                    <span className="text-[10px] text-agro-sand-400 font-mono">
                      {call.simulated ? 'SIMULATED' : 'LIVE EXOTEL'}
                    </span>
                    <StatusBadge status={call.dtmfResult} type="dtmf" />
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-xs text-agro-sand-500">
                No outbound calls placed yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Human-in-the-Loop Sending */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmApprovalAndSend}
        alert={selectedAlertForSend}
        recipientPreview={recipientPreview}
        loading={actionLoading}
        confirmButtonText="Approve & Initiate Outbound Voice Relay"
      />
    </div>
  );
}
