import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import {
  Event,
  Venue,
  Registration,
  SavedEvent,
  Feedback,
} from '../models/index.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { createEventSchema, updateEventSchema } from '../validators/schemas.js';
import {
  checkVenueConflicts,
  syncVenueReservation,
} from '../services/venueConflictService.js';
import { getRecommendedEventsForUser } from '../services/recommendationService.js';
import { createNotificationSafe } from '../services/reminderService.js';

const DEFAULT_CATEGORY_IMAGES: Record<string, string> = {
  Tech: '/images/events/techfest-2026.jpg',
  Workshop: '/images/events/design-sprint.jpg',
  Cultural: '/images/events/cultural-night.jpg',
  Competition: '/images/events/hackathon.jpg',
  Sports: '/images/events/cultural-night.jpg',
  Academic: '/images/events/design-sprint.jpg',
  Career: '/images/events/techfest-2026.jpg',
};

export async function listEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      search = '',
      category,
      status,
      featured,
      organizerId,
      sort = 'startDate',
      page = '1',
      limit = '12',
      upcomingOnly,
    } = req.query as Record<string, string>;

    const query: Record<string, any> = {};

    // Public/Student view defaults to APPROVED or COMPLETED events unless organizer/admin requests specific status
    if (status && status !== 'ALL') {
      query.status = status;
    } else if (!req.user || req.user.role === 'STUDENT') {
      query.status = { $in: ['APPROVED', 'COMPLETED'] };
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (featured === 'true') {
      query.featured = true;
    }

    if (organizerId && Types.ObjectId.isValid(organizerId)) {
      query.organizerId = new Types.ObjectId(organizerId);
    }

    if (upcomingOnly === 'true') {
      query.endDate = { $gte: new Date() };
    }

    if (search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: regex },
        { subtitle: regex },
        { description: regex },
        { venueName: regex },
        { category: regex },
        { tags: regex },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    let sortSpec: Record<string, 1 | -1> = { startDate: 1 };
    if (sort === 'popular') {
      sortSpec = { registeredCount: -1, startDate: 1 };
    } else if (sort === 'newest') {
      sortSpec = { createdAt: -1 };
    } else if (sort === 'deadline') {
      sortSpec = { registrationDeadline: 1 };
    }

    const [events, total] = await Promise.all([
      Event.find(query).sort(sortSpec).skip(skip).limit(limitNum).lean(),
      Event.countDocuments(query),
    ]);

    let savedMap = new Set<string>();
    let registrationMap = new Map<string, any>();

    if (req.user) {
      const eventIds = events.map((e) => e._id);
      const [savedDocs, regDocs] = await Promise.all([
        SavedEvent.find({ userId: req.user._id, eventId: { $in: eventIds } }).lean(),
        Registration.find({
          studentId: req.user._id,
          eventId: { $in: eventIds },
          status: { $ne: 'CANCELLED' },
        }).lean(),
      ]);
      savedMap = new Set(savedDocs.map((s) => String(s.eventId)));
      registrationMap = new Map(regDocs.map((r) => [String(r.eventId), r]));
    }

    const enriched = events.map((ev) => {
      const reg = registrationMap.get(String(ev._id));
      return {
        ...ev,
        isSaved: savedMap.has(String(ev._id)),
        registrationStatus: reg ? reg.status : null,
        registrationId: reg ? reg._id : null,
        spotsRemaining: Math.max(0, ev.capacity - ev.registeredCount),
      };
    });

    res.json({
      success: true,
      events: enriched,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.max(1, Math.ceil(total / limitNum)),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getEventById(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const id = String(req.params.id);
    const event: any = Types.ObjectId.isValid(id)
      ? await Event.findById(id).populate('venueId').lean()
      : await Event.findOne({ code: id.toUpperCase() }).populate('venueId').lean();

    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found.' });
      return;
    }

    let isSaved = false;
    let myRegistration: any = null;
    let myFeedback: any = null;

    if (req.user) {
      const [saved, reg, fb] = await Promise.all([
        SavedEvent.findOne({ userId: req.user._id, eventId: event._id }).lean(),
        Registration.findOne({
          studentId: req.user._id,
          eventId: event._id,
          status: { $ne: 'CANCELLED' },
        }).lean(),
        Feedback.findOne({ studentId: req.user._id, eventId: event._id }).lean(),
      ]);
      isSaved = Boolean(saved);
      myRegistration = reg;
      myFeedback = fb;
    }

    const feedbackList = await Feedback.find({ eventId: event._id })
      .populate('studentId', 'name department yearOfStudy')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    res.json({
      success: true,
      event: {
        ...event,
        isSaved,
        registrationStatus: myRegistration?.status || null,
        myRegistration,
        myFeedback,
        spotsRemaining: Math.max(0, event.capacity - event.registeredCount),
        recentFeedback: feedbackList.map((f: any) => ({
          _id: f._id,
          rating: f.rating,
          comment: f.comment,
          wouldRecommend: f.wouldRecommend,
          studentName: f.isAnonymous ? 'Anonymous Student' : f.studentId?.name || 'Student',
          department: f.studentId?.department || '',
          createdAt: f.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const parsed = createEventSchema.parse(req.body);
    const startDate = new Date(parsed.startDate);
    const endDate = new Date(parsed.endDate);
    const registrationDeadline = new Date(parsed.registrationDeadline);

    if (endDate <= startDate) {
      res.status(400).json({
        success: false,
        error: 'Event end time must be after the start time.',
      });
      return;
    }

    const venue = await Venue.findById(parsed.venueId);
    if (!venue || !venue.isActive) {
      res.status(404).json({
        success: false,
        error: 'Selected venue does not exist or is unavailable.',
      });
      return;
    }

    if (parsed.capacity > venue.capacity) {
      res.status(400).json({
        success: false,
        error: `Event capacity (${parsed.capacity}) exceeds ${venue.name}'s maximum capacity (${venue.capacity}).`,
      });
      return;
    }

    // Backend venue conflict check with setup/cleanup buffers
    const conflictReport = await checkVenueConflicts({
      venueId: String(venue._id),
      startDate,
      endDate,
      minCapacity: parsed.capacity,
    });

    if (conflictReport.hasConflict) {
      res.status(409).json({
        success: false,
        error: `Venue scheduling conflict detected at ${venue.name}.`,
        conflictReport,
      });
      return;
    }

    const randomCode = `CF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialStatus = req.user.role === 'ADMIN' ? 'APPROVED' : 'PENDING_APPROVAL';

    const event = await Event.create({
      code: randomCode,
      title: parsed.title,
      subtitle: parsed.subtitle,
      description: parsed.description,
      category: parsed.category,
      organizerId: req.user._id,
      organizerName: req.user.name,
      organizerDepartment: req.user.department,
      venueId: venue._id,
      venueName: `${venue.name}, ${venue.building}`,
      startDate,
      endDate,
      registrationDeadline,
      capacity: parsed.capacity,
      eligibility: {
        departments: parsed.eligibility?.departments || [],
        years: parsed.eligibility?.years || [],
        openToAll: parsed.eligibility?.openToAll ?? true,
      },
      coverImage: parsed.coverImage || DEFAULT_CATEGORY_IMAGES[parsed.category] || '/images/events/techfest-2026.jpg',
      status: initialStatus,
      featured: parsed.featured || false,
      tags: parsed.tags || [parsed.category],
      signatoryName: parsed.signatoryName || 'Dr. Aaravind Krishnan',
      signatoryTitle: parsed.signatoryTitle || 'Dean of Student Affairs, CampusFlow University',
      approvedBy: req.user.role === 'ADMIN' ? req.user._id : undefined,
      approvedAt: req.user.role === 'ADMIN' ? new Date() : undefined,
      isDemo: false,
    });

    await syncVenueReservation({
      venueId: venue._id,
      eventId: event._id,
      requestedBy: req.user._id,
      startTime: startDate,
      endTime: endDate,
      status: initialStatus === 'APPROVED' ? 'CONFIRMED' : 'PENDING',
    });

    await recordAuditLog({
      user: req.user,
      action: 'EVENT_CREATED',
      targetType: 'Event',
      targetId: String(event._id),
      details: { title: event.title, venue: venue.name, status: event.status },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      event,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(
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
    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found.' });
      return;
    }

    if (
      req.user.role !== 'ADMIN' &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      res.status(403).json({
        success: false,
        error: 'You may only edit events that you organize.',
      });
      return;
    }

    const parsed = updateEventSchema.parse(req.body);
    const newVenueId = parsed.venueId ? parsed.venueId : String(event.venueId);
    const newStart = parsed.startDate ? new Date(parsed.startDate) : new Date(event.startDate);
    const newEnd = parsed.endDate ? new Date(parsed.endDate) : new Date(event.endDate);

    if (newEnd <= newStart) {
      res.status(400).json({
        success: false,
        error: 'Event end time must be after the start time.',
      });
      return;
    }

    const scheduleOrVenueChanged =
      String(newVenueId) !== String(event.venueId) ||
      newStart.getTime() !== new Date(event.startDate).getTime() ||
      newEnd.getTime() !== new Date(event.endDate).getTime();

    let venue = await Venue.findById(newVenueId);
    if (!venue) {
      res.status(404).json({ success: false, error: 'Selected venue not found.' });
      return;
    }

    const newCapacity = parsed.capacity ?? event.capacity;
    if (newCapacity > venue.capacity) {
      res.status(400).json({
        success: false,
        error: `Capacity (${newCapacity}) exceeds ${venue.name}'s maximum capacity (${venue.capacity}).`,
      });
      return;
    }

    if (scheduleOrVenueChanged) {
      const conflictReport = await checkVenueConflicts({
        venueId: String(venue._id),
        startDate: newStart,
        endDate: newEnd,
        excludeEventId: String(event._id),
        minCapacity: newCapacity,
      });

      if (conflictReport.hasConflict) {
        res.status(409).json({
          success: false,
          error: `Venue scheduling conflict detected at ${venue.name}.`,
          conflictReport,
        });
        return;
      }
    }

    if (parsed.title !== undefined) event.title = parsed.title;
    if (parsed.subtitle !== undefined) event.subtitle = parsed.subtitle;
    if (parsed.description !== undefined) event.description = parsed.description;
    if (parsed.category !== undefined) event.category = parsed.category;
    if (parsed.venueId !== undefined) {
      event.venueId = venue._id;
      event.venueName = `${venue.name}, ${venue.building}`;
    }
    if (parsed.startDate !== undefined) event.startDate = newStart;
    if (parsed.endDate !== undefined) event.endDate = newEnd;
    if (parsed.registrationDeadline !== undefined) {
      event.registrationDeadline = new Date(parsed.registrationDeadline);
    }
    if (parsed.capacity !== undefined) event.capacity = parsed.capacity;
    if (parsed.eligibility !== undefined) {
      event.eligibility = {
        departments: parsed.eligibility.departments ?? event.eligibility.departments,
        years: parsed.eligibility.years ?? event.eligibility.years,
        openToAll: parsed.eligibility.openToAll ?? event.eligibility.openToAll,
      };
    }
    if (parsed.coverImage !== undefined) event.coverImage = parsed.coverImage;
    if (parsed.tags !== undefined) event.tags = parsed.tags;
    if (parsed.featured !== undefined && req.user.role === 'ADMIN') {
      event.featured = parsed.featured;
    }
    if (parsed.status !== undefined) {
      if (
        req.user.role === 'ADMIN' ||
        ['DRAFT', 'PENDING_APPROVAL', 'CANCELLED'].includes(parsed.status)
      ) {
        event.status = parsed.status;
      }
    }

    await event.save();

    await syncVenueReservation({
      venueId: event.venueId,
      eventId: event._id,
      requestedBy: req.user._id,
      startTime: event.startDate,
      endTime: event.endDate,
      status:
        event.status === 'CANCELLED'
          ? 'CANCELLED'
          : event.status === 'APPROVED'
          ? 'CONFIRMED'
          : 'PENDING',
    });

    // Notify registered students if schedule or venue changed or cancelled
    if (scheduleOrVenueChanged || parsed.status === 'CANCELLED') {
      const activeRegs = await Registration.find({
        eventId: event._id,
        status: { $in: ['REGISTERED', 'WAITLISTED'] },
      }).lean();

      for (const reg of activeRegs) {
        await createNotificationSafe({
          userId: reg.studentId,
          type:
            parsed.status === 'CANCELLED' ? 'EVENT_CANCELLATION' : 'SCHEDULE_CHANGE',
          title:
            parsed.status === 'CANCELLED'
              ? `Event Cancelled: ${event.title}`
              : `Schedule Updated: ${event.title}`,
          message:
            parsed.status === 'CANCELLED'
              ? `${event.title} has been cancelled by the organizer.`
              : `${event.title} is now scheduled for ${new Date(
                  event.startDate
                ).toLocaleString()} at ${event.venueName}.`,
          link: `/events/${event._id}`,
        });
      }
    }

    await recordAuditLog({
      user: req.user,
      action: 'EVENT_UPDATED',
      targetType: 'Event',
      targetId: String(event._id),
      details: { title: event.title, status: event.status },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      event,
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleSaveEvent(
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
    const event = await Event.findById(id);
    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found.' });
      return;
    }

    const existing = await SavedEvent.findOne({
      userId: req.user._id,
      eventId: event._id,
    });

    if (existing) {
      await existing.deleteOne();
      res.json({
        success: true,
        isSaved: false,
        message: 'Removed from saved events & reminders.',
      });
      return;
    }

    await SavedEvent.create({
      userId: req.user._id,
      eventId: event._id,
      reminderSet: true,
      reminderMinutesBefore: 60,
    });

    res.json({
      success: true,
      isSaved: true,
      message: 'Saved to your events & reminder scheduled.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getSavedEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const saved = await SavedEvent.find({ userId: req.user._id })
      .populate('eventId')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      savedEvents: saved
        .filter((s: any) => s.eventId)
        .map((s: any) => ({
          ...s.eventId,
          isSaved: true,
          savedAt: s.createdAt,
        })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecommendations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }
    const result = await getRecommendedEventsForUser(req.user, 6);
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCalendarEvents(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const events = await Event.find({
      status: { $in: ['APPROVED', 'COMPLETED'] },
    })
      .sort({ startDate: 1 })
      .lean();

    let regMap = new Map<string, string>();
    if (req.user) {
      const regs = await Registration.find({
        studentId: req.user._id,
        status: { $ne: 'CANCELLED' },
      }).lean();
      regMap = new Map(regs.map((r) => [String(r.eventId), r.status]));
    }

    res.json({
      success: true,
      events: events.map((e) => ({
        ...e,
        isRegistered: regMap.has(String(e._id)),
        registrationStatus: regMap.get(String(e._id)) || null,
      })),
    });
  } catch (err) {
    next(err);
  }
}
