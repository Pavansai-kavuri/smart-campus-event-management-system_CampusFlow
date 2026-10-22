import React, { useState, useEffect } from 'react';
import { User, Save, Sun, Moon, Monitor, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, ThemeMode } from '../context/ThemeContext';
import { apiRequest } from '../lib/api';
import { UserAvatar, PROFESSIONAL_AVATARS } from '../components/ui/UserAvatar';

const INTEREST_OPTIONS = [
  'Tech',
  'Workshop',
  'Cultural',
  'Competition',
  'Sports',
  'Academic',
  'Career',
  'AI',
  'Robotics',
  'UI/UX',
];

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, showToast } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [yearOfStudy, setYearOfStudy] = useState(user?.yearOfStudy || 3);
  const [rollNumber, setRollNumber] = useState(user?.rollNumber || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || 'avatar-scholar');
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDepartment(user.department || '');
      setYearOfStudy(user.yearOfStudy || 3);
      setRollNumber(user.rollNumber || '');
      setBio(user.bio || '');
      setAvatar(user.avatar || 'avatar-scholar');
      setInterests(user.interests || []);
    }
  }, [user]);

  const toggleInterest = (tag: string) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((i) => i !== tag) : [...prev, tag]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          department,
          yearOfStudy: Number(yearOfStudy),
          rollNumber,
          bio,
          avatar,
          interests,
          themePreference: theme,
        }),
      });
      await refreshUser();
      showToast({
        title: 'Profile Updated',
        description: 'Your preferences and recommendation interests have been saved.',
        variant: 'success',
      });
    } catch (err: any) {
      showToast({
        title: 'Update failed',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex items-center gap-5">
        <UserAvatar
          user={{ name, avatar }}
          size="xl"
          className="w-20 h-20 shadow-md ring-2 ring-champagne/50"
        />
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-champagne">
            <User className="w-3.5 h-3.5" />
            {user?.role || 'STUDENT'} Profile
          </div>
          <h1 className="font-serif text-2xl font-bold text-content-primary truncate">
            {name || 'Pavan Sai Ram Likhith'}
          </h1>
          <p className="text-xs text-content-secondary">{user?.email}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-champagne/15 text-champagne border border-champagne/30">
              <Sparkles className="w-3 h-3" />
              {PROFESSIONAL_AVATARS.find((a) => a.id === avatar)?.name || 'Custom Headshot'}
            </span>
            <span className="text-[11px] text-content-secondary">
              {department || 'Computer Science & Engineering'}
            </span>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card space-y-5"
      >
        {/* Professional University Avatars Picker */}
        <div className="space-y-3 pb-5 border-b border-surface-border">
          <div className="flex items-center justify-between">
            <div>
              <label className="flex items-center gap-1.5 text-sm font-serif font-bold text-content-primary">
                <Sparkles className="w-4 h-4 text-champagne" />
                Select Professional Avatar Persona
              </label>
              <p className="text-xs text-content-secondary mt-0.5">
                Curated university leadership, research, engineering, and design personas.
              </p>
            </div>
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-elevated text-champagne border border-surface-border">
              {PROFESSIONAL_AVATARS.length} Professional Personas
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PROFESSIONAL_AVATARS.map((opt) => {
              const selected = avatar === opt.id;
              const SvgComp = opt.svg;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setAvatar(opt.id)}
                  className={`group relative p-3 rounded-2xl border text-left transition-all flex flex-col items-center gap-2.5 cursor-pointer ${
                    selected
                      ? 'bg-champagne/15 border-champagne shadow-md ring-2 ring-champagne/40'
                      : 'bg-surface-elevated border-surface-border hover:border-champagne/40 hover:bg-surface-elevated/90'
                  }`}
                >
                  <div className="relative w-14 h-14 rounded-full overflow-hidden shadow-xs ring-1 ring-surface-border group-hover:scale-105 transition-transform shrink-0">
                    <SvgComp className="w-full h-full object-cover" />
                    {selected && (
                      <div className="absolute inset-0 bg-emerald/25 backdrop-blur-[1px] flex items-center justify-center">
                        <Check className="w-5 h-5 text-emerald bg-white dark:bg-[#1E1714] rounded-full p-0.5 shadow-md" />
                      </div>
                    )}
                  </div>
                  <div className="text-center w-full min-w-0">
                    <div className="text-xs font-bold text-content-primary truncate">
                      {opt.name}
                    </div>
                    <div className="text-[10px] text-content-secondary truncate mt-0.5">
                      {opt.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Custom Avatar URL option */}
          <div className="pt-2">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-content-secondary mb-1">
              <ImageIcon className="w-3.5 h-3.5 text-champagne" />
              Or provide an external professional photo URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/professional-headshot.jpg"
              value={avatar.startsWith('http') ? avatar : ''}
              onChange={(e) => setAvatar(e.target.value.trim() || 'avatar-scholar')}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs focus:border-champagne focus:outline-none"
            />
          </div>
        </div>

        <h2 className="font-serif text-xl font-bold text-content-primary">
          Academic Details & Recommendation Interests
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Full Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Roll Number / University ID</label>
            <input
              type="text"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Department</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Year of Study</label>
            <select
              value={yearOfStudy}
              onChange={(e) => setYearOfStudy(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border"
            >
              {[1, 2, 3, 4, 5].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs">
          <label className="block font-semibold mb-1">Bio</label>
          <textarea
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border"
          />
        </div>

        {/* AI Recommendation Interests */}
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-content-primary">
            <Sparkles className="w-3.5 h-3.5 text-champagne" />
            Selected Event Interests (Used by CampusFlow Recommendation Engine)
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((tag) => {
              const active = interests.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    active
                      ? 'bg-emerald text-white border-emerald'
                      : 'bg-surface-elevated text-content-secondary border-surface-border'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Three-State Theme Control per modern-web-guidance */}
        <div className="space-y-2 pt-2 border-t border-surface-border">
          <label className="block text-xs font-semibold text-content-primary">
            Appearance & Theme Preference
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { id: 'light', label: 'Daytime Light', icon: Sun },
                { id: 'dark', label: 'Rich Espresso Dark', icon: Moon },
                { id: 'system', label: 'System Default', icon: Monitor },
              ] as { id: ThemeMode; label: string; icon: any }[]
            ).map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTheme(opt.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    theme === opt.id
                      ? 'bg-champagne/20 border-champagne text-content-primary'
                      : 'bg-surface-elevated border-surface-border text-content-secondary'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>
    </div>
  );
};
