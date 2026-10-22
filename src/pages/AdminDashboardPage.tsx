import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  ShieldCheck,
  Calendar,
  Users,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const CHART_COLORS = ['#178855', '#C5A168', '#D49E9E', '#4DAE8B', '#9E5E78', '#B08A01'];

export const AdminDashboardPage: React.FC = () => {
  const { user, showToast, switchDemoRole } = useAuth();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [data, setData] = useState<any>({
    stats: {
      totalEvents: 0,
      totalStudents: 0,
      activeEvents: 0,
      pendingApprovals: 0,
      totalRegistrations: 0,
      totalAttendance: 0,
      attendanceRate: 0,
      totalCertificates: 0,
    },
    categoryDistribution: [],
    departmentBreakdown: [],
    eventPerformance: [],
    pendingEvents: [],
    recentRegistrations: [],
    recentAuditLogs: [],
  });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'APPROVALS' | 'USERS' | 'AUDIT'>(
    'ANALYTICS'
  );
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const [dash, uData] = await Promise.all([
        apiRequest(`/dashboard/admin?category=${encodeURIComponent(categoryFilter)}`),
        apiRequest('/dashboard/admin/users'),
      ]);
      setData(dash);
      setUsersList(uData.users || []);
    } catch (err: any) {
      showToast({
        title: 'Admin Authorization Required',
        description: err.message,
        variant: 'warning',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      loadAdminData();
    }
  }, [user, categoryFilter]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="bg-surface-card rounded-2xl border border-surface-border p-10 text-center space-y-4">
        <ShieldCheck className="w-10 h-10 text-champagne mx-auto" />
        <h1 className="font-serif text-2xl font-bold">Administrator Access Required</h1>
        <p className="text-xs sm:text-sm text-content-secondary max-w-md mx-auto">
          Switch to the Administrator role (Dr. Aaravind Krishnan) to view university-wide analytics, approve pending events, and manage user roles.
        </p>
        <button
          type="button"
          onClick={() => switchDemoRole('ADMIN')}
          className="px-5 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold"
        >
          Switch to Admin Role (Dr. Aaravind Krishnan)
        </button>
      </div>
    );
  }

  const handleApprovalDecision = async (
    eventId: string,
    decision: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      const res = await apiRequest<{ message: string }>(
        `/dashboard/admin/events/${eventId}/decision`,
        {
          method: 'POST',
          body: JSON.stringify({
            decision,
            notes:
              decision === 'APPROVED'
                ? 'Approved by Dean of Student Affairs after venue verification.'
                : 'Returned for schedule adjustment.',
          }),
        }
      );
      showToast({
        title: `Event ${decision}`,
        description: res.message,
        variant: 'success',
      });
      await loadAdminData();
    } catch (err: any) {
      showToast({ title: 'Decision failed', description: err.message, variant: 'error' });
    }
  };

  const handleRoleChange = async (targetUserId: string, newRole: string) => {
    try {
      await apiRequest(`/dashboard/admin/users/${targetUserId}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: newRole }),
      });
      showToast({
        title: 'Role Updated',
        description: `User role updated to ${newRole}.`,
        variant: 'success',
      });
      await loadAdminData();
    } catch (err: any) {
      showToast({ title: 'Update failed', description: err.message, variant: 'error' });
    }
  };

  const kpiCards = [
    {
      label: 'Total Events',
      value: data.stats.totalEvents,
      sub: `${data.stats.totalRegistrations} total registrations`,
      icon: Calendar,
    },
    {
      label: 'Total Students',
      value: data.stats.totalStudents,
      sub: `${data.stats.totalOrganizers || 1} faculty organizers`,
      icon: Users,
    },
    {
      label: 'Active Events',
      value: data.stats.activeEvents,
      sub: `${data.stats.attendanceRate}% check-in rate`,
      icon: Activity,
    },
    {
      label: 'Pending Approvals',
      value: data.stats.pendingApprovals,
      sub: `${data.stats.totalCertificates} certificates issued`,
      icon: Clock,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Category Filter */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-champagne">
            <ShieldCheck className="w-4 h-4" />
            Executive Governance & Analytics
          </div>
          <h1 className="font-serif text-3xl font-bold text-content-primary mt-1">
            Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Live university metrics, event approval workflows, user governance, and security audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Filter analytics by category"
            className="px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-semibold"
          >
            {['All', 'Tech', 'Workshop', 'Cultural', 'Competition', 'Academic', 'Career'].map(
              (c) => (
                <option key={c} value={c}>
                  Filter Category: {c}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* 4 Reference KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-cf-card flex items-center justify-between"
            >
              <div>
                <div className="text-xs text-content-secondary">{k.label}</div>
                <div className="font-serif text-3xl font-bold text-content-primary mt-1">
                  {loading ? '—' : k.value}
                </div>
                <div className="text-[11px] text-emerald mt-1">{k.sub}</div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-emerald/15 border border-emerald/30 text-emerald flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Admin Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'ANALYTICS', label: 'Analytics & Reports' },
            {
              id: 'APPROVALS',
              label: `Event Approvals (${data.stats.pendingApprovals || 0})`,
            },
            { id: 'USERS', label: `User Management (${usersList.length})` },
            { id: 'AUDIT', label: 'Security Audit Log' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === t.id
                ? 'bg-emerald text-white shadow-xs'
                : 'bg-surface-card text-content-secondary hover:text-content-primary border border-surface-border'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bar Chart: Registrations & Capacity by Category */}
            <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-cf-card space-y-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-content-primary">
                  Registrations vs Capacity by Category
                </h2>
                <p className="text-xs text-content-secondary">
                  Real-time registration tracking across campus event categories
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.categoryDistribution || []}>
                    <XAxis dataKey="category" stroke="#888" fontSize={12} />
                    <YAxis stroke="#888" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--cf-surface)',
                        borderColor: 'var(--cf-border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Bar
                      dataKey="registrations"
                      name="Registered Students"
                      fill="#178855"
                      radius={[6, 6, 0, 0]}
                    />
                    <Bar
                      dataKey="capacity"
                      name="Total Capacity"
                      fill="#C5A168"
                      radius={[6, 6, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Category Distribution */}
            <div className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-cf-card space-y-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-content-primary">
                  Event Category Share
                </h2>
                <p className="text-xs text-content-secondary">
                  Distribution of student participation across disciplines
                </p>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.categoryDistribution || []}
                      dataKey="registrations"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label
                    >
                      {(data.categoryDistribution || []).map((_: any, idx: number) => (
                        <Cell
                          key={idx}
                          fill={CHART_COLORS[idx % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recent Registrations Table */}
          <div className="bg-surface-card rounded-2xl border border-surface-border shadow-cf-card overflow-hidden">
            <div className="px-6 py-4 border-b border-surface-border bg-surface-elevated">
              <h2 className="font-serif text-lg font-bold text-content-primary">
                Recent Student Registrations
              </h2>
            </div>
            <div tabIndex={0} role="region" aria-label="Recent Registrations" className="cf-table-wrapper">
              <table className="cf-table cf-table-responsive text-left text-xs">
                <thead className="bg-surface-elevated text-content-secondary border-b border-surface-border">
                  <tr>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {(data.recentRegistrations || []).map((r: any) => (
                    <tr key={r._id}>
                      <th className="py-3 px-4 font-semibold text-content-primary">
                        {r.studentId?.name || 'Student'}
                      </th>
                      <td data-label="Department" className="py-3 px-4 text-content-secondary">
                        {r.studentId?.department}
                      </td>
                      <td data-label="Event" className="py-3 px-4 font-medium text-content-primary">
                        {r.eventId?.title}
                      </td>
                      <td data-label="Status" className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald/15 text-emerald">
                          {r.status}
                        </span>
                      </td>
                      <td data-label="Registered At" className="py-3 px-4 text-content-secondary">
                        {new Date(r.registeredAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'APPROVALS' && (
        <div className="space-y-4">
          {(data.pendingEvents || []).length === 0 ? (
            <div className="bg-surface-card rounded-2xl border border-surface-border p-12 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald mx-auto" />
              <h2 className="font-serif text-xl font-bold">All Pending Events Reviewed</h2>
              <p className="text-xs text-content-secondary">
                There are no events waiting in the approval queue right now.
              </p>
            </div>
          ) : (
            (data.pendingEvents || []).map((ev: any) => (
              <div
                key={ev._id}
                className="bg-surface-card rounded-2xl p-6 border border-champagne/60 shadow-cf-card flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-champagne/25 text-champagne-gold dark:text-champagne text-[10px] font-bold">
                      {ev.status}
                    </span>
                    <span className="text-xs font-bold text-emerald">{ev.category}</span>
                  </div>
                  <h3 className="font-serif text-xl font-bold text-content-primary">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-content-secondary max-w-2xl">
                    {ev.description}
                  </p>
                  <div className="text-xs text-content-secondary pt-1">
                    Organizer: <strong>{ev.organizerName}</strong> • Venue:{' '}
                    <strong>{ev.venueName}</strong> • Capacity: <strong>{ev.capacity}</strong> • Date:{' '}
                    {new Date(ev.startDate).toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApprovalDecision(ev._id, 'APPROVED')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Approve Event
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApprovalDecision(ev._id, 'REJECTED')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-semantic-error/50 text-semantic-error text-xs font-semibold hover:bg-semantic-error/10"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'USERS' && (
        <div className="bg-surface-card rounded-2xl border border-surface-border shadow-cf-card overflow-hidden">
          <div className="px-6 py-4 border-b border-surface-border bg-surface-elevated">
            <h2 className="font-serif text-lg font-bold text-content-primary">
              University Directory & Role Permissions
            </h2>
          </div>
          <div tabIndex={0} role="region" aria-label="User Directory" className="cf-table-wrapper">
            <table className="cf-table cf-table-responsive text-left text-xs">
              <thead className="bg-surface-elevated text-content-secondary border-b border-surface-border">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email & Roll No</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {usersList.map((u) => (
                  <tr key={u._id}>
                    <th className="py-3 px-4 font-semibold text-content-primary">
                      {u.name}
                    </th>
                    <td data-label="Email" className="py-3 px-4 text-content-secondary">
                      {u.email} {u.rollNumber ? `(${u.rollNumber})` : ''}
                    </td>
                    <td data-label="Department" className="py-3 px-4 text-content-secondary">
                      {u.department}
                    </td>
                    <td data-label="Role" className="py-3 px-4">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u._id, e.target.value)}
                        aria-label={`Role for ${u.name}`}
                        className="px-2.5 py-1 rounded-lg bg-surface-elevated border border-surface-border font-semibold text-xs"
                      >
                        <option value="STUDENT">STUDENT</option>
                        <option value="ORGANIZER">ORGANIZER</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'AUDIT' && (
        <div className="bg-surface-card rounded-2xl border border-surface-border shadow-cf-card p-6 space-y-3">
          <h2 className="font-serif text-lg font-bold text-content-primary flex items-center gap-2">
            <FileText className="w-4 h-4 text-champagne" />
            Immutable Administrative & Attendance Audit Log
          </h2>
          <div className="divide-y divide-surface-border">
            {(data.recentAuditLogs || []).map((log: any) => (
              <div
                key={log._id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-emerald">{log.action}</span> • by{' '}
                  <strong>{log.actorName}</strong> ({log.actorRole}) on {log.targetType}
                </div>
                <div className="text-content-secondary">
                  {new Date(log.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
