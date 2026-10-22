import React, { useEffect, useState } from 'react';
import { MessageSquareHeart, Star, ThumbsUp, Send } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const FeedbackPage: React.FC = () => {
  const { showToast } = useAuth();

  const [summary, setSummary] = useState({
    totalReviews: 0,
    avgOverall: 5,
    avgOrg: 5,
    avgContent: 5,
    avgVenue: 5,
    recommendRate: 100,
  });
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [eligibleEvents, setEligibleEvents] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    eventId: '',
    rating: 5,
    organizationRating: 5,
    contentQualityRating: 5,
    venueRating: 5,
    comment: '',
    wouldRecommend: true,
    isAnonymous: false,
  });

  const loadFeedback = async () => {
    const data = await apiRequest('/feedback');
    setSummary(data.summary || summary);
    setFeedbackList(data.feedback || []);
    const events = data.eligibleEvents || [];
    setEligibleEvents(events);
    const firstUnsubmitted = events.find((e: any) => !e.alreadySubmitted);
    if (firstUnsubmitted && !form.eventId) {
      setForm((prev) => ({ ...prev, eventId: firstUnsubmitted._id }));
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.eventId) {
      showToast({
        title: 'Select an event',
        description: 'Please select an event to review.',
        variant: 'warning',
      });
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiRequest<{ message: string }>('/feedback', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      showToast({
        title: 'Feedback Submitted!',
        description: res.message,
        variant: 'success',
      });
      setForm((prev) => ({ ...prev, comment: '' }));
      await loadFeedback();
    } catch (err: any) {
      showToast({
        title: 'Could not submit feedback',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald">
            <MessageSquareHeart className="w-4 h-4" />
            Event Quality & Student Voice
          </div>
          <h1 className="font-serif text-3xl font-bold text-content-primary mt-1">
            Event Feedback & Satisfaction
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Share ratings on campus events to help organizers improve future experiences.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2.5 rounded-2xl bg-surface-elevated border border-surface-border text-center">
            <div className="text-[11px] text-content-secondary">Avg Rating</div>
            <div className="font-serif text-2xl font-bold text-champagne flex items-center gap-1">
              {summary.avgOverall} <Star className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-surface-elevated border border-surface-border text-center">
            <div className="text-[11px] text-content-secondary">Recommend Rate</div>
            <div className="font-serif text-2xl font-bold text-emerald">
              {summary.recommendRate}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Submit Feedback Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card space-y-4 self-start"
        >
          <h2 className="font-serif text-xl font-bold text-content-primary">
            Submit Event Review
          </h2>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Select Event
            </label>
            <select
              value={form.eventId}
              onChange={(e) => setForm({ ...form, eventId: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-medium"
            >
              <option value="">Choose an event...</option>
              {eligibleEvents.map((ev) => (
                <option key={ev._id} value={ev._id} disabled={ev.alreadySubmitted}>
                  {ev.title} {ev.alreadySubmitted ? '(Already Reviewed)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Overall Rating (1-5)
              </label>
              <select
                value={form.rating}
                onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} Stars
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-content-primary mb-1">
                Venue Quality (1-5)
              </label>
              <select
                value={form.venueRating}
                onChange={(e) =>
                  setForm({ ...form, venueRating: Number(e.target.value) })
                }
                className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} Stars
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-content-primary mb-1">
              Your Review & Suggestions
            </label>
            <textarea
              rows={4}
              required
              minLength={5}
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Share what you enjoyed and what could be improved..."
              className="w-full px-3.5 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
            />
          </div>

          <div className="space-y-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.wouldRecommend}
                onChange={(e) =>
                  setForm({ ...form, wouldRecommend: e.target.checked })
                }
              />
              I would recommend this event to fellow students
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-content-secondary">
              <input
                type="checkbox"
                checked={form.isAnonymous}
                onChange={(e) => setForm({ ...form, isAnonymous: e.target.checked })}
              />
              Post my review anonymously
            </label>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600 inline-flex items-center justify-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" />
            {submitting ? 'Submitting...' : 'Submit Verified Feedback'}
          </button>
        </form>

        {/* Recent Feedback Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-surface-card rounded-2xl p-4 border border-surface-border text-center">
              <div className="text-[11px] text-content-secondary">Organization</div>
              <div className="font-serif text-xl font-bold text-content-primary mt-0.5">
                {summary.avgOrg} / 5.0
              </div>
            </div>
            <div className="bg-surface-card rounded-2xl p-4 border border-surface-border text-center">
              <div className="text-[11px] text-content-secondary">Content Depth</div>
              <div className="font-serif text-xl font-bold text-content-primary mt-0.5">
                {summary.avgContent} / 5.0
              </div>
            </div>
            <div className="bg-surface-card rounded-2xl p-4 border border-surface-border text-center">
              <div className="text-[11px] text-content-secondary">Venue & Audio</div>
              <div className="font-serif text-xl font-bold text-content-primary mt-0.5">
                {summary.avgVenue} / 5.0
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {feedbackList.map((item) => (
              <div
                key={item._id}
                className="bg-surface-card rounded-2xl p-5 border border-surface-border shadow-cf-card space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-emerald">
                      {item.event?.title || 'Campus Event'}
                    </span>
                    <div className="text-xs text-content-secondary">
                      Reviewed by <strong className="text-content-primary">{item.studentName}</strong>
                      {item.department ? ` • ${item.department}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-champagne">
                    {Array.from({ length: item.rating }).map((_, idx) => (
                      <Star key={idx} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-content-primary">{item.comment}</p>
                {item.wouldRecommend && (
                  <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald">
                    <ThumbsUp className="w-3 h-3" /> Recommends this event
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
