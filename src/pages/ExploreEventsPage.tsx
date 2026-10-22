import React, { useEffect, useState } from 'react';
import {
  Search,
  Compass,
  Filter,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { EventCard } from '../components/events/EventCard';

const CATEGORIES = [
  'All',
  'Tech',
  'Cultural',
  'Workshop',
  'Competition',
  'Sports',
  'Academic',
  'Career',
];

export const ExploreEventsPage: React.FC = () => {
  const { showToast } = useAuth();

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('startDate');
  const [upcomingOnly, setUpcomingOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: String(page),
        limit: '8',
        sort,
      });
      if (search.trim()) params.set('search', search.trim());
      if (category !== 'All') params.set('category', category);
      if (upcomingOnly) params.set('upcomingOnly', 'true');

      const data = await apiRequest(`/events?${params.toString()}`);
      setEvents(data.events || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err: any) {
      showToast({
        title: 'Failed to load events',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [category, sort, upcomingOnly, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEvents();
  };

  const handleToggleSave = async (eventId: string) => {
    try {
      const res = await apiRequest<{ isSaved: boolean; message: string }>(
        `/events/${eventId}/save`,
        { method: 'POST' }
      );
      setEvents((prev) =>
        prev.map((ev) => (ev._id === eventId ? { ...ev, isSaved: res.isSaved } : ev))
      );
      showToast({
        title: res.isSaved ? 'Saved to Bookmarks' : 'Removed from Bookmarks',
        description: res.message,
        variant: 'info',
      });
    } catch (err: any) {
      showToast({ title: 'Could not save event', description: err.message, variant: 'error' });
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      setRegisteringId(eventId);
      const res = await apiRequest<{ status: string; message: string }>(
        '/registrations',
        {
          method: 'POST',
          body: JSON.stringify({ eventId }),
        }
      );
      showToast({
        title: res.status === 'REGISTERED' ? 'Registered!' : 'Waitlisted',
        description: res.message,
        variant: 'success',
      });
      await fetchEvents();
    } catch (err: any) {
      showToast({
        title: 'Registration Notice',
        description: err.message,
        variant: 'warning',
      });
    } finally {
      setRegisteringId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald">
            <Compass className="w-4 h-4" />
            Campus Event Directory
          </div>
          <h1 className="font-serif text-3xl font-bold text-content-primary mt-1">
            Explore University Events
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Browse technical symposia, design sprints, cultural festivals, and academic workshops across campus.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-surface-elevated border border-surface-border text-right">
            <div className="text-[11px] text-content-secondary">Matching Events</div>
            <div className="font-serif text-2xl font-bold text-emerald">{pagination.total}</div>
          </div>
        </div>
      </div>

      {/* Search, Category Chips, and Filter Controls */}
      <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-cf-card space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-content-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by event name, topic, venue, or tag..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-xs sm:text-sm text-content-primary focus:outline-none focus:border-emerald"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
          >
            Search Events
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-surface-border">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  category === cat
                    ? 'bg-emerald text-white shadow-xs'
                    : 'bg-surface-elevated text-content-secondary hover:text-content-primary border border-surface-border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-content-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={upcomingOnly}
                onChange={(e) => {
                  setUpcomingOnly(e.target.checked);
                  setPage(1);
                }}
                className="rounded border-surface-border"
              />
              Upcoming Only
            </label>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-champagne" />
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                aria-label="Sort events"
                className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-surface-border text-xs font-semibold text-content-primary"
              >
                <option value="startDate">Date: Soonest First</option>
                <option value="popular">Popularity: Most Registered</option>
                <option value="deadline">Registration Deadline</option>
                <option value="newest">Recently Added</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div
              key={n}
              className="h-80 rounded-2xl bg-surface-card border border-surface-border animate-pulse"
            />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-surface-card rounded-2xl border border-surface-border p-12 text-center space-y-3">
          <Sparkles className="w-8 h-8 text-champagne mx-auto" />
          <h2 className="font-serif text-xl font-bold text-content-primary">
            No events match your current filters
          </h2>
          <p className="text-xs text-content-secondary max-w-md mx-auto">
            Try resetting your category selection or search query to see all approved university events.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setCategory('All');
              setUpcomingOnly(false);
              setPage(1);
            }}
            className="px-4 py-2 rounded-xl bg-emerald text-white text-xs font-semibold"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {events.map((ev) => (
            <EventCard
              key={ev._id}
              event={ev}
              onToggleSave={handleToggleSave}
              onRegister={handleRegister}
              registeringId={registeringId}
            />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border text-xs font-semibold disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-xs font-semibold text-content-secondary">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-surface-card border border-surface-border text-xs font-semibold disabled:opacity-40"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
