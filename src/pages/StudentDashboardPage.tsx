import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Calendar,
  Ticket,
  Award,
  BellRing,
  Sparkles,
  QrCode,
  Megaphone,
  ArrowRight,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { apiRequest } from '../lib/api';
import { EventCard } from '../components/events/EventCard';
import { QrPassModal } from '../components/qr/QrPassModal';

const CATEGORIES = ['All', 'Tech', 'Workshop', 'Cultural', 'Competition', 'Academic', 'Career'];

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export const StudentDashboardPage: React.FC = () => {
  const { user, showToast } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingEvents: 0,
    myRegistrations: 0,
    certificates: 0,
    reminders: 0,
  });
  const [trendingEvents, setTrendingEvents] = useState<any[]>([]);
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'popular' | 'startDate'>('popular');
  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [activeQrPass, setActiveQrPass] = useState<any | null>(null);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/dashboard/student');
      setStats(data.stats);
      setTrendingEvents(data.trendingEvents || []);
      setMyRegistrations(data.myRegistrations || []);
      setAnnouncements(data.announcements || []);
      setRecommendations(data.recommendations || []);
    } catch (err: any) {
      showToast({
        title: 'Could not load dashboard metrics',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadDashboard();
    }
  }, [user]);

  const handleToggleSave = async (eventId: string) => {
    try {
      const res = await apiRequest<{ isSaved: boolean; message: string }>(
        `/events/${eventId}/save`,
        { method: 'POST' }
      );
      setTrendingEvents((prev) =>
        prev.map((e) => (e._id === eventId ? { ...e, isSaved: res.isSaved } : e))
      );
      setStats((prev) => ({
        ...prev,
        reminders: Math.max(0, prev.reminders + (res.isSaved ? 1 : -1)),
      }));
      showToast({
        title: res.isSaved ? 'Event Bookmarked' : 'Bookmark Removed',
        description: res.message,
        variant: 'info',
      });
    } catch (err: any) {
      showToast({ title: 'Action failed', description: err.message, variant: 'error' });
    }
  };

  const handleRegister = async (eventId: string) => {
    try {
      setRegisteringId(eventId);
      const res = await apiRequest<{ status: string; message: string; registration: any }>(
        '/registrations',
        {
          method: 'POST',
          body: JSON.stringify({ eventId }),
        }
      );
      showToast({
        title: res.status === 'REGISTERED' ? 'Registration Confirmed!' : 'Added to Waitlist',
        description: res.message,
        variant: 'success',
      });
      await loadDashboard();
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

  const filteredTrending = useMemo(() => {
    let list = [...trendingEvents];
    if (selectedCategory !== 'All') {
      list = list.filter((e) => e.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.venueName || '').toLowerCase().includes(q) ||
          (e.category || '').toLowerCase().includes(q)
      );
    }
    if (sortBy === 'startDate') {
      list.sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    } else {
      list.sort((a, b) => (b.registeredCount || 0) - (a.registeredCount || 0));
    }
    return list;
  }, [trendingEvents, selectedCategory, searchQuery, sortBy]);

  const statCards = [
    {
      label: 'Upcoming Events',
      value: stats.upcomingEvents,
      subtitle: 'Campus-wide active schedule',
      icon: Calendar,
      accent: 'from-emerald/20 to-emerald/5 text-emerald border-emerald/30',
      onClick: () => navigate('/explore'),
    },
    {
      label: 'My Registrations',
      value: stats.myRegistrations,
      subtitle: 'Confirmed & attended passes',
      icon: Ticket,
      accent: 'from-champagne/25 to-champagne/5 text-champagne-gold dark:text-champagne border-champagne/40',
      onClick: () => navigate('/my-registrations'),
    },
    {
      label: 'Certificates',
      value: stats.certificates,
      subtitle: 'Verified academic credentials',
      icon: Award,
      accent: 'from-rose-dusty/30 to-rose-dusty/5 text-rose-mauve border-rose-dusty/40',
      onClick: () => navigate('/certificates'),
    },
    {
      label: 'Reminders',
      value: stats.reminders,
      subtitle: 'Saved alerts & countdowns',
      icon: BellRing,
      accent: 'from-emerald/20 to-champagne/10 text-emerald border-emerald/30',
      onClick: () => navigate('/calendar'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Campus Hero Banner — Daytime vs Nighttime Campus Photography */}
      <section className="relative rounded-3xl overflow-hidden border border-surface-border shadow-cf-elevated min-h-[250px] sm:min-h-[290px] flex items-end">
        <img
          src={
            resolvedTheme === 'dark'
              ? '/images/campus-night.jpg'
              : '/images/campus-day.jpg'
          }
          alt={
            resolvedTheme === 'dark'
              ? 'CampusFlow University Illuminated Evening Campus'
              : 'CampusFlow University Sunlit Daytime Campus'
          }
          className="absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-500"
        />
        {/* Warm Editorial Overlay Gradient */}
        <div
          className={`absolute inset-0 ${
            resolvedTheme === 'dark'
              ? 'bg-gradient-to-r from-[#1E1714]/90 via-[#1E1714]/65 to-transparent'
              : 'bg-gradient-to-r from-[#18221D]/85 via-[#18221D]/55 to-transparent'
          }`}
        />

        <div className="relative z-10 p-6 sm:p-8 lg:p-10 w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-widest bg-champagne/25 text-[#F8F1E7] border border-champagne/50 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-champagne" />
              CampusFlow • Smart Student Events
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#F8F1E7] leading-tight">
              {getTimeGreeting()},
              <span className="block text-[#EBD6AB] mt-0.5">
                {user?.name || 'Pavan Sai Ram Likhith'}
              </span>
            </h1>
            <div className="pt-2.5 flex flex-wrap items-center gap-3 text-lg sm:text-xl lg:text-2xl font-serif italic text-[#F8F1E7] drop-shadow-md">
              <span className="font-medium">Discover events</span>
              <span className="text-[#EBD6AB] not-italic text-base font-sans font-bold select-none">•</span>
              <span className="font-medium">Learn</span>
              <span className="text-[#EBD6AB] not-italic text-base font-sans font-bold select-none">•</span>
              <span className="font-medium">Build</span>
              <span className="text-[#EBD6AB] not-italic text-base font-sans font-bold select-none">•</span>
              <span className="text-[#EBD6AB] font-bold not-italic tracking-normal">Belong.</span>
            </div>
          </div>

          {/* Quick Hero Pass Shortcut if student has an upcoming registration */}
          {myRegistrations.length > 0 && (
            <div className="bg-surface-card/90 backdrop-blur-md border border-champagne/50 rounded-2xl p-4 max-w-xs w-full shadow-lg">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald">
                  Next Express Pass
                </span>
                <span className="text-[10px] font-mono text-champagne font-semibold">
                  {myRegistrations[0].status}
                </span>
              </div>
              <div className="font-serif font-bold text-sm text-content-primary truncate">
                {(myRegistrations[0].eventId as any)?.title || 'TECHFEST 2026'}
              </div>
              <div className="text-xs text-content-secondary truncate mt-0.5">
                {(myRegistrations[0].eventId as any)?.venueName}
              </div>
              <button
                type="button"
                onClick={() => setActiveQrPass(myRegistrations[0])}
                className="mt-3 w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                Open QR Entry Pass
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 2. Search & Filter Controls Bar (Directly below Hero) */}
      <section className="bg-surface-card rounded-2xl p-3.5 sm:p-4 border border-surface-border shadow-cf-card flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-content-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events by title, venue, or category (e.g., TECHFEST 2026, Design Sprint, Hackathon)..."
            aria-label="Search campus events"
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs sm:text-sm text-content-primary placeholder:text-content-secondary focus:outline-none focus:border-emerald"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald text-white shadow-xs'
                  : 'bg-surface-elevated text-content-secondary hover:text-content-primary border border-surface-border'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SlidersHorizontal className="w-4 h-4 text-champagne hidden sm:block" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            aria-label="Sort trending events"
            className="px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-semibold text-content-primary focus:outline-none focus:border-emerald"
          >
            <option value="popular">Sort: Most Popular</option>
            <option value="startDate">Sort: Soonest Date</option>
          </select>
        </div>
      </section>

      {/* 3. Four Statistics Cards in a Single Horizontal Row */}
      <section aria-label="Student Dashboard Statistics" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              type="button"
              onClick={card.onClick}
              className="text-left group bg-surface-card rounded-2xl p-4 sm:p-5 border border-surface-border shadow-cf-card hover:shadow-cf-elevated hover:border-champagne/60 transition-all flex items-center justify-between gap-4"
            >
              <div>
                <div className="text-xs font-medium text-content-secondary">
                  {card.label}
                </div>
                <div className="font-serif text-3xl font-bold text-content-primary mt-1 group-hover:text-emerald transition-colors">
                  {loading ? '—' : card.value}
                </div>
                <div className="text-[11px] text-content-secondary mt-1">
                  {card.subtitle}
                </div>
              </div>
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br border flex items-center justify-center shrink-0 ${card.accent}`}
              >
                <Icon className="w-5 h-5" />
              </div>
            </button>
          );
        })}
      </section>

      {/* 4. Trending Events — Four-Column Card Layout */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl font-bold text-content-primary">
              Trending Events
            </h2>
            <p className="text-xs text-content-secondary">
              Curated campus experiences open for immediate registration
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald hover:underline"
          >
            Explore All Events
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-80 rounded-2xl bg-surface-card border border-surface-border animate-pulse p-4 flex flex-col justify-between"
              >
                <div className="h-40 rounded-xl bg-surface-elevated" />
                <div className="space-y-2">
                  <div className="h-4 w-2/3 bg-surface-elevated rounded" />
                  <div className="h-3 w-1/2 bg-surface-elevated rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredTrending.length === 0 ? (
          <div className="bg-surface-card rounded-2xl border border-surface-border p-10 text-center space-y-3">
            <p className="font-serif text-lg font-semibold text-content-primary">
              No matching events found
            </p>
            <p className="text-xs text-content-secondary max-w-md mx-auto">
              Try clearing your search filter or switching to "All" categories to view upcoming university events.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="px-4 py-2 rounded-xl bg-emerald text-white text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredTrending.slice(0, 4).map((ev) => (
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
      </section>

      {/* 5. Personalized Recommendations & Campus Notices Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        {/* Smart Event Recommendations (2 Columns) */}
        <section className="lg:col-span-2 bg-surface-card rounded-2xl border border-surface-border p-5 shadow-cf-card space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-champagne">
                <Sparkles className="w-3.5 h-3.5" />
                Personalized Discovery Engine
              </div>
              <h2 className="font-serif text-xl font-bold text-content-primary mt-0.5">
                Recommended For Your Interests
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-elevated border border-surface-border text-[10px] font-medium text-content-secondary">
              <Info className="w-3 h-3 text-champagne" />
              Local Heuristic Match
            </span>
          </div>

          {recommendations.length === 0 ? (
            <p className="text-xs text-content-secondary py-6 text-center">
              You have registered for all matching upcoming events! Update your interests in Profile to discover more.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommendations.slice(0, 2).map((rec: any) => (
                <div
                  key={rec.event._id}
                  className="rounded-2xl border border-surface-border bg-surface-elevated p-4 flex flex-col justify-between gap-3 hover:border-champagne/60 transition-colors"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald/15 text-emerald border border-emerald/30">
                        {rec.matchPercentage}% Match
                      </span>
                      <span className="text-[11px] font-semibold text-champagne">
                        {rec.event.category}
                      </span>
                    </div>
                    <h3
                      onClick={() => navigate(`/events/${rec.event._id}`)}
                      className="font-serif text-base font-bold text-content-primary hover:text-emerald cursor-pointer"
                    >
                      {rec.event.title}
                    </h3>
                    <p className="text-xs text-content-secondary line-clamp-2">
                      {rec.event.subtitle || rec.event.description}
                    </p>
                    <ul className="space-y-1 pt-1">
                      {(rec.reasons || []).map((reason: string, idx: number) => (
                        <li
                          key={idx}
                          className="text-[11px] text-content-secondary flex items-center gap-1.5"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-champagne shrink-0" />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-surface-border flex items-center justify-between">
                    <span className="text-[11px] text-content-secondary">
                      {new Date(rec.event.startDate).toLocaleDateString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRegister(rec.event._id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      Quick Register
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Latest Announcements Column */}
        <section className="bg-surface-card rounded-2xl border border-surface-border p-5 shadow-cf-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-champagne" />
                <h2 className="font-serif text-lg font-bold text-content-primary">
                  Campus Bulletins
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/announcements')}
                className="text-xs font-semibold text-emerald hover:underline"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5">
              {announcements.map((ann) => (
                <div
                  key={ann._id}
                  onClick={() => navigate('/announcements')}
                  className="p-3 rounded-xl bg-surface-elevated border border-surface-border hover:border-champagne/60 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                        ann.priority === 'URGENT'
                          ? 'bg-semantic-error/15 text-semantic-error'
                          : ann.priority === 'IMPORTANT'
                          ? 'bg-champagne/25 text-champagne-gold dark:text-champagne'
                          : 'bg-emerald/15 text-emerald'
                      }`}
                    >
                      {ann.priority}
                    </span>
                    <span className="text-[10px] text-content-secondary">
                      {new Date(ann.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-content-primary line-clamp-1">
                    {ann.title}
                  </h3>
                  <p className="text-[11px] text-content-secondary line-clamp-2 mt-0.5">
                    {ann.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* QR Pass Modal */}
      <QrPassModal
        open={Boolean(activeQrPass)}
        onClose={() => setActiveQrPass(null)}
        registration={activeQrPass}
        studentName={user?.name || 'Pavan Sai Ram Likhith'}
      />
    </div>
  );
};
