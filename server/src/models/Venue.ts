import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IVenue extends Document {
  _id: Types.ObjectId;
  name: string;
  code: string;
  building: string;
  floor: string;
  capacity: number;
  amenities: string[];
  setupBufferMinutes: number;
  cleanupBufferMinutes: number;
  isActive: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const VenueSchema = new Schema<IVenue>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    building: { type: String, required: true, trim: true },
    floor: { type: String, default: 'Ground Floor' },
    capacity: { type: Number, required: true, min: 10 },
    amenities: { type: [String], default: [] },
    setupBufferMinutes: { type: Number, default: 30, min: 0 },
    cleanupBufferMinutes: { type: Number, default: 30, min: 0 },
    isActive: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Venue = mongoose.models.Venue || mongoose.model<IVenue>('Venue', VenueSchema);
