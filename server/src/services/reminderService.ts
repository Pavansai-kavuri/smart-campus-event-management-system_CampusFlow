import { Types } from 'mongoose';
import { Event, Registration, Notification, NotificationType } from '../models/index.js';

export async function createNotificationSafe(params: {
  userId: Types.ObjectId | string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  idempotencyKey?: string;
  isDemo?: boolean;
}): Promise<void> {
  try {
    if (params.idempotencyKey) {
      await Notification.findOneAndUpdate(
        { idempotencyKey: params.idempotencyKey },
        {
          $setOnInsert: {
            userId: new Types.ObjectId(String(params.userId)),
            type: params.type,
            title: params.title,
            message: params.message,
            link: params.link,
            read: false,
            idempotencyKey: params.idempotencyKey,
            isDemo: Boolean(params.isDemo),
          },
        },
        { upsert: true, new: true }
      );
      return;
    }

    await Notification.create({
      userId: new Types.ObjectId(String(params.userId)),
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      read: false,
      isDemo: Boolean(params.isDemo),
    });
  } catch (err: any) {
    if (err?.code !== 11000) {
      console.error('[CampusFlow Notification] Failed to create notification:', err);
    }
  }
}

export async function runAutomatedEventReminders(): Promise<{
  checkedEvents: number;
  remindersCreated: number;
  emailConfigured: boolean;
}> {
  const now = new Date();
  const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const emailConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  const upcomingEvents = await Event.find({
    status: 'APPROVED',
    startDate: { $gte: now, $lte: next48Hours },
  }).lean();

  let remindersCreated = 0;

  for (const ev of upcomingEvents) {
    const registrations = await Registration.find({
      eventId: ev._id,
      status: 'REGISTERED',
      reminderSent: false,
    });

    for (const reg of registrations) {
      const idempotencyKey = `reminder-48h-${String(ev._id)}-${String(reg.studentId)}`;
      await createNotificationSafe({
        userId: reg.studentId,
        type: 'EVENT_REMINDER',
        title: `Upcoming Event Reminder: ${ev.title}`,
        message: `${ev.title} starts on ${new Date(ev.startDate).toLocaleString()} at ${
          ev.venueName
        }. Your QR pass is ready in My Registrations.`,
        link: `/my-registrations`,
        idempotencyKey,
      });

      reg.reminderSent = true;
      await reg.save();
      remindersCreated += 1;
    }
  }

  return {
    checkedEvents: upcomingEvents.length,
    remindersCreated,
    emailConfigured,
  };
}
