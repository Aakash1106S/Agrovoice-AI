import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'forest', trend = null, className = '' }) {
  const colorMap = {
    forest: 'bg-agro-forest-50 text-agro-forest-700 border-agro-forest-200',
    leaf: 'bg-agro-leaf-50 text-agro-leaf-700 border-agro-leaf-200',
    earth: 'bg-agro-earth-50 text-agro-earth-700 border-agro-earth-200',
    crimson: 'bg-agro-crimson-50 text-agro-crimson-700 border-agro-crimson-200',
    sand: 'bg-agro-sand-100 text-agro-sand-700 border-agro-sand-200',
  };

  const iconBgMap = {
    forest: 'bg-agro-forest-600 text-white',
    leaf: 'bg-agro-leaf-600 text-white',
    earth: 'bg-agro-earth-600 text-white',
    crimson: 'bg-agro-crimson-600 text-white',
    sand: 'bg-agro-sand-600 text-white',
  };

  return (
    <div className={`bg-white rounded-xl border border-agro-sand-200 p-5 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-agro-sand-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold text-agro-sand-900 mt-1 tracking-tight">{value}</h3>
          {subtitle && <p className="text-xs text-agro-sand-500 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${iconBgMap[color] || iconBgMap.forest} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 pt-3 border-t border-agro-sand-100 flex items-center gap-1.5 text-xs text-agro-sand-600">
          {trend}
        </div>
      )}
    </div>
  );
}
