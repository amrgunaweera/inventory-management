import { NavLink, useNavigate } from 'react-router-dom';
import {
  IconLayoutDashboard, IconPackage, IconTag, IconShoppingCart,
  IconChartBar, IconBell, IconFileExport, IconSettings,
  IconCreditCard, IconLock, IconChevronRight, IconBuildingStore,
} from '@tabler/icons-react';
import { useSubscription } from '../../context/SubscriptionContext';
import { useInventory } from '../../context/InventoryContext';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: IconLayoutDashboard, to: '/dashboard', feature: null },
  { label: 'Products', icon: IconPackage, to: '/products', feature: null },
  { label: 'Categories', icon: IconTag, to: '/categories', feature: null },
  { label: 'Orders', icon: IconShoppingCart, to: '/orders', feature: null },
  { divider: true },
  { label: 'Reports', icon: IconChartBar, to: '/reports', feature: 'reports' },
  { label: 'Low Stock Alerts', icon: IconBell, to: '/alerts', feature: 'lowStockAlerts', badge: true },
  { label: 'CSV Export', icon: IconFileExport, to: '/export', feature: 'csvExport' },
  { divider: true },
  { label: 'Settings', icon: IconSettings, to: '/settings', feature: null },
  { label: 'Billing', icon: IconCreditCard, to: '/billing', feature: null },
];

const PLAN_COLORS = {
  free: 'bg-slate-500/20 text-slate-300',
  pro: 'bg-brand-500/20 text-brand-300',
  business: 'bg-violet-500/20 text-violet-300',
};

export default function Sidebar() {
  const { hasFeature, plan } = useSubscription();
  const { lowStockProducts } = useInventory();
  const navigate = useNavigate();

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-sidebar flex flex-col z-30 select-none">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
          <IconBuildingStore size={18} className="text-white" />
        </div>
        <div>
          <span className="text-white font-bold text-base tracking-tight">StockSense</span>
          <span className="block text-slate-500 text-xs leading-none">Inventory Pro</span>
        </div>
      </div>

      {/* Plan badge */}
      <div className="px-4 pt-4 pb-2">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-widest ${PLAN_COLORS[plan.id]}`}>
          {plan.name} Plan
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
        {NAV_ITEMS.map((item, idx) => {
          if (item.divider) {
            return <div key={idx} className="my-2 border-t border-white/5" />;
          }
          const locked = item.feature && !hasFeature(item.feature);
          const Icon = item.icon;
          const alertCount = item.badge ? lowStockProducts.length : 0;

          if (locked) {
            return (
              <div
                key={item.to}
                className="sidebar-link locked"
                onClick={() => navigate('/billing')}
                title="Upgrade to unlock"
              >
                <Icon size={18} />
                <span className="flex-1">{item.label}</span>
                <IconLock size={14} />
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {alertCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {alertCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <button
          onClick={() => navigate('/billing')}
          className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors duration-200 group"
        >
          <span className="flex-1 text-left">Upgrade plan</span>
          <IconChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </aside>
  );
}
