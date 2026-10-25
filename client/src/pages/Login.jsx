import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { Sprout, Lock, Mail, Sparkles, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const isDemoMode = import.meta.env.VITE_DEMO_MODE !== 'false';

  const handleAutofillDemo = () => {
    setEmail('admin@agrovoice.org');
    setPassword('AgroAdmin@2026!');
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Invalid administrator email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-agro-sand-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-agro-sand-200 shadow-xl p-8 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-agro-forest-900 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
            <Sprout className="w-6 h-6 text-agro-leaf-400" />
          </div>
          <h1 className="text-2xl font-black text-agro-sand-900 tracking-tight">AgroVoice AI</h1>
          <p className="text-xs text-agro-sand-500">
            Critical Agricultural Alerts, Delivered by Voice.
          </p>
        </div>

        {/* Demo 1-Click Autofill Button */}
        {isDemoMode && (
          <div className="p-3.5 bg-gradient-to-r from-agro-forest-50 to-agro-leaf-50 border border-agro-leaf-200 rounded-2xl text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-agro-forest-900">
              <Sparkles className="w-3.5 h-3.5 text-agro-forest-700" />
              <span>Hackathon Pitch Quick-Access</span>
            </div>
            <button
              type="button"
              onClick={handleAutofillDemo}
              className="w-full py-2 bg-agro-forest-700 hover:bg-agro-forest-800 active:scale-98 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <span>Autofill Hackathon Demo Credentials</span>
            </button>
            <div className="text-[10px] text-agro-sand-500 font-mono">
              admin@agrovoice.org • AgroAdmin@2026!
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs text-agro-sand-700">
          <div>
            <label className="font-bold text-agro-sand-800 block mb-1">Admin Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-agro-sand-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@agrovoice.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-agro-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-agro-sand-800 block mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-agro-sand-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-agro-sand-300 text-sm focus:outline-none focus:ring-2 focus:ring-agro-forest-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-agro-forest-800 hover:bg-agro-forest-900 active:bg-agro-forest-950 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Operation Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-agro-sand-100">
          <Link to="/register" className="text-xs font-semibold text-agro-forest-700 hover:underline">
            Go to Farmer Public Registration Portal →
          </Link>
        </div>
      </div>
    </div>
  );
}
