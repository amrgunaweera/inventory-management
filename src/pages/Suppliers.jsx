import { Button } from "@/components/ui/button";
import { useState } from 'react';
import { IconPlus, IconEdit, IconTrash, IconTruck, IconSearch, IconMail, IconPhone, IconAlertTriangle } from '@tabler/icons-react';
import Modal from '../components/ui/Modal';
import { useInventory } from '../context/InventoryContext';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';


const EMPTY = { name: '', email: '', phone: '', address: '', status: 'active' };

export default function Suppliers() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useInventory();
  const { hasPermission } = useAuth();
  
  const canCreate = hasPermission('suppliers.create');
  const canEdit = hasPermission('suppliers.edit');
  const canDelete = hasPermission('suppliers.delete');

  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setIsOpen(true);
  };
  
  const openEdit = (s) => {
    setEditTarget(s);
    setForm({ 
      name: s.name || '', 
      email: s.email || '', 
      phone: s.phone || '', 
      address: s.address || '',
      status: s.status || 'active'
    });
    setIsOpen(true);
  };
  
  const handleSave = (e) => {
    e.preventDefault();
    if (editTarget) {
      updateSupplier(editTarget.id, form);
    } else {
      addSupplier(form);
    }
    setIsOpen(false);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Suppliers</h2>
            <p className="text-xs text-slate-400 mt-0.5">{suppliers.length} registered vendors</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
                placeholder="Search suppliers…"
              />
            </div>
            
            {canCreate && (
              <Button variant="default" onClick={openAdd} className="flex-shrink-0">
                <IconPlus size={16} /> Add Supplier
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(sup => (
            <div key={sup.id} className="card p-5 border-slate-100 hover:border-brand-200 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <IconTruck size={20} className="text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{sup.name}</h3>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sup.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {sup.status || 'Active'}
                    </span>
                  </div>
                </div>
                
                {(canEdit || canDelete) && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && (
                      <Button variant="ghost" onClick={() => openEdit(sup)} size="icon-sm" className="rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-500 transition-colors">
                        <IconEdit size={14} />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" onClick={() => setDeleteConfirm(sup)} size="icon-sm" className="rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                        <IconTrash size={14} />
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <IconMail size={14} className="text-slate-400" />
                  <span className="truncate">{sup.email || 'No email provided'}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <IconPhone size={14} className="text-slate-400" />
                  <span>{sup.phone || 'No phone provided'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <IconTruck size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No suppliers found</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title={editTarget ? 'Edit Supplier' : 'Add Supplier'}
        footer={
          <>
            <Button type="button" onClick={() => setIsOpen(false)} variant="outline" >Cancel</Button>
            <Button variant="default" type="submit" form="supplier-form" >{editTarget ? 'Save Changes' : 'Add Supplier'}</Button>
          </>
        }
      >
        <form id="supplier-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Company Name</label>
              <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Global Tech Supplies" />
            </div>
            <div>
              <label className="label">Email Address</label>
              <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="sales@example.com" />
            </div>
            <div>
              <label className="label">Phone Number</label>
              <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
            </div>
            <div className="col-span-2">
              <label className="label">Physical Address</label>
              <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="123 Warehouse Row, City" />
            </div>
            <div className="col-span-2">
              <label className="label">Status</label>
              <Select value={form.status} onValueChange={val => setForm(f => ({ ...f, status: val }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!deleteConfirm} 
        onClose={() => setDeleteConfirm(null)} 
        title="Delete Supplier" 
        size="sm"
        icon={
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <IconAlertTriangle size={24} stroke={1.5} />
          </div>
        }
        description={
          <>Are you sure you want to remove <strong>{deleteConfirm?.name}</strong>?</>
        }
        footer={
          <>
            <Button onClick={() => setDeleteConfirm(null)} variant="outline" >Cancel</Button>
            <Button onClick={() => { deleteSupplier(deleteConfirm.id); setDeleteConfirm(null); }} variant="destructive" >Delete</Button>
          </>
        }
      />
    </div>
  );
}
