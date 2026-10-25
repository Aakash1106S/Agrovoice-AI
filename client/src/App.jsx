import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

// Layout
import DashboardLayout from './layouts/DashboardLayout.jsx';

// Pages
import Dashboard from './pages/Dashboard.jsx';
import Weather from './pages/Weather.jsx';
import Alerts from './pages/Alerts.jsx';
import Farmers from './pages/Farmers.jsx';
import VoiceCalls from './pages/VoiceCalls.jsx';
import History from './pages/History.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';
import PublicReg from './pages/PublicReg.jsx';
import Login from './pages/Login.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-agro-sand-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-agro-forest-700 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Farmer Portal */}
            <Route path="/register" element={<PublicReg />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Admin Console Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="weather" element={<Weather />} />
              <Route path="alerts" element={<Alerts />} />
              <Route path="farmers" element={<Farmers />} />
              <Route path="voice-calls" element={<VoiceCalls />} />
              <Route path="history" element={<History />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
