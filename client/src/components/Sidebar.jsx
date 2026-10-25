import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CloudRain,
  AlertTriangle,
  Users,
  PhoneCall,
  History,
  BarChart3,
  Settings,
  Sprout,
  UserPlus,
} from 'lucide-react';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/weather', label: 'Weather Monitoring', icon: CloudRain },
  { to: '/alerts', label: 'Emergency Alerts', icon: AlertTriangle },
  { to: '/farmers', label: 'Farmer Registry', icon: Users },
  { to: '/voice-calls', label: 'Voice Calls & Test', icon: PhoneCall },
  { to: '/history', label: 'Call History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-agro-sand-200 flex flex-col shrink-0 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-agro-sand-200 bg-agro-forest-900 text-white">
        <div className="p-2 bg-agro-leaf-500 rounded-lg text-agro-forest-950 shadow-sm">
          <Sprout className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-tight leading-tight flex items-center gap-1">
            AgroVoice <span className="text-agro-leaf-400 text-xs px-1.5 py-0.2 bg-agro-forest-800 rounded font-mono">AI</span>
          </h1>
          <p className="text-[10px] text-agro-leaf-200 tracking-wide font-medium">Tamil Nadu Voice Shield</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-agro-sand-400 uppercase tracking-wider px-3 mb-2">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-agro-forest-50 text-agro-forest-800 font-semibold border-l-4 border-agro-forest-700 shadow-xs'
                    : 'text-agro-sand-600 hover:text-agro-sand-900 hover:bg-agro-sand-100/70'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        <div className="pt-6">
          <div className="text-[11px] font-semibold text-agro-sand-400 uppercase tracking-wider px-3 mb-2">
            Public Access
          </div>
          <NavLink
            to="/register"
            target="_blank"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-agro-sand-600 hover:text-agro-forest-800 hover:bg-agro-forest-50 transition-colors"
          >
            <UserPlus className="w-4 h-4 text-agro-leaf-600" />
            <span>Public Registration Portal</span>
          </NavLink>
        </div>
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-agro-sand-200 bg-agro-sand-50/70 text-[11px] text-agro-sand-500 space-y-1">
        <div className="flex items-center justify-between font-mono">
          <span>Core Relay:</span>
          <span className="font-semibold text-agro-sand-700">Port 5001</span>
        </div>
        <div className="text-[10px] text-agro-sand-400">
          Open-Meteo CC BY 4.0 • Exotel Voice
        </div>
      </div>
    </aside>
  );
}
