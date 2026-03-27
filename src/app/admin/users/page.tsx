'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
  Trash2,
  Edit3,
  X,
  Users,
  BarChart3,
  Globe,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';

interface UserRow {
  id: string;
  email: string;
  role: string;
  is_active: boolean;
  onboarding_completed: boolean;
  last_login_at: string | null;
  created_at: string;
  agency: {
    id: string;
    name: string;
    subdomain: string | null;
    plan: string;
    is_active: boolean;
    reports_generated_this_month: number;
    plan_report_limit: number;
    plan_client_limit: number;
  } | null;
  stats: {
    clients: number;
    reports: number;
    connections: number;
  };
}

interface DetailData {
  user: any;
  clients: any[];
  reports: any[];
  connections: any[];
  recentAudit: any[];
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail panel
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [detail, setDetail] = useState<DetailData | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modals
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({ plan: '', plan_report_limit: 0, plan_client_limit: 0, role: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20', search });
      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchDetail = async (userId: string) => {
    setSelectedUser(userId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`);
      if (!res.ok) throw new Error('Failed to fetch user detail');
      const data = await res.json();
      setDetail(data);
      // Pre-fill edit form
      const agency = data.user?.agency;
      setEditForm({
        plan: agency?.plan || 'starter',
        plan_report_limit: agency?.plan_report_limit || 2,
        plan_client_limit: agency?.plan_client_limit || 5,
        role: data.user?.role || 'admin',
      });
    } catch {
      toast.error('Failed to load user details');
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!res.ok) throw new Error('Failed to update');
      toast.success(currentActive ? 'User access revoked' : 'User access restored');
      fetchUsers();
      if (selectedUser === userId) fetchDetail(userId);
    } catch {
      toast.error('Sync failed');
    } finally {
      setActionLoading(false);
    }
  };

  const saveEdits = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('User updated');
      setShowEditModal(false);
      fetchUsers();
      fetchDetail(selectedUser);
    } catch {
      toast.error('Failed to save changes');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${selectedUser}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE_USER_AND_ALL_DATA' }),
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('User permanently deleted');
      setShowDeleteModal(false);
      setSelectedUser(null);
      setDetail(null);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const planBadgeColor: Record<string, string> = {
    starter: '#64748b',
    growth: '#2563eb',
    pro: '#7c3aed',
    enterprise: '#0f172a',
  };

  const formatDate = (d: string | null) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f172a' }}>User Management</h1>
          <p className="text-sm mt-1" style={{ color: '#64748b' }}>{total} total users across all agencies</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: '#94a3b8' }} />
        <input
          placeholder="Search by email or agency name..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full h-10 pl-10 pr-4 rounded-xl border text-sm outline-none transition-all focus:ring-2 focus:ring-slate-200"
          style={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
        />
      </div>

      {/* Content area: table + detail panel */}
      <div className="flex gap-4">
        {/* Table */}
        <div className={`flex-1 rounded-2xl border overflow-hidden ${selectedUser ? 'max-w-[60%]' : ''}`} style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: '#64748b' }} />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                      {['Email', 'Agency', 'Plan', 'Clients', 'Reports', 'Status', 'Last Active'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: '#64748b' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => fetchDetail(u.id)}
                        className="cursor-pointer transition-colors hover:bg-slate-50"
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          background: selectedUser === u.id ? '#f8fafc' : 'transparent',
                        }}
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold truncate max-w-[200px]" style={{ color: '#0f172a' }}>{u.email}</div>
                          <div className="text-[10px] font-mono mt-0.5" style={{ color: '#94a3b8' }}>{u.role}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium truncate max-w-[140px]" style={{ color: '#334155' }}>{u.agency?.name || '—'}</div>
                          {u.agency?.subdomain && (
                            <div className="text-[10px] font-mono mt-0.5" style={{ color: '#94a3b8' }}>{u.agency.subdomain}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase text-white" style={{ background: planBadgeColor[u.agency?.plan || 'starter'] }}>
                            {u.agency?.plan || 'starter'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium" style={{ color: '#334155' }}>{u.stats.clients}</td>
                        <td className="px-4 py-3 font-medium" style={{ color: '#334155' }}>{u.stats.reports}</td>
                        <td className="px-4 py-3">
                          {u.is_active ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase" style={{ color: '#16a34a' }}>
                              <CheckCircle2 className="h-3 w-3" /> Active
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase" style={{ color: '#dc2626' }}>
                              <ShieldOff className="h-3 w-3" /> Revoked
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: '#94a3b8' }}>{formatDate(u.last_login_at)}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: '#94a3b8' }}>
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                <span className="text-xs" style={{ color: '#64748b' }}>Page {page} of {totalPages}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border transition-colors hover:bg-slate-50 disabled:opacity-30"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <ChevronLeft className="h-4 w-4" style={{ color: '#64748b' }} />
                  </button>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border transition-colors hover:bg-slate-50 disabled:opacity-30"
                    style={{ borderColor: '#e2e8f0' }}
                  >
                    <ChevronRight className="h-4 w-4" style={{ color: '#64748b' }} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Detail Panel */}
        {selectedUser && (
          <div className="w-[40%] rounded-2xl border overflow-hidden shrink-0" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
            {detailLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-5 w-5 animate-spin" style={{ color: '#64748b' }} />
              </div>
            ) : detail ? (
              <div className="divide-y" style={{ borderColor: '#f1f5f9' }}>
                {/* User Header */}
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold" style={{ color: '#0f172a' }}>{detail.user?.email}</h3>
                      <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>
                        {detail.user?.agency?.name || 'No Agency'} · {detail.user?.role}
                      </p>
                    </div>
                    <button onClick={() => { setSelectedUser(null); setDetail(null); }} className="p-1 rounded-lg hover:bg-slate-100 transition-colors">
                      <X className="h-4 w-4" style={{ color: '#94a3b8' }} />
                    </button>
                  </div>

                  {/* Quick stats */}
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                      { icon: Users, label: 'Clients', value: detail.clients.length },
                      { icon: BarChart3, label: 'Reports', value: detail.reports.length },
                      { icon: Globe, label: 'Connections', value: detail.connections.length },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl border p-3 text-center" style={{ borderColor: '#e2e8f0' }}>
                        <s.icon className="h-4 w-4 mx-auto mb-1" style={{ color: '#64748b' }} />
                        <div className="text-lg font-bold" style={{ color: '#0f172a' }}>{s.value}</div>
                        <div className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#94a3b8' }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="p-5 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>Actions</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleUserActive(selectedUser!, detail.user?.is_active)}
                      disabled={actionLoading}
                      className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-semibold transition-all border"
                      style={{
                        borderColor: detail.user?.is_active ? '#fca5a5' : '#86efac',
                        color: detail.user?.is_active ? '#dc2626' : '#16a34a',
                        background: detail.user?.is_active ? '#fef2f2' : '#f0fdf4',
                      }}
                    >
                      {detail.user?.is_active ? <><ShieldOff className="h-3.5 w-3.5" /> Revoke</> : <><Shield className="h-3.5 w-3.5" /> Restore</>}
                    </button>
                    <button
                      onClick={() => setShowEditModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 h-9 rounded-xl text-xs font-semibold transition-all border"
                      style={{ borderColor: '#e2e8f0', color: '#334155' }}
                    >
                      <Edit3 className="h-3.5 w-3.5" /> Modify
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="flex items-center justify-center gap-2 h-9 px-3 rounded-xl text-xs font-semibold transition-all"
                      style={{ background: '#dc2626', color: '#ffffff' }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Recent Reports */}
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>Recent Reports</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {detail.reports.length === 0 && (
                      <p className="text-xs italic" style={{ color: '#94a3b8' }}>No reports yet</p>
                    )}
                    {detail.reports.slice(0, 8).map((r: any) => (
                      <div key={r.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: '#f8fafc' }}>
                        <div className="text-xs truncate" style={{ color: '#334155' }}>{r.client?.name || 'Unknown'}</div>
                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded" style={{
                          color: r.status === 'sent' ? '#16a34a' : r.status === 'failed' ? '#dc2626' : '#64748b',
                          background: r.status === 'sent' ? '#f0fdf4' : r.status === 'failed' ? '#fef2f2' : '#f1f5f9',
                        }}>
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connections */}
                <div className="p-5">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: '#64748b' }}>Connections</p>
                  <div className="space-y-1.5">
                    {detail.connections.length === 0 && (
                      <p className="text-xs italic" style={{ color: '#94a3b8' }}>No connections</p>
                    )}
                    {detail.connections.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg" style={{ background: '#f8fafc' }}>
                        <span className="text-xs font-semibold uppercase" style={{ color: '#334155' }}>{c.platform}</span>
                        <span className="text-[9px] font-bold uppercase" style={{ color: c.status === 'connected' ? '#16a34a' : '#dc2626' }}>{c.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* ── Delete Confirmation Modal ──────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-4" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: '#fef2f2' }}>
                <AlertTriangle className="h-5 w-5" style={{ color: '#dc2626' }} />
              </div>
              <div>
                <h3 className="text-base font-bold" style={{ color: '#0f172a' }}>Delete User Permanently</h3>
                <p className="text-xs" style={{ color: '#64748b' }}>This action cannot be undone.</p>
              </div>
            </div>
            <div className="rounded-xl p-3 text-xs" style={{ background: '#fef2f2', color: '#991b1b' }}>
              This will permanently delete the user, their agency, all reports, clients, connections, and all associated data.
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 h-10 rounded-xl text-sm font-semibold border transition-colors hover:bg-slate-50" style={{ borderColor: '#e2e8f0', color: '#334155' }}>
                Cancel
              </button>
              <button onClick={deleteUser} disabled={actionLoading} className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all disabled:opacity-50" style={{ background: '#dc2626', color: '#ffffff' }}>
                {actionLoading ? 'Deleting...' : 'Delete Everything'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Modal ──────────────────────────────────────── */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl border p-6 space-y-4" style={{ background: '#ffffff', borderColor: '#e2e8f0' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: '#0f172a' }}>Modify User Limits</h3>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-lg hover:bg-slate-100"><X className="h-4 w-4" style={{ color: '#94a3b8' }} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Plan</label>
                <select
                  value={editForm.plan}
                  onChange={e => setEditForm({ ...editForm, plan: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
                >
                  {['starter', 'growth', 'pro', 'enterprise'].map(p => (
                    <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Report Limit/mo</label>
                  <input
                    type="number"
                    value={editForm.plan_report_limit}
                    onChange={e => setEditForm({ ...editForm, plan_report_limit: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none text-center"
                    style={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Client Limit</label>
                  <input
                    type="number"
                    value={editForm.plan_client_limit}
                    onChange={e => setEditForm({ ...editForm, plan_client_limit: parseInt(e.target.value) || 1 })}
                    className="w-full h-10 px-3 rounded-xl border text-sm outline-none text-center"
                    style={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#64748b' }}>Role</label>
                <select
                  value={editForm.role}
                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                  style={{ background: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }}
                >
                  {['admin', 'member', 'superadmin'].map(r => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowEditModal(false)} className="flex-1 h-10 rounded-xl text-sm font-semibold border transition-colors hover:bg-slate-50" style={{ borderColor: '#e2e8f0', color: '#334155' }}>
                Cancel
              </button>
              <button onClick={saveEdits} disabled={actionLoading} className="flex-1 h-10 rounded-xl text-sm font-semibold transition-all disabled:opacity-50" style={{ background: '#0f172a', color: '#ffffff' }}>
                {actionLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
