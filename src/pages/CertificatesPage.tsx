import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Award,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CertificatePreview } from '../components/certificates/CertificatePreview';

export const CertificatesPage: React.FC = () => {
  const { user, showToast } = useAuth();
  const [searchParams] = useSearchParams();

  const [certificates, setCertificates] = useState<any[]>([]);
  const [selectedCert, setSelectedCert] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Public Verification Portal state
  const [verifyCode, setVerifyCode] = useState(searchParams.get('verify') || '');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);

  const loadMyCertificates = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/certificates/my');
      const list = data.certificates || [];
      setCertificates(list);
      if (list.length > 0 && !selectedCert) {
        const pref = list.find((c: any) => c.certificateCode === 'CF2026TEF12345') || list[0];
        setSelectedCert(pref);
      }
    } catch (err: any) {
      showToast({
        title: 'Failed to load certificates',
        description: err.message,
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyCertificates();
    }
  }, [user]);

  useEffect(() => {
    const initialVerify = searchParams.get('verify');
    if (initialVerify) {
      handleVerifyCode(initialVerify);
    }
  }, [searchParams]);

  const handleVerifyCode = async (codeToCheck?: string) => {
    const target = (codeToCheck ?? verifyCode).trim().toUpperCase();
    if (!target) return;
    try {
      setVerifying(true);
      const res = await apiRequest(`/certificates/verify/${encodeURIComponent(target)}`);
      setVerificationResult(res);
    } catch (err: any) {
      setVerificationResult({
        verified: false,
        error: err.message || 'Certificate ID not found.',
      });
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-champagne">
            <Award className="w-4 h-4" />
            Academic & Co-Curricular Credentials
          </div>
          <h1 className="font-serif text-3xl font-bold text-content-primary mt-1">
            Digital Certificates & Verification
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Preview gold-embossed university certificates, download official PDFs, or verify any credential ID.
          </p>
        </div>

        {/* Public Credential Verifier Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerifyCode();
          }}
          className="flex items-center gap-2 w-full md:w-auto"
        >
          <div className="relative flex-1 md:w-64">
            <Search className="w-3.5 h-3.5 text-content-secondary absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value)}
              placeholder="Verify ID (e.g. CF2026TEF12345)"
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono text-content-primary focus:outline-none focus:border-emerald"
            />
          </div>
          <button
            type="submit"
            disabled={verifying}
            className="px-4 py-2 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600 shrink-0"
          >
            {verifying ? 'Checking...' : 'Verify ID'}
          </button>
        </form>
      </div>

      {/* Public Verification Result Banner */}
      {verificationResult && (
        <div
          className={`rounded-2xl p-5 border shadow-cf-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            verificationResult.verified
              ? 'bg-emerald/10 border-emerald/40'
              : 'bg-semantic-error/10 border-semantic-error/40'
          }`}
        >
          <div className="flex items-start gap-3">
            {verificationResult.verified ? (
              <CheckCircle2 className="w-6 h-6 text-emerald shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-semantic-error shrink-0 mt-0.5" />
            )}
            <div>
              <h2 className="font-serif text-lg font-bold text-content-primary">
                {verificationResult.verified
                  ? `Authentic Credential Verified — ${verificationResult.certificate.certificateCode}`
                  : 'Credential Verification Failed'}
              </h2>
              {verificationResult.certificate ? (
                <p className="text-xs text-content-secondary mt-1">
                  Issued to <strong>{verificationResult.certificate.participantName}</strong> (
                  {verificationResult.certificate.studentDepartment}) for completing{' '}
                  <strong>{verificationResult.certificate.eventTitle}</strong> on{' '}
                  {new Date(verificationResult.certificate.completionDate).toLocaleDateString()}.
                  Status: <strong>{verificationResult.certificate.status}</strong>.
                </p>
              ) : (
                <p className="text-xs text-content-secondary mt-1">
                  {verificationResult.error}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setVerificationResult(null)}
            className="text-xs font-semibold text-content-secondary hover:text-content-primary self-end sm:self-center"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Certificate Workspace */}
      {loading ? (
        <div className="h-96 rounded-2xl bg-surface-card border border-surface-border animate-pulse" />
      ) : certificates.length === 0 ? (
        <div className="bg-surface-card rounded-2xl border border-surface-border p-12 text-center space-y-3">
          <Award className="w-10 h-10 text-champagne mx-auto" />
          <h2 className="font-serif text-xl font-bold text-content-primary">
            No Certificates Issued Yet
          </h2>
          <p className="text-xs text-content-secondary max-w-md mx-auto">
            Certificates are automatically unlocked once your QR attendance is verified at completed campus events.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Selector List */}
          <div className="space-y-3">
            <h2 className="font-serif text-lg font-bold text-content-primary px-1">
              Earned Credentials ({certificates.length})
            </h2>
            {certificates.map((cert) => {
              const active = selectedCert?._id === cert._id;
              return (
                <button
                  key={cert._id}
                  type="button"
                  onClick={() => setSelectedCert(cert)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    active
                      ? 'bg-surface-card border-champagne shadow-cf-elevated'
                      : 'bg-surface-card/70 border-surface-border hover:border-champagne/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald">
                      {cert.eventCategory}
                    </span>
                    <span className="font-mono text-[10px] text-champagne font-semibold">
                      {cert.certificateCode}
                    </span>
                  </div>
                  <div className="font-serif font-bold text-base text-content-primary">
                    {cert.eventTitle}
                  </div>
                  <div className="text-xs text-content-secondary mt-1 flex items-center justify-between">
                    <span>{new Date(cert.completionDate).toLocaleDateString()}</span>
                    <span className="inline-flex items-center gap-1 text-emerald font-medium">
                      <ShieldCheck className="w-3.5 h-3.5" /> Verified
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Gold-Framed Certificate Preview */}
          <div className="lg:col-span-2">
            {selectedCert && (
              <CertificatePreview
                certificate={selectedCert}
                onVerifyClick={(code) => {
                  setVerifyCode(code);
                  handleVerifyCode(code);
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
