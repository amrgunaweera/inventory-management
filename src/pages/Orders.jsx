import { useState } from 'react';
import {
  IconPlus, IconSearch, IconShoppingCart, IconEdit,
} from '@tabler/icons-react';
import Modal from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useInventory } from '../context/InventoryContext';

const STATUSES = ['pending', 'processing', 'completed', 'cancelled'];
const EMPTY_ORDER = { type: 'sale', customer: '', items: [], status: 'pending' };

export default function Orders() {
  const { orders, products, addOrder, updateOrder } = useInventory();
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [editStatus, setEditStatus] = useState(null);
  const [form, setForm] = useState(EMPTY_ORDER);
  const [orderItems, setOrderItems] = useState([{ productId: '', name: '', qty: 1, price: 0 }]);

  const filtered = orders.filter(o => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.customer.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || o.status === filterStatus;
    const matchType = filterType === 'all' || o.type === filterType;
    return matchSearch && matchStatus && matchType;
  });

  const handleProductSelect = (idx, productId) => {
    const product = products.find(p => p.id === productId);
    setOrderItems(items => items.map((item, i) =>
      i === idx ? { ...item, productId, name: product?.name || '', price: product?.price || 0 } : item
    ));
  };

  const handleAddItem = () => {
    setOrderItems(items => [...items, { productId: '', name: '', qty: 1, price: 0 }]);
  };

  const handleRemoveItem = (idx) => {
    setOrderItems(items => items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx, field, val) => {
    setOrderItems(items => items.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const validItems = orderItems.filter(i => i.productId);
    const total = validItems.reduce((sum, i) => sum + i.price * i.qty, 0);
    addOrder({ ...form, items: validItems, total });
    setIsOpen(false);
    setForm(EMPTY_ORDER);
    setOrderItems([{ productId: '', name: '', qty: 1, price: 0 }]);
  };

  const totalRevenue = orders.filter(o => o.type === 'sale' && o.status === 'completed').reduce((s, o) => s + o.total, 0);

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['all','pending','processing','completed'].map(s => {
          const count = s === 'all' ? orders.length : orders.filter(o => o.status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`card text-left transition-all ${filterStatus === s ? 'ring-2 ring-brand-500' : 'hover:shadow-md'}`}
            >
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{s === 'all' ? 'Total Orders' : s}</p>
            </button>
          );
        })}
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} className="input pl-9" placeholder="Search orders or customer…" />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className="input w-auto text-xs py-2">
            <option value="all">All Types</option>
            <option value="sale">Sales</option>
            <option value="purchase">Purchases</option>
          </select>
          <button onClick={() => { setIsOpen(true); setForm(EMPTY_ORDER); setOrderItems([{ productId: '', name: '', qty: 1, price: 0 }]); }} className="btn-primary">
            <IconPlus size={16} /> New Order
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Order ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Customer / Supplier</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Type</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Update</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(order => (
                <tr key={order.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{order.id}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{order.customer}</td>
                  <td className="px-4 py-3"><Badge variant={order.type}>{order.type}</Badge></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{order.date}</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-800">${order.total.toFixed(2)}</td>
                  <td className="px-4 py-3"><Badge variant={order.status}>{order.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={order.status}
                      onChange={e => updateOrder(order.id, { status: e.target.value })}
                      className="input py-1 text-xs w-auto"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <IconShoppingCart size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No orders found</p>
            </div>
          )}
        </div>
      </div>

      {/* New Order Modal */}
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Create New Order" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Order Type</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="sale">Sale</option>
                <option value="purchase">Purchase</option>
              </select>
            </div>
            <div>
              <label className="label">Customer / Supplier</label>
              <input required className="input" value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="Name…" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="label mb-0">Order Items</label>
              <button type="button" onClick={handleAddItem} className="text-xs text-brand-500 hover:text-brand-600 font-semibold">+ Add item</button>
            </div>
            <div className="space-y-2">
              {orderItems.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-5">
                    <select
                      className="input text-xs py-1.5"
                      value={item.productId}
                      onChange={e => handleProductSelect(idx, e.target.value)}
                    >
                      <option value="">Select product…</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number" min="1" placeholder="Qty"
                      value={item.qty}
                      onChange={e => handleItemChange(idx, 'qty', parseInt(e.target.value) || 1)}
                      className="input text-xs py-1.5"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number" step="0.01" min="0" placeholder="Price"
                      value={item.price}
                      onChange={e => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                      className="input text-xs py-1.5"
                    />
                  </div>
                  <div className="col-span-1 text-right text-xs text-slate-500 font-semibold">
                    ${(item.qty * item.price).toFixed(2)}
                  </div>
                  <div className="col-span-1 text-right">
                    {orderItems.length > 1 && (
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-right text-sm font-bold text-slate-800 mt-2 pt-2 border-t border-slate-100">
              Total: ${orderItems.reduce((s, i) => s + i.qty * i.price, 0).toFixed(2)}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Create Order</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
