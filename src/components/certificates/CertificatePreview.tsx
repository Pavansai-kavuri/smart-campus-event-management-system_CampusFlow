import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import {
  Download,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CertificatePreviewProps {
  certificate: any;
  onVerifyClick?: (code: string) => void;
}

export const CertificatePreview: React.FC<CertificatePreviewProps> = ({
  certificate,
  onVerifyClick,
}) => {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState(false);

  // Student's full name: prioritize authenticated student's full name used during login
  const studentFullName =
    user?.name || certificate?.participantName || 'Pavan Sai Ram Likhith';
  const studentDepartment =
    user?.department ||
    certificate?.studentDepartment ||
    'Department of Computer Science and Engineering';

  const certCode = certificate?.certificateCode || 'CF2026TEF12345';
  const eventTitle = certificate?.eventTitle || 'TECHFEST 2026';

  const isDefaultTemplate =
    studentFullName === 'Pavan Sai Ram Likhith' &&
    eventTitle === 'TECHFEST 2026' &&
    certCode === 'CF2026TEF12345';

  const handleDownloadPdf = async () => {
    setDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Load image into canvas for high-resolution 300dpi PDF generation
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = '/images/certificate-template.jpg';

      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Draw the master reference certificate
        ctx.drawImage(img, 0, 0);

        // If student name or event title is different from default, patch and render dynamically
        if (!isDefaultTemplate) {
          if (studentFullName !== 'Pavan Sai Ram Likhith') {
            // Clean parchment patch for name
            ctx.fillStyle = '#FCFAF5';
            ctx.fillRect(62, 284, 570, 52);

            // Draw student full name used during login
            ctx.font = 'bold 36px "Playfair Display", Georgia, serif';
            ctx.fillStyle = '#8C581E';
            ctx.fillText(studentFullName, 66, 324);
          }

          if (studentDepartment !== 'Department of Computer Science and Engineering') {
            ctx.fillStyle = '#FCFAF5';
            ctx.fillRect(62, 342, 480, 28);
            ctx.font = '16px "Inter", system-ui, sans-serif';
            ctx.fillStyle = '#37413C';
            ctx.fillText(studentDepartment, 66, 362);
          }

          if (eventTitle !== 'TECHFEST 2026') {
            ctx.fillStyle = '#FCFAF5';
            ctx.fillRect(62, 400, 560, 46);
            ctx.font = 'bold 30px "Playfair Display", Georgia, serif';
            ctx.fillStyle = '#14221A';
            ctx.fillText(eventTitle, 66, 436);
          }

          if (certCode !== 'CF2026TEF12345') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(835, 575, 140, 26);
            ctx.font = 'bold 13px monospace';
            ctx.fillStyle = '#14221A';
            ctx.fillText(certCode, 836, 593);
          }
        }

        const dataUrl = canvas.toDataURL('image/jpeg', 0.98);
        doc.addImage(dataUrl, 'JPEG', 0, 0, 297, 198);
      } else {
        doc.addImage(img, 'JPEG', 0, 0, 297, 198);
      }

      doc.save(`${certCode}-${studentFullName.replace(/\s+/g, '_')}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Visual Certificate Card Matching Reference Specification Without Ghosting */}
      <div
        className="relative rounded-2xl overflow-hidden shadow-cf-elevated border-2 border-[#C5A168] bg-[#FDFCF7] [container-type:inline-size]"
      >
        {/* Crisp Base Master Certificate Template */}
        <img
          src="/images/certificate-template.jpg"
          alt={`Official Certificate of Participation — ${studentFullName}`}
          className="w-full h-auto block select-none pointer-events-none"
        />

        {/* Dynamic Overlays ONLY rendered when student name/details differ from default */}
        {studentFullName !== 'Pavan Sai Ram Likhith' && (
          <div
            className="absolute flex items-center overflow-hidden"
            style={{
              left: '6.1%',
              top: '41.6%',
              width: '56%',
              height: '7.8%',
              backgroundColor: '#FCFAF5',
            }}
          >
            <span
              className="font-serif font-bold truncate tracking-tight"
              style={{
                color: '#8C581E',
                fontSize: 'clamp(14px, 3.4cqw, 36px)',
                lineHeight: 1.1,
              }}
            >
              {studentFullName}
            </span>
          </div>
        )}

        {studentDepartment !== 'Department of Computer Science and Engineering' && (
          <div
            className="absolute flex items-center overflow-hidden"
            style={{
              left: '6.1%',
              top: '50.1%',
              width: '46%',
              height: '4.2%',
              backgroundColor: '#FCFAF5',
            }}
          >
            <span
              className="font-sans font-semibold text-[#37413C] truncate"
              style={{
                fontSize: 'clamp(10px, 1.45cqw, 16px)',
              }}
            >
              {studentDepartment}
            </span>
          </div>
        )}

        {eventTitle !== 'TECHFEST 2026' && (
          <div
            className="absolute flex items-center overflow-hidden"
            style={{
              left: '6.1%',
              top: '58.6%',
              width: '56%',
              height: '7.0%',
              backgroundColor: '#FCFAF5',
            }}
          >
            <span
              className="font-serif font-bold text-[#14221A] truncate tracking-tight"
              style={{
                fontSize: 'clamp(13px, 2.85cqw, 30px)',
              }}
            >
              {eventTitle}
            </span>
          </div>
        )}

        {certCode !== 'CF2026TEF12345' && (
          <div
            className="absolute flex items-center bg-white overflow-hidden"
            style={{
              left: '81.4%',
              top: '84.4%',
              width: '14.5%',
              height: '3.8%',
            }}
          >
            <span
              className="font-mono font-bold text-[#14221A] truncate"
              style={{
                fontSize: 'clamp(8px, 1.1cqw, 12px)',
              }}
            >
              {certCode}
            </span>
          </div>
        )}
      </div>

      {/* Action & Verification Controls */}
      <div className="bg-surface-card rounded-2xl p-4 border border-surface-border shadow-cf-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-content-secondary">
          <ShieldCheck className="w-4 h-4 text-emerald shrink-0" />
          <span>
            Verified Participant:{' '}
            <strong className="text-content-primary font-bold">{studentFullName}</strong>{' '}
            ({studentDepartment}) • ID: <strong className="text-content-primary font-mono">{certCode}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          {onVerifyClick && (
            <button
              type="button"
              onClick={() => onVerifyClick(certCode)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-surface-border bg-surface-elevated text-content-primary text-xs font-semibold hover:border-champagne transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-champagne" />
              Verify on Portal
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generating Official PDF...' : 'Download Official PDF Certificate'}
          </button>
        </div>
      </div>
    </div>
  );
};
