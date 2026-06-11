import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getOrganization, updateOrganization } from '../lib/firestoreService';

const SubscriptionContext = createContext(null);

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    color: 'slate',
    limits: { products: 50, categories: 3, members: 3 },
    features: {
      lowStockAlerts: false,
      csvExport: false,
      reports: false,
      multiLocation: false,
      advancedRoles: false,
      auditLog: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    color: 'brand',
    limits: { products: Infinity, categories: Infinity, members: 10 },
    features: {
      lowStockAlerts: true,
      csvExport: true,
      reports: true,
      multiLocation: false,
      advancedRoles: true,
      auditLog: true,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 49,
    color: 'violet',
    limits: { products: Infinity, categories: Infinity, members: Infinity },
    features: {
      lowStockAlerts: true,
      csvExport: true,
      reports: true,
      multiLocation: true,
      advancedRoles: true,
      auditLog: true,
    },
  },
};

export function SubscriptionProvider({ children }) {
  const { user, hasPermission } = useAuth();
  const [planId, setPlanId] = useState('free');

  // Load plan from organization document when the user logs in
  useEffect(() => {
    if (!user?.organizationId) {
      setPlanId('free');
      return;
    }
    getOrganization(user.organizationId).then((org) => {
      if (org?.planId && PLANS[org.planId]) {
        setPlanId(org.planId);
      }
    });
  }, [user?.organizationId]);

  const plan = PLANS[planId] || PLANS.free;

  /**
   * Upgrade the organization's plan (admin only) and persist to Firestore.
   */
  const upgradeTo = async (id) => {
    if (!PLANS[id] || !user?.organizationId) return;
    if (!hasPermission('billing.manage')) return;
    setPlanId(id);
    await updateOrganization(user.organizationId, { planId: id });
  };

  const hasFeature = (feature) => plan.features[feature] ?? false;
  const withinLimit = (type, count) => {
    const limit = plan.limits[type];
    return limit === Infinity || count < limit;
  };

  return (
    <SubscriptionContext.Provider
      value={{ plan, planId, upgradeTo, hasFeature, withinLimit, PLANS }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
