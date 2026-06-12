import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IconPlus, IconEdit, IconTrash, IconTag, IconAlertTriangle } from '@tabler/icons-react';
import Modal from '../components/ui/Modal';
import UpgradeBanner from '../components/ui/UpgradeBanner';
import { useInventory } from '../context/InventoryContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';

const COLORS = ['#6366f1','#f59e0b','#10b981','#ec4899','#f97316','#8b5cf6','#06b6d4','#ef4444','#84cc16','#14b8a6'];

const categorySchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().optional(),
  color: z.string()
});

export default function Categories() {
  const { categories, addCategory, updateCategory, deleteCategory, products } = useInventory();
  const { plan, withinLimit } = useSubscription();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission('categories.create');
  const canEdit = hasPermission('categories.edit');
  const canDelete = hasPermission('categories.delete');
  const [isOpen, setIsOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', color: COLORS[0] }
  });
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const atLimit = !withinLimit('categories', categories.length);

  const openAdd = () => {
    setEditTarget(null);
    reset({ name: '', description: '', color: COLORS[0] });
    setIsOpen(true);
  };
  const openEdit = (c) => {
    setEditTarget(c);
    reset({ name: c.name, description: c.description || '', color: c.color || COLORS[0] });
    setIsOpen(true);
  };
  const onValidSave = (data) => {
    if (editTarget) {
      updateCategory(editTarget.id, data);
    } else {
      addCategory(data);
    }
    setIsOpen(false);
  };

  const productCount = (catName) => products.filter(p => p.category === catName).length;

  return (
    <div className="space-y-5 animate-slide-up">
      {atLimit && canCreate && (
        <UpgradeBanner message={`You've reached the Free plan limit of ${plan.limits.categories} categories. Upgrade to Pro for unlimited categories.`} />
      )}

      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Product Categories</h2>
            <p className="text-xs text-slate-400 mt-0.5">{categories.length} categories</p>
          </div>
          {canCreate && (
            <button onClick={openAdd} disabled={atLimit} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
              <IconPlus size={16} /> Add Category
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {categories.map(cat => {
            const count = productCount(cat.name);
            return (
              <div key={cat.id} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 hover:border-slate-200 transition-all duration-200 group">
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
                {(canEdit || canDelete) && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                      <button onClick={() => openEdit(cat)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-500 transition-colors">
                        <IconEdit size={14} />
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => setDeleteConfirm(cat)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <IconTrash size={14} />
                      </button>
                    )}
                  </div>
                )}
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

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title={editTarget ? 'Edit Category' : 'Add Category'} 
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setIsOpen(false)} className="btn-secondary" disabled={isSubmitting}>Cancel</button>
            <button type="submit" form="category-form" className="btn-primary" disabled={isSubmitting}>{editTarget ? 'Save' : 'Add'}</button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit(onValidSave)} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <Input {...register('name')} placeholder="e.g. Electronics" />
            {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Description</label>
            <Input {...register('description')} placeholder="Short description…" />
            {errors.description && <p className="text-xs text-rose-500 mt-1">{errors.description.message}</p>}
          </div>
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setValue('color', c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: watch('color') === c ? '#0f172a' : 'transparent' }}
                />
              ))}
            </div>
            {errors.color && <p className="text-xs text-rose-500 mt-1">{errors.color.message}</p>}
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!deleteConfirm} 
        onClose={() => setDeleteConfirm(null)} 
        title="Delete Category" 
        size="sm"
        icon={
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <IconAlertTriangle size={24} stroke={1.5} />
          </div>
        }
        description={
          <>Delete <strong>{deleteConfirm?.name}</strong>? Products in this category won't be deleted.</>
        }
        footer={
          <>
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={() => { deleteCategory(deleteConfirm.id); setDeleteConfirm(null); }} className="btn-danger">Delete</button>
          </>
        }
      />
    </div>
  );
}
