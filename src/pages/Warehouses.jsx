import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { IconPlus, IconEdit, IconTrash, IconBuildingWarehouse, IconMapPin, IconAlertTriangle } from '@tabler/icons-react';
import Modal from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import { LockedOverlay } from '../components/ui/PlanGate';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {

  subscribeToWarehouses,
  addWarehouse,
  updateWarehouse,
  deleteWarehouse
} from '../lib/firestoreService';

const EMPTY = { name: '', location: '', capacity: '', status: 'active' };

export default function Warehouses() {
  const { user, hasPermission } = useAuth();
  const { hasFeature } = useSubscription();
  const orgId = user?.organizationId;
  
  const canManage = hasPermission('warehouses.manage');
  
  const [warehouses, setWarehouses] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (!orgId || !hasFeature('multiLocation')) return;
    const unsub = subscribeToWarehouses(orgId, setWarehouses);
    return () => unsub();
  }, [orgId, hasFeature]);

  if (!hasFeature('multiLocation')) {
    return <LockedOverlay feature='multiLocation' />;
  }

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY);
    setIsOpen(true);
  };
  
  const openEdit = (w) => {
    setEditTarget(w);
    setForm({ 
      name: w.name || '', 
      location: w.location || '', 
      capacity: w.capacity || '',
      status: w.status || 'active'
    });
    setIsOpen(true);
  };
  
  const handleSave = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    
    if (editTarget) {
      await updateWarehouse(orgId, editTarget.id, form);
    } else {
      await addWarehouse(orgId, form);
    }
    setIsOpen(false);
  };

  const handleDelete = async () => {
    if (!orgId || !deleteConfirm) return;
    await deleteWarehouse(orgId, deleteConfirm.id);
    setDeleteConfirm(null);
  };

  return (
    <div className="space-y-5 animate-slide-up">
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Warehouses & Locations</h2>
            <p className="text-xs text-slate-400 mt-0.5">Manage multiple storage locations and stock.</p>
          </div>
          {canManage && (
            <Button variant="default" onClick={openAdd} >
              <IconPlus size={16} /> Add Location
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map(w => (
            <div key={w.id} className="card p-5 border-slate-100 hover:border-brand-200 transition-colors group">
              <div className="flex justify-between items-start mb-3">
                <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center flex-shrink-0 text-brand-500">
                  <IconBuildingWarehouse size={20} />
                </div>
                {canManage && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" onClick={() => openEdit(w)} size="icon-sm" className="rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-500 transition-colors">
                      <IconEdit size={14} />
                    </Button>
                    <Button variant="ghost" onClick={() => setDeleteConfirm(w)} size="icon-sm" className="rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                      <IconTrash size={14} />
                    </Button>
                  </div>
                )}
              </div>
              
              <h3 className="font-bold text-slate-800">{w.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
                <IconMapPin size={14} />
                <span>{w.location || 'No location specified'}</span>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Status</span>
                  <span className={`text-xs font-semibold ${w.status === 'active' ? 'text-emerald-500' : 'text-slate-500'}`}>
                    {w.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Capacity</span>
                  <span className="text-xs font-semibold text-slate-700">{w.capacity || 'Unlimited'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {warehouses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <IconBuildingWarehouse size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">No warehouses set up yet</p>
          </div>
        )}
      </div>

      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title={editTarget ? 'Edit Warehouse' : 'Add Warehouse'} 
        size="sm"
        footer={
          <>
            <Button type="button" onClick={() => setIsOpen(false)} variant="outline" >Cancel</Button>
            <Button variant="default" type="submit" form="warehouse-form" >{editTarget ? 'Save Changes' : 'Add Location'}</Button>
          </>
        }
      >
        <form id="warehouse-form" onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="label">Location Name</label>
            <Input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Main Hub" />
          </div>
          <div>
            <label className="label">Address / Region</label>
            <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. New York, USA" />
          </div>
          <div>
            <label className="label">Max Capacity (items)</label>
            <Input type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="Leave empty for unlimited" />
          </div>
          <div>
            <label className="label">Status</label>
            <Select value={form.status} onValueChange={(val) => setForm(f => ({ ...f, status: val }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </form>
      </Modal>

      <Modal 
        isOpen={!!deleteConfirm} 
        onClose={() => setDeleteConfirm(null)} 
        title="Delete Warehouse" 
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
            <Button variant="destructive" onClick={handleDelete} >Delete</Button>
          </>
        }
      />
    </div>
  );
}
