import { Response, NextFunction } from 'express';
import {
  Event,
  Registration,
  Attendance,
} from '../models/index.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import {
  attendanceScanSchema,
  manualAttendanceSchema,
} from '../validators/schemas.js';
import { createNotificationSafe } from '../services/reminderService.js';

export async function scanQrPass(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const parsed = attendanceScanSchema.parse(req.body);
    const cleanToken = parsed.qrToken.trim().toUpperCase();

    const registration = await Registration.findOne({ qrToken: cleanToken })
      .populate('studentId', 'name email rollNumber department yearOfStudy')
      .populate('eventId');

    if (!registration || !registration.eventId) {
      res.status(404).json({
        success: false,
        code: 'INVALID_PASS',
        error: 'Invalid or unrecognized QR attendance pass.',
      });
      return;
    }

    const event = registration.eventId as any;
    const student = registration.studentId as any;

    if (parsed.eventId && String(event._id) !== String(parsed.eventId)) {
      res.status(400).json({
        success: false,
        code: 'WRONG_EVENT',
        error: `This QR pass belongs to "${event.title}", not the currently selected scanner session.`,
      });
      return;
    }

    // Check organizer authorization
    if (
      req.user.role === 'ORGANIZER' &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      res.status(403).json({
        success: false,
        code: 'UNAUTHORIZED_ORGANIZER',
        error: 'You are only authorized to scan passes for events you organize.',
      });
      return;
    }

    if (registration.status === 'CANCELLED' || registration.status === 'WAITLISTED') {
      res.status(400).json({
        success: false,
        code: 'INELIGIBLE_STATUS',
        error: `Pass cannot be checked in because registration status is ${registration.status}.`,
      });
      return;
    }

    // Idempotent check: has this student already been checked in?
    const existingAttendance = await Attendance.findOne({
      eventId: event._id,
      studentId: student._id,
    });

    if (existingAttendance || registration.status === 'ATTENDED') {
      res.status(200).json({
        success: true,
        alreadyScanned: true,
        message: `${student.name} was already checked in at ${new Date(
          existingAttendance?.checkedInAt || registration.checkedInAt || Date.now()
        ).toLocaleTimeString()}.`,
        attendee: {
          registrationId: registration._id,
          studentName: student.name,
          rollNumber: student.rollNumber,
          department: student.department,
          eventTitle: event.title,
          checkedInAt: existingAttendance?.checkedInAt || registration.checkedInAt,
          method: existingAttendance?.method || 'QR_SCAN',
        },
      });
      return;
    }

    const now = new Date();
    const attendance = await Attendance.create({
      registrationId: registration._id,
      eventId: event._id,
      studentId: student._id,
      scannedBy: req.user._id,
      method: 'QR_SCAN',
      checkedInAt: now,
      isDemo: false,
    });

    registration.status = 'ATTENDED';
    registration.checkedInAt = now;
    await registration.save();

    await Event.findByIdAndUpdate(event._id, { $inc: { attendedCount: 1 } });

    await createNotificationSafe({
      userId: student._id,
      type: 'ATTENDANCE_UPDATE',
      title: `Checked In: ${event.title}`,
      message: `Your attendance for ${event.title} has been verified at ${now.toLocaleTimeString()}.`,
      link: '/my-registrations',
    });

    res.status(200).json({
      success: true,
      alreadyScanned: false,
      message: `Check-in verified for ${student.name}!`,
      attendee: {
        attendanceId: attendance._id,
        registrationId: registration._id,
        studentName: student.name,
        rollNumber: student.rollNumber,
        department: student.department,
        eventTitle: event.title,
        checkedInAt: now,
        method: 'QR_SCAN',
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function manualAttendanceOverride(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const parsed = manualAttendanceSchema.parse(req.body);
    const registration = await Registration.findById(parsed.registrationId)
      .populate('studentId', 'name email rollNumber department')
      .populate('eventId');

    if (!registration || !registration.eventId) {
      res.status(404).json({ success: false, error: 'Registration record not found.' });
      return;
    }

    const event = registration.eventId as any;
    const student = registration.studentId as any;

    if (
      req.user.role === 'ORGANIZER' &&
      String(event.organizerId) !== String(req.user._id)
    ) {
      res.status(403).json({
        success: false,
        error: 'You may only override attendance for events you organize.',
      });
      return;
    }

    const existing = await Attendance.findOne({
      eventId: event._id,
      studentId: student._id,
    });

    if (existing) {
      res.json({
        success: true,
        alreadyScanned: true,
        message: `${student.name} is already marked as attended.`,
      });
      return;
    }

    const now = new Date();
    await Attendance.create({
      registrationId: registration._id,
      eventId: event._id,
      studentId: student._id,
      scannedBy: req.user._id,
      method: 'MANUAL_OVERRIDE',
      overrideReason: parsed.overrideReason,
      checkedInAt: now,
      isDemo: false,
    });

    registration.status = 'ATTENDED';
    registration.checkedInAt = now;
    await registration.save();

    await Event.findByIdAndUpdate(event._id, { $inc: { attendedCount: 1 } });

    await recordAuditLog({
      user: req.user,
      action: 'ATTENDANCE_MANUAL_OVERRIDE',
      targetType: 'Registration',
      targetId: String(registration._id),
      details: {
        studentName: student.name,
        eventTitle: event.title,
        reason: parsed.overrideReason,
      },
      ipAddress: req.ip,
    });

    await createNotificationSafe({
      userId: student._id,
      type: 'ATTENDANCE_UPDATE',
      title: `Attendance Recorded: ${event.title}`,
      message: `Your attendance for ${event.title} was recorded by ${req.user.name}.`,
      link: '/my-registrations',
    });

    res.json({
      success: true,
      alreadyScanned: false,
      message: `Manual attendance recorded for ${student.name}.`,
    });
  } catch (err) {
    next(err);
  }
}

export async function getEventAttendance(
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

    const [attendanceList, registrations] = await Promise.all([
      Attendance.find({ eventId: event._id })
        .populate('studentId', 'name email rollNumber department yearOfStudy')
        .populate('scannedBy', 'name role')
        .sort({ checkedInAt: -1 })
        .lean(),
      Registration.find({
        eventId: event._id,
        status: { $in: ['REGISTERED', 'ATTENDED'] },
      })
        .populate('studentId', 'name email rollNumber department yearOfStudy')
        .sort({ registeredAt: -1 })
        .lean(),
    ]);

    res.json({
      success: true,
      event,
      stats: {
        totalRegistered: registrations.length,
        totalAttended: attendanceList.length,
        attendanceRate:
          registrations.length > 0
            ? Math.round((attendanceList.length / registrations.length) * 100)
            : 0,
      },
      attendance: attendanceList,
      registrations,
    });
  } catch (err) {
    next(err);
  }
}
