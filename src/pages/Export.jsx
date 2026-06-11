import { IconFileExport, IconDownload, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { LockedOverlay } from '../components/ui/PlanGate';
import { useSubscription } from '../context/SubscriptionContext';
import { useInventory } from '../context/InventoryContext';
import { exportCSV } from '../utils/exportCSV';

const EXPORT_OPTIONS = [
  { id: 'products', label: 'Products', description: 'Full product catalog with pricing and stock', icon: '📦' },
  { id: 'categories', label: 'Categories', description: 'All categories and their details', icon: '🏷️' },
  { id: 'orders', label: 'Orders', description: 'All orders with customer and total info', icon: '🛒' },
  { id: 'low_stock', label: 'Low Stock Report', description: 'Products below minimum threshold', icon: '⚠️' },
];

export default function Export() {
  const { hasFeature } = useSubscription();
  const { products, categories, orders, lowStockProducts } = useInventory();
  const [exported, setExported] = useState(null);

  if (!hasFeature('csvExport')) return <LockedOverlay feature="csvExport" />;

  const handleExport = (type) => {
    switch (type) {
      case 'products':
        exportCSV(products.map(p => ({ name: p.name, sku: p.sku, category: p.category, price: p.price, cost: p.cost, stock: p.stock, minStock: p.minStock, status: p.status })), 'products.csv');
        break;
      case 'categories':
        exportCSV(categories.map(c => ({ name: c.name, description: c.description })), 'categories.csv');
        break;
      case 'orders':
        exportCSV(orders.map(o => ({ id: o.id, type: o.type, customer: o.customer, total: o.total, status: o.status, date: o.date })), 'orders.csv');
        break;
      case 'low_stock':
        exportCSV(lowStockProducts.map(p => ({ name: p.name, sku: p.sku, stock: p.stock, minStock: p.minStock, category: p.category })), 'low_stock_report.csv');
        break;
    }
    setExported(type);
    setTimeout(() => setExported(null), 2500);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card">
        <div className="mb-6">
          <h2 className="text-base font-bold text-slate-800">Export Data</h2>
          <p className="text-xs text-slate-400 mt-0.5">Download your inventory data as CSV files</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {EXPORT_OPTIONS.map(opt => (
            <div key={opt.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200">
              <span className="text-2xl">{opt.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-slate-800 text-sm">{opt.label}</p>
                <p className="text-xs text-slate-400 mt-0.5">{opt.description}</p>
              </div>
              <button
                onClick={() => handleExport(opt.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  exported === opt.id
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'btn-primary'
                }`}
              >
                {exported === opt.id ? (
                  <><IconCheck size={14} /> Exported!</>
                ) : (
                  <><IconDownload size={14} /> Export</>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card bg-slate-50 border-dashed">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0">
            <IconFileExport size={18} className="text-brand-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">Export Tips</h3>
            <ul className="text-xs text-slate-500 space-y-1 list-disc list-inside">
              <li>CSV files can be opened in Excel, Google Sheets, or any spreadsheet app</li>
              <li>Exports contain current data at the time of download</li>
              <li>Schedule regular exports to maintain backup records</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
