import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IFeedback extends Document {
  _id: Types.ObjectId;
  eventId: Types.ObjectId;
  studentId: Types.ObjectId;
  rating: number;
  organizationRating: number;
  contentQualityRating: number;
  venueRating: number;
  comment: string;
  wouldRecommend: boolean;
  isAnonymous: boolean;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    organizationRating: { type: Number, default: 5, min: 1, max: 5 },
    contentQualityRating: { type: Number, default: 5, min: 1, max: 5 },
    venueRating: { type: Number, default: 5, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 2000 },
    wouldRecommend: { type: Boolean, default: true },
    isAnonymous: { type: Boolean, default: false },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FeedbackSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

export const Feedback =
  mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);
