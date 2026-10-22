import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Types } from 'mongoose';
import {
  Event,
  Registration,
  Certificate,
} from '../models/index.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { createNotificationSafe } from '../services/reminderService.js';

export async function registerForEvent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { eventId } = req.body;
    if (!eventId || !Types.ObjectId.isValid(eventId)) {
      res.status(400).json({ success: false, error: 'Valid event ID is required.' });
      return;
    }

    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found.' });
      return;
    }

    if (event.status !== 'APPROVED') {
      res.status(400).json({
        success: false,
        error: `Registrations are not open for this event (Status: ${event.status}).`,
      });
      return;
    }

    const now = new Date();
    if (new Date(event.registrationDeadline) < now) {
      res.status(400).json({
        success: false,
        error: 'The registration deadline for this event has passed.',
      });
      return;
    }

    // Check student eligibility (department & year)
    if (!event.eligibility.openToAll) {
      if (
        event.eligibility.departments.length > 0 &&
        !event.eligibility.departments.includes(req.user.department)
      ) {
        res.status(403).json({
          success: false,
          error: `This event is restricted to: ${event.eligibility.departments.join(', ')}.`,
        });
        return;
      }

      if (
        event.eligibility.years.length > 0 &&
        req.user.yearOfStudy &&
        !event.eligibility.years.includes(req.user.yearOfStudy)
      ) {
        res.status(403).json({
          success: false,
          error: `This event is restricted to students in year(s): ${event.eligibility.years.join(', ')}.`,
        });
        return;
      }
    }

    // Check existing registration (including previously cancelled)
    const existing = await Registration.findOne({
      studentId: req.user._id,
      eventId: event._id,
    });

    if (existing && existing.status !== 'CANCELLED') {
      res.status(409).json({
        success: false,
        error: `You are already ${existing.status.toLowerCase()} for ${event.title}.`,
        registration: existing,
      });
      return;
    }

    // Atomic seat claim to safely handle concurrent registration requests
    const updatedEvent = await Event.findOneAndUpdate(
      {
        _id: event._id,
        status: 'APPROVED',
        $expr: { $lt: ['$registeredCount', '$capacity'] },
      },
      { $inc: { registeredCount: 1 } },
      { new: true }
    );

    let assignedStatus: 'REGISTERED' | 'WAITLISTED' = 'REGISTERED';
    if (!updatedEvent) {
      // Capacity full -> place on waitlist atomically
      assignedStatus = 'WAITLISTED';
      await Event.findByIdAndUpdate(event._id, { $inc: { waitlistCount: 1 } });
    }

    // Cryptographically random opaque QR pass token
    const qrToken = `CFPASS-${crypto.randomBytes(12).toString('hex').toUpperCase()}`;

    let registration;
    if (existing && existing.status === 'CANCELLED') {
      existing.status = assignedStatus;
      existing.qrToken = qrToken;
      existing.registeredAt = new Date();
      existing.cancelledAt = undefined;
      registration = await existing.save();
    } else {
      registration = await Registration.create({
        eventId: event._id,
        studentId: req.user._id,
        status: assignedStatus,
        qrToken,
        registeredAt: new Date(),
        isDemo: false,
      });
    }

    await createNotificationSafe({
      userId: req.user._id,
      type: 'REGISTRATION_CONFIRMATION',
      title:
        assignedStatus === 'REGISTERED'
          ? `Registration Confirmed: ${event.title}`
          : `Added to Waitlist: ${event.title}`,
      message:
        assignedStatus === 'REGISTERED'
          ? `Your seat for ${event.title} on ${new Date(
              event.startDate
            ).toLocaleDateString()} at ${event.venueName} is confirmed. Your QR pass is ready.`
          : `${event.title} is currently at capacity. You have been placed on the priority waitlist.`,
      link: '/my-registrations',
    });

    res.status(201).json({
      success: true,
      registration,
      status: assignedStatus,
      message:
        assignedStatus === 'REGISTERED'
          ? 'Registration confirmed! Your QR attendance pass is ready.'
          : 'Event is full — you have been added to the waitlist.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyRegistrations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const registrations = await Registration.find({ studentId: req.user._id })
      .populate('eventId')
      .sort({ registeredAt: -1 })
      .lean();

    const certs = await Certificate.find({
      studentId: req.user._id,
      status: 'ISSUED',
    }).lean();
    const certByEvent = new Map(certs.map((c) => [String(c.eventId), c]));

    const formatted = registrations
      .filter((r: any) => r.eventId)
      .map((r: any) => ({
        ...r,
        event: r.eventId,
        certificate: certByEvent.get(String(r.eventId._id)) || null,
      }));

    res.json({
      success: true,
      registrations: formatted,
    });
  } catch (err) {
    next(err);
  }
}

export async function cancelRegistration(
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
    const reg = await Registration.findById(id).populate('eventId');
    if (!reg) {
      res.status(404).json({ success: false, error: 'Registration not found.' });
      return;
    }

    if (
      req.user.role === 'STUDENT' &&
      String(reg.studentId) !== String(req.user._id)
    ) {
      res.status(403).json({
        success: false,
        error: 'You may only cancel your own registrations.',
      });
      return;
    }

    if (reg.status === 'ATTENDED') {
      res.status(400).json({
        success: false,
        error: 'Cannot cancel a registration after attendance has been recorded.',
      });
      return;
    }

    if (reg.status === 'CANCELLED') {
      res.status(400).json({
        success: false,
        error: 'This registration is already cancelled.',
      });
      return;
    }

    const prevStatus = reg.status;
    reg.status = 'CANCELLED';
    reg.cancelledAt = new Date();
    await reg.save();

    const eventId = (reg.eventId as any)?._id || reg.eventId;

    if (prevStatus === 'REGISTERED') {
      // Check if someone is waitlisted to promote
      const nextWaitlisted = await Registration.findOneAndUpdate(
        { eventId, status: 'WAITLISTED' },
        { status: 'REGISTERED' },
        { sort: { registeredAt: 1 }, new: true }
      );

      if (nextWaitlisted) {
        await Event.findByIdAndUpdate(eventId, {
          $inc: { waitlistCount: -1 },
        });
        await createNotificationSafe({
          userId: nextWaitlisted.studentId,
          type: 'REGISTRATION_CONFIRMATION',
          title: `Promoted from Waitlist!`,
          message: `A spot opened up for ${(reg.eventId as any)?.title || 'your event'}. Your registration is now confirmed!`,
          link: '/my-registrations',
        });
      } else {
        await Event.findOneAndUpdate(
          { _id: eventId, registeredCount: { $gt: 0 } },
          { $inc: { registeredCount: -1 } }
        );
      }
    } else if (prevStatus === 'WAITLISTED') {
      await Event.findOneAndUpdate(
        { _id: eventId, waitlistCount: { $gt: 0 } },
        { $inc: { waitlistCount: -1 } }
      );
    }

    res.json({
      success: true,
      registration: reg,
      message: 'Registration cancelled successfully.',
    });
  } catch (err) {
    next(err);
  }
}

export async function getEventRegistrations(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found.' });
      return;
    }

    if (
      req.user.role === 'ORGANIZER' &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      res.status(403).json({
        success: false,
        error: 'You can only view registrations for events you organize.',
      });
      return;
    }

    const registrations = await Registration.find({ eventId: event._id })
      .populate('studentId', 'name email rollNumber department yearOfStudy')
      .sort({ registeredAt: -1 })
      .lean();

    res.json({
      success: true,
      event,
      registrations: registrations.map((r: any) => ({
        ...r,
        student: r.studentId,
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function sendEventReminders(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { eventId } = req.params;
    const event = await Event.findById(eventId);
    if (!event) {
      res.status(404).json({ success: false, error: 'Event not found.' });
      return;
    }

    if (
      req.user.role === 'ORGANIZER' &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      res.status(403).json({
        success: false,
        error: 'Only the event organizer or an administrator can send reminders.',
      });
      return;
    }

    const activeRegs = await Registration.find({
      eventId: event._id,
      status: 'REGISTERED',
    });

    for (const reg of activeRegs) {
      await createNotificationSafe({
        userId: reg.studentId,
        type: 'EVENT_REMINDER',
        title: `Reminder: ${event.title}`,
        message: req.body.customMessage
          ? String(req.body.customMessage)
          : `Don't forget! ${event.title} takes place on ${new Date(
              event.startDate
            ).toLocaleString()} at ${event.venueName}. Bring your CampusFlow QR pass.`,
        link: '/my-registrations',
      });
      reg.reminderSent = true;
      await reg.save();
    }

    const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

    await recordAuditLog({
      user: req.user,
      action: 'EVENT_REMINDERS_DISPATCHED',
      targetType: 'Event',
      targetId: String(event._id),
      details: { count: activeRegs.length, emailConfigured },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      dispatchedInApp: activeRegs.length,
      emailIntegrationStatus: emailConfigured
        ? 'DELIVERED_VIA_SMTP'
        : 'AWAITING_SMTP_CONFIGURATION',
      message: emailConfigured
        ? `Sent in-app and email reminders to ${activeRegs.length} registered attendees.`
        : `Delivered ${activeRegs.length} in-app reminders. External email delivery is awaiting SMTP configuration in .env.`,
    });
  } catch (err) {
    next(err);
  }
}
