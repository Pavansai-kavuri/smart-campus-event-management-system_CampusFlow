import { Router } from 'express';
import {
  authenticate,
  optionalAuthenticate,
  requireRole,
} from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as eventController from '../controllers/eventController.js';
import * as registrationController from '../controllers/registrationController.js';
import * as attendanceController from '../controllers/attendanceController.js';
import * as certificateController from '../controllers/certificateController.js';
import * as venueController from '../controllers/venueController.js';
import * as dashboardController from '../controllers/dashboardController.js';
import * as communityController from '../controllers/communityController.js';
import { getDatabaseStatus } from '../config/database.js';
import { runAutomatedEventReminders } from '../services/reminderService.js';

const router = Router();

// Health & Database Connection Status
router.get('/health', (_req, res) => {
  const db = getDatabaseStatus();
  res.json({
    success: true,
    service: 'CampusFlow API',
    timestamp: new Date().toISOString(),
    database: db,
    integrations: {
      emailSmtpConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
      externalAiConfigured: Boolean(process.env.AI_PROVIDER_API_KEY),
    },
  });
});

// Authentication & Profile
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/google', authController.googleLogin);
router.post('/auth/demo-login', authController.demoLogin);
router.post('/auth/logout', authController.logout);
router.get('/auth/me', authenticate, authController.getMe);
router.patch('/auth/profile', authenticate, authController.updateProfile);

// Dashboards
router.get('/dashboard/student', authenticate, dashboardController.getStudentDashboard);
router.get(
  '/dashboard/organizer',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  dashboardController.getOrganizerDashboard
);
router.get(
  '/dashboard/admin',
  authenticate,
  requireRole('ADMIN'),
  dashboardController.getAdminDashboard
);
router.post(
  '/dashboard/admin/events/:id/decision',
  authenticate,
  requireRole('ADMIN'),
  dashboardController.decideEventApproval
);
router.get(
  '/dashboard/admin/users',
  authenticate,
  requireRole('ADMIN'),
  dashboardController.listUsersAdmin
);
router.patch(
  '/dashboard/admin/users/:id/role',
  authenticate,
  requireRole('ADMIN'),
  dashboardController.updateUserRoleOrStatus
);

// Events
router.get('/events', optionalAuthenticate, eventController.listEvents);
router.get('/events/calendar', optionalAuthenticate, eventController.getCalendarEvents);
router.get('/events/recommendations', authenticate, eventController.getRecommendations);
router.get('/events/saved/me', authenticate, eventController.getSavedEvents);
router.get('/events/:id', optionalAuthenticate, eventController.getEventById);
router.post(
  '/events',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  eventController.createEvent
);
router.patch(
  '/events/:id',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  eventController.updateEvent
);
router.post('/events/:id/save', authenticate, eventController.toggleSaveEvent);

// Registrations
router.post('/registrations', authenticate, registrationController.registerForEvent);
router.get('/registrations/my', authenticate, registrationController.getMyRegistrations);
router.post('/registrations/:id/cancel', authenticate, registrationController.cancelRegistration);
router.get(
  '/registrations/event/:eventId',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  registrationController.getEventRegistrations
);
router.post(
  '/registrations/event/:eventId/remind',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  registrationController.sendEventReminders
);

// QR Attendance
router.post(
  '/attendance/scan',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  attendanceController.scanQrPass
);
router.post(
  '/attendance/manual',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  attendanceController.manualAttendanceOverride
);
router.get(
  '/attendance/event/:eventId',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  attendanceController.getEventAttendance
);

// Digital Certificates
router.get('/certificates/my', authenticate, certificateController.getMyCertificates);
router.get('/certificates/verify/:code', certificateController.verifyCertificatePublic);
router.post(
  '/certificates/issue',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  certificateController.issueCertificatesForEvent
);
router.post(
  '/certificates/:id/revoke',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  certificateController.revokeCertificate
);

// Venues & Conflict Detection
router.get('/venues', optionalAuthenticate, venueController.listVenues);
router.get('/venues/reservations', optionalAuthenticate, venueController.listVenueReservations);
router.post('/venues/check-conflict', authenticate, venueController.checkConflictEndpoint);
router.post(
  '/venues',
  authenticate,
  requireRole('ADMIN'),
  venueController.createVenue
);
router.patch(
  '/venues/:id',
  authenticate,
  requireRole('ADMIN'),
  venueController.updateVenue
);

// Announcements, Feedback & Notifications
router.get('/announcements', optionalAuthenticate, communityController.listAnnouncements);
router.post(
  '/announcements',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  communityController.createAnnouncement
);
router.post('/announcements/:id/read', authenticate, communityController.markAnnouncementRead);

router.get('/feedback', optionalAuthenticate, communityController.listFeedbackAndAnalytics);
router.post('/feedback', authenticate, communityController.submitFeedback);

router.get('/notifications', authenticate, communityController.listMyNotifications);
router.patch('/notifications/:id/read', authenticate, communityController.markNotificationRead);
router.post('/notifications/read-all', authenticate, communityController.markAllNotificationsRead);
router.post(
  '/notifications/run-reminders',
  authenticate,
  requireRole('ORGANIZER', 'ADMIN'),
  async (_req, res, next) => {
    try {
      const result = await runAutomatedEventReminders();
      res.json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
