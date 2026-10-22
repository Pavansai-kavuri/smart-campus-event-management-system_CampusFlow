import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICertificate extends Document {
  _id: Types.ObjectId;
  certificateCode: string;
  eventId: Types.ObjectId;
  studentId: Types.ObjectId;
  registrationId: Types.ObjectId;
  issuedBy: Types.ObjectId;
  participantName: string;
  studentDepartment: string;
  eventTitle: string;
  eventCategory: string;
  venueName: string;
  completionDate: Date;
  signatoryName: string;
  signatoryTitle: string;
  institutionName: string;
  status: 'ISSUED' | 'REVOKED';
  revokedReason?: string;
  verificationHash: string;
  isDemo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    certificateCode: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    eventId: { type: Schema.Types.ObjectId, ref: 'Event', required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    registrationId: { type: Schema.Types.ObjectId, ref: 'Registration', required: true },
    issuedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participantName: { type: String, required: true },
    studentDepartment: { type: String, default: 'Computer Science & Engineering' },
    eventTitle: { type: String, required: true },
    eventCategory: { type: String, required: true },
    venueName: { type: String, required: true },
    completionDate: { type: Date, required: true },
    signatoryName: { type: String, required: true },
    signatoryTitle: { type: String, required: true },
    institutionName: { type: String, default: 'CampusFlow Imperial Institute of Technology' },
    status: { type: String, enum: ['ISSUED', 'REVOKED'], default: 'ISSUED', index: true },
    revokedReason: { type: String },
    verificationHash: { type: String, required: true },
    isDemo: { type: Boolean, default: false },
  },
  { timestamps: true }
);

CertificateSchema.index({ eventId: 1, studentId: 1 }, { unique: true });

export const Certificate =
  mongoose.models.Certificate || mongoose.model<ICertificate>('Certificate', CertificateSchema);
