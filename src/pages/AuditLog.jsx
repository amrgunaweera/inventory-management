import { useState, useEffect } from 'react';
import { IconClipboardList, IconSearch, IconUser } from '@tabler/icons-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToAuditLog } from '../lib/firestoreService';

export default function AuditLog() {
  const { user, hasPermission } = useAuth();
  const orgId = user?.organizationId;
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  const canView = hasPermission('settings.system');

  useEffect(() => {
    if (!orgId || !canView) return;
    const unsub = subscribeToAuditLog(orgId, setLogs);
    return () => unsub();
  }, [orgId, canView]);

  if (!canView) {
    return null; // Protected by RoleRoute anyway
  }

  const filtered = logs.filter(l => 
    l.action.toLowerCase().includes(search.toLowerCase()) || 
    l.details.toLowerCase().includes(search.toLowerCase()) ||
    l.performedBy?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-slide-up max-w-5xl">
      <div className="card">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Audit Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">Immutable record of system activities.</p>
          </div>
          <div className="relative w-64">
            <IconSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-9 text-sm py-2"
              placeholder="Search logs…"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Timestamp</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Details</th>
                <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs whitespace-nowrap">
                    {log.timestamp?.toDate().toLocaleString() || 'Just now'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {log.details}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center">
                        <IconUser size={10} className="text-brand-500" />
                      </div>
                      <span className="text-xs font-medium text-slate-700">{log.performedBy || 'System'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <IconClipboardList size={40} className="mb-3 opacity-30" />
              <p className="text-sm font-medium">No logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
