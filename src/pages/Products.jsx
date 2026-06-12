import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';


const productSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  sku: z.string().min(1, { message: 'SKU is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  price: z.coerce.number().min(0, { message: 'Price must be >= 0' }),
  cost: z.coerce.number().min(0, { message: 'Cost must be >= 0' }),
  stock: z.coerce.number().int({ message: 'Must be an integer' }).min(0, { message: 'Stock must be >= 0' }),
  minStock: z.coerce.number().int({ message: 'Must be an integer' }).min(0, { message: 'Min Stock must be >= 0' }),
  status: z.enum(['active','inactive'])
});

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, categories, allStores } = useInventory();
  const { plan, withinLimit } = useSubscription();
  const { user, hasPermission } = useAuth();
  const role = user?.role;
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Store filter states for admin user
  const [storeSearch, setStoreSearch] = useState('');
  const [storeTypeFilter, setStoreTypeFilter] = useState('all');
  const [selectedStore, setSelectedStore] = useState(null);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: { name: '', sku: '', category: '', price: 0, cost: 0, stock: 0, minStock: 0, status: 'active' }
  });

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const canCreate = hasPermission('products.create');
  const canEdit = hasPermission('products.edit');
  const canDelete = hasPermission('products.delete');
  const atLimit = !withinLimit('products', products.length);

  // Derive store suggestions based on search text and type filter
  const filteredStores = (allStores || []).filter(store => {
    const matchType = storeTypeFilter === 'all' || store.type === storeTypeFilter;
    const matchSearch = (store.name || '').toLowerCase().includes(storeSearch.toLowerCase()) || (store.id || '').toLowerCase().includes(storeSearch.toLowerCase());
    return matchType && matchSearch;
  });

  const storeSuggestions = filteredStores.slice(0, 10); // Show top 5-10 suggestions by default

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || p.category === filterCat;
    const matchStatus = filterStatus === 'all' || p.status === filterStatus;

    // Store filtering for super admin
    let matchStore = true;
    if (role === 'super_admin' && selectedStore) {
      matchStore = p.orgId === selectedStore.id;
    }
    return matchSearch && matchCat && matchStatus && matchStore;
  });

  const openAdd = () => {
    setEditTarget(null);
    reset({ name: '', sku: '', category: '', price: 0, cost: 0, stock: 0, minStock: 0, status: 'active' });
    setIsModalOpen(true);
  };
  const openEdit = (p) => {
    setEditTarget(p);
    reset({ name: p.name, sku: p.sku, category: p.category, price: p.price, cost: p.cost, stock: p.stock, minStock: p.minStock, status: p.status });
    setIsModalOpen(true);
  };
  const onValidSave = (data) => {
    if (editTarget) {
      updateProduct(editTarget.id, data);
    } else {
      addProduct(data);
    }
    setIsModalOpen(false);
  };

  const stockStatus = (p) => {
    if (p.stock === 0) return'out';
    if (role !== 'super_admin' && p.stock <= p.minStock) return'low';
    return'active';
  };

  const categoryOptions = categories.map(c => {
    const buildPath = (cat) => {
      if (!cat.parentId) return cat.name;
      const parent = categories.find(p => p.id === cat.parentId);
      return parent ? `${buildPath(parent)} > ${cat.name}` : cat.name;
    };
    return { id: c.id, name: c.name, path: buildPath(c) };
  }).sort((a, b) => a.path.localeCompare(b.path));

  const uniqueCategories = [...new Set(products.map(p => p.category))];

  return (
    <div className="space-y-5 animate-slide-up">
      {atLimit && canCreate && (
        <UpgradeBanner message={`You've reached the Free plan limit of ${plan.limits.products} products. Upgrade to Pro for unlimited products.`} />
      )}

      <div className="card">
        {/* Admin Store Filter Bar */}
        {role === 'super_admin' && (
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4 mb-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Filter by Store:</span>

            {/* Store Type Filter */}
            <Select
              value={storeTypeFilter}
              onValueChange={val => {
                setStoreTypeFilter(val);
                if (selectedStore && val !== 'all' && selectedStore.type !== val) {
                  setSelectedStore(null);
                  setStoreSearch('');
                }
              }}
            >
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="All Store Types">
                  {(val) => val === 'all' ? 'All Store Types' : val}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Store Types</SelectItem>
                <SelectItem value="Retail">Retail</SelectItem>
                <SelectItem value="Wholesale">Wholesale</SelectItem>
                <SelectItem value="Warehouse">Warehouse</SelectItem>
              </SelectContent>
            </Select>

            {/* Store Search with Suggestions */}
            <div className="relative">
              <Input
                type="text"
                placeholder="Search store name..."
                value={storeSearch}
                onChange={e => {
                  setStoreSearch(e.target.value);
                  setShowStoreDropdown(true);
                }}
                onFocus={() => setShowStoreDropdown(true)}
                onBlur={() => setTimeout(() => setShowStoreDropdown(false), 200)}
                className="text-xs h-9 w-56 pr-8"
              />
              {selectedStore && (
                <Button variant="ghost" type="button" onClick={() => {
                    setSelectedStore(null);
                    setStoreSearch('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </Button>
              )}
              {showStoreDropdown && (
                <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded shadow-lg z-50 max-h-60 overflow-y-auto text-xs">
                  <div className="p-2 border-b border-slate-100 font-semibold text-slate-400">
                    {storeSuggestions.length === 0 ? 'No stores found' : `Suggestions (${storeSuggestions.length})`}
                  </div>
                  {storeSuggestions.map(store => (
                    <Button variant="ghost" type="button" key={store.id} onClick={() => {
                        setSelectedStore(store);
                        setStoreSearch(store.name);
                        setShowStoreDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0"
                    >
                      <div className="truncate pr-2">
                        <p className="font-semibold text-slate-700 truncate">{store.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">ID: {store.id}</p>
                      </div>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase font-bold shrink-0">
                        {store.type}
                      </span>
                    </Button>
                  ))}
                  {selectedStore && (
                    <Button variant="ghost" type="button" onClick={() => {
                        setSelectedStore(null);
                        setStoreSearch('');
                        setShowStoreDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 bg-slate-50 text-slate-600 font-medium hover:bg-slate-100 text-center border-t border-slate-100"
                    >
                      Clear Selection
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
              placeholder="Search products or SKU…"
            />
          </div>

          <div className="flex items-center gap-2">
            <IconFilter size={15} className="text-slate-400" />
            <Select value={filterCat} onValueChange={val => setFilterCat(val)}>
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="All Categories">
                  {(val) => {
                    if (val === 'all') return'All Categories';
                    const option = categoryOptions.find(o => o.name === val);
                    return option ? option.path : val;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={val => setFilterStatus(val)}>
              <SelectTrigger className="w-[120px] text-xs h-9">
                <SelectValue placeholder="All Status">
                  {(val) => val === 'all' ? 'All Status' : val === 'active' ? 'Active' : val === 'inactive' ? 'Inactive' : val}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {canCreate && (
            <Button variant="default" onClick={openAdd} disabled={atLimit} className="disabled:opacity-50 disabled:cursor-not-allowed" >
              <IconPlus size={16} /> Add Product
            </Button>
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-4 text-xs text-slate-500 mb-4 flex-wrap">
          <span className="font-medium">{filtered.length} products</span>
          <span className="text-slate-300">|</span>
          <span>{filtered.filter(p => p.stock === 0).length} out of stock</span>
          {role !== 'super_admin' && (
            <>
              <span className="text-slate-300">|</span>
              <span className="text-amber-500">{filtered.filter(p => p.stock > 0 && p.stock <= p.minStock).length} low stock</span>
            </>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                {role === 'super_admin' && (
                  <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Store</th>
                )}
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
                  {role === 'super_admin' && (
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-700">{p.orgName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {p.orgId}</span>
                      </div>
                    </td>
                  )}
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
                          <Button variant="ghost" onClick={() => openEdit(p)}
                            size="icon-sm" className="rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-500 transition-colors"
                          >
                            <IconEdit size={14} />
                          </Button>
                        )}
                        {canDelete && (
                          <Button variant="ghost" onClick={() => setDeleteConfirm(p)}
                            size="icon-sm" className="rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <IconTrash size={14} />
                          </Button>
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
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={editTarget ? 'Edit Product' : 'Add Product'}
          footer={
            <>
              <Button type="button" onClick={() => setIsModalOpen(false)} variant="outline"  disabled={isSubmitting}>Cancel</Button>
              <Button variant="default" type="submit" form="product-form" disabled={isSubmitting}>
                {editTarget ? 'Save Changes' : 'Add Product'}
              </Button>
            </>
          }
        >
          <form id="product-form" onSubmit={handleSubmit(onValidSave)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Product Name</label>
                <Input {...register('name')} placeholder="e.g. Wireless Earbuds Pro" />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="label">SKU</label>
                <Input {...register('sku')} placeholder="e.g. WEP-001" />
                {errors.sku && <p className="text-xs text-rose-500 mt-1">{errors.sku.message}</p>}
              </div>
              <div>
                <label className="label">Category</label>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category">
                          {(val) => {
                            const option = categoryOptions.find(o => o.name === val);
                            return option ? option.path : val;
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map(c => (
                          <SelectItem key={c.id} value={c.name}>{c.path}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-xs text-rose-500 mt-1">{errors.category.message}</p>}
              </div>
              <div>
                <label className="label">Selling Price ($)</label>
                <Input type="number" step="0.01" min="0" {...register('price')} placeholder="0.00" />
                {errors.price && <p className="text-xs text-rose-500 mt-1">{errors.price.message}</p>}
              </div>
              <div>
                <label className="label">Cost Price ($)</label>
                <Input type="number" step="0.01" min="0" {...register('cost')} placeholder="0.00" />
                {errors.cost && <p className="text-xs text-rose-500 mt-1">{errors.cost.message}</p>}
              </div>
              <div>
                <label className="label">Stock Quantity</label>
                <Input type="number" min="0" {...register('stock')} placeholder="0" />
                {errors.stock && <p className="text-xs text-rose-500 mt-1">{errors.stock.message}</p>}
              </div>
              <div>
                <label className="label">Min Stock Threshold</label>
                <Input type="number" min="0" {...register('minStock')} placeholder="0" />
                {errors.minStock && <p className="text-xs text-rose-500 mt-1">{errors.minStock.message}</p>}
              </div>
              <div className="col-span-2">
                <label className="label">Status</label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status">
                          {(val) => val === 'active' ? 'Active' : val === 'inactive' ? 'Inactive' : val}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && <p className="text-xs text-rose-500 mt-1">{errors.status.message}</p>}
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirm Modal */}
      {canDelete && (
        <Modal 
          isOpen={!!deleteConfirm} 
          onClose={() => setDeleteConfirm(null)} 
          title="Delete Product" 
          size="sm"
          icon={
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <IconAlertTriangle size={24} stroke={1.5} />
            </div>
          }
          description={
            <>Are you sure you want to delete <strong>{deleteConfirm?.name}</strong>? This action cannot be undone.</>
          }
          footer={
            <>
              <Button onClick={() => setDeleteConfirm(null)} variant="outline" >Cancel</Button>
              <Button onClick={() => { deleteProduct(deleteConfirm.id); setDeleteConfirm(null); }} variant="destructive" 
              >
                Delete
              </Button>
            </>
          }
        />
      )}
    </div>
  );
}
