import { Card, CardContent } from "./card"

export default function KPICard({ title, value, sub, icon: Icon, color = 'brand', trend }) {
  const colors = {
    brand: 'bg-brand-500 text-white shadow-brand-500/20',
    violet: 'bg-violet-500 text-white shadow-violet-500/20',
    emerald: 'bg-emerald-500 text-white shadow-emerald-500/20',
    amber: 'bg-amber-500 text-white shadow-amber-500/20',
    rose: 'bg-rose-500 text-white shadow-rose-500/20',
  };
  const iconBg = colors[color] || colors.brand;

  return (
    <Card className="group cursor-default shadow-framer-sm hover:shadow-framer hover:-translate-y-0.5">
      <CardContent className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg ${iconBg} shadow-sm flex items-center justify-center flex-shrink-0 transition-transform duration-300 ease-out group-hover:scale-110 group-hover:rotate-3`}>
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold mt-1 truncate text-slate-900">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-xs font-semibold mt-1.5 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
