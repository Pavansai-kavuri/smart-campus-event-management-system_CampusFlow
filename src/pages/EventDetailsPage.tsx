import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Heart,
  ArrowLeft,
  CheckCircle2,
  QrCode,
  ShieldCheck,
  Star,
  Tag,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { QrPassModal } from '../components/qr/QrPassModal';

export const EventDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, showToast } = useAuth();

  const [event, setEvent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/events/${id}`);
      setEvent(data.event);
    } catch (err: any) {
      showToast({
        title: 'Event not found',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadEvent();
  }, [id]);

  const handleRegister = async () => {
    if (!event) return;
    try {
      setRegistering(true);
      const res = await apiRequest<{ message: string; status: string }>(
        '/registrations',
        {
          method: 'POST',
          body: JSON.stringify({ eventId: event._id }),
        }
      );
      showToast({
        title: res.status === 'REGISTERED' ? 'Registration Confirmed!' : 'Added to Waitlist',
        description: res.message,
        variant: 'success',
      });
      await loadEvent();
    } catch (err: any) {
      showToast({
        title: 'Registration Notice',
        description: err.message,
        variant: 'warning',
      });
    } finally {
      setRegistering(false);
    }
  };

  const handleToggleSave = async () => {
    if (!event) return;
    try {
      const res = await apiRequest<{ isSaved: boolean; message: string }>(
        `/events/${event._id}/save`,
        { method: 'POST' }
      );
      setEvent((prev: any) => ({ ...prev, isSaved: res.isSaved }));
      showToast({
        title: res.isSaved ? 'Saved Event' : 'Removed Bookmark',
        description: res.message,
        variant: 'info',
      });
    } catch (err: any) {
      showToast({ title: 'Error', description: err.message, variant: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="h-96 rounded-3xl bg-surface-card border border-surface-border animate-pulse" />
    );
  }

  if (!event) {
    return (
      <div className="bg-surface-card rounded-2xl border border-surface-border p-12 text-center space-y-4">
        <h1 className="font-serif text-2xl font-bold">Event Not Found</h1>
        <button
          type="button"
          onClick={() => navigate('/explore')}
          className="px-4 py-2 rounded-xl bg-emerald text-white text-xs font-semibold"
        >
          Back to Explore Events
        </button>
      </div>
    );
  }

  const deadlinePassed = new Date(event.registrationDeadline) < new Date();
  const spotsLeft = Math.max(0, event.capacity - event.registeredCount);

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-content-secondary hover:text-content-primary"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Events
      </button>

      {/* Hero Cover Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-surface-border shadow-cf-elevated min-h-[260px] sm:min-h-[320px] flex items-end">
        <img
          src={event.coverImage || '/images/events/techfest-2026.jpg'}
          alt={event.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1E1714]/95 via-[#1E1714]/55 to-transparent" />

        <div className="relative z-10 p-6 sm:p-8 w-full flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald text-white">
                {event.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-champagne/25 text-[#EBD6AB] border border-champagne/40">
                Code: {event.code}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white">
                {event.status}
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#F8F1E7]">
              {event.title}
            </h1>
            {event.subtitle && (
              <p className="text-sm sm:text-base text-[#E7E8E2]/90">{event.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleToggleSave}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                event.isSaved
                  ? 'bg-rose-dusty text-[#1E1714] border-rose-dusty'
                  : 'bg-black/40 text-white border-white/25 hover:bg-black/60'
              }`}
            >
              <Heart className={`w-4 h-4 ${event.isSaved ? 'fill-current' : ''}`} />
              {event.isSaved ? 'Saved' : 'Save & Remind'}
            </button>

            {event.myRegistration ? (
              <button
                type="button"
                onClick={() => setQrModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-champagne text-[#1E1714] text-xs font-bold shadow-md hover:opacity-95"
              >
                <QrCode className="w-4 h-4" />
                View QR Pass ({event.myRegistration.status})
              </button>
            ) : (
              <button
                type="button"
                disabled={registering || deadlinePassed || event.status !== 'APPROVED'}
                onClick={handleRegister}
                className="px-6 py-2.5 rounded-xl bg-emerald hover:bg-emerald-600 text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                {registering
                  ? 'Confirming...'
                  : deadlinePassed
                  ? 'Deadline Passed'
                  : spotsLeft > 0
                  ? 'Register Now'
                  : 'Join Waitlist'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card space-y-4">
            <h2 className="font-serif text-xl font-bold text-content-primary">
              About This Event
            </h2>
            <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-line">
              {event.description}
            </p>

            {event.tags?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                {event.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-elevated border border-surface-border text-xs text-content-secondary"
                  >
                    <Tag className="w-3 h-3 text-champagne" />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Student Reviews & Feedback Section */}
          <section className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl font-bold text-content-primary">
                Student Feedback & Reviews
              </h2>
              <button
                type="button"
                onClick={() => navigate('/feedback')}
                className="text-xs font-semibold text-emerald hover:underline"
              >
                Submit Feedback
              </button>
            </div>

            {!event.recentFeedback || event.recentFeedback.length === 0 ? (
              <p className="text-xs text-content-secondary">
                No reviews submitted for this event yet. Be the first to share your experience after attending!
              </p>
            ) : (
              <div className="space-y-3">
                {event.recentFeedback.map((fb: any) => (
                  <div
                    key={fb._id}
                    className="p-4 rounded-xl bg-surface-elevated border border-surface-border space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-content-primary">
                        {fb.studentName}{' '}
                        {fb.department && (
                          <span className="font-normal text-content-secondary">
                            • {fb.department}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-champagne">
                        {Array.from({ length: fb.rating }).map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-content-secondary">{fb.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Logistics & Eligibility Sidebar */}
        <div className="space-y-5">
          <section className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-cf-card space-y-4">
            <h3 className="font-serif text-lg font-bold text-content-primary">
              Schedule & Venue
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-content-primary">Date</div>
                  <div className="text-content-secondary">
                    {new Date(event.startDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-content-primary">Time & Deadline</div>
                  <div className="text-content-secondary">
                    {new Date(event.startDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    –{' '}
                    {new Date(event.endDate).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                  <div className="text-[11px] text-emerald mt-0.5">
                    Registration closes:{' '}
                    {new Date(event.registrationDeadline).toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-content-primary">Venue</div>
                  <div className="text-content-secondary">{event.venueName}</div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                <div className="w-full">
                  <div className="flex justify-between font-semibold text-content-primary">
                    <span>Capacity</span>
                    <span>
                      {event.registeredCount} / {event.capacity}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-surface-elevated overflow-hidden border border-surface-border mt-1.5">
                    <div
                      className="h-full bg-emerald rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round((event.registeredCount / event.capacity) * 100)
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="text-[11px] text-content-secondary mt-1">
                    {spotsLeft} seats available • {event.waitlistCount || 0} on waitlist
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-surface-border">
                <ShieldCheck className="w-4 h-4 text-emerald shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-content-primary">Eligibility</div>
                  <div className="text-content-secondary">
                    {event.eligibility?.openToAll
                      ? 'Open to all university departments and academic years'
                      : `Restricted to ${
                          event.eligibility?.departments?.join(', ') || 'Selected Departments'
                        }`}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-surface-border">
                <CheckCircle2 className="w-4 h-4 text-champagne shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-content-primary">Organizer</div>
                  <div className="text-content-secondary">
                    {event.organizerName} ({event.organizerDepartment})
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <QrPassModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        registration={
          event.myRegistration ? { ...event.myRegistration, event } : null
        }
        studentName={user?.name || 'Pavan Sai Ram Likhith'}
      />
    </div>
  );
};
