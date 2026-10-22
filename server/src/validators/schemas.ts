import { z } from 'zod';

export const registerUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(120),
  email: z.string().email('Valid university email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  role: z.enum(['STUDENT', 'ORGANIZER']).optional().default('STUDENT'), // Public form can NEVER assign ADMIN
  rollNumber: z.string().max(40).optional(),
  department: z.string().min(2).max(120).optional().default('Computer Science & Engineering'),
  yearOfStudy: z.number().int().min(1).max(6).optional().default(3),
  interests: z.array(z.string()).optional().default(['Tech', 'Workshop', 'Competition']),
});

export const loginSchema = z.object({
  email: z.string().min(3, 'Please enter your university email or student ID'),
  password: z.string().min(1, 'Password is required'),
});

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  department: z.string().min(2).max(120).optional(),
  yearOfStudy: z.number().int().min(1).max(6).optional(),
  avatar: z.string().max(2000).optional(),
  rollNumber: z.string().max(40).optional(),
  bio: z.string().max(500).optional(),
  interests: z.array(z.string()).optional(),
  themePreference: z.enum(['system', 'light', 'dark']).optional(),
  notificationPreferences: z
    .object({
      inApp: z.boolean().optional(),
      emailReminders: z.boolean().optional(),
      scheduleUpdates: z.boolean().optional(),
      certificateAlerts: z.boolean().optional(),
      announcements: z.boolean().optional(),
    })
    .optional(),
});

export const createEventSchema = z.object({
  title: z.string().min(3, 'Title is required').max(180),
  subtitle: z.string().max(240).optional(),
  description: z.string().min(15, 'Description must be at least 15 characters').max(5000),
  category: z.enum(['Tech', 'Cultural', 'Workshop', 'Competition', 'Sports', 'Academic', 'Career']),
  venueId: z.string().min(1, 'Venue selection is required'),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  registrationDeadline: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), 'Invalid registration deadline'),
  capacity: z.number().int().min(5, 'Capacity must be at least 5').max(10000),
  eligibility: z
    .object({
      departments: z.array(z.string()).optional().default([]),
      years: z.array(z.number().int()).optional().default([]),
      openToAll: z.boolean().optional().default(true),
    })
    .optional(),
  coverImage: z.string().min(1).optional(),
  tags: z.array(z.string()).optional().default([]),
  featured: z.boolean().optional().default(false),
  signatoryName: z.string().optional(),
  signatoryTitle: z.string().optional(),
});

export const updateEventSchema = createEventSchema.partial().extend({
  status: z
    .enum(['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'])
    .optional(),
});

export const venueSchema = z.object({
  name: z.string().min(2).max(120),
  code: z.string().min(2).max(30),
  building: z.string().min(2).max(120),
  floor: z.string().max(60).optional().default('Ground Floor'),
  capacity: z.number().int().min(10).max(20000),
  amenities: z.array(z.string()).optional().default([]),
  setupBufferMinutes: z.number().int().min(0).max(240).optional().default(30),
  cleanupBufferMinutes: z.number().int().min(0).max(240).optional().default(30),
});

export const conflictCheckSchema = z.object({
  venueId: z.string().min(1),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid start date'),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid end date'),
  excludeEventId: z.string().optional(),
});

export const attendanceScanSchema = z.object({
  qrToken: z.string().min(6, 'QR pass token is required'),
  eventId: z.string().optional(),
});

export const manualAttendanceSchema = z.object({
  registrationId: z.string().min(1),
  overrideReason: z.string().min(3, 'Reason is required for manual attendance override').max(400),
});

export const announcementSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(10).max(4000),
  category: z.string().optional().default('Campus Notice'),
  priority: z.enum(['NORMAL', 'IMPORTANT', 'URGENT']).optional().default('NORMAL'),
  targetAudience: z.enum(['ALL', 'STUDENTS', 'ORGANIZERS']).optional().default('ALL'),
  isPinned: z.boolean().optional().default(false),
});

export const feedbackSchema = z.object({
  eventId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  organizationRating: z.number().int().min(1).max(5).optional().default(5),
  contentQualityRating: z.number().int().min(1).max(5).optional().default(5),
  venueRating: z.number().int().min(1).max(5).optional().default(5),
  comment: z.string().min(5, 'Please share a brief comment (at least 5 characters)').max(2000),
  wouldRecommend: z.boolean().optional().default(true),
  isAnonymous: z.boolean().optional().default(false),
});
