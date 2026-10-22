import React, { useEffect, useState } from 'react';
import { Megaphone, Plus, CheckCircle2, Pin } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { DialogModal } from '../components/ui/DialogModal';

export const AnnouncementsPage: React.FC = () => {
  const { user, showToast } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    content: '',
    category: 'Campus Notice',
    priority: 'NORMAL',
    targetAudience: 'ALL',
    isPinned: false,
  });

  const loadAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/announcements');
      setAnnouncements(data.announcements || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, [user]);

  const handleMarkRead = async (id: string) => {
    try {
      await apiRequest(`/announcements/${id}/read`, { method: 'POST' });
      setAnnouncements((prev) =>
        prev.map((a) => (a._id === id ? { ...a, isRead: true } : a))
      );
    } catch {
      // ignore
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/announcements', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showToast({
        title: 'Announcement Published',
        description: 'Campus bulletin is now live.',
        variant: 'success',
      });
      setCreateOpen(false);
      setForm({
        title: '',
        content: '',
        category: 'Campus Notice',
        priority: 'NORMAL',
        targetAudience: 'ALL',
        isPinned: false,
      });
      await loadAnnouncements();
    } catch (err: any) {
      showToast({
        title: 'Could not publish announcement',
        description: err.message,
        variant: 'error',
      });
    }
  };

  const canPublish = user?.role === 'ORGANIZER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald">
            <Megaphone className="w-4 h-4" />
            Official University Communications
          </div>
          <h1 className="font-serif text-3xl font-bold text-content-primary mt-1">
            Campus Announcements
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Stay informed on flagship event schedules, venue updates, and academic deadlines.
          </p>
        </div>

        {canPublish && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Publish Bulletin
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-32 rounded-2xl bg-surface-card border border-surface-border animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <article
              key={ann._id}
              onClick={() => !ann.isRead && handleMarkRead(ann._id)}
              className={`bg-surface-card rounded-2xl p-5 sm:p-6 border shadow-cf-card transition-all ${
                !ann.isRead
                  ? 'border-champagne/70'
                  : 'border-surface-border opacity-90'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  {ann.isPinned && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-champagne/20 text-champagne-gold dark:text-champagne text-[10px] font-bold">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      ann.priority === 'URGENT'
                        ? 'bg-semantic-error/15 text-semantic-error'
                        : ann.priority === 'IMPORTANT'
                        ? 'bg-champagne/25 text-champagne-gold dark:text-champagne'
                        : 'bg-emerald/15 text-emerald'
                    }`}
                  >
                    {ann.priority}
                  </span>
                  <span className="text-xs font-medium text-content-secondary">
                    {ann.category}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-content-secondary">
                  <span>{new Date(ann.publishedAt).toLocaleDateString()}</span>
                  {ann.isRead ? (
                    <span className="inline-flex items-center gap-1 text-emerald font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Read
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkRead(ann._id);
                      }}
                      className="text-xs font-semibold text-champagne hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              </div>

              <h2 className="font-serif text-xl font-bold text-content-primary">
                {ann.title}
              </h2>
              <p className="text-xs sm:text-sm text-content-secondary mt-2 leading-relaxed">
                {ann.content}
              </p>
              <div className="mt-3 pt-3 border-t border-surface-border text-[11px] text-content-secondary">
                Published by <strong className="text-content-primary">{ann.authorName}</strong> • Audience: {ann.targetAudience}
              </div>
            </article>
          ))}
        </div>
      )}

      <DialogModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Publish Campus Announcement"
        subtitle="Broadcast an official update to students and organizers"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Announcement Title
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Category
              </label>
              <input
                type="text"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Priority
              </label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              >
                <option value="NORMAL">NORMAL</option>
                <option value="IMPORTANT">IMPORTANT</option>
                <option value="URGENT">URGENT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Target Audience
              </label>
              <select
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              >
                <option value="ALL">ALL CAMPUS</option>
                <option value="STUDENTS">STUDENTS</option>
                <option value="ORGANIZERS">ORGANIZERS</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Message Content
            </label>
            <textarea
              rows={4}
              required
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs sm:text-sm"
            />
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-semibold text-content-primary cursor-pointer">
            <input
              type="checkbox"
              checked={form.isPinned}
              onChange={(e) => setForm({ ...form, isPinned: e.target.checked })}
            />
            Pin this announcement to the top of student dashboards
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 rounded-xl border border-surface-border text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald text-white text-xs font-semibold"
            >
              Publish Now
            </button>
          </div>
        </form>
      </DialogModal>
    </div>
  );
};
