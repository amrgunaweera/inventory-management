import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  IconBuildingStore, IconShieldLock, IconCrown, IconSettings, IconAlertTriangle, IconPlus, IconEdit
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToAllOrganizations,
  updateOrganization,
  createStoreByAdmin,
  subscribeToAllUsers,
  updateStoreByAdmin
} from '../lib/firestoreService';
import Modal from '../components/ui/Modal';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

const storeSchema = z.object({
  name: z.string().min(1, { message: "Store Name is required" }),
  type: z.enum(['Retail', 'Wholesale', 'Warehouse']),
  planId: z.enum(['free', 'pro', 'business']),
  ownerId: z.string().optional()
});

export default function PlatformStores() {
  const { hasPermission } = useAuth();
  const [stores, setStores] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggleConfirm, setToggleConfirm] = useState(null);
  const [toggling, setToggling] = useState(false);

  // Create Store states
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    control: controlCreate,
    formState: { errors: createErrors, isSubmitting: isCreating }
  } = useForm({
    resolver: zodResolver(storeSchema),
    defaultValues: { name: '', type: 'Retail', planId: 'free', ownerId: '' }
  });

  // Edit Store states
  const [editStore, setEditStore] = useState(null);

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    control: controlEdit,
    formState: { errors: editErrors, isSubmitting: isUpdating }
  } = useForm({
    resolver: zodResolver(storeSchema),
    defaultValues: { name: '', type: 'Retail', planId: 'free', ownerId: '' }
  });

  const canManage = hasPermission('platform.stores.manage');

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    const unsubOrgs = subscribeToAllOrganizations((fetchedStores) => {
      setStores(fetchedStores);
      setLoading(false);
    });

    const unsubUsers = subscribeToAllUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
    });

    return () => {
      unsubOrgs();
      unsubUsers();
    };
  }, [canManage]);

  const onValidCreateStore = async (data) => {
    try {
      await createStoreByAdmin(data);
      setIsCreateOpen(false);
      resetCreate();
    } catch (err) {
      console.error(err);
      alert('Failed to create store: ' + (err.message || err));
    }
  };

  const handleEditOpen = (s) => {
    setEditStore(s);
    resetEdit({
      name: s.name || '',
      type: s.type || (s.name?.toLowerCase().includes('wholesale') || s.name?.toLowerCase().includes('corp') ? 'Wholesale' : s.name?.toLowerCase().includes('warehouse') ? 'Warehouse' : 'Retail'),
      planId: s.planId || 'free',
      ownerId: s.ownerId || '',
    });
  };

  const onValidUpdateStore = async (data) => {
    try {
      await updateStoreByAdmin(editStore.id, data);
      setEditStore(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update store: ' + (err.message || err));
    }
  };

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <IconShieldLock size={48} className="mb-4 opacity-20 text-rose-500" />
        <p>You do not have permission to view platform stores.</p>
      </div>
    );
  }

  const handleToggleStatus = (store) => {
    setToggleConfirm(store);
  };

  const executeToggle = async () => {
    if (!toggleConfirm) return;
    setToggling(true);
    const newStatus = toggleConfirm.status === 'disabled' ? 'active' : 'disabled';
    try {
      await updateOrganization(toggleConfirm.id, { status: newStatus });
      setToggleConfirm(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update store status');
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Platform Stores</h2>
          <p className="text-xs text-slate-400 mt-0.5">Global view of all registered stores/organizations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="btn-primary"
          >
            <IconPlus size={16} /> Create Store
          </button>
          <div className="flex gap-2 items-center text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-md border border-slate-100 shadow-sm">
            <IconBuildingStore size={16} className="text-brand-500" />
            {stores.length} Total Stores
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading stores...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Store Name</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Store ID</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Type</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Plan</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Created</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stores.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm ${s.status === 'disabled' ? 'bg-slate-300' : 'bg-gradient-to-br from-brand-400 to-violet-500 shadow-brand-500/20'}`}>
                        <IconBuildingStore size={16} />
                      </div>
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <p className={`font-medium truncate ${s.status === 'disabled' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                            {s.name || 'Unnamed Store'}
                          </p>
                          {s.status === 'disabled' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">Disabled</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate flex items-center gap-1">
                          <IconCrown size={12} />
                          Owner: {s.ownerId ? (users.find(u => u.uid === s.ownerId)?.name || users.find(u => u.uid === s.ownerId)?.email || `ID: ${s.ownerId}`) : 'No Owner'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                      {s.id}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium">
                      {s.type || (s.name?.toLowerCase().includes('wholesale') || s.name?.toLowerCase().includes('corp') ? 'Wholesale' : s.name?.toLowerCase().includes('warehouse') ? 'Warehouse' : 'Retail')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-widest block w-fit bg-slate-100 text-slate-600">
                      {s.planId || 'free'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {s.createdAt?.toDate ? s.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditOpen(s)}
                        className="text-slate-400 hover:text-brand-500 transition-colors p-1"
                        title="Edit store details"
                      >
                        <IconEdit size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(s)}
                        className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${s.status === 'disabled' ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                      >
                        {s.status === 'disabled' ? 'Enable Store' : 'Disable Store'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Store Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Store"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setIsCreateOpen(false)} className="btn-secondary" disabled={isCreating}>Cancel</button>
            <button type="submit" form="create-store-form" className="btn-primary" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Store'}
            </button>
          </>
        }
      >
        <form id="create-store-form" onSubmit={handleSubmitCreate(onValidCreateStore)} className="space-y-4">
          <div>
            <label className="label">Store Name</label>
            <Input type="text" placeholder="e.g. Downtown Branch" {...registerCreate('name')} />
            {createErrors.name && <p className="text-xs text-rose-500 mt-1">{createErrors.name.message}</p>}
          </div>
          <div>
            <label className="label">Store Type</label>
            <Controller
              name="type"
              control={controlCreate}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Store Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Wholesale">Wholesale</SelectItem>
                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {createErrors.type && <p className="text-xs text-rose-500 mt-1">{createErrors.type.message}</p>}
          </div>
          <div>
            <label className="label">Subscription Plan</label>
            <Controller
              name="planId"
              control={controlCreate}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Subscription Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {createErrors.planId && <p className="text-xs text-rose-500 mt-1">{createErrors.planId.message}</p>}
          </div>
          <div>
            <label className="label">Assign Owner User (Optional)</label>
            <Controller
              name="ownerId"
              control={controlCreate}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assign Owner User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- No Owner Assigned --</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.uid}>
                        {u.name || u.email} ({u.organizationId ? `Org: ${u.organizationId}` : 'No Org'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {createErrors.ownerId && <p className="text-xs text-rose-500 mt-1">{createErrors.ownerId.message}</p>}
          </div>
        </form>
      </Modal>

      {/* Edit Store Modal */}
      <Modal
        isOpen={!!editStore}
        onClose={() => setEditStore(null)}
        title="Edit Store Details"
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setEditStore(null)} className="btn-secondary" disabled={isUpdating}>Cancel</button>
            <button type="submit" form="edit-store-form" className="btn-primary" disabled={isUpdating}>
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form id="edit-store-form" onSubmit={handleSubmitEdit(onValidUpdateStore)} className="space-y-4">
          <div>
            <label className="label">Store Name</label>
            <Input type="text" {...registerEdit('name')} />
            {editErrors.name && <p className="text-xs text-rose-500 mt-1">{editErrors.name.message}</p>}
          </div>
          <div>
            <label className="label">Store Type</label>
            <Controller
              name="type"
              control={controlEdit}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Store Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Wholesale">Wholesale</SelectItem>
                    <SelectItem value="Warehouse">Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {editErrors.type && <p className="text-xs text-rose-500 mt-1">{editErrors.type.message}</p>}
          </div>
          <div>
            <label className="label">Subscription Plan</label>
            <Controller
              name="planId"
              control={controlEdit}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Subscription Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="pro">Pro</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {editErrors.planId && <p className="text-xs text-rose-500 mt-1">{editErrors.planId.message}</p>}
          </div>
          <div>
            <label className="label">Reassign Owner User (Optional)</label>
            <Controller
              name="ownerId"
              control={controlEdit}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Reassign Owner User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- No Owner Assigned --</SelectItem>
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.uid}>
                        {u.name || u.email} ({u.organizationId ? `Org: ${u.organizationId}` : 'No Org'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {editErrors.ownerId && <p className="text-xs text-rose-500 mt-1">{editErrors.ownerId.message}</p>}
          </div>
        </form>
      </Modal>

      {/* Confirmation Modal */}
      <Modal 
        isOpen={!!toggleConfirm} 
        onClose={() => (toggling ? null : setToggleConfirm(null))} 
        title={`${toggleConfirm?.status === 'disabled' ? 'Enable' : 'Disable'} Store`} 
        size="sm"
        icon={
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <IconAlertTriangle size={24} stroke={1.5} />
          </div>
        }
        description={
          <>Are you sure you want to {toggleConfirm?.status === 'disabled' ? 'enable' : 'disable'} the store <strong>{toggleConfirm?.name}</strong>?</>
        }
        footer={
          <>
            <button
              onClick={() => setToggleConfirm(null)}
              className="btn-secondary"
              disabled={toggling}
            >
              Cancel
            </button>
            <button
              onClick={executeToggle}
              className={toggleConfirm?.status === 'disabled' ? 'btn-primary' : 'btn-danger'}
              disabled={toggling}
            >
              {toggling ? 'Processing...' : (toggleConfirm?.status === 'disabled' ? 'Enable Store' : 'Disable Store')}
            </button>
          </>
        }
      >
        {toggleConfirm?.status !== 'disabled' && (
          <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200 mt-2">
            <strong>Notice:</strong> Disabling this store will immediately prevent all of its users (excluding Super Admins) from logging in or accessing any data.
          </div>
        )}
      </Modal>
    </div>
  );
}
