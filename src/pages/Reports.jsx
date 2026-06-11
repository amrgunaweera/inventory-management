import { LockedOverlay } from '../components/ui/PlanGate';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import { useSubscription } from '../context/SubscriptionContext';
import { useInventory } from '../context/InventoryContext';
import { IconTrendingUp, IconShoppingCart, IconCurrencyDollar, IconPackage } from '@tabler/icons-react';

export default function Reports() {
  const { hasFeature } = useSubscription();
  const { products, orders, totalRevenue } = useInventory();

  if (!hasFeature('reports')) return <LockedOverlay feature="reports" />;

  const completedSales = orders.filter(o => o.type === 'sale' && o.status === 'completed');
  const avgOrderValue = completedSales.length > 0 ? totalRevenue / completedSales.length : 0;
  const topProduct = [...products].sort((a, b) => b.stock - a.stock)[0];

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Summary stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
              <IconCurrencyDollar size={16} className="text-brand-500" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">${totalRevenue.toFixed(2)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
              <IconShoppingCart size={16} className="text-emerald-500" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Completed Sales</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{completedSales.length}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <IconTrendingUp size={16} className="text-violet-500" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Avg Order Value</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">${avgOrderValue.toFixed(2)}</p>
        </div>
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <IconPackage size={16} className="text-amber-500" />
            </div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Active Products</span>
          </div>
          <p className="text-2xl font-bold text-slate-800">{products.filter(p => p.status === 'active').length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <SalesTrendChart />
        <TopProductsChart />
      </div>

      {/* Category breakdown */}
      <div className="card">
        <h3 className="text-base font-bold text-slate-800 mb-4">Products by Category</h3>
        <div className="space-y-3">
          {Object.entries(
            products.reduce((acc, p) => { acc[p.category] = (acc[p.category] || 0) + 1; return acc; }, {})
          ).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <div key={cat} className="flex items-center gap-3">
              <span className="text-sm text-slate-600 w-36 truncate">{cat}</span>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-brand-400 to-violet-400 rounded-full transition-all"
                  style={{ width: `${(count / products.length) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500 w-8 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
