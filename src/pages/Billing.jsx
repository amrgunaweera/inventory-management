import { Button } from "@/components/ui/button";
import { IconCheck, IconSparkles, IconCreditCard, IconBolt } from '@tabler/icons-react';
import { useSubscription, PLANS } from '../context/SubscriptionContext';


const FEATURE_LIST = [
  { key: 'products', label: (lim) => lim === Infinity ? 'Unlimited products' : `Up to ${lim} products` },
  { key: 'categories', label: (lim) => lim === Infinity ? 'Unlimited categories' : `Up to ${lim} categories` },
  { key: 'staff', label: (lim) => lim === Infinity ? 'Unlimited staff accounts' : lim === 1 ? '1 staff account' : `Up to ${lim} staff accounts` },
];

const PLAN_FEATURES = {
  free: ['Basic product management','Order tracking','Category management'],
  pro: ['Everything in Free','Unlimited products & categories','Low stock alerts','Sales reports','CSV export','Up to 3 staff accounts'],
  business: ['Everything in Pro','Multi-location support','Unlimited staff accounts','Priority support','Advanced analytics','API access'],
};

const PLAN_STYLE = {
  free: { badge: 'bg-slate-100 text-slate-600', btn: 'bg-slate-100 hover:bg-slate-200 text-slate-700', border: 'border-slate-200' },
  pro: { badge: 'bg-brand-100 text-brand-700', btn: 'btn-primary', border: 'border-brand-400 ring-2 ring-brand-200', popular: true },
  business: { badge: 'bg-violet-100 text-violet-700', btn: 'bg-violet-500 hover:bg-violet-600 text-white', border: 'border-violet-200' },
};

export default function Billing() {
  const { planId, upgradeTo, PLANS: plans } = useSubscription();

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Current Plan banner */}
      <div className="flex items-center gap-4 bg-gradient-to-r from-brand-500/10 to-violet-500/10 border border-brand-200 rounded-2xl px-6 py-5">
        <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center">
          <IconCreditCard size={20} className="text-brand-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">Current Plan: <span className="text-gradient capitalize">{planId}</span></p>
          <p className="text-xs text-slate-500 mt-0.5">
            {planId === 'free' ? 'You are on the free tier. Upgrade to unlock more features.' : 'You have access to all features on this plan.'}
          </p>
        </div>
        {planId === 'free' && (
          <div className="flex items-center gap-1 text-brand-500 text-xs font-bold">
            <IconBolt size={14} />
            <span>Upgrade Now</span>
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(PLANS).map(plan => {
          const style = PLAN_STYLE[plan.id];
          const isActive = planId === plan.id;

          return (
            <div
              key={plan.id}
              className={`card relative flex flex-col border-2 transition-all duration-200 ${style.border}`}
            >
              {style.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="flex items-center gap-1 bg-brand-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-brand-500/20">
                    <IconSparkles size={12} /> Most Popular
                  </span>
                </div>
              )}

              <div className="mb-4 mt-2">
                <span className={`badge ${style.badge} mb-3`}>{plan.name}</span>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-slate-800">${plan.price}</span>
                  {plan.price > 0 && <span className="text-slate-400 text-sm mb-0.5">/mo</span>}
                  {plan.price === 0 && <span className="text-slate-400 text-sm mb-0.5">forever</span>}
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {PLAN_FEATURES[plan.id].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <IconCheck size={15} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Button variant="ghost" onClick={() => upgradeTo(plan.id)}
                disabled={isActive}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'bg-slate-100 text-slate-400 cursor-default' : style.btn}`}
              >
                {isActive ? '✓ Current Plan' : plan.id === 'free' ? 'Downgrade to Free' : `Switch to ${plan.name}`}
              </Button>
            </div>
          );
        })}
      </div>

      {/* FAQ / Note */}
      <div className="card bg-slate-50 border-dashed">
        <h3 className="text-sm font-bold text-slate-700 mb-3">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {[
            ['Can I switch plans anytime?','Yes! You can upgrade or downgrade at any time. Changes take effect immediately.'],
            ['Is there a free trial?','The Free plan is available forever with no credit card required.'],
            ['What payment methods are accepted?','We accept all major credit cards and PayPal.'],
          ].map(([q, a], i) => (
            <div key={i}>
              <p className="text-xs font-semibold text-slate-700">{q}</p>
              <p className="text-xs text-slate-400 mt-0.5">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
