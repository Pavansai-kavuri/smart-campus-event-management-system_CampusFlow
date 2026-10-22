import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Plus,
  Users,
  QrCode,
  Award,
  Bell,
  AlertTriangle,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DialogModal } from '../components/ui/DialogModal';

export const OrganizerDashboardPage: React.FC = () => {
  const { user, showToast, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalEvents: 0,
    approvedEvents: 0,
    pendingEvents: 0,
    totalRegistrations: 0,
    totalAttended: 0,
    attendanceRate: 0,
    certificatesIssued: 0,
  });
  const [events, setEvents] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [conflictAlert, setConflictAlert] = useState<any | null>(null);
  const [attendeesModalEvent, setAttendeesModalEvent] = useState<any | null>(null);
  const [attendeesList, setAttendeesList] = useState<any[]>([]);

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: 'Tech',
    venueId: '',
    startDate: '',
    endDate: '',
    registrationDeadline: '',
    capacity: 150,
    coverImage: '/images/events/techfest-2026.jpg',
  });

  const loadOrganizerData = async () => {
    try {
      setLoading(true);
      const [dash, venueData] = await Promise.all([
        apiRequest('/dashboard/organizer'),
        apiRequest('/venues'),
      ]);
      setStats(dash.stats || stats);
      setEvents(dash.events || []);
      const vList = venueData.venues || [];
      setVenues(vList);
      if (vList.length > 0 && !form.venueId) {
        setForm((prev) => ({ ...prev, venueId: vList[0]._id }));
      }
    } catch (err: any) {
      showToast({
        title: 'Organizer Access Required',
        description: err.message,
        variant: 'warning',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'ORGANIZER' || user?.role === 'ADMIN') {
      loadOrganizerData();
    }
  }, [user]);

  if (user?.role === 'STUDENT') {
    return (
      <div className="bg-surface-card rounded-2xl border border-surface-border p-10 text-center space-y-4">
        <Sparkles className="w-10 h-10 text-champagne mx-auto" />
        <h1 className="font-serif text-2xl font-bold">Organizer Access Required</h1>
        <p className="text-xs sm:text-sm text-content-secondary max-w-md mx-auto">
          You are currently viewing CampusFlow as a Student ({user.name}). Switch to the Organizer role to create events, check venue conflicts, and issue certificates.
        </p>
        <button
          type="button"
          onClick={() => switchDemoRole('ORGANIZER')}
          className="px-5 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold"
        >
          Switch to Organizer (Prof. Vikram Mehta)
        </button>
      </div>
    );
  }

  const openCreateModal = () => {
    setEditingEventId(null);
    setConflictAlert(null);
    const tomorrow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    const startStr = new Date(tomorrow.setHours(10, 0, 0, 0)).toISOString().slice(0, 16);
    const endStr = new Date(tomorrow.setHours(15, 0, 0, 0)).toISOString().slice(0, 16);
    const deadStr = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

    setForm({
      title: '',
      subtitle: '',
      description: '',
      category: 'Tech',
      venueId: venues[0]?._id || '',
      startDate: startStr,
      endDate: endStr,
      registrationDeadline: deadStr,
      capacity: 120,
      coverImage: '/images/events/techfest-2026.jpg',
    });
    setModalOpen(true);
  };

  const openEditModal = (ev: any) => {
    setEditingEventId(ev._id);
    setConflictAlert(null);
    setForm({
      title: ev.title,
      subtitle: ev.subtitle || '',
      description: ev.description,
      category: ev.category,
      venueId: String(ev.venueId?._id || ev.venueId),
      startDate: new Date(ev.startDate).toISOString().slice(0, 16),
      endDate: new Date(ev.endDate).toISOString().slice(0, 16),
      registrationDeadline: new Date(ev.registrationDeadline).toISOString().slice(0, 16),
      capacity: ev.capacity,
      coverImage: ev.coverImage || '/images/events/techfest-2026.jpg',
    });
    setModalOpen(true);
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setConflictAlert(null);
    try {
      const payload = {
        ...form,
        capacity: Number(form.capacity),
        startDate: new Date(form.startDate).toISOString(),
        endDate: new Date(form.endDate).toISOString(),
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
      };

      if (editingEventId) {
        await apiRequest(`/events/${editingEventId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        showToast({
          title: 'Event Updated',
          description: 'Schedule and venue reservation synced.',
          variant: 'success',
        });
      } else {
        await apiRequest('/events', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showToast({
          title: 'Event Created',
          description: 'Venue reservation verified with zero conflicts.',
          variant: 'success',
        });
      }
      setModalOpen(false);
      await loadOrganizerData();
    } catch (err: any) {
      if (err.status === 409 && err.data?.conflictReport) {
        setConflictAlert(err.data.conflictReport);
      } else {
        showToast({
          title: 'Could not save event',
          description: err.message,
          variant: 'error',
        });
      }
    }
  };

  const handleOpenAttendees = async (ev: any) => {
    setAttendeesModalEvent(ev);
    const data = await apiRequest(`/registrations/event/${ev._id}`);
    setAttendeesList(data.registrations || []);
  };

  const handleSendReminders = async (eventId: string) => {
    try {
      const res = await apiRequest<{ message: string }>(
        `/registrations/event/${eventId}/remind`,
        { method: 'POST', body: JSON.stringify({}) }
      );
      showToast({
        title: 'Reminders Dispatched',
        description: res.message,
        variant: 'success',
      });
    } catch (err: any) {
      showToast({ title: 'Reminder error', description: err.message, variant: 'error' });
    }
  };

  const handleIssueCertificates = async (eventId: string) => {
    try {
      const res = await apiRequest<{ message: string }>('/certificates/issue', {
        method: 'POST',
        body: JSON.stringify({ eventId }),
      });
      showToast({
        title: 'Certificates Issued',
        description: res.message,
        variant: 'success',
      });
      await loadOrganizerData();
    } catch (err: any) {
      showToast({
        title: 'Certificate Notice',
        description: err.message,
        variant: 'warning',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-champagne">
            <Sparkles className="w-4 h-4" />
            Organizer Command Center
          </div>
          <h1 className="font-serif text-3xl font-bold text-content-primary mt-1">
            Event Management & Operations
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Create events with real-time venue conflict detection, manage registrations, and issue verified certificates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/qr-attendance')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-xs font-semibold hover:border-champagne"
          >
            <QrCode className="w-4 h-4 text-emerald" />
            Open QR Scanner
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create New Event
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-card rounded-2xl p-4 border border-surface-border">
          <div className="text-xs text-content-secondary">Managed Events</div>
          <div className="font-serif text-3xl font-bold text-content-primary mt-1">
            {stats.totalEvents}
          </div>
          <div className="text-[11px] text-emerald mt-1">
            {stats.approvedEvents} Approved • {stats.pendingEvents} Pending
          </div>
        </div>
        <div className="bg-surface-card rounded-2xl p-4 border border-surface-border">
          <div className="text-xs text-content-secondary">Total Registrations</div>
          <div className="font-serif text-3xl font-bold text-champagne mt-1">
            {stats.totalRegistrations}
          </div>
          <div className="text-[11px] text-content-secondary mt-1">
            Across active campus events
          </div>
        </div>
        <div className="bg-surface-card rounded-2xl p-4 border border-surface-border">
          <div className="text-xs text-content-secondary">Verified Attendance</div>
          <div className="font-serif text-3xl font-bold text-emerald mt-1">
            {stats.totalAttended} ({stats.attendanceRate}%)
          </div>
          <div className="text-[11px] text-content-secondary mt-1">
            QR & Manual check-ins
          </div>
        </div>
        <div className="bg-surface-card rounded-2xl p-4 border border-surface-border">
          <div className="text-xs text-content-secondary">Certificates Issued</div>
          <div className="font-serif text-3xl font-bold text-content-primary mt-1">
            {stats.certificatesIssued}
          </div>
          <div className="text-[11px] text-content-secondary mt-1">
            Cryptographically verifiable
          </div>
        </div>
      </div>

      {/* Events Management Table */}
      <div className="bg-surface-card rounded-2xl border border-surface-border shadow-cf-card overflow-hidden">
        <div className="px-6 py-4 border-b border-surface-border bg-surface-elevated flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-content-primary">
            Events & Venue Reservations
          </h2>
          <span className="text-xs text-content-secondary">
            Click any action to manage attendees, send reminders, or issue certificates
          </span>
        </div>

        <div tabIndex={0} role="region" aria-label="Organizer Events Table" className="cf-table-wrapper">
          <table className="cf-table cf-table-responsive text-left text-xs">
            <thead className="bg-surface-elevated text-content-secondary border-b border-surface-border">
              <tr>
                <th className="py-3 px-4 font-semibold">Event</th>
                <th className="py-3 px-4 font-semibold">Venue & Schedule</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Registrations</th>
                <th className="py-3 px-4 font-semibold text-right">Organizer Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {events.map((ev) => (
                <tr key={ev._id} className="hover:bg-surface-elevated/60">
                  <th className="py-3.5 px-4 font-semibold text-content-primary">
                    <div className="font-serif text-sm font-bold">{ev.title}</div>
                    <div className="text-[11px] text-champagne">{ev.category} • {ev.code}</div>
                  </th>
                  <td data-label="Venue & Schedule" className="py-3.5 px-4 text-content-secondary">
                    <div className="font-medium text-content-primary">{ev.venueName}</div>
                    <div>{new Date(ev.startDate).toLocaleString()}</div>
                  </td>
                  <td data-label="Status" className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        ev.status === 'APPROVED'
                          ? 'bg-emerald/15 text-emerald'
                          : ev.status === 'PENDING_APPROVAL'
                          ? 'bg-champagne/25 text-champagne-gold dark:text-champagne'
                          : 'bg-surface-elevated text-content-secondary'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </td>
                  <td data-label="Registrations" className="py-3.5 px-4">
                    <div className="font-semibold text-content-primary">
                      {ev.registeredCount} / {ev.capacity}
                    </div>
                    <div className="text-[11px] text-emerald">
                      {ev.attendedCount || 0} Checked In
                    </div>
                  </td>
                  <td data-label="Actions" className="py-3.5 px-4 text-right">
                    <div className="inline-flex flex-wrap items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenAttendees(ev)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-surface-border hover:border-champagne font-semibold"
                      >
                        <Users className="w-3.5 h-3.5 text-emerald" />
                        Attendees
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendReminders(ev._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface-elevated border border-surface-border hover:border-champagne font-semibold"
                        title="Send in-app reminder to registered attendees"
                      >
                        <Bell className="w-3.5 h-3.5 text-champagne" />
                        Remind
                      </button>
                      <button
                        type="button"
                        onClick={() => handleIssueCertificates(ev._id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald/15 text-emerald border border-emerald/30 font-semibold hover:bg-emerald/25"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Issue Certs
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(ev)}
                        aria-label={`Edit ${ev.title}`}
                        className="p-1.5 rounded-lg bg-surface-elevated border border-surface-border hover:border-champagne"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Event Modal with Live Conflict Feedback */}
      <DialogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingEventId ? 'Edit Campus Event' : 'Create New Campus Event'}
        subtitle="Includes automatic setup/cleanup buffer conflict detection across university venues"
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSaveEvent} className="space-y-4">
          {conflictAlert && (
            <div className="rounded-2xl p-4 bg-semantic-error/10 border border-semantic-error/40 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-bold text-semantic-error">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Venue Scheduling Conflict Detected (Including {conflictAlert.setupBufferMinutes}m Setup / {conflictAlert.cleanupBufferMinutes}m Cleanup Buffer)
              </div>
              {conflictAlert.conflicts?.map((c: any) => (
                <div key={c.eventId} className="text-content-primary">
                  Overlaps with <strong>{c.eventTitle}</strong> ({new Date(c.startDate).toLocaleString()} – {new Date(c.endDate).toLocaleTimeString()})
                </div>
              ))}
              {conflictAlert.suggestedVenues?.length > 0 && (
                <div className="pt-1">
                  <span className="font-semibold text-emerald">Available Conflict-Free Venues: </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {conflictAlert.suggestedVenues.map((sv: any) => (
                      <button
                        key={sv._id}
                        type="button"
                        onClick={() => {
                          setForm({ ...form, venueId: sv._id });
                          setConflictAlert(null);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald text-white font-semibold"
                      >
                        Use {sv.name} (Cap: {sv.capacity})
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Event Title</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="e.g., Autonomous Robotics Workshop"
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Category</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              >
                {['Tech', 'Workshop', 'Cultural', 'Competition', 'Sports', 'Academic', 'Career'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Campus Venue</label>
              <select
                value={form.venueId}
                onChange={(e) => setForm({ ...form, venueId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              >
                {venues.map((v) => (
                  <option key={v._id} value={v._id}>
                    {v.name} (Max Cap: {v.capacity})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Seat Capacity</label>
              <input
                type="number"
                min={5}
                required
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">Start Date & Time</label>
              <input
                type="datetime-local"
                required
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">End Date & Time</label>
              <input
                type="datetime-local"
                required
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Registration Deadline</label>
              <input
                type="datetime-local"
                required
                value={form.registrationDeadline}
                onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Cover Artwork Preset</label>
            <select
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
            >
              <option value="/images/events/techfest-2026.jpg">Tech Symposium Auditorium</option>
              <option value="/images/events/design-sprint.jpg">Design Studio Collaborative</option>
              <option value="/images/events/cultural-night.jpg">Heritage Amphitheater Festival</option>
              <option value="/images/events/hackathon.jpg">Innovation Lab Hackathon</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1">Event Description</label>
            <textarea
              rows={3}
              required
              minLength={15}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-surface-border text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald text-white text-xs font-semibold"
            >
              {editingEventId ? 'Save Changes' : 'Verify Venue & Submit Event'}
            </button>
          </div>
        </form>
      </DialogModal>

      {/* Attendees List Modal */}
      <DialogModal
        open={Boolean(attendeesModalEvent)}
        onClose={() => setAttendeesModalEvent(null)}
        title={`Registered Attendees — ${attendeesModalEvent?.title || ''}`}
        subtitle={`${attendeesList.length} student record(s) found`}
        maxWidthClass="max-w-2xl"
      >
        <div className="space-y-3">
          {attendeesList.length === 0 ? (
            <p className="text-xs text-content-secondary text-center py-6">
              No student registrations recorded for this event yet.
            </p>
          ) : (
            attendeesList.map((reg) => (
              <div
                key={reg._id}
                className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border flex flex-wrap items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-content-primary">
                    {reg.student?.name || 'Student'}{' '}
                    <span className="font-mono text-champagne">
                      ({reg.student?.rollNumber || 'N/A'})
                    </span>
                  </div>
                  <div className="text-content-secondary">
                    {reg.student?.email} • {reg.student?.department}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] bg-surface-card px-2 py-1 rounded border border-surface-border">
                    {reg.qrToken}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                      reg.status === 'ATTENDED'
                        ? 'bg-emerald/15 text-emerald'
                        : 'bg-champagne/25 text-champagne-gold dark:text-champagne'
                    }`}
                  >
                    {reg.status === 'ATTENDED' && <CheckCircle2 className="w-3 h-3" />}
                    {reg.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogModal>
    </div>
  );
};
