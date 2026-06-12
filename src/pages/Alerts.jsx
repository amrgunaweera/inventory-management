import { Button } from "@/components/ui/button";
import { IconAlertTriangle, IconPackage, IconRefresh } from '@tabler/icons-react';
import { LockedOverlay } from '../components/ui/PlanGate';
import { Badge } from '../components/ui/Badge';
import { useSubscription } from '../context/SubscriptionContext';
import { useInventory } from '../context/InventoryContext';
import { useNavigate } from 'react-router-dom';


export default function Alerts() {
  const { hasFeature } = useSubscription();
  const { lowStockProducts, products, updateProduct } = useInventory();
  const navigate = useNavigate();

  if (!hasFeature('lowStockAlerts')) return <LockedOverlay feature='lowStockAlerts' />;

  const outOfStock = products.filter(p => p.stock === 0 && p.status === 'active');
  const belowMin = products.filter(p => p.stock > 0 && p.stock <= p.minStock && p.status === 'active');

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card border-l-4 border-red-500">
          <p className="text-2xl font-bold text-red-500">{outOfStock.length}</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wide">Out of Stock</p>
        </div>
        <div className="card border-l-4 border-amber-400">
          <p className="text-2xl font-bold text-amber-500">{belowMin.length}</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wide">Below Minimum</p>
        </div>
        <div className="card border-l-4 border-brand-400">
          <p className="text-2xl font-bold text-brand-500">{lowStockProducts.length}</p>
          <p className="text-xs text-slate-500 mt-1 font-semibold uppercase tracking-wide">Total Alerts</p>
        </div>
      </div>

      {lowStockProducts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-4">
            <IconPackage size={28} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-700 mb-1">All good! 🎉</h3>
          <p className="text-sm text-slate-400">No products are below their minimum stock level.</p>
        </div>
      ) : (
        <div className="card">
          <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
            <IconAlertTriangle size={18} className="text-amber-500" />
            Products Needing Attention
          </h3>
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Product</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Category</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Current Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Min. Stock</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Alert</th>
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map(p => (
                  <tr key={p.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{p.sku}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.category}</span>
                    </td>
                    <td className={`px-4 py-3 text-right font-bold ${p.stock === 0 ? 'text-red-500' : 'text-amber-500'}`}>
                      {p.stock}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500">{p.minStock}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.stock === 0 ? 'out' : 'low'}>
                        {p.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button onClick={() => navigate('/orders')} variant="outline" className="py-1 px-3 text-xs flex items-center gap-1.5 ml-auto"
                      >
                        <IconRefresh size={13} /> Reorder
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
