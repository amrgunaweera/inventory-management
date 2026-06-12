import { Button } from "@/components/ui/button";
import {
  IconPackage, IconShoppingCart, IconAlertTriangle, IconCurrencyDollar,
  IconTrendingUp, IconArrowRight, IconTruck, IconBuildingWarehouse,
  IconClipboardCheck, IconSparkles,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/ui/KPICard';
import SalesTrendChart from '../components/charts/SalesTrendChart';
import TopProductsChart from '../components/charts/TopProductsChart';
import { Badge } from '../components/ui/Badge';
import { useInventory } from '../context/InventoryContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';


export default function Dashboard() {
  const { products, orders, suppliers, lowStockProducts, totalInventoryValue, totalRevenue } = useInventory();
  const { plan } = useSubscription();
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();
  const role = user?.role;

  const completedOrders = orders.filter(o => o.type === 'sale' && o.status === 'completed');
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const recentOrders = orders.slice(0, 5);

  // Role-specific dashboard configurations
  const showFullKPIs = hasPermission('dashboard.full');
  const showSalesData = hasPermission('orders.view_sales');
  const showPurchaseData = hasPermission('orders.view_purchase');
  const showStockOps = hasPermission('stock.in');

  return (
    <div className="space-y-6 animate-slide-up dashboard-view">
      {/* KPI Cards — adjusted per role */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Products"
          value={products.length}
          sub={`${products.filter(p => p.status === 'active').length} active`}
          icon={IconPackage}
          color="brand"
          trend={8}
        />

        {showSalesData && (
          <KPICard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            sub={`${completedOrders.length} completed orders`}
            icon={IconCurrencyDollar}
            color="emerald"
            trend={12}
          />
        )}

        {showFullKPIs && (
          <KPICard
            title="Inventory Value"
            value={`$${totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            sub="At cost price"
            icon={IconTrendingUp}
            color="violet"
          />
        )}

        {showStockOps && role !== 'super_admin' && (
          <KPICard
            title="Low Stock Items"
            value={lowStockProducts.length}
            sub="Below minimum threshold"
            icon={IconAlertTriangle}
            color={lowStockProducts.length > 0 ? 'rose' : 'emerald'}
          />
        )}

        {/* Store Sales Person: pending sales */}
        {role === 'store_sales_person' && (
          <KPICard
            title='Pending Sales'
            value={pendingOrders.filter(o => o.type === 'sale').length}
            sub="Awaiting processing"
            icon={IconClipboardCheck}
            color="amber"
          />
        )}

        {/* Store Owner: active suppliers */}
        {role === 'store_owner' && (
          <KPICard
            title="Active Suppliers"
            value={suppliers.length}
            sub="Total vendor relationships"
            icon={IconTruck}
            color="blue"
          />
        )}
      </div>

      {/* Charts — only for roles with full dashboard access */}
      {showFullKPIs && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <SalesTrendChart />
          <TopProductsChart />
        </div>
      )}

      {/* AI Insights placeholder — visible to all */}
      <div className="card bg-gradient-to-r from-violet-50 to-brand-50 border-violet-200/50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-brand-500 flex items-center justify-center">
            <IconSparkles size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">AI Insights</h3>
            <p className="text-xs text-slate-500">Powered by machine learning</p>
          </div>
          <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 uppercase tracking-widest">
            Coming Soon
          </span>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          AI-powered demand forecasting, automated reorder suggestions, dead stock identification,
          anomaly detection, and natural language search will be available in a future update.
        </p>
      </div>

      {/* Recent Orders + Low Stock */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Orders */}
        {(showSalesData || showPurchaseData) && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">Recent Orders</h3>
              <Button variant="ghost" onClick={() => navigate('/orders')}
                className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1 transition-colors" >
                View all <IconArrowRight size={13} />
              </Button>
            </div>
            <div className="space-y-3">
              {recentOrders
                .filter(order => {
                  if (role === 'store_sales_person') return order.type === 'sale';
                  return true;
                })
                .slice(0, 5)
                .map(order => (
                <div key={order.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <IconShoppingCart size={14} className="text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{order.id}</p>
                    <p className="text-xs text-slate-400">{order.customer} · {order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">${order.total.toFixed(2)}</p>
                    <Badge variant={order.status}>{order.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock — for roles with alerts access */}
        {hasPermission('alerts.view') && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800">Low Stock Alerts</h3>
              {plan.features.lowStockAlerts && (
                <Button variant="ghost" onClick={() => navigate('/alerts')}
                  className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1 transition-colors"
                >
                  View all <IconArrowRight size={13} />
                </Button>
              )}
            </div>
            {lowStockProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <IconPackage size={32} className="mb-2 opacity-40" />
                <p className="text-sm">All items are well-stocked 🎉</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.slice(0, 5).map(p => (
                  <div key={p.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                      <IconAlertTriangle size={14} className="text-amber-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-700 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400">SKU: {p.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-bold ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                        {p.stock} left
                      </p>
                      <p className="text-xs text-slate-400">Min: {p.minStock}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
