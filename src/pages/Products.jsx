import { useState } from 'react';
import {
  IconPlus, IconSearch, IconEdit, IconTrash, IconFilter,
  IconPackage, IconAlertTriangle,
} from '@tabler/icons-react';
import Modal from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import UpgradeBanner from '../components/ui/UpgradeBanner';
import { useInventory } from '../context/InventoryContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';

const EMPTY = { name: '', sku: '', category: '', price: '', cost: '', stock: '', minStock: '', status: 'active' };

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, categories } = useInventory();
  const { plan, withinLimit } = useSubscription();
  const { hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canCreate = hasPermission('products.create');
  const canEdit = hasPermission('products.edit');
  const canDelete = hasPermission('products.delete');
  const atLimit = !withinLimit('products', products.length);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;
    return matchSearch && matchCat && matchStatus;
  });

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setIsModalOpen(true);
  };
  const openEdit = (p) => {
    setEditTarget(p);
    setForm({ name: p.name, sku: p.sku, category: p.category, price: p.price, cost: p.cost, stock: p.stock, minStock: p.minStock, status: p.status });
    setIsModalOpen(true);
  };
  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: parseFloat(form.price) || 0,
      cost: parseFloat(form.cost) || 0,
      stock: parseInt(form.stock) || 0,
      minStock: parseInt(form.minStock) || 0,
    };
    if (editTarget) {
      updateProduct(editTarget.id, payload);
    } else {
      addProduct(payload);
    }
    setIsModalOpen(false);
  };

  const stockStatus = (p) => {
    if (p.stock === 0) return 'out';
    if (p.stock <= p.minStock) return 'low';
    return 'active';
  };

  const uniqueCategories = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-5 animate-slide-up">
      {atLimit && canCreate && (
        <UpgradeBanner message={`You've reached the Free plan limit of ${plan.limits.products} products. Upgrade to Pro for unlimited products.`} />
      )}

      <div className="card">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9"
              placeholder="Search products or SKU…"
            />
          </div>

          <div className="flex items-center gap-2">
            <IconFilter size={15} className="text-slate-400" />
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className="input w-auto text-xs py-2">
              <option value="all">All Categories</option>
              {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input w-auto text-xs py-2">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {canCreate && (
            <button
              onClick={openAdd}
              disabled={atLimit}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconPlus size={16} /> Add Product
            </button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-4 text-xs text-slate-500 mb-4 flex-wrap">
          <span className="font-medium">{filtered.length} products</span>
          <span className="text-slate-300">|</span>
          <span>{products.filter(p => p.stock === 0).length} out of stock</span>
          <span className="text-slate-300">|</span>
          <span className="text-amber-500">{products.filter(p => p.stock > 0 && p.stock <= p.minStock).length} low stock</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">SKU</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Price</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Stock</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                {(canEdit || canDelete) && (
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center flex-shrink-0">
                        <IconPackage size={14} className="text-brand-400" />
                      </div>
                      <span className="font-medium text-slate-800">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.sku}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.category}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">${p.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {stockStatus(p) !== 'active' && (
                        <IconAlertTriangle size={13} className={stockStatus(p) === 'out' ? 'text-red-500' : 'text-amber-500'} />
                      )}
                      <span className={`font-semibold ${stockStatus(p) === 'out' ? 'text-red-500' : stockStatus(p) === 'low' ? 'text-amber-500' : 'text-slate-800'}`}>
                        {p.stock}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status}>{p.status}</Badge>
                  </td>
                  {(canEdit || canDelete) && (
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                          <button
                            onClick={() => openEdit(p)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-500 transition-colors"
                          >
                            <IconEdit size={14} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteConfirm(p)}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <IconTrash size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <IconPackage size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No products found</p>
              <p className="text-xs">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {(canCreate || canEdit) && (
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editTarget ? 'Edit Product' : 'Add Product'}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Product Name</label>
                <input required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Wireless Earbuds Pro" />
              </div>
              <div>
                <label className="label">SKU</label>
                <input required className="input" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="e.g. WEP-001" />
              </div>
              <div>
                <label className="label">Category</label>
                <input required className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Electronics" list="cat-list" />
                <datalist id="cat-list">
                  {categories.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </div>
              <div>
                <label className="label">Selling Price ($)</label>
                <input required type="number" step="0.01" min="0" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="label">Cost Price ($)</label>
                <input required type="number" step="0.01" min="0" className="input" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label className="label">Stock Quantity</label>
                <input required type="number" min="0" className="input" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <label className="label">Min Stock Threshold</label>
                <input required type="number" min="0" className="input" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: e.target.value }))} placeholder="0" />
              </div>
              <div className="col-span-2">
                <label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary flex-1">Cancel</button>
              <button type="submit" className="btn-primary flex-1">
                {editTarget ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {canDelete && (
        <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Product" size="sm">
          <p className="text-sm text-slate-600 mb-6">
            Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => { deleteProduct(deleteConfirm.id); setDeleteConfirm(null); }}
              className="btn-danger flex-1"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
