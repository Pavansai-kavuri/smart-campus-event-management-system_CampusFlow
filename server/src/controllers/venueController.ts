import { Request, Response, NextFunction } from 'express';
import {
  Venue,
  Event,
  VenueReservation,
} from '../models/index.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { venueSchema, conflictCheckSchema } from '../validators/schemas.js';
import { checkVenueConflicts } from '../services/venueConflictService.js';

export async function listVenues(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const venues = await Venue.find().sort({ capacity: -1 }).lean();
    const upcomingEvents = await Event.find({
      status: { $in: ['APPROVED', 'PENDING_APPROVAL'] },
      endDate: { $gte: new Date() },
    })
      .select('title venueId startDate endDate status organizerName capacity registeredCount')
      .sort({ startDate: 1 })
      .lean();

    const byVenue = new Map<string, any[]>();
    for (const ev of upcomingEvents) {
      const key = String(ev.venueId);
      if (!byVenue.has(key)) byVenue.set(key, []);
      byVenue.get(key)!.push(ev);
    }

    res.json({
      success: true,
      venues: venues.map((v) => ({
        ...v,
        upcomingBookings: byVenue.get(String(v._id)) || [],
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function createVenue(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const parsed = venueSchema.parse(req.body);
    const venue = await Venue.create({
      ...parsed,
      code: parsed.code.toUpperCase(),
      isActive: true,
      isDemo: false,
    });

    await recordAuditLog({
      user: req.user,
      action: 'VENUE_CREATED',
      targetType: 'Venue',
      targetId: String(venue._id),
      details: { name: venue.name, capacity: venue.capacity },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      venue,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateVenue(
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
    const venue = await Venue.findByIdAndUpdate(id, req.body, { new: true });
    if (!venue) {
      res.status(404).json({ success: false, error: 'Venue not found.' });
      return;
    }

    await recordAuditLog({
      user: req.user,
      action: 'VENUE_UPDATED',
      targetType: 'Venue',
      targetId: String(venue._id),
      details: { name: venue.name, isActive: venue.isActive },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      venue,
    });
  } catch (err) {
    next(err);
  }
}

export async function checkConflictEndpoint(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = conflictCheckSchema.parse(req.body);
    const startDate = new Date(parsed.startDate);
    const endDate = new Date(parsed.endDate);

    if (endDate <= startDate) {
      res.status(400).json({
        success: false,
        error: 'End time must be after start time.',
      });
      return;
    }

    const report = await checkVenueConflicts({
      venueId: parsed.venueId,
      startDate,
      endDate,
      excludeEventId: parsed.excludeEventId,
      minCapacity: req.body.minCapacity ? Number(req.body.minCapacity) : undefined,
    });

    res.json({
      success: true,
      report,
    });
  } catch (err) {
    next(err);
  }
}

export async function listVenueReservations(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const reservations = await VenueReservation.find({
      status: { $in: ['CONFIRMED', 'PENDING'] },
    })
      .populate('venueId', 'name code building capacity setupBufferMinutes cleanupBufferMinutes')
      .populate('eventId', 'title category startDate endDate status organizerName capacity registeredCount')
      .sort({ startTime: 1 })
      .lean();

    res.json({
      success: true,
      reservations,
    });
  } catch (err) {
    next(err);
  }
}
