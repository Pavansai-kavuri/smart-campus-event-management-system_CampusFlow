import mongoose, { Schema, Document, Types } from 'mongoose';

export type UserRole = 'STUDENT' | 'ORGANIZER' | 'ADMIN';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  rollNumber?: string;
  department: string;
  yearOfStudy?: number;
  avatar?: string;
  bio?: string;
  interests: string[];
  themePreference: 'system' | 'light' | 'dark';
  notificationPreferences: {
    inApp: boolean;
    emailReminders: boolean;
    scheduleUpdates: boolean;
    certificateAlerts: boolean;
    announcements: boolean;
  };
  isActive: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ['STUDENT', 'ORGANIZER', 'ADMIN'],
      default: 'STUDENT',
      required: true,
      index: true,
    },
    rollNumber: { type: String, trim: true, sparse: true },
    department: { type: String, default: 'Computer Science & Engineering', trim: true },
    yearOfStudy: { type: Number, min: 1, max: 6, default: 3 },
    avatar: { type: String },
    bio: { type: String, maxlength: 500 },
    interests: {
      type: [String],
      default: ['Tech', 'Workshop', 'Competition'],
    },
    themePreference: {
      type: String,
      enum: ['system', 'light', 'dark'],
      default: 'system',
    },
    notificationPreferences: {
      inApp: { type: Boolean, default: true },
      emailReminders: { type: Boolean, default: true },
      scheduleUpdates: { type: Boolean, default: true },
      certificateAlerts: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true },
    },
    isActive: { type: Boolean, default: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
