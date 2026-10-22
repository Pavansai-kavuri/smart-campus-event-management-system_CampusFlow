import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAnnouncement extends Document {
  _id: Types.ObjectId;
  code: string;
  title: string;
  content: string;
  category: string;
  priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  targetAudience: 'ALL' | 'STUDENTS' | 'ORGANIZERS';
  authorId: Types.ObjectId;
  authorName: string;
  publishedAt: Date;
  expiresAt?: Date;
  readBy: Types.ObjectId[];
  isPinned: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, required: true, maxlength: 4000 },
    category: { type: String, default: 'Campus Notice' },
    priority: {
      type: String,
      enum: ['NORMAL', 'IMPORTANT', 'URGENT'],
      default: 'NORMAL',
      index: true,
    },
    targetAudience: {
      type: String,
      enum: ['ALL', 'STUDENTS', 'ORGANIZERS'],
      default: 'ALL',
    },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    publishedAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date },
    readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    isPinned: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Announcement =
  mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
