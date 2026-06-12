import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import {
  IconBuildingStore, IconUsers, IconWorld, IconChartBar, IconCrown, IconBuildingWarehouse
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import KPICard from '../components/ui/KPICard';
import { StoresByPlanChart, UserRolesChart } from '../components/charts/PlatformAnalyticsCharts';
import { subscribeToAllOrganizations, subscribeToAllUsers } from '../lib/firestoreService';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../lib/roles';


export default function PlatformDashboard() {
  const [users, setUsers] = useState([]);
  const [stores, setStores] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingStores, setLoadingStores] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const unsubUsers = subscribeToAllUsers((data) => {
      setUsers(data);
      setLoadingUsers(false);
    });
    const unsubStores = subscribeToAllOrganizations((data) => {
      setStores(data);
      setLoadingStores(false);
    });

    return () => {
      unsubUsers();
      unsubStores();
    };
  }, []);

  if (loadingUsers || loadingStores) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" style={{ borderWidth: '3px' }} />
      </div>
    );
  }

  // Calculate metrics
  const activeStores = stores.filter(s => s.status !== 'inactive');
  const paidStores = stores.filter(s => s.planId && s.planId !== 'free');
  
  const superAdmins = users.filter(u => u.role === 'super_admin');
  const storeOwners = users.filter(u => u.role === 'store_owner');
  
  // Recent items
  const recentStores = [...stores].slice(0, 5);
  const recentUsers = [...users].slice(0, 5);

  const getPlanBadgeVariant = (planId) => {
    switch (planId) {
      case'pro': return'emerald';
      case'business': return'violet';
      default: return'slate';
    }
  };

  return (
    <div className="space-y-6 animate-slide-up dashboard-view">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Stores"
          value={stores.length}
          sub={`${activeStores.length} active stores`}
          icon={IconBuildingStore}
          color="brand"
        />

        <KPICard
          title="Total Users"
          value={users.length}
          sub={`${superAdmins.length} admins, ${storeOwners.length} owners`}
          icon={IconUsers}
          color="blue"
        />

        <KPICard
          title="Paid Subscriptions"
          value={paidStores.length}
          sub="Pro and Business plans"
          icon={IconCrown}
          color="violet"
        />

        <KPICard
          title="Platform Status"
          value="Healthy"
          sub="All systems operational"
          icon={IconWorld}
          color="emerald"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <StoresByPlanChart stores={stores} />
        <UserRolesChart users={users} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Stores */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Recent Stores</h3>
            <Button variant="ghost" onClick={() => navigate('/platform/stores')}
              className="text-xs text-brand-500 hover:text-brand-600 font-semibold transition-colors"
            >
              View all
            </Button>
          </div>
          <div className="space-y-3">
            {recentStores.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No stores found.</p>
            ) : (
              recentStores.map(store => (
                <div key={store.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                    <IconBuildingStore size={14} className="text-brand-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{store.name}</p>
                    <p className="text-xs text-slate-400 capitalize">{store.type || 'Retail'}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={getPlanBadgeVariant(store.planId)}>{store.planId || 'free'}</Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Recent Users</h3>
            <Button variant="ghost" onClick={() => navigate('/platform/users')}
              className="text-xs text-brand-500 hover:text-brand-600 font-semibold transition-colors"
            >
              View all
            </Button>
          </div>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">No users found.</p>
            ) : (
              recentUsers.map(u => (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <IconUsers size={14} className="text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{u.name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      u.role === 'super_admin' ? 'rose' :
                      u.role === 'store_owner' ? 'brand' : 'emerald'
                    }>
                      {ROLES[u.role]?.label || u.role || 'Unassigned'}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
