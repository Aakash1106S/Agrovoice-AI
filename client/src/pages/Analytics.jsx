import React, { useState, useEffect } from 'react';
import { analyticsApi } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { BarChart3, PieChart as PieIcon, TrendingUp, Sprout, MapPin } from 'lucide-react';

const PIE_COLORS = ['#15803d', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error } = useNotification();

  useEffect(() => {
    analyticsApi.getAnalytics()
      .then((res) => {
        setData(res.data.data);
      })
      .catch((err) => {
        error('Failed to load analytics data.');
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-xs text-agro-sand-500 font-medium">Computing real-time database aggregations...</div>
      </div>
    );
  }

  const { districtStats, languageSplit, callsOverTime, cropReach } = data;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-black text-agro-sand-900 tracking-tight">Agricultural Telephony Analytics</h2>
        <p className="text-sm text-agro-sand-600 mt-0.5">
          Real-time aggregations across districts, language preferences, keypad acknowledgments, and crop vulnerability.
        </p>
      </div>

      {/* Grid 1: District Acknowledgment Rate & Language Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* District Acknowledgment Rate (Bar Chart) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-agro-forest-700" />
            <div>
              <h3 className="text-base font-bold text-agro-sand-900">Acknowledgment Rate by District (%)</h3>
              <p className="text-xs text-agro-sand-500">Percentage of placed calls where farmer confirmed via Keypad '1'</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districtStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="district" stroke="#78716c" fontSize={11} />
                <YAxis stroke="#78716c" fontSize={11} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                  }}
                  formatter={(val) => [`${Math.round(val)}%`, 'Ack Rate']}
                />
                <Bar dataKey="rate" fill="#15803d" radius={[6, 6, 0, 0]} name="Acknowledgment %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Language Preference Split (Pie Chart) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-agro-earth-700" />
            <div>
              <h3 className="text-base font-bold text-agro-sand-900">Voice Language Distribution</h3>
              <p className="text-xs text-agro-sand-500">Registered farmer language preference</p>
            </div>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageSplit || []}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {(languageSplit || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 2: Calls Over Time & Crop Reach */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calls Over Time Area Chart */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-sky-700" />
            <div>
              <h3 className="text-base font-bold text-agro-sand-900">Calls Dispatched Over Time</h3>
              <p className="text-xs text-agro-sand-500">Daily outbound voice alerts over the last 14 days</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={callsOverTime || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis dataKey="_id" stroke="#78716c" fontSize={11} />
                <YAxis stroke="#78716c" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                  }}
                />
                <Area type="monotone" dataKey="totalCalls" stroke="#0284c7" strokeWidth={2} fill="url(#colorCalls)" name="Total Calls" />
                <Area type="monotone" dataKey="acknowledged" stroke="#15803d" strokeWidth={2} fill="none" name="Acknowledged" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop-wise Reach (Bar Chart) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-agro-sand-200 p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Sprout className="w-5 h-5 text-agro-leaf-700" />
            <div>
              <h3 className="text-base font-bold text-agro-sand-900">Crop-Wise Reach & Registry</h3>
              <p className="text-xs text-agro-sand-500">Farmers protected categorized by crop</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cropReach || []} layout="vertical" margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" />
                <XAxis type="number" stroke="#78716c" fontSize={11} />
                <YAxis dataKey="crop" type="category" stroke="#78716c" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e7e5e4',
                  }}
                />
                <Bar dataKey="registeredFarmers" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Protected Farmers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
