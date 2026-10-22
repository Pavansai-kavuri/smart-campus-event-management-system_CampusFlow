import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISavedEvent extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  eventId: Types.ObjectId;
  reminderSet: boolean;
  reminderMinutesBefore: number;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SavedEventSchema = new Schema<ISavedEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    reminderSet: { type: Boolean, default: true },
    reminderMinutesBefore: { type: Number, default: 60 },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SavedEventSchema.index({ userId: 1, eventId: 1 }, { unique: true });

export const SavedEvent =
  mongoose.models.SavedEvent || mongoose.model<ISavedEvent>('SavedEvent', SavedEventSchema);
