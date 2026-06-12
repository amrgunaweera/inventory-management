import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { IconPlus, IconEdit, IconTrash, IconTag, IconAlertTriangle, IconChevronDown, IconChevronRight, IconSearch, IconFilter } from '@tabler/icons-react';
import Modal from '../components/ui/Modal';
import UpgradeBanner from '../components/ui/UpgradeBanner';
import { useInventory } from '../context/InventoryContext';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';


const COLORS = ['#6366f1','#f59e0b','#10b981','#ec4899','#f97316','#8b5cf6','#06b6d4','#ef4444','#84cc16','#14b8a6'];

const categorySchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  description: z.string().optional(),
  color: z.string(),
  parentId: z.string().nullable().optional()
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

  const [expandedNodes, setExpandedNodes] = useState({});

  // Search and filter states
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '', color: COLORS[0], parentId: 'root' }
  });
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const openAdd = (parentId ='root') => {
    const actualParentId = typeof parentId === 'string' ? parentId : 'root';
    setEditTarget(null);
    reset({ name: '', description: '', color: COLORS[0], parentId: actualParentId });
    setIsOpen(true);
  };
  const openEdit = (c) => {
    setEditTarget(c);
    reset({ name: c.name, description: c.description || '', color: c.color || COLORS[0], parentId: c.parentId || 'root' });
    setIsOpen(true);
  };
  const onValidSave = (data) => {
    const parentId = data.parentId === 'root' ? null : data.parentId;
    let level = 1;
    let path = [];

    if (parentId) {
      const parent = categories.find(c => c.id === parentId);
      if (parent) {
        level = (parent.level || 1) + 1;
        path = [...(parent.path || []), parentId];
      }
    }

    const payload = {
      ...data,
      parentId,
      level,
      path
    };

    if (editTarget) {
      updateCategory(editTarget.id, payload);
    } else {
      addCategory(payload);
    }
    setIsOpen(false);
  };

  const productCount = (catName) => products.filter(p => p.category === catName).length;

  const toggleExpand = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const buildTree = (cats) => {
    const childrenMap = {};
    cats.forEach(c => {
      const pId = c.parentId || 'root';
      if (!childrenMap[pId]) childrenMap[pId] = [];
      childrenMap[pId].push(c);
    });

    const buildNode = (cat) => ({
      ...cat,
      children: childrenMap[cat.id] ? childrenMap[cat.id].map(buildNode) : []
    });

    return (childrenMap['root'] || []).map(buildNode);
  };

  const categoryTree = buildTree(categories);

  const filterTree = (nodes, query, lvlFilter) => {
    return nodes.map(node => {
      const matchQuery = !query || 
        (node.name || '').toLowerCase().includes(query.toLowerCase()) ||
        (node.description || '').toLowerCase().includes(query.toLowerCase());
      
      const matchLvl = lvlFilter === 'all' || String(node.level) === lvlFilter;
      const isSelfMatch = matchQuery && matchLvl;

      const filteredChildren = node.children ? filterTree(node.children, query, lvlFilter) : [];
      const hasMatchingChildren = filteredChildren.length > 0;

      if (isSelfMatch || hasMatchingChildren) {
        return {
          ...node,
          children: filteredChildren,
          isForceExpanded: hasMatchingChildren && (!!query || lvlFilter !== 'all')
        };
      }
      return null;
    }).filter(Boolean);
  };

  const filteredTree = filterTree(categoryTree, search, filterLevel);

  // Parent dropdown options (Levels 1 and 2 only, can't be self)
  const eligibleParents = categories.filter(c => (c.level || 1) < 3);
  const parentOptions = eligibleParents.filter(c => !editTarget || c.id !== editTarget.id);

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Product Categories</h2>
          <p className="text-xs text-slate-400 mt-0.5">{categories.length} categories</p>
        </div>
        {canCreate && (
          <Button variant="default" onClick={openAdd} >
            <IconPlus size={16} /> Add Category
          </Button>
        )}
      </div>

      <div className="card">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="relative flex-1 min-w-48">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
              placeholder="Search categories or descriptions…"
            />
          </div>

          <div className="flex items-center gap-2">
            <IconFilter size={15} className="text-slate-400" />
            <Select value={filterLevel} onValueChange={val => setFilterLevel(val)}>
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="All Levels">
                  {(val) => val === 'all' ? 'All Levels' : `Level ${val}`}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="1">Level 1 (Root)</SelectItem>
                <SelectItem value="2">Level 2</SelectItem>
                <SelectItem value="3">Level 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        {!search && filterLevel === 'all' ? null : (
          <div className="mb-4 text-xs text-slate-500">
            Found {filteredTree.length} root match{filteredTree.length !== 1 ? 'es' : ''}
          </div>
        )}

        <div className="bg-white border border-slate-100 rounded-xl p-4">
          <div className="space-y-1">
            {filteredTree.map(cat => (
              <CategoryNode 
                key={cat.id} 
                node={cat} 
                expandedNodes={expandedNodes} 
                toggleExpand={toggleExpand} 
                canEdit={canEdit} 
                canDelete={canDelete} 
                openEdit={openEdit} 
                setDeleteConfirm={setDeleteConfirm} 
                productCount={productCount}
                openAdd={openAdd}
              />
            ))}
            {filteredTree.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No matching categories found.
              </div>
            )}
          </div>
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
            <Button type="button" onClick={() => setIsOpen(false)} variant="outline"  disabled={isSubmitting}>Cancel</Button>
            <Button variant="default" type="submit" form="category-form" disabled={isSubmitting}>{editTarget ? 'Save' : 'Add'}</Button>
          </>
        }
      >
        <form id="category-form" onSubmit={handleSubmit(onValidSave)} className="space-y-4">
          <div>
            <label className="label">Parent Category</label>
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Parent Category">
                      {(val) => {
                        if (val === 'root') return'None (Root Level)';
                        const parent = categories.find(c => c.id === val);
                        if (!parent) return'';
                        return parent.level === 2 ? `— ${parent.name}` : parent.name;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="root">None (Root Level)</SelectItem>
                    {parentOptions.map(c => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.level === 2 ? `— ${c.name}` : c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
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
                <Button variant="ghost" key={c} type="button" onClick={() => setValue('color', c)}
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
            <Button onClick={() => setDeleteConfirm(null)} variant="outline" >Cancel</Button>
            <Button onClick={() => { deleteCategory(deleteConfirm.id); setDeleteConfirm(null); }} variant="destructive" >Delete</Button>
          </>
        }
      />
    </div>
  );
}

function CategoryNode({ node, expandedNodes, toggleExpand, canEdit, canDelete, openEdit, setDeleteConfirm, productCount, openAdd }) {
  const isExpanded = expandedNodes[node.id] || node.isForceExpanded;
  const hasChildren = node.children && node.children.length > 0;
  const count = productCount(node.name);
  const level = node.level || 1;
  // Increase indentation per level
  const paddingLeft = (level - 1) * 32 + 8;
  const isMaxLevel = level >= 3;

  return (
    <div className="relative">
      {/* Vertical guide line for children (rendered if expanded) */}
      {isExpanded && hasChildren && (
        <div 
          className="absolute border-l border-slate-200 z-0"
          style={{ 
            left: `${paddingLeft + 19}px`, 
            top: '36px', 
            bottom: '12px' 
          }} 
        />
      )}

      <div 
        className="relative z-10 flex items-center gap-2 py-2 px-2 hover:bg-slate-50/80 transition-colors group cursor-pointer rounded-lg" style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => hasChildren && toggleExpand(node.id)}
      >
        {/* Horizontal branch line for nested items */}
        {level > 1 && (
          <div 
            className="absolute border-b border-slate-200 z-0"
            style={{ 
              left: `${paddingLeft - 13}px`, 
              width: '12px',
              top: '50%'
            }} 
          />
        )}

        <Button   size='icon-xs' className={` rounded hover:bg-slate-200 transition-colors flex-shrink-0 ${!hasChildren && 'invisible'} `} >
          {isExpanded ? <IconChevronDown size={14} className="text-slate-500" /> : <IconChevronRight size={14} className="text-slate-500" />}
        </Button>

        <div
          className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: node.color +'15' }}
        >
          <IconTag size={14} style={{ color: node.color }} />
        </div>

        <div className="flex-1 min-w-0 flex items-center gap-3">
          <p className="font-medium text-slate-700 text-sm">{node.name}</p>
          {node.description && <p className="text-xs text-slate-400 truncate hidden sm:block max-w-[200px]">{node.description}</p>}
          <p className="text-[10px] text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{count}</p>
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
          {!isMaxLevel && canEdit && (
            <Button variant="ghost" onClick={() => openAdd(node.id)} size="icon-sm" className="rounded hover:bg-brand-50 text-slate-400 hover:text-brand-500 transition-colors" title="Add Subcategory">
              <IconPlus size={14} />
            </Button>
          )}
          {canEdit && (
            <Button variant="ghost" onClick={() => openEdit(node)} size="icon-sm" className="rounded hover:bg-brand-50 text-slate-400 hover:text-brand-500 transition-colors" title="Edit">
              <IconEdit size={14} />
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" onClick={() => setDeleteConfirm(node)} size="icon-sm" className="rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Delete">
              <IconTrash size={14} />
            </Button>
          )}
        </div>
      </div>

      {isExpanded && hasChildren && (
        <div className="flex flex-col">
          {node.children.map(child => (
            <CategoryNode 
              key={child.id} 
              node={child} 
              expandedNodes={expandedNodes} 
              toggleExpand={toggleExpand} 
              canEdit={canEdit} 
              canDelete={canDelete} 
              openEdit={openEdit} 
              setDeleteConfirm={setDeleteConfirm} 
              productCount={productCount}
              openAdd={openAdd}
            />
          ))}
        </div>
      )}
    </div>
  );
}
