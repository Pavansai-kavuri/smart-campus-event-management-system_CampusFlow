import { Response, NextFunction } from 'express';
import {
  User,
  Event,
  Registration,
  Certificate,
  SavedEvent,
  Notification,
  Announcement,
  Attendance,
  Feedback,
  Venue,
  AuditLog,
} from '../models/index.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { syncVenueReservation } from '../services/venueConflictService.js';
import { createNotificationSafe } from '../services/reminderService.js';
import { getRecommendedEventsForUser } from '../services/recommendationService.js';

export async function getStudentDashboard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const now = new Date();

    const [
      upcomingEventsCount,
      myActiveRegistrations,
      certificatesCount,
      savedRemindersCount,
      unreadRemindersCount,
      trendingEventsRaw,
      savedDocs,
      unreadNotificationsCount,
      announcements,
      recommendationsData,
    ] = await Promise.all([
      Event.countDocuments({
        status: 'APPROVED',
        endDate: { $gte: now },
      }),
      Registration.find({
        studentId: req.user._id,
        status: { $in: ['REGISTERED', 'WAITLISTED', 'ATTENDED'] },
      })
        .populate('eventId')
        .sort({ registeredAt: -1 })
        .lean(),
      Certificate.countDocuments({
        studentId: req.user._id,
        status: 'ISSUED',
      }),
      SavedEvent.countDocuments({
        userId: req.user._id,
        reminderSet: true,
      }),
      Notification.countDocuments({
        userId: req.user._id,
        type: 'EVENT_REMINDER',
        read: false,
      }),
      Event.find({
        status: 'APPROVED',
        endDate: { $gte: now },
      })
        .sort({ featured: -1, registeredCount: -1, startDate: 1 })
        .limit(8)
        .lean(),
      SavedEvent.find({ userId: req.user._id }).lean(),
      Notification.countDocuments({
        userId: req.user._id,
        read: false,
      }),
      Announcement.find({
        targetAudience: { $in: ['ALL', 'STUDENTS'] },
      })
        .sort({ isPinned: -1, publishedAt: -1 })
        .limit(4)
        .lean(),
      getRecommendedEventsForUser(req.user, 4),
    ]);

    const savedSet = new Set(savedDocs.map((s) => String(s.eventId)));
    const regByEvent = new Map(
      myActiveRegistrations
        .filter((r: any) => r.eventId)
        .map((r: any) => [String(r.eventId._id || r.eventId), r])
    );

    const trendingEvents = trendingEventsRaw.map((ev) => {
      const reg = regByEvent.get(String(ev._id));
      return {
        ...ev,
        isSaved: savedSet.has(String(ev._id)),
        registrationStatus: reg ? reg.status : null,
        registrationId: reg ? reg._id : null,
        spotsRemaining: Math.max(0, ev.capacity - ev.registeredCount),
      };
    });

    res.json({
      success: true,
      stats: {
        upcomingEvents: upcomingEventsCount,
        myRegistrations: myActiveRegistrations.length,
        certificates: certificatesCount,
        reminders: savedRemindersCount + unreadRemindersCount,
        unreadNotifications: unreadNotificationsCount,
      },
      trendingEvents,
      myRegistrations: myActiveRegistrations.slice(0, 4),
      announcements,
      recommendations: recommendationsData.recommendations,
    });
  } catch (err) {
    next(err);
  }
}

export async function getOrganizerDashboard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const filter =
      req.user.role === 'ADMIN' ? {} : { organizerId: req.user._id };

    const myEvents = await Event.find(filter).sort({ startDate: 1 }).lean();
    const eventIds = myEvents.map((e) => e._id);

    const [totalRegistrations, totalAttended, totalCertificates, recentRegistrations] =
      await Promise.all([
        Registration.countDocuments({
          eventId: { $in: eventIds },
          status: { $in: ['REGISTERED', 'ATTENDED'] },
        }),
        Attendance.countDocuments({
          eventId: { $in: eventIds },
        }),
        Certificate.countDocuments({
          eventId: { $in: eventIds },
          status: 'ISSUED',
        }),
        Registration.find({
          eventId: { $in: eventIds },
          status: { $ne: 'CANCELLED' },
        })
          .populate('studentId', 'name email rollNumber department yearOfStudy')
          .populate('eventId', 'title category startDate venueName')
          .sort({ registeredAt: -1 })
          .limit(12)
          .lean(),
      ]);

    const approvedCount = myEvents.filter((e) => e.status === 'APPROVED').length;
    const pendingCount = myEvents.filter((e) => e.status === 'PENDING_APPROVAL').length;

    res.json({
      success: true,
      stats: {
        totalEvents: myEvents.length,
        approvedEvents: approvedCount,
        pendingEvents: pendingCount,
        totalRegistrations,
        totalAttended,
        attendanceRate:
          totalRegistrations > 0
            ? Math.round((totalAttended / totalRegistrations) * 100)
            : 0,
        certificatesIssued: totalCertificates,
      },
      events: myEvents,
      recentRegistrations,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAdminDashboard(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { category, status } = req.query as Record<string, string>;
    const eventMatch: Record<string, any> = {};
    if (category && category !== 'All') eventMatch.category = category;
    if (status && status !== 'ALL') eventMatch.status = status;

    const now = new Date();

    const [
      totalEvents,
      totalStudents,
      totalOrganizers,
      activeEvents,
      pendingApprovalsCount,
      totalRegistrations,
      totalAttendance,
      totalCertificates,
      categoryDistribution,
      pendingEvents,
      recentRegistrations,
      departmentBreakdown,
      eventPerformance,
      feedbackSummary,
      recentAuditLogs,
    ] = await Promise.all([
      Event.countDocuments(eventMatch),
      User.countDocuments({ role: 'STUDENT', isActive: true }),
      User.countDocuments({ role: 'ORGANIZER', isActive: true }),
      Event.countDocuments({
        status: 'APPROVED',
        endDate: { $gte: now },
        ...(category && category !== 'All' ? { category } : {}),
      }),
      Event.countDocuments({ status: 'PENDING_APPROVAL' }),
      Registration.countDocuments({ status: { $in: ['REGISTERED', 'ATTENDED'] } }),
      Attendance.countDocuments(),
      Certificate.countDocuments({ status: 'ISSUED' }),
      Event.aggregate([
        { $match: eventMatch },
        {
          $group: {
            _id: '$category',
            events: { $sum: 1 },
            registrations: { $sum: '$registeredCount' },
            capacity: { $sum: '$capacity' },
            attended: { $sum: '$attendedCount' },
          },
        },
        { $sort: { registrations: -1 } },
      ]),
      Event.find({ status: 'PENDING_APPROVAL' })
        .populate('venueId', 'name building capacity')
        .sort({ createdAt: -1 })
        .lean(),
      Registration.find({ status: { $ne: 'CANCELLED' } })
        .populate('studentId', 'name email rollNumber department yearOfStudy')
        .populate('eventId', 'title category startDate venueName')
        .sort({ registeredAt: -1 })
        .limit(10)
        .lean(),
      User.aggregate([
        { $match: { role: 'STUDENT' } },
        { $group: { _id: '$department', students: { $sum: 1 } } },
        { $sort: { students: -1 } },
      ]),
      Event.find(eventMatch)
        .select(
          'title category status startDate venueName capacity registeredCount attendedCount waitlistCount organizerName'
        )
        .sort({ startDate: 1 })
        .limit(12)
        .lean(),
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            avgOrg: { $avg: '$organizationRating' },
            avgContent: { $avg: '$contentQualityRating' },
            avgVenue: { $avg: '$venueRating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]),
      AuditLog.find().sort({ createdAt: -1 }).limit(15).lean(),
    ]);

    const venuesCount = await Venue.countDocuments({ isActive: true });

    res.json({
      success: true,
      stats: {
        totalEvents,
        totalStudents,
        totalOrganizers,
        activeEvents,
        pendingApprovals: pendingApprovalsCount,
        totalRegistrations,
        totalAttendance,
        attendanceRate:
          totalRegistrations > 0
            ? Math.round((totalAttendance / totalRegistrations) * 100)
            : 0,
        totalCertificates,
        activeVenues: venuesCount,
        averageFeedback: feedbackSummary[0]
          ? Number(feedbackSummary[0].avgRating.toFixed(2))
          : 4.8,
        totalFeedbackCount: feedbackSummary[0]?.totalReviews || 0,
      },
      categoryDistribution: categoryDistribution.map((c) => ({
        category: c._id,
        events: c.events,
        registrations: c.registrations,
        capacity: c.capacity,
        attended: c.attended,
        utilization:
          c.capacity > 0 ? Math.round((c.registrations / c.capacity) * 100) : 0,
      })),
      departmentBreakdown: departmentBreakdown.map((d) => ({
        department: d._id || 'General',
        students: d.students,
      })),
      eventPerformance: eventPerformance.map((e) => ({
        _id: e._id,
        title: e.title,
        category: e.category,
        status: e.status,
        startDate: e.startDate,
        venueName: e.venueName,
        organizerName: e.organizerName,
        capacity: e.capacity,
        registered: e.registeredCount,
        attended: e.attendedCount,
        waitlisted: e.waitlistCount,
        fillRate:
          e.capacity > 0 ? Math.round((e.registeredCount / e.capacity) * 100) : 0,
      })),
      pendingEvents,
      recentRegistrations,
      recentAuditLogs,
    });
  } catch (err) {
    next(err);
  }
}

export async function decideEventApproval(
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
    const { decision, notes } = req.body as {
      decision: 'APPROVED' | 'REJECTED';
      notes?: string;
    };

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      res.status(400).json({
        success: false,
        error: 'Decision must be APPROVED or REJECTED.',
      });
      return;
    }

    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found.' });
      return;
    }

    event.status = decision;
    event.approvalNotes = notes || (decision === 'APPROVED' ? 'Approved by Administration' : 'Needs revision');
    event.approvedBy = req.user._id;
    event.approvedAt = new Date();
    await event.save();

    await syncVenueReservation({
      venueId: event.venueId,
      eventId: event._id,
      requestedBy: event.organizerId,
      startTime: event.startDate,
      endTime: event.endDate,
      status: decision === 'APPROVED' ? 'CONFIRMED' : 'CANCELLED',
    });

    await createNotificationSafe({
      userId: event.organizerId,
      type: 'APPROVAL_DECISION',
      title: `Event ${decision === 'APPROVED' ? 'Approved' : 'Returned'}: ${event.title}`,
      message:
        decision === 'APPROVED'
          ? `Your event "${event.title}" has been approved and is now live for student registration.`
          : `Your event "${event.title}" was not approved. Notes: ${event.approvalNotes}`,
      link: `/organizer`,
    });

    await recordAuditLog({
      user: req.user,
      action: `EVENT_${decision}`,
      targetType: 'Event',
      targetId: String(event._id),
      details: { title: event.title, notes: event.approvalNotes },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      event,
      message: `Event "${event.title}" has been ${decision.toLowerCase()}.`,
    });
  } catch (err) {
    next(err);
  }
}

export async function listUsersAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { search = '', role = 'ALL' } = req.query as Record<string, string>;
    const query: Record<string, any> = {};

    if (role && role !== 'ALL') {
      query.role = role;
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: regex },
        { email: regex },
        { department: regex },
        { rollNumber: regex },
      ];
    }

    const users = await User.find(query).sort({ createdAt: -1 }).limit(100).lean();

    res.json({
      success: true,
      users,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUserRoleOrStatus(
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
    const { role, isActive } = req.body;

    const target = await User.findById(id);
    if (!target) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    if (role && ['STUDENT', 'ORGANIZER', 'ADMIN'].includes(role)) {
      target.role = role;
    }
    if (typeof isActive === 'boolean') {
      target.isActive = isActive;
    }

    await target.save();

    await recordAuditLog({
      user: req.user,
      action: 'USER_PERMISSIONS_UPDATED',
      targetType: 'User',
      targetId: String(target._id),
      details: { name: target.name, role: target.role, isActive: target.isActive },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      user: target,
    });
  } catch (err) {
    next(err);
  }
}
