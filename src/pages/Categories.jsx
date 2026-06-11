import { useState } from 'react';
import { IconPlus, IconEdit, IconTrash, IconTag } from '@tabler/icons-react';
import Modal from '../components/ui/Modal';
import UpgradeBanner from '../components/ui/UpgradeBanner';
import { useInventory } from '../context/InventoryContext';
import { useSubscription } from '../context/SubscriptionContext';

const COLORS = ['#6366f1','#f59e0b','#10b981','#ec4899','#f97316','#8b5cf6','#06b6d4','#ef4444','#84cc16','#14b8a6'];
const EMPTY = { name: '', description: '', color: COLORS[0] };

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, products } = useInventory();
  const { plan, withinLimit } = useSubscription();
  const [isOpen, setIsOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const atLimit = !withinLimit('categories', categories.length);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setIsOpen(true);
  };
  const openEdit = (c) => {
    setEditTarget(c);
    setForm({ name: c.name, description: c.description, color: c.color });
    setIsOpen(true);
  };
  const handleSave = (e) => {
    e.preventDefault();
    if (editTarget) {
      updateCategory(editTarget.id, form);
    } else {
      addCategory(form);
    }
    setIsOpen(false);
  };

  const productCount = (catName) => products.filter(p => p.category === catName).length;

  return (
    <div className="space-y-5 animate-slide-up">
      {atLimit && (
        <UpgradeBanner message={`You've reached the Free plan limit of ${plan.limits.categories} categories. Upgrade to Pro for unlimited categories.`} />
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Product Categories</h2>
            <p className="text-xs text-slate-400 mt-0.5">{categories.length} categories</p>
          </div>
          <button onClick={openAdd} disabled={atLimit} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
            <IconPlus size={16} /> Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map(cat => {
            const count = productCount(cat.name);
            return (
              <div key={cat.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-sm transition-all duration-200 group">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <IconTag size={18} style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">{cat.name}</p>
                  <p className="text-xs text-slate-400 truncate">{cat.description || 'No description'}</p>
                  <p className="text-xs text-slate-500 mt-0.5 font-medium">{count} product{count !== 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-500 transition-colors">
                    <IconEdit size={14} />
                  </button>
                  <button onClick={() => setDeleteConfirm(cat)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                    <IconTrash size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <IconTag size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No categories yet</p>
          </div>
        )}
      </div>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={editTarget ? 'Edit Category' : 'Add Category'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input required className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Electronics" />
          </div>
          <div>
            <label className="label">Description</label>
            <input className="input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Short description…" />
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, color: c }))}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: form.color === c ? '#0f172a' : 'transparent' }}
                />
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">{editTarget ? 'Save' : 'Add'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete Category" size="sm">
        <p className="text-sm text-slate-600 mb-6">
          Delete <strong>{deleteConfirm?.name}</strong>? Products in this category won't be deleted.
        </p>
        <div className="flex gap-3">
          <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
          <button onClick={() => { deleteCategory(deleteConfirm.id); setDeleteConfirm(null); }} className="btn-danger flex-1">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
