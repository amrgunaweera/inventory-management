import { useState } from 'react';
import { IconDeviceFloppy, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, hasPermission } = useAuth();
  const isAdmin = hasPermission('settings.system');
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    storeName: user?.orgName || 'My Organization',
    email: user?.email || '',
    currency: 'USD',
    timezone: 'UTC-5',
    lowStockEmail: true,
    weeklyDigest: false,
    orderConfirmation: true,
  });

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-5 animate-slide-up max-w-2xl">
      <form onSubmit={handleSave} className="space-y-5">
        {/* Organization Info — admin only */}
        {isAdmin && (
          <div className="card">
            <h3 className="text-base font-bold text-slate-800 mb-4">Organization Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="label">Organization Name</label>
                <input className="input" value={form.storeName} onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Currency</label>
                  <select className="input" value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                    <option value="USD">USD — US Dollar</option>
                    <option value="GBP">GBP — British Pound</option>
                    <option value="EUR">EUR — Euro</option>
                    <option value="LKR">LKR — Sri Lankan Rupee</option>
                    <option value="AUD">AUD — Australian Dollar</option>
                    <option value="CAD">CAD — Canadian Dollar</option>
                  </select>
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <select className="input" value={form.timezone} onChange={e => setForm(f => ({ ...f, timezone: e.target.value }))}>
                    <option value="UTC-8">UTC-8 Pacific</option>
                    <option value="UTC-5">UTC-5 Eastern</option>
                    <option value="UTC+0">UTC+0 London</option>
                    <option value="UTC+1">UTC+1 Central Europe</option>
                    <option value="UTC+5.5">UTC+5:30 Colombo</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Personal Info — all roles */}
        <div className="card">
          <h3 className="text-base font-bold text-slate-800 mb-4">Personal Information</h3>
          <div className="space-y-4">
            <div>
              <label className="label">Your Name</label>
              <input className="input" value={user?.name || ''} disabled className="input bg-slate-50" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <input type="email" className="input bg-slate-50" value={form.email} disabled />
            </div>
            {user?.roleLabel && (
              <div>
                <label className="label">Your Role</label>
                <input className="input bg-slate-50" value={user.roleLabel} disabled />
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <h3 className="text-base font-bold text-slate-800 mb-4">Notifications</h3>
          <div className="space-y-3">
            {[
              { key: 'lowStockEmail', label: 'Low stock email alerts', desc: 'Get notified when items fall below minimum' },
              { key: 'weeklyDigest', label: 'Weekly sales digest', desc: 'Summary of your week\'s performance' },
              { key: 'orderConfirmation', label: 'Order confirmations', desc: 'Email on every new order' },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, [item.key]: !f[item.key] }))}
                  className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 flex-shrink-0 ${form[item.key] ? 'bg-brand-500' : 'bg-slate-200'}`}
                  style={{ height: '22px', width: '40px' }}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${form[item.key] ? 'translate-x-4.5' : ''}`}
                    style={{ width: '18px', height: '18px', transform: form[item.key] ? 'translateX(18px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        <button type="submit" className="btn-primary">
          {saved ? <><IconCheck size={16} /> Saved!</> : <><IconDeviceFloppy size={16} /> Save Settings</>}
        </button>
      </form>
    </div>
  );
}
