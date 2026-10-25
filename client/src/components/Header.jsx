import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { alertsApi, settingsApi } from '../services/api.js';
import { Bell, Radio, LogOut, ExternalLink, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const [telephonyMode, setTelephonyMode] = useState('test');
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Fetch initial settings to get telephony mode
    settingsApi.getSettings()
      .then((res) => {
        if (res.data?.data?.telephony?.mode) {
          setTelephonyMode(res.data.data.telephony.mode);
        }
      })
      .catch(() => {});

    // Check pending alerts
    const checkPending = () => {
      alertsApi.list({ status: 'pending_review', limit: 10 })
        .then((res) => {
          setPendingCount(res.data?.pagination?.total || 0);
        })
        .catch(() => {});
    };

    checkPending();
    const timer = setInterval(checkPending, 8000); // 8s polling for background updates
    return () => clearInterval(timer);
  }, []);

  const isLive = telephonyMode === 'real';

  return (
    <header className="h-16 bg-white border-b border-agro-sand-200 px-6 flex items-center justify-between sticky top-0 z-40 shadow-xs">
      {/* Left: Mode Indicator & Tagline */}
      <div className="flex items-center gap-4">
        {/* Persistent Telephony Mode Indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold tracking-wide transition-all border ${
            isLive
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-purple-50 text-purple-900 border-purple-200'
          }`}
          title={isLive ? 'Real Exotel Voice API Carrier Connected' : 'Simulated Telephony Provider - No actual phone calls billed'}
        >
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isLive ? 'bg-emerald-400' : 'bg-purple-400'
              }`}
            ></span>
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                isLive ? 'bg-emerald-600' : 'bg-purple-600'
              }`}
            ></span>
          </span>
          <span className="uppercase font-mono">
            {isLive ? 'LIVE CARRIER (EXOTEL)' : 'TEST MODE (SIMULATED)'}
          </span>
        </div>

        <span className="hidden md:inline-block text-xs text-agro-sand-400">|</span>
        <span className="hidden md:inline-block text-xs font-medium text-agro-sand-500">
          Tamil Nadu Agricultural Advisory Voice Relay
        </span>
      </div>

      {/* Right: Actions & Admin Profile */}
      <div className="flex items-center gap-3">
        {/* Public Registration Link */}
        <Link
          to="/register"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-agro-forest-800 bg-agro-forest-50 hover:bg-agro-forest-100 border border-agro-forest-200 rounded-lg transition-colors"
        >
          <span>Farmer Self-Registration</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>

        {/* Pending Alerts Notification Pill */}
        <Link
          to="/alerts"
          className={`relative p-2 rounded-lg text-agro-sand-600 hover:bg-agro-sand-100 transition-colors ${
            pendingCount > 0 ? 'text-amber-700' : ''
          }`}
          title={pendingCount > 0 ? `${pendingCount} alerts require human review` : 'No pending alerts'}
        >
          <Bell className="w-5 h-5" />
          {pendingCount > 0 && (
            <span className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-agro-crimson-600 text-white text-[10px] font-black shadow-xs animate-pulse">
              {pendingCount}
            </span>
          )}
        </Link>

        {/* User Profile & Logout */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-agro-sand-200">
          <div className="w-8 h-8 rounded-full bg-agro-forest-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'AG'}
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-bold text-agro-sand-900 leading-tight">{user?.name || 'Administrator'}</div>
            <div className="text-[10px] text-agro-sand-500 font-mono capitalize">{user?.role?.replace('_', ' ') || 'Super Admin'}</div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-agro-sand-400 hover:text-agro-crimson-700 hover:bg-agro-crimson-50 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
