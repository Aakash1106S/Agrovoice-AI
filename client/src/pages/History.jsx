import React, { useState, useEffect } from 'react';
import { callsApi } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import {
  History as HistoryIcon,
  Download,
  Filter,
  Search,
  Clock,
  Phone,
  RefreshCw,
} from 'lucide-react';

export default function History() {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dtmfFilter, setDtmfFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [simulatedFilter, setSimulatedFilter] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 });

  const { error } = useNotification();

  const fetchHistory = (page = 1) => {
    setLoading(true);
    callsApi.listHistory({
      page,
      limit: 20,
      status: statusFilter || undefined,
      dtmfResult: dtmfFilter || undefined,
      district: districtFilter || undefined,
      simulated: simulatedFilter !== '' ? simulatedFilter : undefined,
    })
      .then((res) => {
        setCalls(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 1 });
      })
      .catch((err) => {
        error('Failed to load call history.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHistory(1);
  }, [statusFilter, dtmfFilter, districtFilter, simulatedFilter]);

  const handleExportCsv = () => {
    window.open('/api/calls/export-csv', '_blank');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-agro-sand-900 tracking-tight">Outbound Voice Call History</h2>
          <p className="text-sm text-agro-sand-600 mt-0.5">
            Full audit logs of automated weather alerts, telephony lifecycles, and DTMF farmer acknowledgments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchHistory(pagination.page)}
            className="p-2.5 rounded-xl border border-agro-sand-200 bg-white text-agro-sand-600 hover:text-agro-sand-900 shadow-xs"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-2 px-4 py-2.5 bg-agro-sand-800 hover:bg-agro-sand-900 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-agro-sand-200 p-4 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-agro-sand-200 bg-white font-medium text-agro-sand-700 focus:outline-none"
          >
            <option value="">All Call Statuses</option>
            <option value="answered">Answered</option>
            <option value="ringing">Ringing</option>
            <option value="queued">Queued</option>
            <option value="no_answer">No Answer</option>
            <option value="failed">Failed</option>
          </select>

          <select
            value={dtmfFilter}
            onChange={(e) => setDtmfFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-agro-sand-200 bg-white font-medium text-agro-sand-700 focus:outline-none"
          >
            <option value="">All DTMF Results</option>
            <option value="acknowledged">Acknowledged (Key 1)</option>
            <option value="replay_requested">Replay Requested (Key 2)</option>
            <option value="no_response">No Response</option>
            <option value="opt_out">Opt Out (Key 9)</option>
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-agro-sand-200 bg-white font-medium text-agro-sand-700 focus:outline-none"
          >
            <option value="">All Districts</option>
            <option value="Thanjavur">Thanjavur</option>
            <option value="Madurai">Madurai</option>
            <option value="Tiruchirappalli">Tiruchirappalli</option>
            <option value="Coimbatore">Coimbatore</option>
            <option value="Nagapattinam">Nagapattinam</option>
          </select>

          <select
            value={simulatedFilter}
            onChange={(e) => setSimulatedFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-agro-sand-200 bg-white font-medium text-agro-sand-700 focus:outline-none"
          >
            <option value="">All Telephony Providers</option>
            <option value="true">Simulated Calls</option>
            <option value="false">Live Exotel Carrier Calls</option>
          </select>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-agro-sand-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-agro-sand-50/80 border-b border-agro-sand-200 text-agro-sand-600 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Recipient Farmer</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Language</th>
                <th className="py-3 px-4">Call Lifecycle</th>
                <th className="py-3 px-4">Keypad DTMF</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Provider</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-agro-sand-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-agro-sand-500 text-xs">
                    Loading call logs...
                  </td>
                </tr>
              ) : calls.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-agro-sand-500 text-xs">
                    No voice calls found matching the selected filters.
                  </td>
                </tr>
              ) : (
                calls.map((call) => (
                  <tr key={call._id} className="hover:bg-agro-sand-50/50 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-mono text-agro-sand-700">
                      <div>{new Date(call.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                      <div className="text-[11px] text-agro-sand-400">
                        {new Date(call.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-agro-sand-900">{call.farmer?.name || 'Farmer'}</div>
                      <div className="text-xs font-mono text-agro-sand-500">{call.farmer?.phone || 'Masked Mobile'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-agro-sand-700">
                      {call.farmer?.district || call.alert?.district || 'Tamil Nadu'}
                    </td>

                    <td className="py-3.5 px-4 text-xs font-semibold">
                      {call.language === 'ta' ? 'தமிழ் (TA)' : 'English (EN)'}
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={call.status} type="callStatus" />
                    </td>

                    <td className="py-3.5 px-4">
                      <StatusBadge status={call.dtmfResult} type="dtmf" />
                    </td>

                    <td className="py-3.5 px-4 text-xs font-mono text-agro-sand-600">
                      {call.durationSec ? `${call.durationSec}s` : '-'}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {call.simulated ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          SIMULATED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          EXOTEL LIVE
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-agro-sand-100 flex items-center justify-between text-xs text-agro-sand-500">
            <span>
              Showing {calls.length} of {pagination.total} call records
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchHistory(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg border border-agro-sand-200 bg-white disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 font-bold text-agro-sand-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchHistory(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg border border-agro-sand-200 bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
