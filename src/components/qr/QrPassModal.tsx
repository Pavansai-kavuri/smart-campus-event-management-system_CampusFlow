import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QrCode, Calendar, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { DialogModal } from '../ui/DialogModal';

interface QrPassModalProps {
  open: boolean;
  onClose: () => void;
  registration: any | null;
  studentName: string;
}

export const QrPassModal: React.FC<QrPassModalProps> = ({
  open,
  onClose,
  registration,
  studentName,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    if (registration?.qrToken) {
      QRCode.toDataURL(registration.qrToken, {
        width: 260,
        margin: 2,
        color: {
          dark: '#1E1714',
          light: '#FDFBF7',
        },
      })
        .then(setQrDataUrl)
        .catch(() => setQrDataUrl(''));
    }
  }, [registration]);

  if (!registration) return null;
  const event = registration.event || registration.eventId || {};

  return (
    <DialogModal
      open={open}
      onClose={onClose}
      title="CampusFlow Digital Event Pass"
      subtitle="Present this verified QR code at the venue entrance for instant check-in"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-5">
        <div className="rounded-2xl border-2 border-champagne/60 bg-gradient-to-b from-surface-elevated to-surface-card p-5 text-center space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald/15 text-emerald text-xs font-semibold border border-emerald/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            {registration.status === 'ATTENDED' ? 'Attendance Verified' : 'Official Entry Pass'}
          </div>

          <div>
            <h3 className="font-serif text-xl font-bold text-content-primary">{event.title}</h3>
            <p className="text-xs text-content-secondary mt-1">{studentName}</p>
          </div>

          <div className="mx-auto w-52 h-52 rounded-2xl bg-[#FDFBF7] p-3 border border-champagne/50 shadow-inner flex items-center justify-center">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Pass ${registration.qrToken}`}
                className="w-full h-full object-contain"
              />
            ) : (
              <QrCode className="w-16 h-16 text-champagne animate-pulse" />
            )}
          </div>

          <div className="font-mono text-xs font-bold tracking-wider text-champagne bg-surface-bg py-2 px-3 rounded-xl border border-surface-border select-all">
            {registration.qrToken}
          </div>

          <div className="text-left space-y-1.5 pt-2 border-t border-surface-border text-xs text-content-secondary">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-champagne shrink-0" />
              <span>
                {event.startDate ? new Date(event.startDate).toLocaleString() : 'TBA'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-emerald shrink-0" />
              <span>{event.venueName}</span>
            </div>
            {registration.checkedInAt && (
              <div className="flex items-center gap-2 text-emerald font-semibold pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Checked in at {new Date(registration.checkedInAt).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </DialogModal>
  );
};
