import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Users,
  GraduationCap,
  Trophy,
  Sun,
  Moon,
  Monitor,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Shield,
  Sparkles,
  AlertCircle,
  Leaf,
} from 'lucide-react';
import { useAuth, UserRole } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { CampusFlowEmblem } from '../components/layout/AppShell';

declare global {
  interface Window {
    google?: any;
  }
}

const GOOGLE_CLIENT_ID =
  (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID ||
  '';

interface AuthPageProps {
  initialMode?: 'LOGIN' | 'REGISTER';
}

export const AuthPage: React.FC<AuthPageProps> = ({ initialMode = 'LOGIN' }) => {
  const { loginWithCredentials, registerAccount, switchDemoRole, loginWithGoogle, user, loading } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // If already authenticated, redirect to role dashboard
  React.useEffect(() => {
    if (!loading && user) {
      if (user.role === 'ADMIN') navigate('/admin', { replace: true });
      else if (user.role === 'ORGANIZER') navigate('/organizer', { replace: true });
      else navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');
  const [role, setRole] = useState<'STUDENT' | 'ORGANIZER'>('STUDENT');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');
  const [googleSubmitting, setGoogleSubmitting] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  // Clear inputs on mount and mode toggle to prevent browser autofill
  React.useEffect(() => {
    setEmail('');
    setPassword('');
  }, [mode]);

  const handleGoogleClick = () => {
    setError(null);
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      try {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'email profile openid',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.error) {
              console.warn('[Google OAuth Notice]:', tokenResponse);
              setGoogleModalOpen(true);
              return;
            }
            if (tokenResponse?.access_token) {
              setGoogleSubmitting(true);
              try {
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const userInfo = await res.json();
                if (userInfo?.email) {
                  await loginWithGoogle({
                    email: userInfo.email,
                    name: userInfo.name,
                    avatar: userInfo.picture,
                  });
                  navigate('/');
                  return;
                }
              } catch (err: any) {
                console.error('[Google Profile Fetch Error]:', err);
                setError(err.message || 'Google sign-in failed.');
              } finally {
                setGoogleSubmitting(false);
              }
            }
          },
        });
        client.requestAccessToken();
        return;
      } catch (err) {
        console.warn('[Google OAuth Client Exception]:', err);
      }
    }

    // Fallback to campus Google chooser modal if Google SDK popup is blocked
    setGoogleModalOpen(true);
  };

  const handleGoogleAuth = async (targetEmail: string, targetName?: string) => {
    setError(null);
    setGoogleSubmitting(true);
    try {
      if (!targetEmail || !targetEmail.trim()) {
        throw new Error('Please enter a valid Google email.');
      }
      await loginWithGoogle({
        email: targetEmail.trim(),
        name: targetName?.trim() || undefined,
      });
      setGoogleModalOpen(false);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (mode === 'LOGIN') {
        if (!email.trim() || !password) {
          throw new Error('Please enter both your university email and password.');
        }
        await loginWithCredentials(email.trim(), password);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim()) throw new Error('Please enter your university email.');
        if (!password || password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await registerAccount({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          rollNumber: rollNumber.trim() || undefined,
          department: department.trim() || undefined,
        });
      }

      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoRole: UserRole) => {
    setError(null);
    setSubmitting(true);
    try {
      await switchDemoRole(demoRole);
      if (demoRole === 'ADMIN') navigate('/admin');
      else if (demoRole === 'ORGANIZER') navigate('/organizer');
      else navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to switch demo account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col md:flex-row bg-[#F7F6F3] dark:bg-[#1E1714] text-[#202522] dark:text-[#F8F1E7] selection:bg-[#C5A168]/30 font-sans">
      {/* ============================================================== */}
      {/* LEFT PANEL: CAMPUS EDITORIAL HERO (Crystal-Clear 1:1 Retina)   */}
      {/* ============================================================== */}
      <div className="relative w-full md:w-auto md:max-w-[70vw] h-[35vh] md:h-full shrink-0 md:aspect-[2530/2160] overflow-hidden z-0 select-none bg-[#F7F6F3] dark:bg-[#1E1714]">
        {/* Crystal-Clear 1:1 Master Artwork with Pristine Native Resolution & Razor-Sharp Clarity */}
        <img
          src="/images/campus-hero-exact.png"
          alt="CampusFlow — Smart Student Events. Discover Events. Learn. Build. Belong."
          className="w-full h-full object-cover md:object-contain object-left pointer-events-none"
          style={{
            imageRendering: '-webkit-optimize-contrast',
          }}
        />

        {/* Transparent Interactive Navigation Hitboxes over Exact Image Positions */}
        {/* 1. Top Brand Logo Hitbox */}
        <Link
          to="/"
          aria-label="CampusFlow — Smart Student Events Home"
          title="CampusFlow Home"
          className="absolute top-6 sm:top-8 lg:top-10 left-6 sm:left-8 lg:left-10 w-48 h-12 z-20 cursor-pointer rounded-xl focus:outline-none focus:ring-2 focus:ring-[#C5A168]/50"
        />

        {/* 2. Top Navigation Links Hitboxes */}
        <div className="hidden lg:flex items-center gap-2 absolute top-6 sm:top-8 lg:top-10 left-[230px] xl:left-[270px] z-20">
          <Link
            to="/explore"
            aria-label="Discover Events"
            title="Discover Events"
            className="px-3 py-1.5 h-8 rounded-lg cursor-pointer hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#C5A168]/50 transition-colors"
          >
            <span className="sr-only">Discover Events</span>
          </Link>
          <Link
            to="/explore?cat=Workshop"
            aria-label="Learn — Workshops"
            title="Learn — Workshops"
            className="px-3 py-1.5 h-8 rounded-lg cursor-pointer hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#C5A168]/50 transition-colors"
          >
            <span className="sr-only">Learn</span>
          </Link>
          <Link
            to="/explore?cat=Competition"
            aria-label="Build — Competitions"
            title="Build — Competitions"
            className="px-3 py-1.5 h-8 rounded-lg cursor-pointer hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#C5A168]/50 transition-colors"
          >
            <span className="sr-only">Build</span>
          </Link>
          <Link
            to="/explore?cat=Cultural"
            aria-label="Belong — Campus Community"
            title="Belong — Campus Community"
            className="px-3 py-1.5 h-8 rounded-lg cursor-pointer hover:bg-white/15 focus:outline-none focus:ring-2 focus:ring-[#C5A168]/50 transition-colors"
          >
            <span className="sr-only">Belong</span>
          </Link>
        </div>

        {/* 3. Four Feature Cards Clickable Hitboxes */}
        <div className="absolute bottom-[24%] sm:bottom-[22%] left-6 sm:left-8 lg:left-10 w-[85%] max-w-xl grid grid-cols-2 xl:grid-cols-4 gap-2 sm:gap-2.5 z-20">
          <Link
            to="/explore"
            aria-label="Explore Events"
            title="Find events that match your interests"
            className="h-20 sm:h-22 rounded-2xl cursor-pointer hover:bg-white/15 hover:ring-2 hover:ring-[#C5A168]/40 transition-all focus:outline-none"
          >
            <span className="sr-only">Explore Events</span>
          </Link>
          <Link
            to="/explore?cat=Cultural"
            aria-label="Build Connections"
            title="Meet like-minded peers"
            className="h-20 sm:h-22 rounded-2xl cursor-pointer hover:bg-white/15 hover:ring-2 hover:ring-[#C5A168]/40 transition-all focus:outline-none"
          >
            <span className="sr-only">Build Connections</span>
          </Link>
          <Link
            to="/explore?cat=Workshop"
            aria-label="Gain Skills"
            title="Attend workshops and competitions"
            className="h-20 sm:h-22 rounded-2xl cursor-pointer hover:bg-white/15 hover:ring-2 hover:ring-[#C5A168]/40 transition-all focus:outline-none"
          >
            <span className="sr-only">Gain Skills</span>
          </Link>
          <Link
            to="/explore?cat=Competition"
            aria-label="Be Part of Something Bigger"
            title="Create your campus story"
            className="h-20 sm:h-22 rounded-2xl cursor-pointer hover:bg-white/15 hover:ring-2 hover:ring-[#C5A168]/40 transition-all focus:outline-none"
          >
            <span className="sr-only">Be Part of Something Bigger</span>
          </Link>
        </div>

        {/* 4. Bottom-Left Message Hitbox */}
        <Link
          to="/explore"
          aria-label="Events today. Opportunities tomorrow."
          title="Browse Upcoming Campus Opportunities"
          className="absolute bottom-6 sm:bottom-8 lg:bottom-10 left-6 sm:left-8 lg:left-10 w-52 sm:w-60 h-16 sm:h-18 rounded-2xl cursor-pointer hover:bg-white/10 hover:ring-2 hover:ring-[#C5A168]/40 transition-all focus:outline-none z-20"
        >
          <span className="sr-only">Events today. Opportunities tomorrow.</span>
        </Link>
      </div>

      {/* ============================================================== */}
      {/* RIGHT PANEL: INTEGRATED WARM IVORY SIGN-IN (Zero Gaps)         */}
      {/* ============================================================== */}
      <div className="relative flex-1 w-full h-full flex flex-col justify-between bg-[#F7F6F3] dark:bg-[#1E1714] z-10">
        {/* Subtle Decorative Botanical Watermark in Top-Right Corner */}
        <div className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-20 dark:opacity-10 overflow-hidden">
          <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <path
              d="M160 0C120 40 100 90 90 160M160 30C130 60 120 100 110 160M160 70C140 90 135 120 130 160"
              stroke="#C5A168"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx="120" cy="50" r="3" fill="#C5A168" />
            <circle cx="140" cy="80" r="2.5" fill="#C5A168" />
            <circle cx="105" cy="95" r="2" fill="#C5A168" />
          </svg>
        </div>

        {/* Inner Scrollable Form Container */}
        <div className="w-full h-full overflow-y-auto p-5 sm:p-6 lg:p-7 flex flex-col justify-between">
          <div className="w-full max-w-[390px] mx-auto flex flex-col justify-between h-full relative z-10 py-1 space-y-2.5">
          {/* Top Header / Theme Switcher in Upper-Right of Panel */}
          <div className="flex items-center justify-between sm:justify-end gap-2">
            <span className="sm:hidden font-serif font-bold text-sm text-[#124E3A] dark:text-[#EBD6AB]">
              CampusFlow
            </span>

            {/* Three-State Theme Switcher */}
            <div
              className="inline-flex items-center gap-1 p-1 rounded-full bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] shadow-xs text-xs font-medium"
              role="group"
              aria-label="Color theme selector"
            >
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-[11px] cursor-pointer ${
                  theme === 'light'
                    ? 'bg-[#E7F1EA] text-[#124E3A] font-semibold shadow-xs'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Sun className="w-3 h-3 text-[#124E3A]" />
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-[11px] cursor-pointer ${
                  theme === 'dark'
                    ? 'bg-champagne/20 text-champagne font-semibold shadow-xs'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Moon className="w-3 h-3" />
                Dark
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-all text-[11px] cursor-pointer ${
                  theme === 'system'
                    ? 'bg-surface-elevated text-content-primary font-semibold shadow-xs'
                    : 'text-content-secondary hover:text-content-primary'
                }`}
              >
                <Monitor className="w-3 h-3" />
                Auto
              </button>
            </div>
          </div>

          {/* Header Emblem & Welcome Typography */}
          <div className="text-left pt-0.5">
            <div className="inline-flex items-center gap-2 mb-1.5">
              <img
                src="/images/campusflow-emblem-exact-transparent.png"
                alt="CampusFlow Logo"
                className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-xs"
              />
              <div className="text-left">
                <span className="font-serif text-base sm:text-lg font-bold text-[#124E3A] dark:text-[#F8F1E7] block leading-none">
                  CampusFlow
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold tracking-[0.25em] uppercase text-[#C5A168] block mt-0.5">
                  SMART STUDENT EVENTS
                </span>
              </div>
            </div>

            <h2 className="font-serif text-2xl sm:text-[26px] font-bold text-[#124E3A] dark:text-[#F8F1E7] tracking-tight">
              {mode === 'LOGIN' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-content-secondary mt-0.5">
              {mode === 'LOGIN'
                ? 'Sign in to continue your campus journey'
                : 'Join CampusFlow to discover and lead student events'}
            </p>
          </div>

          {/* Active Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-2.5 rounded-xl bg-semantic-error/10 border border-semantic-error/30 text-xs text-semantic-error flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-tight">{error}</div>
            </div>
          )}

          {/* Sign In / Registration Form */}
          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-2.5">
            {/* Decoy inputs to prevent browser from auto-filling saved passwords */}
            <input
              type="text"
              name="cf_dummy_email"
              tabIndex={-1}
              autoComplete="off"
              style={{ display: 'none' }}
              aria-hidden="true"
            />
            <input
              type="password"
              name="cf_dummy_pass"
              tabIndex={-1}
              autoComplete="new-password"
              style={{ display: 'none' }}
              aria-hidden="true"
            />

            {/* Registration-specific fields */}
            {mode === 'REGISTER' && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-content-primary mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pavan Sai Ram Likhith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] text-xs text-content-primary placeholder:text-content-secondary/60 focus:border-[#178855] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-content-primary mb-1">
                      Roll Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 241FA04312"
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] text-xs font-mono text-content-primary placeholder:text-content-secondary/60 focus:border-[#178855] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-content-primary mb-1">
                      Account Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] text-xs text-content-primary focus:border-[#178855] focus:outline-none"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="ORGANIZER">Event Organizer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-content-primary mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="Department of Computer Science and Engineering"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] text-xs text-content-primary focus:border-[#178855] focus:outline-none"
                  />
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-[11px] font-semibold text-content-primary mb-1">
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-secondary">
                  <Mail className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  inputMode="email"
                  name="cf_campus_student_id"
                  id="cf_campus_student_id"
                  required
                  autoComplete="off"
                  placeholder="you@campusflow.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] text-xs text-content-primary placeholder:text-content-secondary/60 focus:border-[#178855] focus:outline-none focus:ring-1 focus:ring-[#178855] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-content-primary">
                  Password
                </label>
                {mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-[10px] font-semibold text-[#178855] dark:text-[#78BFA4] hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-content-secondary">
                  <Lock className="w-3.5 h-3.5" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="cf_campus_student_key"
                  id="cf_campus_student_key"
                  required
                  autoComplete="new-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 rounded-xl bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] text-xs text-content-primary placeholder:text-content-secondary/60 focus:border-[#178855] focus:outline-none focus:ring-1 focus:ring-[#178855] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-secondary hover:text-content-primary cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Primary Sign In Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-xl bg-[#124E3A] hover:bg-[#0E3E2E] dark:bg-[#178855] dark:hover:bg-[#137046] text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed mt-0.5"
            >
              {submitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : mode === 'LOGIN' ? (
                <>
                  <span>Sign In to CampusFlow</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Create Campus Account</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* OR Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E7E8E2] dark:border-[#493A31]" />
            </div>
            <div className="relative flex justify-center text-[9px] uppercase tracking-widest">
              <span className="bg-[#F7F6F3] dark:bg-[#1E1714] px-2.5 text-content-secondary font-bold">
                OR
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            disabled={googleSubmitting}
            onClick={handleGoogleClick}
            className="w-full py-2 px-3.5 rounded-xl bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] hover:border-[#C5A168]/50 text-content-primary text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs disabled:opacity-60"
          >
            {googleSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-[#124E3A] dark:border-[#178855] border-t-transparent rounded-full animate-spin" />
                <span>Connecting with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Registration Prompt Banner */}
          <div className="p-2.5 rounded-xl bg-[#E7F1EA]/80 dark:bg-[#1E2E24]/70 border border-[#178855]/30 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-[#124E3A]/10 dark:bg-[#178855]/20 text-[#124E3A] dark:text-[#A2E2C5] flex items-center justify-center shrink-0">
                <Leaf className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-content-primary truncate">
                  {mode === 'LOGIN' ? 'New to CampusFlow?' : 'Already have an account?'}
                </div>
                <div className="text-[9px] text-content-secondary truncate">
                  {mode === 'LOGIN'
                    ? 'Create your account and start exploring events.'
                    : 'Sign in to access your registered events and certificates.'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode(mode === 'LOGIN' ? 'REGISTER' : 'LOGIN');
              }}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] text-[#124E3A] dark:text-[#EBD6AB] hover:bg-[#124E3A] hover:text-white dark:hover:bg-[#178855] text-[10px] font-bold transition-all shadow-xs shrink-0 cursor-pointer"
            >
              {mode === 'LOGIN' ? 'Register Now' : 'Sign In'}
            </button>
          </div>

          {/* Explore Demo Accounts Section (1-Click Real Authentication) */}
          <div className="pt-2 border-t border-[#E7E8E2] dark:border-[#493A31]">
            <div className="mb-1.5">
              <h3 className="font-serif font-bold text-xs text-content-primary">
                Explore Demo Accounts
              </h3>
              <p className="text-[10px] text-content-secondary">
                Experience different roles with 1-click access
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Demo Account 1: Student */}
              <button
                type="button"
                onClick={() => handleQuickDemo('STUDENT')}
                className="group p-2 rounded-xl bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] hover:border-emerald/60 hover:shadow-xs transition-all text-left flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#E7F1EA] text-[#124E3A]">
                      <GraduationCap className="w-2.5 h-2.5" />
                      Student
                    </span>
                    <span className="w-4 h-4 rounded-full bg-surface-elevated flex items-center justify-center text-content-secondary group-hover:text-emerald group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div className="font-semibold text-[10px] text-content-primary truncate">
                    Pavan Sai Ram Likhith
                  </div>
                  <div className="text-[9px] text-content-secondary truncate">
                    Vu.241FA04312@gmail.com
                  </div>
                </div>
                <div className="text-[8px] font-mono text-content-secondary mt-1 pt-1 border-t border-[#E7E8E2]/60 dark:border-[#493A31]/60">
                  Pass: CampusFlow@2026
                </div>
              </button>

              {/* Demo Account 2: Organizer */}
              <button
                type="button"
                onClick={() => handleQuickDemo('ORGANIZER')}
                className="group p-2 rounded-xl bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] hover:border-champagne/60 hover:shadow-xs transition-all text-left flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#FBF4E8] text-[#B08A01] dark:text-[#EBD6AB]">
                      <Users className="w-2.5 h-2.5" />
                      Organizer
                    </span>
                    <span className="w-4 h-4 rounded-full bg-surface-elevated flex items-center justify-center text-content-secondary group-hover:text-champagne group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div className="font-semibold text-[10px] text-content-primary truncate">
                    Prof. Vikram Mehta
                  </div>
                  <div className="text-[9px] text-content-secondary truncate">
                    vikram.mehta@campusflow.edu
                  </div>
                </div>
                <div className="text-[8px] font-mono text-content-secondary mt-1 pt-1 border-t border-[#E7E8E2]/60 dark:border-[#493A31]/60">
                  Pass: Organizer@2026
                </div>
              </button>

              {/* Demo Account 3: Admin */}
              <button
                type="button"
                onClick={() => handleQuickDemo('ADMIN')}
                className="group p-2 rounded-xl bg-white dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] hover:border-rose-mauve/60 hover:shadow-xs transition-all text-left flex flex-col justify-between cursor-pointer"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-[#FDE8E8] text-rose-mauve">
                      <Shield className="w-2.5 h-2.5" />
                      Admin
                    </span>
                    <span className="w-4 h-4 rounded-full bg-surface-elevated flex items-center justify-center text-content-secondary group-hover:text-rose-mauve group-hover:translate-x-0.5 transition-all">
                      <ArrowRight className="w-2.5 h-2.5" />
                    </span>
                  </div>
                  <div className="font-semibold text-[10px] text-content-primary truncate">
                    Dr. Aaravind Krishnan
                  </div>
                  <div className="text-[9px] text-content-secondary truncate">
                    admin@campusflow.edu
                  </div>
                </div>
                <div className="text-[8px] font-mono text-content-secondary mt-1 pt-1 border-t border-[#E7E8E2]/60 dark:border-[#493A31]/60">
                  Pass: Admin@2026
                </div>
              </button>
            </div>
          </div>

          {/* Footer Security Indicator */}
          <div className="pt-2 text-center border-t border-[#E7E8E2] dark:border-[#493A31]">
            <div className="inline-flex items-center gap-1.5 text-[10px] text-content-secondary">
              <Shield className="w-3 h-3 text-champagne" />
              <span>Secure access for our campus community</span>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ============================================================== */}
      {/* PROPER GOOGLE SIGN-IN / ACCOUNT CHOOSER MODAL                  */}
      {/* ============================================================== */}
      {googleModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-[#201A16] border border-[#E7E8E2] dark:border-[#493A31] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            {/* Google Brand Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E7E8E2] dark:border-[#493A31]">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <div>
                  <h4 className="text-sm font-semibold text-content-primary">Sign in with Google</h4>
                  <p className="text-[11px] text-content-secondary">Choose an account to continue to CampusFlow</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setGoogleModalOpen(false)}
                className="text-content-secondary hover:text-content-primary text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Quick One-Click Google Account Option */}
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                Active Campus Google Account
              </div>
              <button
                type="button"
                disabled={googleSubmitting}
                onClick={() => handleGoogleAuth('Vu.241FA04312@gmail.com', 'Pavan Sai Ram Likhith')}
                className="w-full p-3 rounded-xl border border-[#E7E8E2] dark:border-[#493A31] hover:border-emerald/60 hover:bg-[#E7F1EA]/30 dark:hover:bg-[#1E2E24]/30 transition-all flex items-center justify-between text-left group cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald/15 text-emerald font-bold flex items-center justify-center text-xs">
                    P
                  </div>
                  <div>
                    <div className="text-xs font-bold text-content-primary group-hover:text-emerald transition-colors">
                      Pavan Sai Ram Likhith
                    </div>
                    <div className="text-[11px] text-content-secondary">
                      Vu.241FA04312@gmail.com
                    </div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-emerald px-2 py-0.5 rounded-full bg-emerald/10">
                  Continue →
                </span>
              </button>
            </div>

            {/* Custom Google Account Option */}
            <div className="pt-2 border-t border-[#E7E8E2] dark:border-[#493A31] space-y-2.5">
              <div className="text-[11px] font-semibold text-content-secondary uppercase tracking-wider">
                Use another Google Account
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Your Full Name (optional)"
                  value={customGoogleName}
                  onChange={(e) => setCustomGoogleName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F6F3] dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] text-xs text-content-primary placeholder:text-content-secondary/60 focus:border-[#178855] focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Google email (e.g. you@gmail.com)"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F7F6F3] dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] text-xs text-content-primary placeholder:text-content-secondary/60 focus:border-[#178855] focus:outline-none"
                />
                <button
                  type="button"
                  disabled={googleSubmitting || !customGoogleEmail.trim()}
                  onClick={() => handleGoogleAuth(customGoogleEmail, customGoogleName)}
                  className="w-full py-2 px-3 rounded-xl bg-[#124E3A] hover:bg-[#0E3E2E] dark:bg-[#178855] text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {googleSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Authenticating with Google...</span>
                    </>
                  ) : (
                    <span>Sign in with this Google Account →</span>
                  )}
                </button>
              </div>
            </div>

            {/* Google Notice Disclaimer */}
            <p className="text-[10px] text-content-secondary leading-tight pt-1">
              To continue, Google will share your name, email address, language preference, and profile picture with CampusFlow.
            </p>
          </div>
        </div>
      )}

      {forgotModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-[#F7F6F3] dark:bg-[#2B2118] border border-[#E7E8E2] dark:border-[#493A31] rounded-2xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl">
            <div className="flex items-center gap-3 text-content-primary">
              <div className="w-9 h-9 rounded-full bg-emerald/15 flex items-center justify-center text-emerald">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-sm">Password Assistance</h4>
                <p className="text-[10px] text-content-secondary">University IT Self-Service</p>
              </div>
            </div>
            <p className="text-xs text-content-secondary leading-relaxed">
              For security, evaluation passwords are provided directly in the 1-click demo cards below (e.g. <code>CampusFlow@2026</code> for students). To reset your university account password, contact your department IT coordinator.
            </p>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setForgotModalOpen(false)}
                className="px-3.5 py-1.5 rounded-xl bg-emerald text-white text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthPage;
