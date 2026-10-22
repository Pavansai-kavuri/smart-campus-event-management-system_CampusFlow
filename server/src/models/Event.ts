import mongoose, { Schema, Document, Types } from 'mongoose';

export type EventCategory =
  | 'Tech'
  | 'Cultural'
  | 'Workshop'
  | 'Competition'
  | 'Sports'
  | 'Academic'
  | 'Career';

export type EventStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface IEvent extends Document {
  _id: Types.ObjectId;
  code: string;
  title: string;
  subtitle?: string;
  description: string;
  category: EventCategory;
  organizerId: Types.ObjectId;
  organizerName: string;
  organizerDepartment: string;
  venueId: Types.ObjectId;
  venueName: string;
  startDate: Date;
  endDate: Date;
  registrationDeadline: Date;
  capacity: number;
  registeredCount: number;
  waitlistCount: number;
  attendedCount: number;
  eligibility: {
    departments: string[];
    years: number[];
    openToAll: boolean;
  };
  coverImage: string;
  status: EventStatus;
  featured: boolean;
  tags: string[];
  signatoryName: string;
  signatoryTitle: string;
  approvalNotes?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    subtitle: { type: String, trim: true, maxlength: 240 },
    description: { type: String, required: true, maxlength: 5000 },
    category: {
      type: String,
      enum: ['Tech', 'Cultural', 'Workshop', 'Competition', 'Sports', 'Academic', 'Career'],
      required: true,
      index: true,
    },
    organizerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    organizerName: { type: String, required: true },
    organizerDepartment: { type: String, default: 'Student Affairs Council' },
    venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    venueName: { type: String, required: true },
    startDate: { type: Date, required: true, index: true },
    endDate: { type: Date, required: true, index: true },
    registrationDeadline: { type: Date, required: true },
    capacity: { type: Number, required: true, min: 1 },
    registeredCount: { type: Number, default: 0, min: 0 },
    waitlistCount: { type: Number, default: 0, min: 0 },
    attendedCount: { type: Number, default: 0, min: 0 },
    eligibility: {
      departments: { type: [String], default: [] },
      years: { type: [Number], default: [] },
      openToAll: { type: Boolean, default: true },
    },
    coverImage: { type: String, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    featured: { type: Boolean, default: false, index: true },
    tags: { type: [String], default: [] },
    signatoryName: { type: String, default: 'Dr. Aaravind Krishnan' },
    signatoryTitle: { type: String, default: 'Dean of Student Affairs, CampusFlow University' },
    approvalNotes: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    approvedAt: { type: Date },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

EventSchema.index({ status: 1, startDate: 1 });
EventSchema.index({ venueId: 1, startDate: 1, endDate: 1 });

export const Event = mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);
