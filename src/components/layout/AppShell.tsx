import React, { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  Ticket,
  Calendar as CalendarIcon,
  Award,
  Megaphone,
  MessageSquareHeart,
  QrCode,
  ShieldCheck,
  Building2,
  Sparkles,
  Bell,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  CheckCheck,
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { apiRequest } from '../../lib/api';
import { UserAvatar } from '../ui/UserAvatar';

export const CampusFlowEmblem: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <img
    src="/images/campusflow-emblem-exact-transparent.png"
    alt="CampusFlow Logo"
    className={`${className} object-contain`}
  />
);

export const AppShell: React.FC = () => {
  const { user, toasts, dismissToast, switchDemoRole, logout } = useAuth();
  const { theme, resolvedTheme, setTheme, toggleTwoStateTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [dbConnected, setDbConnected] = useState<boolean>(true);

  const fetchNotificationsAndHealth = async () => {
    try {
      const health = await apiRequest<{ database: { connected: boolean } }>('/health');
      setDbConnected(Boolean(health?.database?.connected));
    } catch {
      setDbConnected(false);
    }

    if (!user) return;
    try {
      const data = await apiRequest<{ unreadCount: number; notifications: any[] }>(
        '/notifications'
      );
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotificationsAndHealth();
  }, [user, location.pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

  const handleMarkAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      try {
        await apiRequest(`/notifications/${notif._id}/read`, { method: 'PATCH' });
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
      } catch {
        // ignore
      }
    }
    setNotifOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const studentNavItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/explore', label: 'Explore Events', icon: Compass },
    { to: '/my-registrations', label: 'My Registrations', icon: Ticket },
    { to: '/calendar', label: 'Calendar', icon: CalendarIcon },
    { to: '/certificates', label: 'Certificates', icon: Award },
    { to: '/announcements', label: 'Announcements', icon: Megaphone },
    { to: '/feedback', label: 'Feedback', icon: MessageSquareHeart },
  ];

  const organizerNavItems = [
    { to: '/organizer', label: 'Organizer Hub', icon: Sparkles },
    { to: '/qr-attendance', label: 'QR Attendance', icon: QrCode },
    { to: '/venues', label: 'Venues & Conflicts', icon: Building2 },
  ];

  const adminNavItems = [
    { to: '/admin', label: 'Admin Analytics', icon: ShieldCheck },
  ];

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full justify-between py-4 px-3 select-none">
      <div>
        {/* Brand Header */}
        <div
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 px-2 pb-5 mb-3 border-b border-surface-border cursor-pointer group"
        >
          <CampusFlowEmblem className="w-8 h-8 shrink-0 transition-transform group-hover:scale-105" />
          <div className="min-w-0">
            <div className="font-serif text-base font-bold tracking-tight text-content-primary leading-tight">
              CampusFlow
            </div>
            <div className="text-[10px] font-medium text-champagne uppercase tracking-widest truncate">
              Smart Events
            </div>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav aria-label="Main Navigation" className="space-y-1">
          {studentNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald text-white shadow-sm font-semibold'
                      : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </NavLink>
            );
          })}

          {(user?.role === 'ORGANIZER' || user?.role === 'ADMIN') && (
            <div className="pt-3 mt-3 border-t border-surface-border space-y-1">
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-champagne">
                Organizer Tools
              </div>
              {organizerNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald text-white shadow-sm font-semibold'
                          : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}

          {user?.role === 'ADMIN' && (
            <div className="pt-2 space-y-1">
              <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-rose-mauve">
                Administration
              </div>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                        isActive
                          ? 'bg-emerald text-white shadow-sm font-semibold'
                          : 'text-content-secondary hover:text-content-primary hover:bg-surface-elevated'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* Bottom Profile & Role Switcher */}
      <div className="pt-3 border-t border-surface-border space-y-2.5">
        {/* Role Switcher for seamless evaluation */}
        <div className="bg-surface-elevated rounded-xl p-2 border border-surface-border">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-content-secondary mb-1.5 px-1">
            Active Role View
          </div>
          <div className="grid grid-cols-3 gap-1">
            {(['STUDENT', 'ORGANIZER', 'ADMIN'] as UserRole[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={async () => {
                  await switchDemoRole(r);
                  if (r === 'ADMIN') navigate('/admin');
                  else if (r === 'ORGANIZER') navigate('/organizer');
                  else navigate('/');
                }}
                className={`py-1 px-1 rounded-lg text-[10px] font-semibold transition-all ${
                  user?.role === r
                    ? 'bg-champagne text-[#1E1714] shadow-sm'
                    : 'text-content-secondary hover:text-content-primary hover:bg-surface-card'
                }`}
                title={`Switch to ${r} perspective`}
              >
                {r === 'STUDENT' ? 'Student' : r === 'ORGANIZER' ? 'Org' : 'Admin'}
              </button>
            ))}
          </div>
        </div>

        {user ? (
          <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-surface-elevated border border-surface-border">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 min-w-0 text-left group"
            >
              <UserAvatar user={user} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-content-primary truncate group-hover:text-emerald transition-colors">
                  {user.name}
                </div>
                <div className="text-[10px] text-champagne font-medium uppercase tracking-wider">
                  {user.role}
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={logout}
              title="Sign Out"
              aria-label="Sign Out"
              className="p-1.5 rounded-lg text-content-secondary hover:text-semantic-error hover:bg-surface-card transition-colors shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="w-full py-2 px-3 rounded-xl bg-emerald text-white text-xs font-semibold hover:opacity-95 transition-opacity"
          >
            Sign In / Register
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-surface-bg text-content-primary">
      {/* Desktop Persistent Sidebar (Reference-proportioned ~190px width) */}
      <aside className="hidden lg:flex lg:w-[196px] xl:w-[208px] shrink-0 flex-col bg-surface-card border-r border-surface-border sticky top-0 h-screen z-30">
        {renderSidebarContent()}
      </aside>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="relative w-64 max-w-[80vw] bg-surface-card border-r border-surface-border h-full z-10">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close navigation drawer"
              className="absolute top-4 right-3 p-1.5 rounded-lg text-content-secondary hover:text-content-primary"
            >
              <X className="w-5 h-5" />
            </button>
            {renderSidebarContent()}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Header */}
        <header className="sticky top-0 z-20 bg-surface-card/90 backdrop-blur-md border-b border-surface-border px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="lg:hidden p-2 rounded-xl border border-surface-border text-content-primary hover:bg-surface-elevated"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center">
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-surface-elevated/70 border border-surface-border/80 shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-champagne shadow-sm" />
                <span className="font-serif italic text-base sm:text-lg md:text-xl text-content-primary tracking-wide flex items-center gap-2.5 font-medium">
                  <span>Discover events</span>
                  <span className="text-champagne font-sans font-bold text-sm not-italic select-none">•</span>
                  <span>Learn</span>
                  <span className="text-champagne font-sans font-bold text-sm not-italic select-none">•</span>
                  <span>Build</span>
                  <span className="text-champagne font-sans font-bold text-sm not-italic select-none">•</span>
                  <span className="text-champagne dark:text-[#EBD6AB] font-semibold not-italic">Belong.</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Header Controls: Theme Switcher, Notifications, Profile */}
          <div className="flex items-center gap-2.5">
            {/* Keyboard-accessible Theme Control */}
            <div
              className="inline-flex items-center rounded-xl bg-surface-elevated p-1 border border-surface-border"
              role="group"
              aria-label="Color theme selector"
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
                title="Daytime Light Theme"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  theme === 'light'
                    ? 'bg-surface-card text-emerald shadow-xs font-semibold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
                title="Rich Espresso Dark Theme"
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  theme === 'dark'
                    ? 'bg-surface-card text-champagne shadow-xs font-semibold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                aria-pressed={theme === 'system'}
                title={`System Default (Currently ${resolvedTheme})`}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  theme === 'system'
                    ? 'bg-surface-card text-content-primary shadow-xs font-semibold'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">Auto</span>
              </button>
            </div>

            {/* Notification Center Button & Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label="Notifications"
                className="relative p-2 rounded-xl bg-surface-elevated border border-surface-border text-content-primary hover:border-champagne transition-colors"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-surface-card border border-surface-border shadow-cf-elevated z-50 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border bg-surface-elevated">
                    <div>
                      <h3 className="font-serif text-sm font-semibold text-content-primary">
                        Notifications
                      </h3>
                      <p className="text-[11px] text-content-secondary">
                        {unreadCount} unread alert{unreadCount === 1 ? '' : 's'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="inline-flex items-center gap-1 text-xs font-medium text-emerald hover:underline"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-surface-border">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-content-secondary">
                        You are all caught up! No notifications yet.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n._id}
                          type="button"
                          onClick={() => handleNotificationClick(n)}
                          className={`w-full text-left px-4 py-3 hover:bg-surface-elevated transition-colors flex items-start gap-3 ${
                            !n.read ? 'bg-emerald/5' : ''
                          }`}
                        >
                          <span
                            className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                              !n.read ? 'bg-emerald' : 'bg-transparent'
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-content-primary">
                              {n.title}
                            </div>
                            <p className="text-xs text-content-secondary mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-content-secondary mt-1 block">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Pill */}
            {user ? (
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl bg-surface-elevated border border-surface-border hover:border-champagne transition-colors"
              >
                <UserAvatar user={user} size="sm" className="w-7 h-7" />
                <span className="text-xs font-semibold text-content-primary hidden sm:inline">
                  {user.name}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald text-white text-xs font-semibold"
              >
                <UserIcon className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 max-w-[1536px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Toast Notification Stack */}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl border shadow-cf-elevated bg-surface-card transition-all ${
              t.variant === 'error'
                ? 'border-semantic-error/60'
                : t.variant === 'warning'
                ? 'border-semantic-warning/60'
                : 'border-emerald/50'
            }`}
          >
            <div>
              <div className="text-xs font-bold text-content-primary">{t.title}</div>
              {t.description && (
                <div className="text-xs text-content-secondary mt-0.5">{t.description}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss notification"
              className="text-content-secondary hover:text-content-primary"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
