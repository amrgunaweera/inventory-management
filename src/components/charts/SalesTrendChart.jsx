import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { SEED_SALES_TREND } from '../../utils/seedData';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-sidebar text-white px-4 py-3 rounded-xl shadow-xl text-xs">
        <p className="font-semibold mb-1">{label}</p>
        <p>Revenue: <span className="text-brand-300">${payload[0]?.value?.toLocaleString()}</span></p>
        <p>Orders: <span className="text-violet-300">{payload[1]?.value}</span></p>
      </div>
    );
  }
  return null;
};

export default function SalesTrendChart() {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-800">Sales Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Revenue over the last 6 months</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-brand-400 inline-block" /> Revenue</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-1.5 rounded-full bg-violet-400 inline-block" /> Orders</span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={SEED_SALES_TREND} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2.5} fill="url(#revGrad)" dot={false} />
          <Area type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} fill="url(#ordGrad)" dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
