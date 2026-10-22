import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import {
  Certificate,
  Event,
  Registration,
  User,
} from '../models/index.js';
import { AuthRequest, recordAuditLog } from '../middleware/auth.js';
import { createNotificationSafe } from '../services/reminderService.js';

export async function getMyCertificates(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const certificates = await Certificate.find({
      studentId: req.user._id,
      status: 'ISSUED',
    })
      .sort({ completionDate: -1 })
      .lean();

    // Ensure student's full name used during login is dynamically reflected on the certificate
    const enriched = certificates.map((cert: any) => ({
      ...cert,
      participantName: req.user?.name || cert.participantName,
      studentDepartment: req.user?.department || cert.studentDepartment,
    }));

    res.json({
      success: true,
      certificates: enriched,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyCertificatePublic(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const code = String(req.params.code || '').trim().toUpperCase();
    if (!code) {
      res.status(400).json({ success: false, error: 'Certificate ID is required.' });
      return;
    }

    const cert: any = await Certificate.findOne({ certificateCode: code }).lean();
    if (!cert) {
      res.status(404).json({
        success: false,
        verified: false,
        error: 'No certificate found matching this verification ID.',
      });
      return;
    }

    // Protect unnecessary personal info while confirming authenticity
    res.json({
      success: true,
      verified: cert.status === 'ISSUED',
      certificate: {
        certificateCode: cert.certificateCode,
        participantName: cert.participantName,
        studentDepartment: cert.studentDepartment,
        eventTitle: cert.eventTitle,
        eventCategory: cert.eventCategory,
        venueName: cert.venueName,
        completionDate: cert.completionDate,
        signatoryName: cert.signatoryName,
        signatoryTitle: cert.signatoryTitle,
        institutionName: cert.institutionName,
        status: cert.status,
        revokedReason: cert.revokedReason,
        issuedAt: cert.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function issueCertificatesForEvent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const { eventId, registrationId } = req.body;
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
        error: 'You may only issue certificates for events you organize.',
      });
      return;
    }

    const filter: Record<string, any> = {
      eventId: event._id,
      status: 'ATTENDED',
    };
    if (registrationId) {
      filter._id = registrationId;
    }

    const attendedRegs = await Registration.find(filter).populate('studentId');
    if (attendedRegs.length === 0) {
      res.status(400).json({
        success: false,
        error: 'No eligible attended registrations found for certificate issuance.',
      });
      return;
    }

    let issuedCount = 0;
    const issuedCerts = [];

    for (const reg of attendedRegs) {
      const student = reg.studentId as any;
      if (!student) continue;

      const existing = await Certificate.findOne({
        eventId: event._id,
        studentId: student._id,
      });

      if (existing && existing.status === 'ISSUED') {
        issuedCerts.push(existing);
        continue;
      }

      const certCode = `CFCERT-${new Date(event.startDate).getFullYear()}-${crypto
        .randomBytes(4)
        .toString('hex')
        .toUpperCase()}`;

      const verificationHash = crypto
        .createHash('sha256')
        .update(`${certCode}:${student._id}:${event._id}`)
        .digest('hex');

      const cert = await Certificate.findOneAndUpdate(
        { eventId: event._id, studentId: student._id },
        {
          certificateCode: existing?.certificateCode || certCode,
          eventId: event._id,
          studentId: student._id,
          registrationId: reg._id,
          issuedBy: req.user._id,
          participantName: student.name,
          studentDepartment: student.department || 'Computer Science & Engineering',
          eventTitle: event.title,
          eventCategory: event.category,
          venueName: event.venueName,
          completionDate: event.endDate || new Date(),
          signatoryName: event.signatoryName || 'Dr. Aaravind Krishnan',
          signatoryTitle:
            event.signatoryTitle || 'Dean of Student Affairs, CampusFlow University',
          institutionName: 'CampusFlow Imperial University',
          status: 'ISSUED',
          revokedReason: undefined,
          verificationHash,
          isDemo: false,
        },
        { upsert: true, new: true }
      );

      issuedCount += 1;
      issuedCerts.push(cert);

      await createNotificationSafe({
        userId: student._id,
        type: 'CERTIFICATE_ISSUED',
        title: `Certificate Awarded: ${event.title}`,
        message: `Your official digital certificate (${cert.certificateCode}) for ${event.title} is now available to preview and download.`,
        link: '/certificates',
      });
    }

    await recordAuditLog({
      user: req.user,
      action: 'CERTIFICATES_ISSUED',
      targetType: 'Event',
      targetId: String(event._id),
      details: { eventTitle: event.title, issuedCount },
      ipAddress: req.ip,
    });

    res.status(201).json({
      success: true,
      issuedCount,
      certificates: issuedCerts,
      message: `Successfully issued ${issuedCount} new digital certificate(s).`,
    });
  } catch (err) {
    next(err);
  }
}

export async function revokeCertificate(
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
    const { reason } = req.body;
    const cert = await Certificate.findById(id);
    if (!cert) {
      res.status(404).json({ success: false, error: 'Certificate not found.' });
      return;
    }

    cert.status = 'REVOKED';
    cert.revokedReason = reason || 'Revoked by administrator';
    await cert.save();

    await recordAuditLog({
      user: req.user,
      action: 'CERTIFICATE_REVOKED',
      targetType: 'Certificate',
      targetId: String(cert._id),
      details: { certificateCode: cert.certificateCode, reason: cert.revokedReason },
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      certificate: cert,
      message: `Certificate ${cert.certificateCode} has been revoked.`,
    });
  } catch (err) {
    next(err);
  }
}
