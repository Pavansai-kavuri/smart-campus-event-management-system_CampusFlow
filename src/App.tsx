import React from 'react';
import { BrowserRouter, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { ExploreEventsPage } from './pages/ExploreEventsPage';
import { EventDetailsPage } from './pages/EventDetailsPage';
import { MyRegistrationsPage } from './pages/MyRegistrationsPage';
import { CalendarPage } from './pages/CalendarPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { OrganizerDashboardPage } from './pages/OrganizerDashboardPage';
import { QrAttendancePage } from './pages/QrAttendancePage';
import { VenuesAndConflictsPage } from './pages/VenuesAndConflictsPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { AuthPage } from './pages/AuthPage';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-surface-card rounded-2xl border border-surface-border p-12 text-center space-y-4">
      <h1 className="font-serif text-3xl font-bold text-content-primary">
        404 — Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-content-secondary max-w-md mx-auto">
        The campus page you requested does not exist or has moved.
      </p>
      <button
        type="button"
        onClick={() => navigate('/')}
        className="px-5 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold cursor-pointer"
      >
        Return to Student Dashboard
      </button>
    </div>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#F7F6F3] dark:bg-[#1E1714]">
        <img
          src="/images/campusflow-emblem-exact-transparent.png"
          alt="CampusFlow"
          className="w-12 h-12 object-contain animate-pulse mb-3"
        />
        <div className="text-xs font-semibold tracking-wider uppercase text-content-secondary">
          Loading CampusFlow...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Full-Screen Login & Registration */}
            <Route path="/login" element={<AuthPage initialMode="LOGIN" />} />
            <Route path="/register" element={<AuthPage initialMode="REGISTER" />} />

            {/* Authenticated Application Shell */}
            <Route
              element={
                <ProtectedRoute>
                  <AppShell />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<StudentDashboardPage />} />
              <Route path="/explore" element={<ExploreEventsPage />} />
              <Route path="/events/:id" element={<EventDetailsPage />} />
              <Route path="/my-registrations" element={<MyRegistrationsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/certificates" element={<CertificatesPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/organizer" element={<OrganizerDashboardPage />} />
              <Route path="/qr-attendance" element={<QrAttendancePage />} />
              <Route path="/venues" element={<VenuesAndConflictsPage />} />
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
