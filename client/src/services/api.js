import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agrovoice_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      localStorage.removeItem('agrovoice_token');
      localStorage.removeItem('agrovoice_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  registerAdmin: (data) => api.post('/auth/register-admin', data),
};

export const farmersApi = {
  list: (params) => api.get('/farmers', { params }),
  get: (id) => api.get(`/farmers/${id}`),
  create: (data) => api.post('/farmers', data),
  update: (id, data) => api.put(`/farmers/${id}`, data),
  toggleOptOut: (id) => api.patch(`/farmers/${id}/opt-out`),
  delete: (id) => api.delete(`/farmers/${id}`),
};

export const weatherApi = {
  getOverview: () => api.get('/weather/overview'),
  getDistrict: (districtId) => api.get(`/weather/district/${districtId}`),
  checkNow: () => api.post('/weather/check'),
};

export const alertsApi = {
  list: (params) => api.get('/alerts', { params }),
  get: (id) => api.get(`/alerts/${id}`),
  previewRecipients: (id) => api.get(`/alerts/${id}/preview-recipients`),
  updateScripts: (id, data) => api.put(`/alerts/${id}/scripts`, data),
  approve: (id, data) => api.post(`/alerts/${id}/approve`, data),
  dismiss: (id) => api.post(`/alerts/${id}/dismiss`),
  send: (id) => api.post(`/alerts/${id}/send`),
};

export const callsApi = {
  placeCall: (data) => api.post('/calls', data),
  listHistory: (params) => api.get('/calls/history', { params }),
  getDetails: (id) => api.get(`/calls/${id}`),
  simulateDtmf: (id, digit) => api.post(`/calls/${id}/simulate-dtmf`, { digit }),
  exportCsvUrl: '/api/calls/export-csv',
};

export const dashboardApi = {
  getStats: () => api.get('/dashboard/stats'),
};

export const analyticsApi = {
  getAnalytics: () => api.get('/analytics'),
};

export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateRules: (rules) => api.put('/settings/rules', { rules }),
  updateGeneral: (data) => api.put('/settings/general', data),
};

export const publicApi = {
  register: (data) => api.post('/public/register', data),
};

export default api;
