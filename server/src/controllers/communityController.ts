import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import {
  Announcement,
  Feedback,
  Notification,
  Event,
  Registration,
} from '../models/index.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { announcementSchema, feedbackSchema } from '../validators/schemas.js';

export async function listAnnouncements(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const announcements = await Announcement.find()
      .sort({ isPinned: -1, publishedAt: -1 })
      .lean();

    const userId = req.user ? String(req.user._id) : null;

    res.json({
      success: true,
      announcements: announcements.map((a) => ({
        ...a,
        isRead: userId
          ? (a.readBy || []).some((id: any) => String(id) === userId)
          : false,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function createAnnouncement(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const parsed = announcementSchema.parse(req.body);
    const code = `CF-ANN-${Date.now().toString().slice(-6)}`;

    const announcement = await Announcement.create({
      code,
      title: parsed.title,
      content: parsed.content,
      category: parsed.category,
      priority: parsed.priority,
      targetAudience: parsed.targetAudience,
      authorId: req.user._id,
      authorName: req.user.name,
      publishedAt: new Date(),
      readBy: [req.user._id],
      isPinned: parsed.isPinned,
      isDemo: false,
    });

    await recordAuditLog({
      user: req.user,
      action: 'ANNOUNCEMENT_PUBLISHED',
      targetType: 'Announcement',
      targetId: String(announcement._id),
      details: { title: announcement.title, priority: announcement.priority },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      announcement: { ...announcement.toObject(), isRead: true },
    });
  } catch (err) {
    next(err);
  }
}

export async function markAnnouncementRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { id } = req.params;
    await Announcement.findByIdAndUpdate(id, {
      $addToSet: { readBy: req.user._id },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function submitFeedback(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const parsed = feedbackSchema.parse(req.body);
    const event = await Event.findById(parsed.eventId);
    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found.' });
      return;
    }

    // Check duplicate submission policy
    const existing = await Feedback.findOne({
      eventId: event._id,
      studentId: req.user._id,
    });

    if (existing) {
      res.status(409).json({
        success: false,
        error: 'You have already submitted feedback for this event.',
      });
      return;
    }

    const feedback = await Feedback.create({
      eventId: event._id,
      studentId: req.user._id,
      rating: parsed.rating,
      organizationRating: parsed.organizationRating,
      contentQualityRating: parsed.contentQualityRating,
      venueRating: parsed.venueRating,
      comment: parsed.comment,
      wouldRecommend: parsed.wouldRecommend,
      isAnonymous: parsed.isAnonymous,
      isDemo: false,
    });

    res.status(201).json({
      success: true,
      feedback,
      message: 'Thank you! Your feedback has been recorded.',
    });
  } catch (err) {
    next(err);
  }
}

export async function listFeedbackAndAnalytics(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const [feedbackItems, eventList, myRegs] = await Promise.all([
      Feedback.find()
        .populate('eventId', 'title category startDate venueName')
        .populate('studentId', 'name department yearOfStudy')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Event.find({ status: { $in: ['APPROVED', 'COMPLETED'] } })
        .select('title category startDate venueName')
        .sort({ startDate: -1 })
        .lean(),
      req.user
        ? Registration.find({
            studentId: req.user._id,
            status: { $in: ['REGISTERED', 'ATTENDED'] },
          })
            .select('eventId status')
            .lean()
        : Promise.resolve([]),
    ]);

    const myFeedbackIds = new Set(
      feedbackItems
        .filter((f: any) => req.user && String(f.studentId?._id) === String(req.user._id))
        .map((f: any) => String(f.eventId?._id))
    );

    const total = feedbackItems.length;
    const avgOverall =
      total > 0
        ? Number(
            (
              feedbackItems.reduce((acc, f) => acc + f.rating, 0) / total
            ).toFixed(2)
          )
        : 0;
    const avgOrg =
      total > 0
        ? Number(
            (
              feedbackItems.reduce((acc, f) => acc + (f.organizationRating || f.rating), 0) /
              total
            ).toFixed(2)
          )
        : 0;
    const avgContent =
      total > 0
        ? Number(
            (
              feedbackItems.reduce((acc, f) => acc + (f.contentQualityRating || f.rating), 0) /
              total
            ).toFixed(2)
          )
        : 0;
    const avgVenue =
      total > 0
        ? Number(
            (
              feedbackItems.reduce((acc, f) => acc + (f.venueRating || f.rating), 0) /
              total
            ).toFixed(2)
          )
        : 0;
    const recommendRate =
      total > 0
        ? Math.round(
            (feedbackItems.filter((f) => f.wouldRecommend).length / total) * 100
          )
        : 100;

    res.json({
      success: true,
      summary: {
        totalReviews: total,
        avgOverall,
        avgOrg,
        avgContent,
        avgVenue,
        recommendRate,
      },
      feedback: feedbackItems.map((f: any) => ({
        _id: f._id,
        event: f.eventId,
        studentName: f.isAnonymous
          ? 'Anonymous Student'
          : f.studentId?.name || 'Student',
        department: f.isAnonymous ? '' : f.studentId?.department || '',
        rating: f.rating,
        organizationRating: f.organizationRating,
        contentQualityRating: f.contentQualityRating,
        venueRating: f.venueRating,
        comment: f.comment,
        wouldRecommend: f.wouldRecommend,
        createdAt: f.createdAt,
      })),
      eligibleEvents: eventList.map((e: any) => ({
        ...e,
        alreadySubmitted: myFeedbackIds.has(String(e._id)),
        isRegistered: myRegs.some((r: any) => String(r.eventId) === String(e._id)),
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function listMyNotifications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
      Notification.countDocuments({ userId: req.user._id, read: false }),
    ]);

    res.json({
      success: true,
      unreadCount,
      notifications,
    });
  } catch (err) {
    next(err);
  }
}

export async function markNotificationRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const id = String(req.params.id);
    await Notification.findOneAndUpdate(
      { _id: new Types.ObjectId(id), userId: req.user._id },
      { read: true }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

export async function markAllNotificationsRead(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { $set: { read: true } }
    );

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
