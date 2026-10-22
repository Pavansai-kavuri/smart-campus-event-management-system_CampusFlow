import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Heart,
  Users,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';

export interface EventCardProps {
  event: any;
  onToggleSave?: (eventId: string) => void;
  onRegister?: (eventId: string) => void;
  registeringId?: string | null;
}

const CATEGORY_STYLES: Record<string, string> = {
  Tech: 'bg-emerald/15 text-emerald border-emerald/30',
  Workshop: 'bg-champagne/20 text-champagne-gold dark:text-champagne border-champagne/40',
  Cultural: 'bg-rose-dusty/25 text-rose-mauve border-rose-dusty/40',
  Competition: 'bg-emerald/15 text-emerald border-emerald/30',
  Sports: 'bg-semantic-info/15 text-semantic-info border-semantic-info/30',
  Academic: 'bg-champagne/20 text-champagne-gold dark:text-champagne border-champagne/40',
  Career: 'bg-rose-dusty/25 text-rose-mauve border-rose-dusty/40',
};

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onToggleSave,
  onRegister,
  registeringId,
}) => {
  const navigate = useNavigate();

  const startDate = new Date(event.startDate);
  const formattedDate = startDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const isRegistered =
    event.registrationStatus === 'REGISTERED' ||
    event.registrationStatus === 'ATTENDED' ||
    event.registrationStatus === 'WAITLISTED';

  const spotsRemaining = Math.max(0, (event.capacity || 100) - (event.registeredCount || 0));
  const fillPercent = Math.min(
    100,
    Math.round(((event.registeredCount || 0) / Math.max(1, event.capacity || 100)) * 100)
  );

  return (
    <article className="group bg-surface-card rounded-2xl border border-surface-border shadow-cf-card hover:shadow-cf-elevated hover:border-champagne/60 transition-all duration-200 flex flex-col overflow-hidden">
      {/* Cover Image Area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-elevated">
        <img
          src={event.coverImage || '/images/events/techfest-2026.jpg'}
          alt={event.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

        {/* Category Badge */}
        <span
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md bg-surface-card/90 ${
            CATEGORY_STYLES[event.category] || CATEGORY_STYLES.Tech
          }`}
        >
          {event.category}
        </span>

        {/* Favorite / Save Button */}
        {onToggleSave && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(event._id);
            }}
            aria-label={event.isSaved ? 'Remove from saved events' : 'Save event and set reminder'}
            className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all ${
              event.isSaved
                ? 'bg-rose-dusty text-[#1E1714] border-rose-dusty shadow-sm'
                : 'bg-black/40 text-white border-white/20 hover:bg-black/60'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${event.isSaved ? 'fill-current' : ''}`} />
          </button>
        )}

        {/* Title overlay on bottom of card image (matching reference editorial style) */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-end justify-between gap-2">
          <h3
            onClick={() => navigate(`/events/${event._id}`)}
            className="font-serif text-lg font-bold text-white leading-snug drop-shadow-xs cursor-pointer hover:text-champagne-light transition-colors line-clamp-1"
          >
            {event.title}
          </h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-content-secondary">
            <Calendar className="w-3.5 h-3.5 text-champagne shrink-0" />
            <span>{formattedDate}</span>
            <span className="text-surface-border">•</span>
            <Clock className="w-3.5 h-3.5 text-champagne shrink-0" />
            <span>{formattedTime}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-content-secondary">
            <MapPin className="w-3.5 h-3.5 text-emerald shrink-0" />
            <span className="truncate">{event.venueName}</span>
          </div>

          {/* Capacity & Registration Bar */}
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] text-content-secondary mb-1">
              <span className="inline-flex items-center gap-1">
                <Users className="w-3 h-3 text-champagne" />
                {event.registeredCount}/{event.capacity} registered
              </span>
              <span className="font-medium text-emerald">
                {spotsRemaining > 0 ? `${spotsRemaining} seats left` : 'Waitlist open'}
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-elevated overflow-hidden border border-surface-border">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald to-champagne transition-all"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="pt-2 border-t border-surface-border flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => navigate(`/events/${event._id}`)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-content-secondary hover:text-content-primary transition-colors"
          >
            Details
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>

          {isRegistered ? (
            <button
              type="button"
              onClick={() => navigate('/my-registrations')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald/15 text-emerald border border-emerald/30 text-xs font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              {event.registrationStatus === 'ATTENDED'
                ? 'Attended'
                : event.registrationStatus === 'WAITLISTED'
                ? 'Waitlisted'
                : 'Registered'}
            </button>
          ) : event.status === 'COMPLETED' ? (
            <span className="px-3 py-1.5 rounded-xl bg-surface-elevated text-content-secondary text-xs font-medium">
              Completed
            </span>
          ) : (
            <button
              type="button"
              disabled={registeringId === event._id}
              onClick={() =>
                onRegister ? onRegister(event._id) : navigate(`/events/${event._id}`)
              }
              className="px-3.5 py-1.5 rounded-xl bg-emerald hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
            >
              {registeringId === event._id ? 'Joining...' : 'Register'}
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
