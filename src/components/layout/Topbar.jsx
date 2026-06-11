import { useLocation } from 'react-router-dom';
import { IconSearch, IconBell, IconLogout } from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { useInventory } from '../../context/InventoryContext';
import RoleBadge from '../ui/RoleBadge';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', sub: 'Welcome back 👋' },
  '/products': { title: 'Products', sub: 'Manage your product catalog' },
  '/categories': { title: 'Categories', sub: 'Organise your products' },
  '/orders': { title: 'Orders', sub: 'Track sales and purchases' },
  '/reports': { title: 'Reports', sub: 'Sales insights and analytics' },
  '/alerts': { title: 'Low Stock Alerts', sub: 'Items that need restocking' },
  '/export': { title: 'CSV Export', sub: 'Download your data' },
  '/settings': { title: 'Settings', sub: 'Store configuration' },
  '/billing': { title: 'Billing & Plans', sub: 'Manage your subscription' },
  '/team': { title: 'Team Management', sub: 'Manage members and roles' },
  '/suppliers': { title: 'Suppliers', sub: 'Manage vendor relationships' },
  '/warehouses': { title: 'Warehouses', sub: 'Manage storage locations' },
  '/audit-log': { title: 'Audit Log', sub: 'System activity history' },
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const { lowStockProducts } = useInventory();
  const { pathname } = useLocation();
  const page = PAGE_TITLES[pathname] || { title: 'Smartventory', sub: '' };

  return (
    <header className="h-16 bg-white border-b border-slate-100 flex items-center px-6 gap-4">
      <div className="flex-1">
        <h1 className="text-lg font-bold text-slate-800 leading-none">{page.title}</h1>
        <p className="text-xs text-slate-400 mt-0.5">{page.sub}</p>
      </div>

      {/* Search */}
      <div className="relative hidden md:block">
        <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-56 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
        />
      </div>

      {/* Alerts */}
      <div className="relative">
        <button className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800">
          <IconBell size={18} />
          {lowStockProducts.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
          )}
        </button>
      </div>

      {/* User */}
      <div className="flex items-center gap-3 pl-3 border-l border-slate-100">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
          {user?.avatar || 'U'}
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</p>
            <RoleBadge role={user?.role} size="sm" />
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{user?.orgName || 'My Organization'}</p>
        </div>
        <button
          onClick={logout}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 hover:text-red-500 text-slate-400 transition-colors"
          title="Sign out"
        >
          <IconLogout size={16} />
        </button>
      </div>
    </header>
  );
}
