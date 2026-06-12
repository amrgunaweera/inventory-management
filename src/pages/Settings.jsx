import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { IconDeviceFloppy, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';


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
                <Input value={form.storeName} onChange={e => setForm(f => ({ ...f, storeName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Currency</label>
                  <Select value={form.currency} onValueChange={val => setForm(f => ({ ...f, currency: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                      <SelectItem value="GBP">GBP — British Pound</SelectItem>
                      <SelectItem value="EUR">EUR — Euro</SelectItem>
                      <SelectItem value="LKR">LKR — Sri Lankan Rupee</SelectItem>
                      <SelectItem value="AUD">AUD — Australian Dollar</SelectItem>
                      <SelectItem value="CAD">CAD — Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="label">Timezone</label>
                  <Select value={form.timezone} onValueChange={val => setForm(f => ({ ...f, timezone: val }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-8">UTC-8 Pacific</SelectItem>
                      <SelectItem value="UTC-5">UTC-5 Eastern</SelectItem>
                      <SelectItem value="UTC+0">UTC+0 London</SelectItem>
                      <SelectItem value="UTC+1">UTC+1 Central Europe</SelectItem>
                      <SelectItem value="UTC+5.5">UTC+5:30 Colombo</SelectItem>
                    </SelectContent>
                  </Select>
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
              <Input value={user?.name || ''} disabled className="bg-slate-50" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <Input type="email" className="bg-slate-50" value={form.email} disabled />
            </div>
            {user?.roleLabel && (
              <div>
                <label className="label">Your Role</label>
                <Input className="bg-slate-50" value={user.roleLabel} disabled />
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
            ].filter(item => {
              if (item.key === 'lowStockEmail' && user?.role === 'super_admin') return false;
              return true;
            }).map(item => (
              <div key={item.key} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.desc}</p>
                </div>
                <Button variant="ghost" type="button" onClick={() => setForm(f => ({ ...f, [item.key]: !f[item.key] }))}
                  className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 flex-shrink-0 ${form[item.key] ? 'bg-brand-500' : 'bg-slate-200'}`}
                  style={{ height: '22px', width: '40px' }}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200 ${form[item.key] ? 'translate-x-4.5' : ''}`}
                    style={{ width: '18px', height: '18px', transform: form[item.key] ? 'translateX(18px)' : 'translateX(0)' }}
                  />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <Button variant="default" type="submit" >
          {saved ? <><IconCheck size={16} /> Saved!</> : <><IconDeviceFloppy size={16} /> Save Settings</>}
        </Button>
      </form>
    </div>
  );
}
