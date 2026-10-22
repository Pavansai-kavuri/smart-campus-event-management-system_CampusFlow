import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVenueReservation extends Document {
  _id: Types.ObjectId;
  venueId: Types.ObjectId;
  eventId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  bufferStart: Date;
  bufferEnd: Date;
  status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'RELEASED';
  notes?: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VenueReservationSchema = new Schema<IVenueReservation>(
  {
    venueId: { type: Schema.Types.ObjectId, ref: 'Venue', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    bufferStart: { type: Date, required: true, index: true },
    bufferEnd: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ['CONFIRMED', 'PENDING', 'CANCELLED', 'RELEASED'],
      default: 'PENDING',
      index: true,
    },
    notes: { type: String },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

VenueReservationSchema.index({ venueId: 1, bufferStart: 1, bufferEnd: 1, status: 1 });

export const VenueReservation =
  mongoose.models.VenueReservation ||
  mongoose.model<IVenueReservation>('VenueReservation', VenueReservationSchema);
