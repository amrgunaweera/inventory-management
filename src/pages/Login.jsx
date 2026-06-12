import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconBuildingStore, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'register'

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register extra fields
  const [name, setName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingTarget, setLoadingTarget] = useState(null);

  const { user, login, register, registerDemo } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const resetForm = () => {
    setError('');
    setEmail('');
    setPassword('');
    setName('');
    setOrgName('');
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
    setLoadingTarget(mode);

    try {
      const result = mode === 'login'
        ? await login(email, password)
        : await register(email, password, name, orgName);

      if (result.success) {
        // user is now fully loaded in AuthContext — useEffect will navigate
        return;
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setLoadingTarget(null);
    }
  };

  const handleDemoLogin = async (roleKey) => {
    setError('');
    setLoading(true);
    setLoadingTarget(roleKey);

    const demoUsers = {
      super_admin: { email: 'demo.superadmin@smartventory.com', name: 'Demo Super Admin' },
      store_owner: { email: 'demo.owner@smartventory.com', name: 'Demo Store Owner' },
      store_sales_person: { email: 'demo.sales@smartventory.com', name: 'Demo Sales Person' },
    };

    const targetUser = demoUsers[roleKey];
    const demoPassword = 'demoPassword123';

    try {
      // 1. Try signing in (user already exists)
      const result = await login(targetUser.email, demoPassword);
      if (result.success) {
        // user is now fully loaded — useEffect will navigate
        return;
      }

      // 2. User doesn't exist yet — register them
      const regResult = await registerDemo(
        targetUser.email,
        demoPassword,
        targetUser.name,
        roleKey
      );
      if (regResult.success) {
        // user is now fully loaded — useEffect will navigate
        return;
      }

      setError(regResult.error || 'Failed to setup demo user.');
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setLoadingTarget(null);
    }
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
          <h1 className="text-2xl font-bold text-white">Smartventory</h1>
          <p className="text-slate-400 text-sm mt-1">Inventory management for teams</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          {/* Tab switcher */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchMode('login')}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all duration-200 ${mode === 'login'
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
                }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('register')}
              className={`flex-1 text-sm font-semibold py-2 rounded-lg transition-all duration-200 ${mode === 'register'
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
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Full Name
                  </Label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    placeholder="Alex Morgan"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                    Organization Name
                  </Label>
                  <Input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                    placeholder="Acme Corp"
                    required
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Have an invite? Just sign up with your invited email — you'll be added automatically.
                  </p>
                </div>
              </>
            )}

            {/* Email */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Email Address
              </Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                placeholder="you@example.com"
                required
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Password
              </Label>
              <div className="relative">
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-slate-500 pr-10"
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
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Confirm Password
                </Label>
                <Input
                  type={showPw ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                <p className="text-xs text-destructive-foreground">{error}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white py-6 mt-4 text-sm"
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
            </Button>
          </form>

          {/* Demo Roles Quick Sign-In */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-center mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-950 px-3 py-1 rounded-full border border-white/5">
                Quick Sign-In by Role
              </span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('super_admin')}
                className="flex items-center justify-between text-left p-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition text-sm font-semibold text-rose-300 disabled:opacity-50"
              >
                <span>Super Admin</span>
                {loadingTarget === 'super_admin' && <div className="w-4 h-4 border-2 border-rose-500/30 border-t-rose-500 rounded-full animate-spin" />}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('store_owner')}
                className="flex items-center justify-between text-left p-3 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 transition text-sm font-semibold text-brand-300 disabled:opacity-50"
              >
                <span>Store Owner</span>
                {loadingTarget === 'store_owner' && <div className="w-4 h-4 border-2 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" />}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleDemoLogin('store_sales_person')}
                className="flex items-center justify-between text-left p-3 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition text-sm font-semibold text-emerald-300 disabled:opacity-50"
              >
                <span>Store Sales Person</span>
                {loadingTarget === 'store_sales_person' && <div className="w-4 h-4 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          © 2026 Smartventory · For businesses & teams
        </p>
      </div>
    </div>
  );
}
