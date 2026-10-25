import React from 'react';
import { CheckCircle, AlertTriangle, Clock, PhoneCall, XCircle, RotateCcw } from 'lucide-react';

export default function StatusBadge({ status, type = 'callStatus', className = '' }) {
  if (status === null || status === undefined) {
    return <span className="text-agro-sand-400 text-xs">-</span>;
  }

  // DTMF Badges
  if (type === 'dtmf') {
    switch (status) {
      case 'acknowledged':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 ${className}`}>
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            Ack (Key 1)
          </span>
        );
      case 'replay_requested':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 ${className}`}>
            <RotateCcw className="w-3 h-3 text-amber-600" />
            Replay (Key 2)
          </span>
        );
      case 'opt_out':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 ${className}`}>
            <XCircle className="w-3 h-3 text-rose-600" />
            Opt Out
          </span>
        );
      case 'no_response':
      default:
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-agro-sand-100 text-agro-sand-700 border border-agro-sand-200 ${className}`}>
            No Response
          </span>
        );
    }
  }

  // Alert Status Badges
  if (type === 'alertStatus') {
    switch (status) {
      case 'pending_review':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse ${className}`}>
            <Clock className="w-3 h-3 text-amber-700" />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 ${className}`}>
            <CheckCircle className="w-3 h-3 text-emerald-700" />
            Approved
          </span>
        );
      case 'sending':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300 ${className}`}>
            <PhoneCall className="w-3 h-3 text-blue-700 animate-bounce" />
            Dispatching
          </span>
        );
      case 'sent':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-agro-leaf-100 text-agro-forest-900 border border-agro-leaf-300 ${className}`}>
            <CheckCircle className="w-3 h-3 text-agro-forest-700" />
            Sent
          </span>
        );
      case 'dismissed':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-agro-sand-200 text-agro-sand-700 ${className}`}>
            Dismissed
          </span>
        );
      default:
        return <span className={`px-2 py-0.5 rounded text-xs ${className}`}>{status}</span>;
    }
  }

  // Severity Badges
  if (type === 'severity') {
    switch (status) {
      case 'critical':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-agro-crimson-100 text-agro-crimson-800 border border-agro-crimson-300 uppercase tracking-wide ${className}`}>
            <AlertTriangle className="w-3 h-3 text-agro-crimson-600" />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 uppercase tracking-wide ${className}`}>
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            Warning
          </span>
        );
      case 'watch':
      default:
        return (
          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wide ${className}`}>
            Watch
          </span>
        );
    }
  }

  // Call Status Badges
  switch (status) {
    case 'answered':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          Answered
        </span>
      );
    case 'ringing':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 animate-pulse ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          Ringing
        </span>
      );
    case 'queued':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200 ${className}`}>
          <Clock className="w-3 h-3 text-sky-600" />
          Queued
        </span>
      );
    case 'no_answer':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-200 ${className}`}>
          No Answer
        </span>
      );
    case 'failed':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 ${className}`}>
          Failed
        </span>
      );
    case 'busy':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200 ${className}`}>
          Busy
        </span>
      );
    default:
      return <span className={`px-2 py-0.5 rounded text-xs bg-agro-sand-100 text-agro-sand-700 ${className}`}>{status}</span>;
  }
}
