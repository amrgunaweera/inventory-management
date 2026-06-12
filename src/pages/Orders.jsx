import { Button } from "@/components/ui/button";
import { useState } from 'react';
import {
  IconPlus, IconSearch, IconShoppingCart,
} from '@tabler/icons-react';
import Modal from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';


const STATUSES = ['pending','processing','completed','cancelled'];
const EMPTY_ORDER = { type: 'sale', customer: '', items: [], status: 'pending' };

export default function Orders() {
  const { orders, products, addOrder, updateOrder } = useInventory();
  const { user, hasPermission } = useAuth();
  const role = user?.role;

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_ORDER);
  const [orderItems, setOrderItems] = useState([{ productId: '', name: '', qty: 1, price: 0 }]);

  const canCreateSales = hasPermission('orders.create_sales');
  const canCreatePurchase = hasPermission('orders.create_purchase');
  const canCreate = canCreateSales || canCreatePurchase;
  const canEdit = hasPermission('orders.edit');
  const canViewAll = hasPermission('orders.view_all');

  // Role-scoped filtering: Sales Person sees only sales
  const roleFiltered = orders.filter(o => {
    if (canViewAll) return true;
    if (role === 'store_sales_person') return o.type === 'sale';
    return true;
  });

  const filtered = roleFiltered.filter(o => {
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

  const openNewOrder = () => {
    // Default type based on role
    let defaultType ="sale";
    if (!canCreateSales) defaultType ="purchase";
    setForm({ ...EMPTY_ORDER, type: defaultType });
    setOrderItems([{ productId: '', name: '', qty: 1, price: 0 }]);
    setIsOpen(true);
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

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['all','pending','processing','completed'].map(s => {
          const count = s === 'all' ? roleFiltered.length : roleFiltered.filter(o => o.status === s).length;
          return (
            <Button variant='ghost' key={s} onClick={() => setFilterStatus(s)}
              className={`card text-left transition-all ${filterStatus === s ? 'ring-2 ring-brand-500' : ''}`}
            >
              <p className="text-2xl font-bold text-slate-800">{count}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{s === 'all' ? 'Total Orders' : s}</p>
            </Button>
          );
        })}
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" placeholder="Search orders or customer…" />
          </div>

          {/* Only show type filter if user can see both types */}
          {canViewAll && (
            <Select value={filterType} onValueChange={val => setFilterType(val)}>
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">Sales</SelectItem>
                <SelectItem value="purchase">Purchases</SelectItem>
              </SelectContent>
            </Select>
          )}

          {canCreate && (
            <Button variant="default" onClick={openNewOrder} >
              <IconPlus size={16} /> New Order
            </Button>
          )}
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
                {canEdit && (
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Update</th>
                )}
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
                  {canEdit && (
                    <td className="px-4 py-3 text-right">
                      <Select value={order.status} onValueChange={val => updateOrder(order.id, { status: val })}>
                        <SelectTrigger className="w-[120px] text-xs h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                  )}
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
      {canCreate && (
        <Modal 
          isOpen={isOpen} 
          onClose={() => setIsOpen(false)} 
          title="Create New Order" 
          size="lg"
          footer={
            <>
              <Button type="button" onClick={() => setIsOpen(false)} variant="outline" >Cancel</Button>
              <Button variant="default" type="submit" form="order-form" >Create Order</Button>
            </>
          }
        >
          <form id="order-form" onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Order Type</label>
                <Select value={form.type} onValueChange={val => setForm(f => ({ ...f, type: val }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Order Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {canCreateSales && <SelectItem value="sale">Sale</SelectItem>}
                    {canCreatePurchase && <SelectItem value="purchase">Purchase</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="label">Customer / Supplier</label>
                <Input required value={form.customer} onChange={e => setForm(f => ({ ...f, customer: e.target.value }))} placeholder="Name…" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label mb-0">Order Items</label>
                <Button variant="ghost" type="button" onClick={handleAddItem} className="text-xs text-brand-500 hover:text-brand-600 font-semibold">+ Add item</Button>
              </div>
              <div className="space-y-2">
                {orderItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <Select value={item.productId} onValueChange={val => handleProductSelect(idx, val)}>
                        <SelectTrigger className="text-xs h-8">
                          <SelectValue placeholder="Select product…" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number" min="1" placeholder="Qty"
                        value={item.qty}
                        onChange={e => handleItemChange(idx,'qty', parseInt(e.target.value) || 1)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        type="number" step="0.01" min="0" placeholder="Price"
                        value={item.price}
                        onChange={e => handleItemChange(idx,'price', parseFloat(e.target.value) || 0)}
                        className="text-xs h-8"
                      />
                    </div>
                    <div className="col-span-1 text-right text-xs text-slate-500 font-semibold">
                      ${(item.qty * item.price).toFixed(2)}
                    </div>
                    <div className="col-span-1 text-right">
                      {orderItems.length > 1 && (
                        <Button variant="ghost" type="button" onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-600 text-xs">✕</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-right text-sm font-bold text-slate-800 mt-2 pt-2 border-t border-slate-100">
                Total: ${orderItems.reduce((s, i) => s + i.qty * i.price, 0).toFixed(2)}
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
