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
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="flex items-start gap-4 p-4">
        <div className={`w-12 h-12 rounded-xl ${iconBg} shadow-sm flex items-center justify-center flex-shrink-0`}>
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-0.5 truncate">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          {trend !== undefined && (
            <p className={`text-xs font-semibold mt-1 ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
