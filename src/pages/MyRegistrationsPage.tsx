import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Ticket,
  QrCode,
  Award,
  Calendar,
  MapPin,
  XCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { QrPassModal } from '../components/qr/QrPassModal';

type TabFilter = 'ALL' | 'UPCOMING' | 'ATTENDED' | 'WAITLISTED' | 'CANCELLED';

export const MyRegistrationsPage: React.FC = () => {
  const { user, showToast } = useAuth();
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>('ALL');
  const [selectedPass, setSelectedPass] = useState<any | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/registrations/my');
      setRegistrations(data.registrations || []);
    } catch (err: any) {
      showToast({
        title: 'Could not load registrations',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, [user]);

  const handleCancel = async (regId: string) => {
    try {
      setCancellingId(regId);
      const res = await apiRequest<{ message: string }>(`/registrations/${regId}/cancel`, {
        method: 'POST',
      });
      showToast({
        title: 'Registration Cancelled',
        description: res.message,
        variant: 'info',
      });
      await loadRegistrations();
    } catch (err: any) {
      showToast({
        title: 'Unable to cancel',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setCancellingId(null);
    }
  };

  const filtered = useMemo(() => {
    const now = new Date();
    return registrations.filter((r) => {
      if (tab === 'ALL') return true;
      if (tab === 'UPCOMING') {
        return (
          r.status === 'REGISTERED' &&
          r.event?.endDate &&
          new Date(r.event.endDate) >= now
        );
      }
      if (tab === 'ATTENDED') return r.status === 'ATTENDED';
      if (tab === 'WAITLISTED') return r.status === 'WAITLISTED';
      if (tab === 'CANCELLED') return r.status === 'CANCELLED';
      return true;
    });
  }, [registrations, tab]);

  return (
    <div className="space-y-6">
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald">
            <Ticket className="w-4 h-4" />
            Student Event Passes & Attendance
          </div>
          <h1 className="font-serif text-3xl font-bold text-content-primary mt-1">
            My Registrations
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Access your verified QR entry passes, track check-in status, and download earned certificates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="px-4 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600 transition-colors self-start sm:self-auto"
        >
          Discover More Events
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {(
          [
            { id: 'ALL', label: 'All Registrations' },
            { id: 'UPCOMING', label: 'Upcoming Passes' },
            { id: 'ATTENDED', label: 'Attended / Completed' },
            { id: 'WAITLISTED', label: 'Waitlisted' },
            { id: 'CANCELLED', label: 'Cancelled' },
          ] as { id: TabFilter; label: string }[]
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              tab === item.id
                ? 'bg-emerald text-white shadow-xs'
                : 'bg-surface-card text-content-secondary hover:text-content-primary border border-surface-border'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Registrations List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-32 rounded-2xl bg-surface-card border border-surface-border animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-surface-card rounded-2xl border border-surface-border p-12 text-center space-y-3">
          <Ticket className="w-8 h-8 text-champagne mx-auto" />
          <h2 className="font-serif text-xl font-bold text-content-primary">
            No registrations in this view
          </h2>
          <p className="text-xs text-content-secondary max-w-md mx-auto">
            Register for upcoming campus workshops, hackathons, or cultural events to generate your instant QR entry pass.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map((reg) => {
            const ev = reg.event || {};
            return (
              <div
                key={reg._id}
                className="bg-surface-card rounded-2xl border border-surface-border shadow-cf-card p-5 flex flex-col justify-between gap-4 hover:border-champagne/60 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={ev.coverImage || '/images/events/techfest-2026.jpg'}
                    alt={ev.title}
                    className="w-24 h-24 rounded-xl object-cover shrink-0 border border-surface-border"
                  />
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-champagne uppercase tracking-wider">
                        {ev.category}
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          reg.status === 'ATTENDED'
                            ? 'bg-emerald/15 text-emerald border border-emerald/30'
                            : reg.status === 'REGISTERED'
                            ? 'bg-champagne/25 text-champagne-gold dark:text-champagne border border-champagne/40'
                            : reg.status === 'WAITLISTED'
                            ? 'bg-semantic-warning/15 text-semantic-warning'
                            : 'bg-semantic-error/15 text-semantic-error'
                        }`}
                      >
                        {reg.status === 'ATTENDED' && <CheckCircle2 className="w-3 h-3" />}
                        {reg.status === 'REGISTERED' && <Clock className="w-3 h-3" />}
                        {reg.status}
                      </span>
                    </div>

                    <h3
                      onClick={() => navigate(`/events/${ev._id}`)}
                      className="font-serif text-lg font-bold text-content-primary hover:text-emerald cursor-pointer truncate"
                    >
                      {ev.title}
                    </h3>

                    <div className="text-xs text-content-secondary flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-champagne shrink-0" />
                      <span>
                        {ev.startDate
                          ? new Date(ev.startDate).toLocaleString([], {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : 'TBA'}
                      </span>
                    </div>

                    <div className="text-xs text-content-secondary flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald shrink-0" />
                      <span className="truncate">{ev.venueName}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-surface-border flex flex-wrap items-center justify-between gap-2">
                  <div className="font-mono text-[11px] text-content-secondary">
                    Pass: <strong className="text-content-primary">{reg.qrToken}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {reg.status !== 'CANCELLED' && (
                      <button
                        type="button"
                        onClick={() => setSelectedPass(reg)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        QR Pass
                      </button>
                    )}

                    {reg.certificate && (
                      <button
                        type="button"
                        onClick={() => navigate('/certificates')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-champagne text-[#1E1714] text-xs font-bold hover:opacity-95"
                      >
                        <Award className="w-3.5 h-3.5" />
                        Certificate
                      </button>
                    )}

                    {(reg.status === 'REGISTERED' || reg.status === 'WAITLISTED') && (
                      <button
                        type="button"
                        disabled={cancellingId === reg._id}
                        onClick={() => handleCancel(reg._id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-semantic-error/40 text-semantic-error text-xs font-semibold hover:bg-semantic-error/10 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        {cancellingId === reg._id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate(`/events/${ev._id}`)}
                      aria-label="Event Details"
                      className="p-1.5 rounded-lg border border-surface-border text-content-secondary hover:text-content-primary"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <QrPassModal
        open={Boolean(selectedPass)}
        onClose={() => setSelectedPass(null)}
        registration={selectedPass}
        studentName={user?.name || 'Pavan Sai Ram Likhith'}
      />
    </div>
  );
};
