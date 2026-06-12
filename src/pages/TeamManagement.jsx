import { useState, useEffect } from 'react';
import {
  IconMail, IconTrash, IconUserPlus, IconShield,
  IconCheck, IconX, IconClock, IconAlertTriangle
} from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import {
  subscribeToMembers,
  subscribeToInvitations,
  createInvitation,
  deleteInvitation,
  updateMemberRole,
  removeMember
} from '../lib/firestoreService';
import { ROLES, getRoleColorClasses } from '../lib/roles';
import Modal from '../components/ui/Modal';
import RoleBadge from '../components/ui/RoleBadge';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function TeamManagement() {
  const { user, hasPermission } = useAuth();
  const orgId = user?.organizationId;

  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'store_sales_person' });
  const [removeConfirm, setRemoveConfirm] = useState(null);

  const canManage = hasPermission('team.manage');

  useEffect(() => {
    if (!orgId || !canManage) return;

    const unsubMembers = subscribeToMembers(orgId, setMembers);
    const unsubInvites = subscribeToInvitations(orgId, setInvitations);

    return () => {
      unsubMembers();
      unsubInvites();
    };
  }, [orgId, canManage]);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!orgId) return;
    try {
      await createInvitation(orgId, {
        email: inviteForm.email,
        role: inviteForm.role,
        invitedBy: user.name || user.email,
      });
      setIsInviteOpen(false);
      setInviteForm({ email: '', role: 'store_sales_person' });
    } catch (err) {
      console.error('Failed to invite:', err);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!orgId || memberId === user.uid) return; // Prevent changing own role
    await updateMemberRole(orgId, memberId, newRole);
  };

  const handleRemoveMember = async () => {
    if (!orgId || !removeConfirm || removeConfirm === user.uid) return;
    await removeMember(orgId, removeConfirm);
    setRemoveConfirm(null);
  };

  const cancelInvite = async (inviteId) => {
    if (!orgId) return;
    await deleteInvitation(orgId, inviteId);
  };

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <IconShield size={48} className="mb-4 opacity-20" />
        <p>You do not have permission to manage the team.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-800">Team Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">Manage your organization members and roles.</p>
        </div>
        <button onClick={() => setIsInviteOpen(true)} className="btn-primary">
          <IconUserPlus size={16} /> Invite Member
        </button>
      </div>

      {/* Members List */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Member</th>
              <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Role</th>
              <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-left">Joined</th>
              <th className="px-5 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wide text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {members.map(m => (
              <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold">
                      {m.name ? m.name[0].toUpperCase() : m.email[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{m.name || 'Unnamed User'}</p>
                      <p className="text-xs text-slate-400">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {m.id === user.uid ? (
                    <RoleBadge role={m.role} />
                  ) : (
                    <Select value={m.role} onValueChange={(val) => handleRoleChange(m.id, val)}>
                      <SelectTrigger className="w-48 h-8 text-xs bg-transparent">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(ROLES).map(rKey => (
                          <SelectItem key={rKey} value={rKey}>{ROLES[rKey].label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </td>
                <td className="px-5 py-4 text-slate-500 text-xs">
                  {m.joinedAt?.toDate().toLocaleDateString() || 'Recently'}
                </td>
                <td className="px-5 py-4 text-right">
                  {m.id !== user.uid && (
                    <button
                      onClick={() => setRemoveConfirm(m.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Remove member"
                    >
                      <IconTrash size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-700">Pending Invitations</h3>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-50">
              {invitations.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <IconMail size={14} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{inv.email}</p>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wide">
                          Invited by {inv.invitedBy}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <RoleBadge role={inv.role} />
                  </td>
                  <td className="px-5 py-4">
                    <Badge variant={inv.status === 'accepted' ? 'completed' : 'pending'}>
                      {inv.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => cancelInvite(inv.id)}
                        className="text-xs text-red-500 font-medium hover:text-red-600 transition-colors"
                      >
                        Cancel Invite
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      <Modal 
        isOpen={isInviteOpen} 
        onClose={() => setIsInviteOpen(false)} 
        title="Invite Team Member" 
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setIsInviteOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" form="invite-form" className="btn-primary">Send Invite</button>
          </>
        }
      >
        <form id="invite-form" onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="label">Email Address</label>
            <Input
              type="email"
              required
              value={inviteForm.email}
              onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
              placeholder="colleague@example.com"
            />
          </div>
          <div>
            <label className="label">Assign Role</label>
            <Select
              value={inviteForm.role}
              onValueChange={val => setInviteForm(f => ({ ...f, role: val }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(ROLES).map(rKey => (
                  <SelectItem key={rKey} value={rKey}>{ROLES[rKey].label} — {ROLES[rKey].description}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </form>
      </Modal>

      {/* Remove Confirm Modal */}
      <Modal 
        isOpen={!!removeConfirm} 
        onClose={() => setRemoveConfirm(null)} 
        title="Remove Member" 
        size="sm"
        icon={
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <IconAlertTriangle size={24} stroke={1.5} />
          </div>
        }
        description="Are you sure you want to remove this member? They will lose access to the organization immediately."
        footer={
          <>
            <button onClick={() => setRemoveConfirm(null)} className="btn-secondary">Cancel</button>
            <button onClick={handleRemoveMember} className="btn-danger">Remove</button>
          </>
        }
      />
    </div>
  );
}
