import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAttendance extends Document {
  _id: Types.ObjectId;
  registrationId: Types.ObjectId;
  eventId: Types.ObjectId;
  studentId: Types.ObjectId;
  scannedBy: Types.ObjectId;
  method: 'QR_SCAN' | 'MANUAL_OVERRIDE';
  overrideReason?: string;
  checkedInAt: Date;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    registrationId: { type: Schema.Types.ObjectId, ref: 'Registration', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    scannedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    method: {
      type: String,
      enum: ['QR_SCAN', 'MANUAL_OVERRIDE'],
      default: 'QR_SCAN',
      required: true,
    },
    overrideReason: { type: String, maxlength: 400 },
    checkedInAt: { type: Date, default: Date.now },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Ensure idempotent attendance per student per event
AttendanceSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

export const Attendance =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);
