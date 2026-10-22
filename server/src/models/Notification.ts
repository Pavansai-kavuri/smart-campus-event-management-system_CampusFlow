import mongoose, { Schema, Document, Types } from 'mongoose';

export type NotificationType =
  | 'REGISTRATION_CONFIRMATION'
  | 'EVENT_REMINDER'
  | 'SCHEDULE_CHANGE'
  | 'EVENT_CANCELLATION'
  | 'APPROVAL_DECISION'
  | 'ATTENDANCE_UPDATE'
  | 'CERTIFICATE_ISSUED'
  | 'ANNOUNCEMENT';

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  idempotencyKey?: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: [
        'REGISTRATION_CONFIRMATION',
        'EVENT_REMINDER',
        'SCHEDULE_CHANGE',
        'EVENT_CANCELLATION',
        'APPROVAL_DECISION',
        'ATTENDANCE_UPDATE',
        'CERTIFICATE_ISSUED',
        'ANNOUNCEMENT',
      ],
      required: true,
    },
    title: { type: String, required: true, maxlength: 180 },
    message: { type: String, required: true, maxlength: 1000 },
    link: { type: String },
    read: { type: Boolean, default: false, index: true },
    idempotencyKey: { type: String, sparse: true, unique: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

export const Notification =
  mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
