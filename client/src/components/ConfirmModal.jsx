import React from 'react';
import { AlertCircle, PhoneCall, Check, X, ShieldAlert, Users, PhoneOff } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Voice Call Dispatch',
  alert = null,
  recipientPreview = null,
  loading = false,
  confirmButtonText = 'Approve & Dispatch Voice Calls',
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-agro-sand-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-agro-sand-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-agro-crimson-100 text-agro-crimson-700">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-agro-sand-900">{title}</h3>
              <p className="text-xs text-agro-sand-500">Human-In-The-Loop Approval & Dispatch Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 rounded-lg text-agro-sand-400 hover:text-agro-sand-700 hover:bg-agro-sand-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-4 space-y-4 text-sm text-agro-sand-700">
          {alert && (
            <div className="p-3.5 bg-agro-sand-50 rounded-xl border border-agro-sand-200 space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-agro-sand-500 uppercase tracking-wide">Target District</span>
                <span className="text-agro-forest-800 font-bold">{alert.district}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-agro-sand-500 uppercase tracking-wide">Anomaly Type</span>
                <span className="text-agro-crimson-700 font-bold capitalize">{alert.type?.replace('_', ' ')}</span>
              </div>
              {alert.forecastEvidence && (
                <div className="text-xs text-agro-sand-600 pt-1 border-t border-agro-sand-200">
                  {alert.forecastEvidence.description}
                </div>
              )}
            </div>
          )}

          {/* Recipient Calculation Vault */}
          {recipientPreview ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-800 mb-1">
                    <Users className="w-3.5 h-3.5" />
                    <span>Eligible to Call</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-900">{recipientPreview.eligibleCount}</div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">
                    {recipientPreview.breakdown?.tamilRecipients || 0} Tamil • {recipientPreview.breakdown?.englishRecipients || 0} English
                  </div>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-rose-800 mb-1">
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>Strictly Excluded</span>
                  </div>
                  <div className="text-2xl font-black text-rose-900">{recipientPreview.excludedCount}</div>
                  <div className="text-[11px] text-rose-700 mt-0.5">
                    {recipientPreview.breakdown?.optedOut || 0} Opted-out • {recipientPreview.breakdown?.noConsent || 0} No-consent
                  </div>
                </div>
              </div>

              <div className="text-xs text-agro-sand-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Consent Enforcement:</strong> Only active farmers with recorded voice consent who have not opted out will be dialed. Each farmer will receive an automated call in their preferred language.
                </span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-agro-sand-500 py-2">Loading recipient calculation...</div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-agro-sand-100">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-agro-sand-700 bg-agro-sand-100 hover:bg-agro-sand-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading || (recipientPreview && recipientPreview.eligibleCount === 0)}
            className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-agro-forest-700 hover:bg-agro-forest-800 active:bg-agro-forest-900 shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{confirmButtonText}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
