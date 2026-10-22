import { Types } from 'mongoose';
import { Venue, Event, VenueReservation, IVenue } from '../models/index.js';

export interface ConflictDetail {
  eventId: string;
  eventTitle: string;
  organizerName: string;
  startDate: Date;
  endDate: Date;
  bufferStart: Date;
  bufferEnd: Date;
  status: string;
}

export interface ConflictCheckResult {
  hasConflict: boolean;
  venue?: IVenue;
  requestedStart: Date;
  requestedEnd: Date;
  bufferStart: Date;
  bufferEnd: Date;
  setupBufferMinutes: number;
  cleanupBufferMinutes: number;
  conflicts: ConflictDetail[];
  suggestedVenues: Array<{
    _id: string;
    name: string;
    code: string;
    building: string;
    capacity: number;
  }>;
  suggestedNextSlot?: {
    startDate: Date;
    endDate: Date;
  };
}

export async function checkVenueConflicts(params: {
  venueId: string;
  startDate: Date;
  endDate: Date;
  excludeEventId?: string;
  minCapacity?: number;
}): Promise<ConflictCheckResult> {
  const venue = await Venue.findById(params.venueId);
  const defaultBuffer = Number(process.env.VENUE_BUFFER_MINUTES || 30);
  const setupMin = venue?.setupBufferMinutes ?? defaultBuffer;
  const cleanupMin = venue?.cleanupBufferMinutes ?? defaultBuffer;

  const bufferStart = new Date(params.startDate.getTime() - setupMin * 60 * 1000);
  const bufferEnd = new Date(params.endDate.getTime() + cleanupMin * 60 * 1000);

  const eventFilter: Record<string, any> = {
    venueId: new Types.ObjectId(params.venueId),
    status: { $in: ['APPROVED', 'PENDING_APPROVAL'] },
  };

  if (params.excludeEventId && Types.ObjectId.isValid(params.excludeEventId)) {
    eventFilter._id = { $ne: new Types.ObjectId(params.excludeEventId) };
  }

  // Find candidate events at this venue and check buffer-aware interval overlap:
  // Overlap exists when existingBufferStart < requestedBufferEnd AND existingBufferEnd > requestedBufferStart
  const existingEvents = await Event.find(eventFilter).sort({ startDate: 1 }).lean();

  const conflicts: ConflictDetail[] = [];

  for (const ev of existingEvents) {
    const evBufferStart = new Date(new Date(ev.startDate).getTime() - setupMin * 60 * 1000);
    const evBufferEnd = new Date(new Date(ev.endDate).getTime() + cleanupMin * 60 * 1000);

    if (evBufferStart < bufferEnd && evBufferEnd > bufferStart) {
      conflicts.push({
        eventId: String(ev._id),
        eventTitle: ev.title,
        organizerName: ev.organizerName,
        startDate: ev.startDate,
        endDate: ev.endDate,
        bufferStart: evBufferStart,
        bufferEnd: evBufferEnd,
        status: ev.status,
      });
    }
  }

  // If there is a conflict, compute alternative conflict-free venues and next free time slot
  const suggestedVenues: ConflictCheckResult['suggestedVenues'] = [];
  let suggestedNextSlot: ConflictCheckResult['suggestedNextSlot'];

  if (conflicts.length > 0) {
    const durationMs = params.endDate.getTime() - params.startDate.getTime();
    const latestConflictEnd = new Date(
      Math.max(...conflicts.map((c) => c.bufferEnd.getTime()))
    );
    const nextStart = new Date(latestConflictEnd.getTime() + setupMin * 60 * 1000);
    suggestedNextSlot = {
      startDate: nextStart,
      endDate: new Date(nextStart.getTime() + durationMs),
    };

    const allVenues = await Venue.find({
      _id: { $ne: new Types.ObjectId(params.venueId) },
      isActive: true,
      ...(params.minCapacity ? { capacity: { $gte: params.minCapacity } } : {}),
    }).lean();

    for (const candidate of allVenues) {
      const cSetup = candidate.setupBufferMinutes ?? defaultBuffer;
      const cCleanup = candidate.cleanupBufferMinutes ?? defaultBuffer;
      const cStart = new Date(params.startDate.getTime() - cSetup * 60 * 1000);
      const cEnd = new Date(params.endDate.getTime() + cCleanup * 60 * 1000);

      const overlappingAtCandidate = await Event.findOne({
        venueId: candidate._id,
        status: { $in: ['APPROVED', 'PENDING_APPROVAL'] },
        startDate: { $lt: cEnd },
        endDate: { $gt: cStart },
      }).lean();

      if (!overlappingAtCandidate) {
        suggestedVenues.push({
          _id: String(candidate._id),
          name: candidate.name,
          code: candidate.code,
          building: candidate.building,
          capacity: candidate.capacity,
        });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    venue: venue || undefined,
    requestedStart: params.startDate,
    requestedEnd: params.endDate,
    bufferStart,
    bufferEnd,
    setupBufferMinutes: setupMin,
    cleanupBufferMinutes: cleanupMin,
    conflicts,
    suggestedVenues,
    suggestedNextSlot,
  };
}

export async function syncVenueReservation(params: {
  venueId: Types.ObjectId;
  eventId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'RELEASED';
  isDemo?: boolean;
}): Promise<void> {
  const venue = await Venue.findById(params.venueId);
  const defaultBuffer = Number(process.env.VENUE_BUFFER_MINUTES || 30);
  const setupMin = venue?.setupBufferMinutes ?? defaultBuffer;
  const cleanupMin = venue?.cleanupBufferMinutes ?? defaultBuffer;

  const bufferStart = new Date(params.startTime.getTime() - setupMin * 60 * 1000);
  const bufferEnd = new Date(params.endTime.getTime() + cleanupMin * 60 * 1000);

  await VenueReservation.findOneAndUpdate(
    { eventId: params.eventId },
    {
      venueId: params.venueId,
      eventId: params.eventId,
      requestedBy: params.requestedBy,
      startTime: params.startTime,
      endTime: params.endTime,
      bufferStart,
      bufferEnd,
      status: params.status,
      isDemo: Boolean(params.isDemo),
    },
    { upsert: true, new: true }
  );
}
