import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ROLES } from '../../lib/roles';

const PLAN_COLORS = {
  free: '#94a3b8',
  pro: '#10b981',
  business: '#8b5cf6',
};

const ROLE_COLORS = {
  super_admin: '#f43f5e',
  store_owner: '#6366f1',
  store_sales_person: '#10b981',
  unassigned: '#94a3b8'
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-sidebar text-white px-4 py-3 rounded-xl shadow-xl text-xs">
        <p className="font-semibold mb-1 capitalize">{payload[0].name} Plan</p>
        <p><span className="text-brand-300">{payload[0].value} stores</span></p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-sidebar text-white px-4 py-3 rounded-xl shadow-xl text-xs">
        <p className="font-semibold mb-1">{label}</p>
        <p><span className="text-brand-300">{payload[0].value} users</span></p>
      </div>
    );
  }
  return null;
};

export function StoresByPlanChart({ stores }) {
  // Aggregate data
  const counts = stores.reduce((acc, store) => {
    const plan = store.planId || 'free';
    acc[plan] = (acc[plan] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts).map(([name, value]) => ({ name, value }));

  return (
    <div className="card">
      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">Stores by Plan</h3>
        <p className="text-xs text-slate-400 mt-0.5">Subscription distribution</p>
      </div>
      <div className="flex items-center justify-center">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={PLAN_COLORS[entry.name] || PLAN_COLORS.free} />
              ))}
            </Pie>
            <Tooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-500 font-medium capitalize">
            <span className="w-2.5 h-2.5 rounded-full block" style={{ backgroundColor: PLAN_COLORS[entry.name] || PLAN_COLORS.free }} />
            {entry.name} ({entry.value})
          </div>
        ))}
      </div>
    </div>
  );
}

export function UserRolesChart({ users }) {
  const counts = users.reduce((acc, user) => {
    const role = user.role || 'unassigned';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const data = Object.entries(counts)
    .map(([id, value]) => ({
      id,
      name: ROLES[id]?.label || 'Unassigned',
      value
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-800">User Distribution</h3>
        <p className="text-xs text-slate-400 mt-0.5">By platform roles</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {data.map((entry, i) => <Cell key={i} fill={ROLE_COLORS[entry.id] || ROLE_COLORS.unassigned} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
