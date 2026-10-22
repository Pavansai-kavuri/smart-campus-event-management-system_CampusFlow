import mongoose, { Schema, Document, Types } from 'mongoose';

export type RegistrationStatus = 'REGISTERED' | 'WAITLISTED' | 'ATTENDED' | 'CANCELLED';

export interface IRegistration extends Document {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  studentId: Types.ObjectId;
  status: RegistrationStatus;
  qrToken: string;
  registeredAt: Date;
  cancelledAt?: Date;
  checkedInAt?: Date;
  reminderSent: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['REGISTERED', 'WAITLISTED', 'ATTENDED', 'CANCELLED'],
      default: 'REGISTERED',
      required: true,
      index: true,
    },
    qrToken: { type: String, required: true, unique: true, index: true },
    registeredAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date },
    checkedInAt: { type: Date },
    reminderSent: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Prevent duplicate registrations per student and event
RegistrationSchema.index({ studentId: 1, eventId: 1 }, { unique: true });

export const Registration =
  mongoose.models.Registration || mongoose.model<IRegistration>('Registration', RegistrationSchema);
