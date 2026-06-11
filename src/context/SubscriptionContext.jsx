import { createContext, useContext, useState, useEffect } from 'react';
import { storage } from '../utils/storage';

const SubscriptionContext = createContext(null);

export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    color: 'slate',
    limits: { products: 50, categories: 3, staff: 1 },
    features: {
      lowStockAlerts: false,
      csvExport: false,
      reports: false,
      multiLocation: false,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    color: 'brand',
    limits: { products: Infinity, categories: Infinity, staff: 3 },
    features: {
      lowStockAlerts: true,
      csvExport: true,
      reports: true,
      multiLocation: false,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 49,
    color: 'violet',
    limits: { products: Infinity, categories: Infinity, staff: Infinity },
    features: {
      lowStockAlerts: true,
      csvExport: true,
      reports: true,
      multiLocation: true,
    },
  },
};

export function SubscriptionProvider({ children }) {
  const [planId, setPlanId] = useState(() => storage.get('plan', 'pro'));

  const plan = PLANS[planId] || PLANS.free;

  const upgradeTo = (id) => {
    if (PLANS[id]) {
      setPlanId(id);
      storage.set('plan', id);
    }
  };

  const hasFeature = (feature) => plan.features[feature] ?? false;
  const withinLimit = (type, count) => {
    const limit = plan.limits[type];
    return limit === Infinity || count < limit;
  };

  return (
    <SubscriptionContext.Provider value={{ plan, planId, upgradeTo, hasFeature, withinLimit, PLANS }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
