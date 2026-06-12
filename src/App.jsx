import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InventoryProvider } from './context/InventoryContext';
import { SubscriptionProvider, useSubscription } from './context/SubscriptionContext';
import Layout from './components/layout/Layout';
import { canAccessRoute } from './lib/roles';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Orders from './pages/Orders';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import Export from './pages/Export';
import Settings from './pages/Settings';
import Billing from './pages/Billing';
import TeamManagement from './pages/TeamManagement';
import Suppliers from './pages/Suppliers';
import Warehouses from './pages/Warehouses';
import AuditLog from './pages/AuditLog';
import PlatformUsers from './pages/PlatformUsers';
import PlatformStores from './pages/PlatformStores';
import AccessDenied from './pages/AccessDenied';

/**
 * PrivateRoute — Requires authentication. Redirects to /login if not logged in.
 */
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-3 border-brand-500/30 border-t-brand-500 rounded-full animate-spin" style={{ borderWidth: '3px' }} />
        <p className="text-sm text-slate-400">Loading Smartventory…</p>
      </div>
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

/**
 * RoleRoute — Requires authentication + route-level permission.
 * If user lacks permission, shows AccessDenied instead of the page.
 */
function RoleRoute({ route, children }) {
  const { user } = useAuth();
  const { planId } = useSubscription();
  if (!user) return null;
  if (!canAccessRoute(user.role, route, planId)) {
    return <AccessDenied />;
  }
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <Layout>
              <Routes>
                <Route path="/dashboard" element={<RoleRoute route="/dashboard"><Dashboard /></RoleRoute>} />
                <Route path="/products" element={<RoleRoute route="/products"><Products /></RoleRoute>} />
                <Route path="/categories" element={<RoleRoute route="/categories"><Categories /></RoleRoute>} />
                <Route path="/orders" element={<RoleRoute route="/orders"><Orders /></RoleRoute>} />
                <Route path="/reports" element={<RoleRoute route="/reports"><Reports /></RoleRoute>} />
                <Route path="/alerts" element={<RoleRoute route="/alerts"><Alerts /></RoleRoute>} />
                <Route path="/export" element={<RoleRoute route="/export"><Export /></RoleRoute>} />
                <Route path="/settings" element={<RoleRoute route="/settings"><Settings /></RoleRoute>} />
                <Route path="/billing" element={<RoleRoute route="/billing"><Billing /></RoleRoute>} />
                <Route path="/team" element={<RoleRoute route="/team"><TeamManagement /></RoleRoute>} />
                <Route path="/suppliers" element={<RoleRoute route="/suppliers"><Suppliers /></RoleRoute>} />
                <Route path="/warehouses" element={<RoleRoute route="/warehouses"><Warehouses /></RoleRoute>} />
                <Route path="/audit-log" element={<RoleRoute route="/audit-log"><AuditLog /></RoleRoute>} />
                <Route path="/platform/users" element={<RoleRoute route="/platform/users"><PlatformUsers /></RoleRoute>} />
                <Route path="/platform/stores" element={<RoleRoute route="/platform/stores"><PlatformStores /></RoleRoute>} />
                <Route path="/access-denied" element={<AccessDenied />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Layout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <InventoryProvider>
            <AppRoutes />
          </InventoryProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
