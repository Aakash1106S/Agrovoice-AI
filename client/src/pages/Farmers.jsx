import React, { useState, useEffect } from 'react';
import { farmersApi } from '../services/api.js';
import { useNotification } from '../context/NotificationContext.jsx';
import {
  Users,
  Search,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  Phone,
  Shield,
  ShieldAlert,
  Edit2,
  Trash2,
  MapPin,
  X,
} from 'lucide-react';

const DISTRICT_OPTIONS = ['Thanjavur', 'Madurai', 'Tiruchirappalli', 'Coimbatore', 'Nagapattinam'];
const CROP_OPTIONS = ['Paddy', 'Sugarcane', 'Banana', 'Cotton'];

export default function Farmers() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, pages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [optedOutFilter, setOptedOutFilter] = useState('');

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: '',
    district: 'Thanjavur',
    crops: ['Paddy'],
    language: 'ta',
    consent: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const { success, error } = useNotification();

  const fetchFarmers = (page = 1) => {
    setLoading(true);
    farmersApi.list({
      page,
      limit: 15,
      search: search || undefined,
      district: districtFilter || undefined,
      crop: cropFilter || undefined,
      language: languageFilter || undefined,
      optedOut: optedOutFilter !== '' ? optedOutFilter : undefined,
    })
      .then((res) => {
        setFarmers(res.data.data || []);
        setPagination(res.data.pagination || { page: 1, limit: 15, total: 0, pages: 1 });
      })
      .catch((err) => {
        error('Failed to load farmers.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchFarmers(1);
  }, [districtFilter, cropFilter, languageFilter, optedOutFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFarmers(1);
  };

  const handleToggleOptOut = async (id) => {
    try {
      const res = await farmersApi.toggleOptOut(id);
      success(res.data.message);
      fetchFarmers(pagination.page);
    } catch (err) {
      error('Failed to toggle opt-out.');
    }
  };

  const handleDeleteFarmer = async (id) => {
    if (!window.confirm('Are you sure you want to remove this farmer from the registry?')) return;
    try {
      await farmersApi.delete(id);
      success('Farmer removed from registry.');
      fetchFarmers(pagination.page);
    } catch (err) {
      error('Failed to delete farmer.');
    }
  };

  const handleOpenAddModal = () => {
    setEditingFarmer(null);
    setFormData({
      name: '',
      phone: '',
      village: '',
      district: 'Thanjavur',
      crops: ['Paddy'],
      language: 'ta',
      consent: true,
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (farmer) => {
    setEditingFarmer(farmer);
    setFormData({
      name: farmer.name,
      phone: farmer.phone, // will show masked unless modified
      village: farmer.village,
      district: farmer.district,
      crops: farmer.crops || ['Paddy'],
      language: farmer.language || 'ta',
      consent: farmer.consent,
    });
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!formData.consent) {
      error('Explicit voice consent is required to register a farmer.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingFarmer) {
        await farmersApi.update(editingFarmer._id, formData);
        success('Farmer profile updated.');
      } else {
        await farmersApi.create(formData);
        success('Farmer successfully registered with recorded consent.');
      }
      setModalOpen(false);
      fetchFarmers(pagination.page);
    } catch (err) {
      error(err.response?.data?.error || 'Failed to save farmer.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleCropSelection = (crop) => {
    setFormData((prev) => {
      const exists = prev.crops.includes(crop);
      const updated = exists ? prev.crops.filter((c) => c !== crop) : [...prev.crops, crop];
      return { ...prev, crops: updated.length > 0 ? updated : [crop] };
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-agro-sand-900 tracking-tight">Farmer Registry & Consent Vault</h2>
          <p className="text-sm text-agro-sand-600 mt-0.5">
            Audit-compliant repository with strict voice consent tracking and automatic phone masking (+91 98*** **456).
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-agro-forest-700 hover:bg-agro-forest-800 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Farmer</span>
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white rounded-2xl border border-agro-sand-200 p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-agro-sand-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by farmer name, village, or district..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-agro-sand-200 text-sm focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-agro-sand-800 hover:bg-agro-sand-900 text-white text-xs font-semibold rounded-xl"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-agro-sand-100">
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-agro-sand-200 bg-white font-medium text-agro-sand-700 focus:outline-none"
          >
            <option value="">All Districts</option>
            {DISTRICT_OPTIONS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          <select
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-agro-sand-200 bg-white font-medium text-agro-sand-700 focus:outline-none"
          >
            <option value="">All Crops</option>
            {CROP_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-agro-sand-200 bg-white font-medium text-agro-sand-700 focus:outline-none"
          >
            <option value="">All Preferred Languages</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="en">English</option>
          </select>

          <select
            value={optedOutFilter}
            onChange={(e) => setOptedOutFilter(e.target.value)}
            className="text-xs p-2 rounded-lg border border-agro-sand-200 bg-white font-medium text-agro-sand-700 focus:outline-none"
          >
            <option value="">All Consent Statuses</option>
            <option value="false">Active (Not Opted Out)</option>
            <option value="true">Opted Out (Excluded)</option>
          </select>
        </div>
      </div>

      {/* Farmers Table */}
      <div className="bg-white rounded-2xl border border-agro-sand-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-agro-sand-50/80 border-b border-agro-sand-200 text-agro-sand-600 text-xs uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Farmer Name</th>
                <th className="py-3 px-4">Masked Mobile</th>
                <th className="py-3 px-4">Village & District</th>
                <th className="py-3 px-4">Target Crops</th>
                <th className="py-3 px-4">Voice Language</th>
                <th className="py-3 px-4">Consent Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-agro-sand-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-agro-sand-500 text-xs">
                    Loading farmers registry...
                  </td>
                </tr>
              ) : farmers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-agro-sand-500 text-xs">
                    No registered farmers match the specified filters.
                  </td>
                </tr>
              ) : (
                farmers.map((farmer) => (
                  <tr key={farmer._id} className="hover:bg-agro-sand-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-agro-sand-900">
                      {farmer.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-agro-sand-600">
                      {farmer.phone}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-agro-sand-700">
                      <div>{farmer.village}</div>
                      <div className="text-[11px] text-agro-sand-400 font-semibold">{farmer.district}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {farmer.crops?.map((c) => (
                          <span key={c} className="px-2 py-0.5 rounded text-[10px] font-semibold bg-agro-leaf-50 text-agro-forest-800 border border-agro-leaf-200">
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold">
                      {farmer.language === 'ta' ? 'தமிழ் (TA)' : 'English (EN)'}
                    </td>
                    <td className="py-3.5 px-4">
                      {farmer.optedOut ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Opted Out
                        </span>
                      ) : farmer.consent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Consented
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          No Consent
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleOptOut(farmer._id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                            farmer.optedOut
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                          }`}
                          title={farmer.optedOut ? 'Remove opt-out' : 'Opt out from all voice calls'}
                        >
                          {farmer.optedOut ? 'Re-enable' : 'Opt Out'}
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(farmer)}
                          className="p-1.5 rounded-lg text-agro-sand-400 hover:text-agro-sand-800 hover:bg-agro-sand-100"
                          title="Edit farmer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteFarmer(farmer._id)}
                          className="p-1.5 rounded-lg text-agro-sand-400 hover:text-rose-700 hover:bg-rose-50"
                          title="Delete farmer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
              Showing {farmers.length} of {pagination.total} registered farmers
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchFarmers(pagination.page - 1)}
                className="px-3 py-1.5 rounded-lg border border-agro-sand-200 bg-white disabled:opacity-40"
              >
                Previous
              </button>
              <span className="px-3 py-1.5 font-bold text-agro-sand-700">
                Page {pagination.page} of {pagination.pages}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => fetchFarmers(pagination.page + 1)}
                className="px-3 py-1.5 rounded-lg border border-agro-sand-200 bg-white disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Registration / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-agro-sand-200">
            <div className="flex items-center justify-between pb-3 border-b border-agro-sand-100">
              <h3 className="text-base font-bold text-agro-sand-900">
                {editingFarmer ? 'Edit Farmer Profile' : 'Register Farmer & Record Consent'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-agro-sand-400 hover:text-agro-sand-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="py-4 space-y-3.5 text-xs text-agro-sand-700">
              <div>
                <label className="font-semibold block mb-1">Farmer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Murugan S."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-agro-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Indian Mobile Number * (E.164: +91 or 10 digits)</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 9842100001"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-agro-sand-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold block mb-1">Village *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Thiruvaiyaru"
                    value={formData.village}
                    onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-agro-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
                  />
                </div>

                <div>
                  <label className="font-semibold block mb-1">District *</label>
                  <select
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className="w-full p-2.5 rounded-xl border border-agro-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-agro-forest-600 bg-white"
                  >
                    {DISTRICT_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1.5">Cultivated Crops * (Multi-select)</label>
                <div className="flex flex-wrap gap-2">
                  {CROP_OPTIONS.map((crop) => {
                    const selected = formData.crops.includes(crop);
                    return (
                      <button
                        type="button"
                        key={crop}
                        onClick={() => toggleCropSelection(crop)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                          selected
                            ? 'bg-agro-forest-700 text-white border-agro-forest-800'
                            : 'bg-agro-sand-100 text-agro-sand-700 border-agro-sand-200 hover:bg-agro-sand-200'
                        }`}
                      >
                        {crop}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Preferred Voice Advisory Language</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, language: 'ta' })}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.language === 'ta'
                        ? 'bg-agro-forest-50 text-agro-forest-900 border-agro-forest-600 ring-1 ring-agro-forest-600'
                        : 'bg-white text-agro-sand-700 border-agro-sand-200'
                    }`}
                  >
                    தமிழ் (Tamil Voice)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, language: 'en' })}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.language === 'en'
                        ? 'bg-agro-forest-50 text-agro-forest-900 border-agro-forest-600 ring-1 ring-agro-forest-600'
                        : 'bg-white text-agro-sand-700 border-agro-sand-200'
                    }`}
                  >
                    English (Indian Accent)
                  </button>
                </div>
              </div>

              {/* Consent Checkbox */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
                    className="mt-0.5 rounded text-agro-forest-700 focus:ring-agro-forest-600 w-4 h-4"
                  />
                  <span className="text-xs font-semibold text-emerald-950">
                    Farmer has provided explicit oral or written consent to receive urgent meteorological automated voice alerts.
                  </span>
                </label>
              </div>

              <div className="pt-3 border-t border-agro-sand-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-agro-sand-600 hover:bg-agro-sand-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold bg-agro-forest-700 hover:bg-agro-forest-800 text-white rounded-lg shadow-xs"
                >
                  {submitting ? 'Saving...' : editingFarmer ? 'Update Profile' : 'Save & Record Consent'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
