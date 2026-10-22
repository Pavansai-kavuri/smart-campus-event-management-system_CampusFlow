import React, { useEffect, useState } from 'react';
import {
  Building2,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Users,
  Plus,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DialogModal } from '../components/ui/DialogModal';

export const VenuesAndConflictsPage: React.FC = () => {
  const { user, showToast } = useAuth();
  const [venues, setVenues] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Conflict Checker form state
  const [checkForm, setCheckForm] = useState({
    venueId: '',
    startDate: '',
    endDate: '',
    minCapacity: 100,
  });
  const [conflictReport, setConflictReport] = useState<any | null>(null);
  const [checking, setChecking] = useState(false);

  // Admin Create Venue Modal
  const [createVenueOpen, setCreateVenueOpen] = useState(false);
  const [venueForm, setVenueForm] = useState({
    name: '',
    code: '',
    building: '',
    floor: 'Ground Floor',
    capacity: 250,
    setupBufferMinutes: 30,
    cleanupBufferMinutes: 30,
  });

  const loadVenuesAndReservations = async () => {
    try {
      setLoading(true);
      const [vData, rData] = await Promise.all([
        apiRequest('/venues'),
        apiRequest('/venues/reservations'),
      ]);
      const vList = vData.venues || [];
      setVenues(vList);
      setReservations(rData.reservations || []);

      if (vList.length > 0 && !checkForm.venueId) {
        // Default to the first venue's upcoming booking window so user can immediately see or test conflict detection
        const firstBooking = vList[0]?.upcomingBookings?.[0];
        const defaultStart = firstBooking
          ? new Date(firstBooking.startDate).toISOString().slice(0, 16)
          : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
        const defaultEnd = firstBooking
          ? new Date(firstBooking.endDate).toISOString().slice(0, 16)
          : new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 3 * 3600 * 1000)
              .toISOString()
              .slice(0, 16);

        setCheckForm({
          venueId: vList[0]._id,
          startDate: defaultStart,
          endDate: defaultEnd,
          minCapacity: 100,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVenuesAndReservations();
  }, []);

  const handleRunConflictCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setChecking(true);
      const res = await apiRequest('/venues/check-conflict', {
        method: 'POST',
        body: JSON.stringify({
          venueId: checkForm.venueId,
          startDate: new Date(checkForm.startDate).toISOString(),
          endDate: new Date(checkForm.endDate).toISOString(),
          minCapacity: Number(checkForm.minCapacity),
        }),
      });
      setConflictReport(res.report);
    } catch (err: any) {
      showToast({
        title: 'Conflict check error',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleCreateVenue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/venues', {
        method: 'POST',
        body: JSON.stringify({
          ...venueForm,
          capacity: Number(venueForm.capacity),
          setupBufferMinutes: Number(venueForm.setupBufferMinutes),
          cleanupBufferMinutes: Number(venueForm.cleanupBufferMinutes),
          amenities: ['Projector', 'Smart Audio', 'Campus Wi-Fi'],
        }),
      });
      showToast({
        title: 'Venue Added',
        description: `${venueForm.name} is now available for scheduling.`,
        variant: 'success',
      });
      setCreateVenueOpen(false);
      await loadVenuesAndReservations();
    } catch (err: any) {
      showToast({ title: 'Error', description: err.message, variant: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald">
            <Building2 className="w-4 h-4" />
            Campus Facilities & Buffer-Aware Scheduling
          </div>
          <h1 className="font-serif text-3xl font-bold text-content-primary mt-1">
            Venue Management & Conflict Detection
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Verify time intervals with automated setup and cleanup buffers before reserving university auditoriums and labs.
          </p>
        </div>

        {user?.role === 'ADMIN' && (
          <button
            type="button"
            onClick={() => setCreateVenueOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Add Campus Venue
          </button>
        )}
      </div>

      {/* Interactive Venue Conflict Simulator */}
      <section className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card space-y-5">
        <div>
          <h2 className="font-serif text-xl font-bold text-content-primary">
            Interactive Venue Conflict Detector
          </h2>
          <p className="text-xs text-content-secondary">
            Test any venue and time window. The engine checks overlapping bookings including mandatory setup and cleanup buffers.
          </p>
        </div>

        <form
          onSubmit={handleRunConflictCheck}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-semibold mb-1">Venue</label>
            <select
              value={checkForm.venueId}
              onChange={(e) => setCheckForm({ ...checkForm, venueId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
            >
              {venues.map((v) => (
                <option key={v._id} value={v._id}>
                  {v.name} ({v.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Start Time</label>
            <input
              type="datetime-local"
              required
              value={checkForm.startDate}
              onChange={(e) => setCheckForm({ ...checkForm, startDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">End Time</label>
            <input
              type="datetime-local"
              required
              value={checkForm.endDate}
              onChange={(e) => setCheckForm({ ...checkForm, endDate: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Required Capacity</label>
            <input
              type="number"
              min={10}
              value={checkForm.minCapacity}
              onChange={(e) =>
                setCheckForm({ ...checkForm, minCapacity: Number(e.target.value) })
              }
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={checking}
            className="py-2.5 px-4 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600"
          >
            {checking ? 'Checking...' : 'Check Availability'}
          </button>
        </form>

        {conflictReport && (
          <div
            className={`p-5 rounded-2xl border space-y-3 ${
              conflictReport.hasConflict
                ? 'bg-semantic-error/10 border-semantic-error/40'
                : 'bg-emerald/10 border-emerald/40'
            }`}
          >
            <div className="flex items-center gap-2">
              {conflictReport.hasConflict ? (
                <ShieldAlert className="w-5 h-5 text-semantic-error" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald" />
              )}
              <h3 className="font-serif text-lg font-bold text-content-primary">
                {conflictReport.hasConflict
                  ? `Scheduling Conflict Detected (${conflictReport.conflicts.length} Overlapping Reservation)`
                  : 'Venue Available — No Scheduling Conflicts!'}
              </h3>
            </div>

            <div className="text-xs text-content-secondary">
              Buffer Window Checked: {conflictReport.setupBufferMinutes} min setup before start +{' '}
              {conflictReport.cleanupBufferMinutes} min cleanup after end.
            </div>

            {conflictReport.hasConflict && (
              <div className="space-y-2 text-xs">
                {conflictReport.conflicts.map((c: any) => (
                  <div
                    key={c.eventId}
                    className="p-3 rounded-xl bg-surface-card border border-surface-border"
                  >
                    <strong className="text-content-primary">{c.eventTitle}</strong> • Organized by{' '}
                    {c.organizerName} ({new Date(c.startDate).toLocaleString()} –{' '}
                    {new Date(c.endDate).toLocaleTimeString()})
                  </div>
                ))}

                {conflictReport.suggestedNextSlot && (
                  <div className="text-emerald font-semibold pt-1">
                    Suggested Next Free Slot at this Venue:{' '}
                    {new Date(conflictReport.suggestedNextSlot.startDate).toLocaleString()} –{' '}
                    {new Date(conflictReport.suggestedNextSlot.endDate).toLocaleTimeString()}
                  </div>
                )}

                {conflictReport.suggestedVenues?.length > 0 && (
                  <div className="pt-1">
                    <span className="font-semibold text-content-primary block mb-1">
                      Alternative Conflict-Free Venues for this exact time:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {conflictReport.suggestedVenues.map((sv: any) => (
                        <button
                          key={sv._id}
                          type="button"
                          onClick={() =>
                            setCheckForm((prev) => ({ ...prev, venueId: sv._id }))
                          }
                          className="px-3 py-1.5 rounded-xl bg-emerald text-white font-semibold"
                        >
                          Switch to {sv.name} (Cap: {sv.capacity})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Campus Venues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {venues.map((v) => (
          <div
            key={v._id}
            className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-cf-card flex flex-col justify-between gap-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full bg-champagne/20 text-champagne-gold dark:text-champagne text-[10px] font-bold font-mono">
                  {v.code}
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald">
                  <Users className="w-3.5 h-3.5" /> Cap: {v.capacity}
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-content-primary">{v.name}</h3>
              <p className="text-xs text-content-secondary">
                {v.building} • {v.floor}
              </p>
              <div className="text-[11px] text-content-secondary flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-champagne" />
                Buffers: {v.setupBufferMinutes}m setup / {v.cleanupBufferMinutes}m cleanup
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {(v.amenities || []).map((am: string) => (
                  <span
                    key={am}
                    className="px-2 py-0.5 rounded-md bg-surface-elevated border border-surface-border text-[10px] text-content-secondary"
                  >
                    {am}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-surface-border space-y-1.5">
              <div className="text-[11px] font-semibold text-content-primary">
                Upcoming Reservations ({v.upcomingBookings?.length || 0})
              </div>
              {(v.upcomingBookings || []).slice(0, 2).map((b: any) => (
                <div
                  key={b._id}
                  className="text-[11px] text-content-secondary flex items-center justify-between"
                >
                  <span className="truncate font-medium text-content-primary">{b.title}</span>
                  <span>{new Date(b.startDate).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <DialogModal
        open={createVenueOpen}
        onClose={() => setCreateVenueOpen(false)}
        title="Add Campus Venue"
        subtitle="Configure capacity and setup/cleanup buffer intervals"
      >
        <form onSubmit={handleCreateVenue} className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Venue Name</label>
              <input
                type="text"
                required
                value={venueForm.name}
                onChange={(e) => setVenueForm({ ...venueForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Venue Code</label>
              <input
                type="text"
                required
                value={venueForm.code}
                onChange={(e) => setVenueForm({ ...venueForm, code: e.target.value })}
                placeholder="e.g. HALL-C"
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Building</label>
              <input
                type="text"
                required
                value={venueForm.building}
                onChange={(e) => setVenueForm({ ...venueForm, building: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Max Capacity</label>
              <input
                type="number"
                required
                min={10}
                value={venueForm.capacity}
                onChange={(e) =>
                  setVenueForm({ ...venueForm, capacity: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateVenueOpen(false)}
              className="px-4 py-2 rounded-xl border border-surface-border font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald text-white font-semibold"
            >
              Create Venue
            </button>
          </div>
        </form>
      </DialogModal>
    </div>
  );
};
