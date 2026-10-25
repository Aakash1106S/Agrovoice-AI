import React, { useState, useEffect } from 'react';
import { alertsApi } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import AudioPlayer from '../components/AudioPlayer.jsx';
import {
  AlertTriangle,
  CheckCircle,
  PhoneCall,
  Clock,
  Edit3,
  XCircle,
  Eye,
  Filter,
  Users,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTamilScript, setEditTamilScript] = useState('');
  const [editEnglishScript, setEditEnglishScript] = useState('');
  const [savingScripts, setSavingScripts] = useState(false);

  // Dispatch / Confirm Modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const { success, error, info } = useNotification();

  const fetchAlerts = () => {
    setLoading(true);
    alertsApi.list({ status: statusFilter || undefined })
      .then((res) => {
        setAlerts(res.data.data || []);
      })
      .catch((err) => {
        error('Failed to load alerts.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const handleSelectAlert = (alert) => {
    setSelectedAlert(alert);
    setEditTamilScript(alert.tamilScript);
    setEditEnglishScript(alert.englishScript);
    setIsEditing(false);
  };

  const handleSaveScripts = async () => {
    if (!selectedAlert) return;
    setSavingScripts(true);
    try {
      const res = await alertsApi.updateScripts(selectedAlert._id, {
        tamilScript: editTamilScript,
        englishScript: editEnglishScript,
      });
      setSelectedAlert(res.data.data);
      success('Voice scripts saved successfully.');
      setIsEditing(false);
      fetchAlerts();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save scripts.');
    } finally {
      setSavingScripts(false);
    }
  };

  const handleOpenConfirmModal = async (alert) => {
    setSelectedAlert(alert);
    setConfirmModalOpen(true);
    try {
      const previewRes = await alertsApi.previewRecipients(alert._id);
      setRecipientPreview(previewRes.data.data);
    } catch (err) {
      error('Failed to preview recipients.');
    }
  };

  const handleConfirmApprovalAndDispatch = async () => {
    if (!selectedAlert) return;
    setActionLoading(true);
    try {
      // 1. Approve if in pending_review
      if (selectedAlert.status === 'pending_review') {
        const approveRes = await alertsApi.approve(selectedAlert._id, {
          tamilScript: editTamilScript,
          englishScript: editEnglishScript,
        });
        setSelectedAlert(approveRes.data.data);
      }

      // 2. Dispatch outbound voice calls
      const sendRes = await alertsApi.send(selectedAlert._id);
      success(sendRes.data.message || 'Outbound voice alert campaign initiated!');
      setConfirmModalOpen(false);
      fetchAlerts();
    } catch (err) {
      error(err.response?.data?.error || 'Failed to dispatch calls.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismissAlert = async (alertId) => {
    if (!window.confirm('Are you sure you want to dismiss this emergency alert?')) return;
    try {
      await alertsApi.dismiss(alertId);
      success('Alert has been dismissed.');
      fetchAlerts();
      if (selectedAlert?._id === alertId) {
        setSelectedAlert(null);
      }
    } catch (err) {
      error('Failed to dismiss alert.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-agro-sand-900 tracking-tight">Emergency Weather Alerts</h2>
          <p className="text-sm text-agro-sand-600 mt-0.5">
            Strict human-in-the-loop approval: Admins must review, verify, and approve colloquial voice scripts before any phone call is dispatched.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-agro-sand-200 pb-3 overflow-x-auto">
        {[
          { label: 'All Alerts', value: '' },
          { label: 'Pending Review', value: 'pending_review' },
          { label: 'Approved', value: 'approved' },
          { label: 'Sending / Sent', value: 'sent' },
          { label: 'Dismissed', value: 'dismissed' },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === tab.value
                ? 'bg-agro-forest-800 text-white shadow-xs'
                : 'text-agro-sand-600 hover:text-agro-sand-900 hover:bg-agro-sand-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Grid: Alert List (Left) & Script Review Drawer (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Alerts List */}
        <div className={`space-y-3 ${selectedAlert ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
          {loading ? (
            <div className="p-8 text-center text-xs text-agro-sand-500">Loading alerts registry...</div>
          ) : alerts.length === 0 ? (
            <div className="p-10 bg-white rounded-2xl border border-agro-sand-200 text-center text-sm text-agro-sand-500">
              No weather alerts found matching this status filter.
            </div>
          ) : (
            alerts.map((alert) => {
              const isSelected = selectedAlert?._id === alert._id;
              return (
                <div
                  key={alert._id}
                  onClick={() => handleSelectAlert(alert)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-agro-forest-700 shadow-md ring-2 ring-agro-forest-600/20'
                      : 'bg-white border-agro-sand-200 hover:border-agro-sand-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-agro-sand-900">{alert.district}</span>
                        <StatusBadge status={alert.severity} type="severity" />
                      </div>
                      <p className="text-xs font-semibold text-agro-crimson-700 mt-0.5 capitalize">
                        {alert.type?.replace('_', ' ')} Warning
                      </p>
                    </div>
                    <StatusBadge status={alert.status} type="alertStatus" />
                  </div>

                  <p className="text-xs text-agro-sand-600 mt-2 line-clamp-2">
                    {alert.forecastEvidence?.description || 'Meteorological threshold reached.'}
                  </p>

                  <div className="mt-3 pt-3 border-t border-agro-sand-100 flex items-center justify-between text-[11px] text-agro-sand-500">
                    <span>Crops: {alert.affectedCrops?.join(', ') || 'All crops'}</span>
                    <span>{new Date(alert.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  {/* Inline Action Bar */}
                  <div className="mt-3 flex items-center justify-end gap-2">
                    {alert.status === 'pending_review' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenConfirmModal(alert);
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Review & Approve</span>
                      </button>
                    )}
                    {alert.status === 'approved' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenConfirmModal(alert);
                        }}
                        className="px-3 py-1.5 bg-agro-forest-700 hover:bg-agro-forest-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Dispatch Voice Calls</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detailed Script Review & Audio Inspection Panel */}
        {selectedAlert && (
          <div className="lg:col-span-7 bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-sm space-y-5 sticky top-20">
            <div className="flex items-start justify-between pb-4 border-b border-agro-sand-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-agro-sand-900">{selectedAlert.district} Alert Review</h3>
                  <StatusBadge status={selectedAlert.status} type="alertStatus" />
                </div>
                <p className="text-xs text-agro-sand-500 mt-0.5">
                  ID: <span className="font-mono text-agro-sand-700">{selectedAlert._id}</span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {selectedAlert.status !== 'sent' && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-3 py-1.5 text-xs font-semibold text-agro-sand-700 bg-agro-sand-100 hover:bg-agro-sand-200 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{isEditing ? 'Cancel Edit' : 'Edit Voice Scripts'}</span>
                  </button>
                )}
                {selectedAlert.status === 'pending_review' && (
                  <button
                    onClick={() => handleDismissAlert(selectedAlert._id)}
                    className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                    title="Dismiss alert"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Evidence details */}
            <div className="p-3.5 bg-agro-sand-50 rounded-xl border border-agro-sand-200 text-xs space-y-1">
              <div className="font-bold text-agro-sand-800">Forecast Meteorological Evidence:</div>
              <p className="text-agro-sand-700">{selectedAlert.forecastEvidence?.description}</p>
              <div className="text-agro-sand-500 font-mono text-[11px] pt-1">
                Metric: {selectedAlert.forecastEvidence?.metric} = {selectedAlert.forecastEvidence?.value} {selectedAlert.forecastEvidence?.unit} (Threshold: {selectedAlert.forecastEvidence?.threshold})
              </div>
            </div>

            {/* Tamil Voice Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-agro-sand-800 font-tamil">
                  தமிழ் குரல் செய்தி (Tamil Spoken Advisory Script):
                </label>
                <span className="text-[11px] text-agro-sand-500">Colloquial Spoken Tamil for IVR</span>
              </div>
              {isEditing ? (
                <textarea
                  rows={4}
                  value={editTamilScript}
                  onChange={(e) => setEditTamilScript(e.target.value)}
                  className="w-full text-sm font-tamil p-3 rounded-xl border border-agro-sand-300 focus:outline-none focus:ring-2 focus:ring-agro-forest-600 bg-agro-sand-50/50"
                />
              ) : (
                <div className="p-3.5 rounded-xl bg-agro-sand-50/80 border border-agro-sand-200 text-sm font-tamil text-agro-sand-800 leading-relaxed">
                  {selectedAlert.tamilScript}
                </div>
              )}
              {/* Voice Preview Player */}
              <AudioPlayer scriptText={selectedAlert.tamilScript} language="ta" />
            </div>

            {/* English Voice Script */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-agro-sand-800">
                  English Spoken Advisory Script:
                </label>
                <span className="text-[11px] text-agro-sand-500">Indian English Voice</span>
              </div>
              {isEditing ? (
                <textarea
                  rows={3}
                  value={editEnglishScript}
                  onChange={(e) => setEditEnglishScript(e.target.value)}
                  className="w-full text-sm p-3 rounded-xl border border-agro-sand-300 focus:outline-none focus:ring-2 focus:ring-agro-forest-600 bg-agro-sand-50/50"
                />
              ) : (
                <div className="p-3.5 rounded-xl bg-agro-sand-50/80 border border-agro-sand-200 text-sm text-agro-sand-800 leading-relaxed">
                  {selectedAlert.englishScript}
                </div>
              )}
              {/* Voice Preview Player */}
              <AudioPlayer scriptText={selectedAlert.englishScript} language="en" />
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-agro-sand-200 flex items-center justify-between">
              {isEditing ? (
                <button
                  onClick={handleSaveScripts}
                  disabled={savingScripts}
                  className="px-5 py-2.5 bg-agro-forest-700 hover:bg-agro-forest-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  {savingScripts ? 'Saving...' : 'Save Script Changes'}
                </button>
              ) : (
                <div className="text-xs text-agro-sand-500">
                  {selectedAlert.approvedAt
                    ? `Approved on ${new Date(selectedAlert.approvedAt).toLocaleDateString()}`
                    : 'Awaiting Administrator review & sign-off'}
                </div>
              )}

              <div className="flex items-center gap-3">
                {selectedAlert.status === 'pending_review' && (
                  <button
                    onClick={() => handleOpenConfirmModal(selectedAlert)}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Review & Approve Advisory</span>
                  </button>
                )}

                {selectedAlert.status === 'approved' && (
                  <button
                    onClick={() => handleOpenConfirmModal(selectedAlert)}
                    className="px-5 py-2.5 bg-agro-forest-700 hover:bg-agro-forest-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-2"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Dispatch Voice Calls</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recipient Calculation & Approval Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmApprovalAndDispatch}
        alert={selectedAlert}
        recipientPreview={recipientPreview}
        loading={actionLoading}
        confirmButtonText={selectedAlert?.status === 'approved' ? 'Dispatch Voice Campaign' : 'Approve & Dispatch Voice Calls'}
      />
    </div>
  );
}
