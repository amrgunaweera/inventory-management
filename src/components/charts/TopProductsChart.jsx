import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useInventory } from '../../context/InventoryContext';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-sidebar text-white px-4 py-3 rounded-xl shadow-xl text-xs">
        <p className="font-semibold mb-1">{label}</p>
        <p>Stock: <span className="text-brand-300">{payload[0]?.value} units</span></p>
      </div>
    );
  }
  return null;
};

export default function TopProductsChart() {
  const { products } = useInventory();
  const top = [...products]
    .sort((a, b) => b.stock - a.stock)
    .slice(0, 5)
    .map(p => ({ name: p.name.length > 16 ? p.name.slice(0, 14) + '…' : p.name, stock: p.stock }));

  return (
    <div className="card">
      <div className="mb-6">
        <h3 className="text-base font-bold text-slate-800">Top Products by Stock</h3>
        <p className="text-xs text-slate-400 mt-0.5">Highest inventory levels</p>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={top} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="stock" radius={[0, 6, 6, 0]} maxBarSize={28}>
            {top.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
