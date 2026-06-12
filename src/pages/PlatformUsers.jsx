import { Button } from "@/components/ui/button";
import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  IconTrash, IconShieldLock, IconUsers, IconEdit, IconCheck, IconX, IconAlertTriangle, IconBuildingStore, IconSearch, IconFilter, IconPlus
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToAllUsers,
  deactivateUser,
  updateUserProfile,
  subscribeToAllOrganizations,
  assignUserToStore,
  createUserByAdmin
} from '../lib/firestoreService';
import Modal from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { getRoleColorClasses, ROLES } from '../lib/roles';


const createUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  role: z.enum(['store_owner','store_sales_person','super_admin']),
  orgId: z.string().optional()
});

const editUserSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }),
  email: z.string().email({ message: 'Invalid email address' }),
});

const assignStoreSchema = z.object({
  orgId: z.string().optional(),
  role: z.enum(['store_owner','store_sales_person']).optional(),
});

export default function PlatformUsers() {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Edit state
  const [editUser, setEditUser] = useState(null);
  
  // Delete confirm state
  const [removeConfirm, setRemoveConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Assign Store states
  const [assignTarget, setAssignTarget] = useState(null);
  const [stores, setStores] = useState([]);

  const {
    register: registerAssign,
    handleSubmit: handleSubmitAssign,
    reset: resetAssign,
    watch: watchAssign,
    control: controlAssign,
    formState: { errors: assignErrors, isSubmitting: isAssigning }
  } = useForm({
    resolver: zodResolver(assignStoreSchema),
    defaultValues: { orgId: '', role: 'store_owner' }
  });

  // Filters and search states
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStore, setFilterStore] = useState('all');

  // Create User states
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const {
    register: registerCreate,
    handleSubmit: handleSubmitCreate,
    reset: resetCreate,
    watch: watchCreate,
    setValue: setCreateValue,
    control: controlCreate,
    formState: { errors: createErrors, isSubmitting: isCreating }
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: { name: '', email: '', password: '', orgId: '', role: 'store_owner' }
  });

  const createRole = watchCreate('role');

  useEffect(() => {
    if (createRole === 'super_admin') {
      setCreateValue('orgId','');
    }
  }, [createRole, setCreateValue]);

  const {
    register: registerEdit,
    handleSubmit: handleSubmitEdit,
    reset: resetEdit,
    formState: { errors: editErrors, isSubmitting: isEditing }
  } = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: { name: '', email: '' }
  });

  const canManage = hasPermission('platform.users.manage');

  const onValidCreateUser = async (data) => {
    try {
      await createUserByAdmin(data);
      setIsCreateOpen(false);
      resetCreate();
    } catch (err) {
      console.error(err);
      alert('Failed to create user: ' + (err.message || err));
    }
  };

  useEffect(() => {
    if (!canManage) {
      setLoading(false);
      return;
    }

    const unsubUsers = subscribeToAllUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
      setLoading(false);
    });

    const unsubOrgs = subscribeToAllOrganizations((fetchedStores) => {
      setStores(fetchedStores);
    });

    return () => {
      unsubUsers();
      unsubOrgs();
    };
  }, [canManage]);

  const handleAssignOpen = (u) => {
    setAssignTarget(u);
    resetAssign({
      orgId: u.organizationId || '',
      role: 'store_owner'
    });
  };

  const onValidAssignSave = async (data) => {
    if (!assignTarget) return;
    try {
      await assignUserToStore(assignTarget.uid, data.orgId || null, data.role);
      setAssignTarget(null);
    } catch (err) {
      console.error(err);
      alert('Failed to assign user: ' + (err.message || err));
    }
  };

  const handleEditOpen = (u) => {
    setEditUser(u);
    resetEdit({ name: u.name || '', email: u.email || '' });
  };

  const onValidEditSave = async (data) => {
    if (!editUser) return;
    try {
      await updateUserProfile(editUser.uid, data);
      setEditUser(null);
    } catch (err) {
      console.error('Failed to update user:', err);
      alert('Failed to update user: ' + (err.message || err));
    }
  };

  const handleDeactivate = async () => {
    if (!removeConfirm) return;
    setDeleting(true);
    try {
      await deactivateUser(removeConfirm.uid);
      setRemoveConfirm(null);
    } catch (err) {
      console.error('Failed to deactivate user:', err);
      alert('Failed to deactivate user: ' + (err.message || err));
    } finally {
      setDeleting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <IconShieldLock size={48} className="mb-4 opacity-20 text-rose-500" />
        <p>You do not have permission to view platform users.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => {
    const matchSearch = (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
                        (u.email || '').toLowerCase().includes(search.toLowerCase());
    
    const uStatus = u.status || 'active';
    const matchStatus = filterStatus === 'all' || uStatus === filterStatus;
    
    const matchStore = filterStore === 'all' || 
                       (filterStore === 'unassigned' && !u.organizationId) ||
                       (u.organizationId === filterStore);

    return matchSearch && matchStatus && matchStore;
  });

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Platform Users</h2>
          <p className="text-xs text-slate-400 mt-0.5">Global view of all registered users across all organizations.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" onClick={() => setIsCreateOpen(true)} variant="default" 
          >
            <IconPlus size={16} /> Create User
          </Button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center gap-3 bg-white">
          <div className="relative flex-1 min-w-48">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9"
              placeholder="Search users by name or email…"
            />
          </div>

          <div className="flex items-center gap-2">
            <IconFilter size={15} className="text-slate-400" />
            <Select value={filterStatus} onValueChange={val => setFilterStatus(val)}>
              <SelectTrigger className="w-[120px] text-xs h-9">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStore} onValueChange={val => setFilterStore(val)}>
              <SelectTrigger className="w-[140px] text-xs h-9">
                <SelectValue placeholder="All Stores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {stores.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name || s.id}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        {!loading && (
          <div className="px-5 py-3 bg-slate-50/50 border-b border-slate-100 text-xs text-slate-500 flex gap-4">
            <span className="font-medium">{filteredUsers.length} matching users</span>
          </div>
        )}

        {loading ? (
          <div className="p-10 text-center text-slate-400">Loading users...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">User</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Organization ID</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Joined</th>
                <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.name ? u.name[0].toUpperCase() : (u.email ? u.email[0].toUpperCase() : '?')}
                      </div>
                      <div className="min-w-0 flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-800 truncate">{u.name || 'Unnamed User'}</p>
                          {u.role && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getRoleColorClasses(u.role)}`}>
                              {ROLES[u.role]?.label || u.role}
                            </span>
                          )}
                          {u.status === 'disabled' && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold uppercase tracking-wider">Disabled</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {u.role === 'super_admin' ? (
                      <span className="text-xs text-slate-400 italic font-semibold">N/A (System Admin)</span>
                    ) : u.organizationId ? (
                      <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded">
                        {u.organizationId}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-slate-500 text-xs">
                    {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'Unknown'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {u.role !== 'super_admin' && (
                        <Button variant="ghost" type="button" onClick={() => handleAssignOpen(u)}
                          className="text-slate-400 hover:text-violet-500 transition-colors p-1"
                          title="Assign to Store"
                        >
                          <IconBuildingStore size={16} />
                        </Button>
                      )}
                      <Button variant="ghost" type="button" onClick={() => handleEditOpen(u)}
                        className="text-slate-400 hover:text-brand-500 transition-colors p-1"
                        title="Edit user profile"
                      >
                        <IconEdit size={16} />
                      </Button>
                      {u.uid !== user.uid && u.status !== 'disabled' && (
                        <Button variant="ghost" type="button" onClick={() => setRemoveConfirm(u)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Deactivate user profile"
                        >
                          <IconTrash size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      <Modal 
        isOpen={!!editUser} 
        onClose={() => setEditUser(null)} 
        title="Edit User Profile" 
        size="sm"
        footer={
          <>
            <Button type="button" onClick={() => setEditUser(null)} variant="outline" >Cancel</Button>
            <Button variant="default" type="submit" form="edit-user-form" disabled={isEditing}>Save Changes</Button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleSubmitEdit(onValidEditSave)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <Input type="text" {...registerEdit('name')} />
            {editErrors.name && <p className="text-xs text-rose-500 mt-1">{editErrors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email Address</label>
            <Input type="email" {...registerEdit('email')} />
            {editErrors.email && <p className="text-xs text-rose-500 mt-1">{editErrors.email.message}</p>}
          </div>
        </form>
      </Modal>

      {/* Assign Store Modal */}
      <Modal
        isOpen={!!assignTarget}
        onClose={() => setAssignTarget(null)}
        title="Assign User to Store"
        size="sm"
        footer={
          <>
            <Button type="button" onClick={() => setAssignTarget(null)} variant="outline"  disabled={isAssigning}>Cancel</Button>
            <Button variant="default" type="submit" form="assign-store-form" disabled={isAssigning}>
              {isAssigning ? 'Assigning...' : 'Assign User'}
            </Button>
          </>
        }
      >
        <form id="assign-store-form" onSubmit={handleSubmitAssign(onValidAssignSave)} className="space-y-4">
          <p className="text-xs text-slate-500">
            Assign <strong>{assignTarget?.name || assignTarget?.email}</strong> to a store and select their role.
          </p>
          <div>
            <label className="label">Select Store</label>
            <Controller
              name="orgId"
              control={controlAssign}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Store" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">-- Unassigned (No Store) --</SelectItem>
                    {stores.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name} (ID: {s.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {assignErrors.orgId && <p className="text-xs text-rose-500 mt-1">{assignErrors.orgId.message}</p>}
          </div>
          {watchAssign('orgId') && (
            <div>
              <label className="label">User Role</label>
              <Controller
                name="role"
                control={controlAssign}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="User Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="store_owner">Store Owner</SelectItem>
                      <SelectItem value="store_sales_person">Store Sales Person</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {assignErrors.role && <p className="text-xs text-rose-500 mt-1">{assignErrors.role.message}</p>}
            </div>
          )}
        </form>
      </Modal>

      {/* Deactivate Confirm Modal */}
      <Modal 
        isOpen={!!removeConfirm} 
        onClose={() => (deleting ? null : setRemoveConfirm(null))} 
        title="Deactivate account" 
        size="sm"
        icon={
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <IconAlertTriangle size={24} stroke={1.5} />
          </div>
        }
        description={
          <>
            Are you sure you want to deactivate the account for <strong>{removeConfirm?.email}</strong>? All of their data will be permanently removed. This action cannot be undone.
          </>
        }
        footer={
          <>
            <Button onClick={() => setRemoveConfirm(null)} variant="outline" 
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeactivate} disabled={deleting} >
              {deleting ? 'Deactivating...' : 'Deactivate'}
            </Button>
          </>
        }
      >
        <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-lg border border-amber-200 mt-2">
          <strong>Notice:</strong> This soft-deletes the user. They will remain in Firebase Auth, but will be immediately blocked from accessing any app data or functions.
        </div>
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New User"
        size="sm"
        footer={
          <>
            <Button type="button" onClick={() => setIsCreateOpen(false)} variant="outline"  disabled={isCreating}>Cancel</Button>
            <Button variant="default" type="submit" form="create-user-form" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create User'}
            </Button>
          </>
        }
      >
        <form id="create-user-form" onSubmit={handleSubmitCreate(onValidCreateUser)} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <Input type="text" placeholder="e.g. John Doe" {...registerCreate('name')} />
            {createErrors.name && <p className="text-xs text-rose-500 mt-1">{createErrors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email Address</label>
            <Input type="email" placeholder="e.g. john@example.com" {...registerCreate('email')} />
            {createErrors.email && <p className="text-xs text-rose-500 mt-1">{createErrors.email.message}</p>}
          </div>
          <div>
            <label className="label">Password</label>
            <Input type="password" placeholder="Min. 6 characters" {...registerCreate('password')} />
            {createErrors.password && <p className="text-xs text-rose-500 mt-1">{createErrors.password.message}</p>}
          </div>
          <div>
            <label className="label">User Role</label>
            <Controller
              name="role"
              control={controlCreate}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="User Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="store_owner">Store Owner</SelectItem>
                    <SelectItem value="store_sales_person">Store Sales Person</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            {createErrors.role && <p className="text-xs text-rose-500 mt-1">{createErrors.role.message}</p>}
          </div>
          
          {createRole !== 'super_admin' && (
            <div>
              <label className="label">Assign Store (Optional)</label>
              <Controller
                name="orgId"
                control={controlCreate}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Store" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Unassigned (No Store) --</SelectItem>
                      {stores.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} (ID: {s.id})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {createErrors.orgId && <p className="text-xs text-rose-500 mt-1">{createErrors.orgId.message}</p>}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
