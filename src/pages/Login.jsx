import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBuildingStore, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register extra fields
  const [name, setName] = useState('');
  const [store, setStore] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const resetForm = () => {
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setStore('');
    setConfirmPassword('');
  };

  const switchMode = (newMode) => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
    }

    setLoading(true);
    const result = mode === 'login'
      ? await login(email, password)
      : await register(email, password, name, store);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-sidebar flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-xl shadow-brand-500/30 mb-4">
            <IconBuildingStore size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">StockSense</h1>
          <p className="text-slate-400 text-sm mt-1">Inventory management for small businesses</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {/* Tab switcher */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Register-only fields */}
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 transition-all"
                    placeholder="Alex Morgan"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                    Store Name
                  </label>
                  <input
                    type="text"
                    value={store}
                    onChange={(e) => setStore(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 transition-all"
                    placeholder="The Niche Shop"
                    required
                  />
                </div>
              </>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 transition-all"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password (register only) */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
                  Confirm Password
                </label>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 shadow-lg shadow-brand-500/20 disabled:opacity-60 text-sm mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {mode === 'login' ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2024 StockSense · For small businesses & niche retailers
        </p>
      </div>
    </div>
  );
}
