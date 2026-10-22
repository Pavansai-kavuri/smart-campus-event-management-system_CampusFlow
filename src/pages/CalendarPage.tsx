import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../lib/api';

type CalendarViewMode = 'MONTH' | 'WEEK' | 'AGENDA';

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<CalendarViewMode>('MONTH');
  const [onlyMyEvents, setOnlyMyEvents] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  useEffect(() => {
    apiRequest('/events/calendar')
      .then((data) => setEvents(data.events || []))
      .finally(() => setLoading(false));
  }, []);

  const displayedEvents = useMemo(() => {
    return onlyMyEvents ? events.filter((e) => e.isRegistered) : events;
  }, [events, onlyMyEvents]);

  const daysInMonthGrid = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const cells: Array<{ date: Date | null; dayNumber?: number; events: any[] }> = [];
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({ date: null, events: [] });
    }

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(year, month, day);
      const dayEvents = displayedEvents.filter((e) => {
        const d = new Date(e.startDate);
        return (
          d.getFullYear() === year &&
          d.getMonth() === month &&
          d.getDate() === day
        );
      });
      cells.push({ date: cellDate, dayNumber: day, events: dayEvents });
    }
    return cells;
  }, [currentMonth, displayedEvents]);

  const weekEvents = useMemo(() => {
    const now = new Date();
    const next14 = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    return displayedEvents.filter((e) => {
      const d = new Date(e.startDate);
      return d >= new Date(now.setHours(0, 0, 0, 0)) && d <= next14;
    });
  }, [displayedEvents]);

  return (
    <div className="space-y-6">
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald">
            <CalendarIcon className="w-4 h-4" />
            Academic & Cultural Schedule
          </div>
          <h1 className="font-serif text-3xl font-bold text-content-primary mt-1">
            Campus Event Calendar
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Switch between Month, Week, and Agenda views or filter to your registered schedule.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-content-primary bg-surface-elevated px-3 py-2 rounded-xl border border-surface-border cursor-pointer">
            <input
              type="checkbox"
              checked={onlyMyEvents}
              onChange={(e) => setOnlyMyEvents(e.target.checked)}
            />
            My Registered Events Only
          </label>

          <div className="inline-flex rounded-xl bg-surface-elevated p-1 border border-surface-border">
            {(['MONTH', 'WEEK', 'AGENDA'] as CalendarViewMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === m
                    ? 'bg-emerald text-white shadow-xs'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                {m === 'MONTH' ? 'Month' : m === 'WEEK' ? 'Next 14 Days' : 'Agenda'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'MONTH' && (
        <div className="bg-surface-card rounded-2xl border border-surface-border shadow-cf-card overflow-hidden">
          <div className="p-4 border-b border-surface-border bg-surface-elevated flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-content-primary">
              {currentMonth.toLocaleDateString('en-US', {
                month: 'long',
                year: 'numeric',
              })}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                  )
                }
                aria-label="Previous Month"
                className="p-2 rounded-xl bg-surface-card border border-surface-border hover:border-champagne"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                }}
                className="px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border text-xs font-semibold"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() =>
                  setCurrentMonth(
                    new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                  )
                }
                aria-label="Next Month"
                className="p-2 rounded-xl bg-surface-card border border-surface-border hover:border-champagne"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Desktop Month Grid */}
          <div className="hidden md:grid grid-cols-7 border-b border-surface-border bg-surface-elevated text-center text-xs font-bold text-content-secondary py-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          <div className="hidden md:grid grid-cols-7 divide-x divide-y divide-surface-border">
            {daysInMonthGrid.map((cell, idx) => {
              const isToday =
                cell.date &&
                cell.date.toDateString() === new Date().toDateString();
              return (
                <div
                  key={idx}
                  className={`min-h-[120px] p-2 transition-colors ${
                    cell.date ? 'bg-surface-card' : 'bg-surface-bg/50'
                  }`}
                >
                  {cell.dayNumber && (
                    <div className="flex items-center justify-between mb-1.5">
                      <span
                        className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                          isToday
                            ? 'bg-emerald text-white'
                            : 'text-content-secondary'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    {cell.events.map((ev) => (
                      <button
                        key={ev._id}
                        type="button"
                        onClick={() => navigate(`/events/${ev._id}`)}
                        className={`w-full text-left px-2 py-1 rounded-lg text-[11px] font-semibold truncate border transition-all ${
                          ev.isRegistered
                            ? 'bg-emerald/15 text-emerald border-emerald/40'
                            : 'bg-champagne/20 text-content-primary border-champagne/40 hover:bg-champagne/30'
                        }`}
                      >
                        {ev.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile Agenda Fallback */}
          <div className="md:hidden p-4 space-y-3">
            {displayedEvents.map((ev) => (
              <div
                key={ev._id}
                onClick={() => navigate(`/events/${ev._id}`)}
                className="p-3.5 rounded-xl bg-surface-elevated border border-surface-border space-y-1 cursor-pointer"
              >
                <div className="text-xs font-bold text-emerald">
                  {new Date(ev.startDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="font-serif font-bold text-sm text-content-primary">
                  {ev.title}
                </div>
                <div className="text-xs text-content-secondary">{ev.venueName}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(viewMode === 'WEEK' || viewMode === 'AGENDA') && (
        <div className="space-y-3">
          {(viewMode === 'WEEK' ? weekEvents : displayedEvents).length === 0 ? (
            <div className="bg-surface-card rounded-2xl border border-surface-border p-10 text-center text-xs text-content-secondary">
              No scheduled events found for this timeframe.
            </div>
          ) : (
            (viewMode === 'WEEK' ? weekEvents : displayedEvents).map((ev) => (
              <div
                key={ev._id}
                onClick={() => navigate(`/events/${ev._id}`)}
                className="bg-surface-card rounded-2xl border border-surface-border p-4 sm:p-5 shadow-cf-card hover:border-champagne/60 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-surface-elevated border border-champagne/40 flex flex-col items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold uppercase text-champagne">
                      {new Date(ev.startDate).toLocaleDateString('en-US', {
                        month: 'short',
                      })}
                    </span>
                    <span className="font-serif text-xl font-bold text-content-primary">
                      {new Date(ev.startDate).getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold uppercase text-emerald">
                        {ev.category}
                      </span>
                      {ev.isRegistered && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald/15 text-emerald text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> {ev.registrationStatus}
                        </span>
                      )}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-content-primary">
                      {ev.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-content-secondary">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-champagne" />
                        {new Date(ev.startDate).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald" />
                        {ev.venueName}
                      </span>
                    </div>
                  </div>
                </div>

                <span className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-surface-border text-xs font-semibold text-content-primary self-start sm:self-center">
                  View Event
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
