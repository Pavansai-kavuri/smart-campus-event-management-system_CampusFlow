import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import {
  QrCode,
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Search,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const QrAttendancePage: React.FC = () => {
  const { user, showToast, switchDemoRole } = useAuth();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [attendanceData, setAttendanceData] = useState<any>({
    stats: { totalRegistered: 0, totalAttended: 0, attendanceRate: 0 },
    attendance: [],
    registrations: [],
  });

  const [qrInput, setQrInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<any | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [overrideReason, setOverrideReason] = useState('Verified physical student ID card at desk');
  const [searchAttendee, setSearchAttendee] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const loadEvents = async () => {
    const data = await apiRequest('/events?status=ALL&limit=30');
    const list = data.events || [];
    setEvents(list);
    if (list.length > 0 && !selectedEventId) {
      setSelectedEventId(list[0]._id);
    }
  };

  const loadEventAttendance = async (eventId: string) => {
    if (!eventId) return;
    try {
      const data = await apiRequest(`/attendance/event/${eventId}`);
      setAttendanceData(data);
    } catch {
      // ignore if student role
    }
  };

  useEffect(() => {
    if (user?.role === 'ORGANIZER' || user?.role === 'ADMIN') {
      loadEvents();
    }
  }, [user]);

  useEffect(() => {
    if (selectedEventId && (user?.role === 'ORGANIZER' || user?.role === 'ADMIN')) {
      loadEventAttendance(selectedEventId);
    }
  }, [selectedEventId, user]);

  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, []);

  if (user?.role === 'STUDENT') {
    return (
      <div className="bg-surface-card rounded-2xl border border-surface-border p-10 text-center space-y-4">
        <QrCode className="w-10 h-10 text-emerald mx-auto" />
        <h1 className="font-serif text-2xl font-bold">Organizer QR Scanner</h1>
        <p className="text-xs sm:text-sm text-content-secondary max-w-md mx-auto">
          Students can access their personal QR passes in "My Registrations". To test scanning and verifying student passes, switch to the Organizer or Admin role.
        </p>
        <button
          type="button"
          onClick={() => switchDemoRole('ORGANIZER')}
          className="px-5 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold"
        >
          Switch to Organizer Role to Scan Passes
        </button>
      </div>
    );
  }

  const handleStartCamera = async () => {
    setCameraError(null);
    try {
      const scanner = new Html5Qrcode('cf-qr-reader');
      scannerRef.current = scanner;
      setCameraActive(true);
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        async (decodedText) => {
          await handleVerifyToken(decodedText);
        },
        () => {}
      );
    } catch (err: any) {
      setCameraActive(false);
      setCameraError(
        err?.message ||
          'Camera permission denied or no webcam detected. Use the Token / Demo Pass Scanner on the right.'
      );
    }
  };

  const handleStopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
    }
    setCameraActive(false);
  };

  const handleVerifyToken = async (tokenToScan?: string) => {
    const clean = (tokenToScan ?? qrInput).trim();
    if (!clean) return;
    try {
      const res = await apiRequest('/attendance/scan', {
        method: 'POST',
        body: JSON.stringify({
          qrToken: clean,
          eventId: selectedEventId || undefined,
        }),
      });
      setScanFeedback({
        success: true,
        alreadyScanned: res.alreadyScanned,
        message: res.message,
        attendee: res.attendee,
      });
      setQrInput('');
      await loadEventAttendance(selectedEventId);
    } catch (err: any) {
      setScanFeedback({
        success: false,
        message: err.message,
      });
    }
  };

  const handleManualOverride = async (registrationId: string) => {
    try {
      const res = await apiRequest<{ message: string }>('/attendance/manual', {
        method: 'POST',
        body: JSON.stringify({
          registrationId,
          overrideReason: overrideReason || 'Verified ID at registration desk',
        }),
      });
      showToast({
        title: 'Attendance Recorded',
        description: res.message,
        variant: 'success',
      });
      await loadEventAttendance(selectedEventId);
    } catch (err: any) {
      showToast({
        title: 'Override failed',
        description: err.message,
        variant: 'error',
      });
    }
  };

  const filteredRegistrations = (attendanceData.registrations || []).filter((r: any) => {
    if (!searchAttendee.trim()) return true;
    const q = searchAttendee.toLowerCase();
    return (
      (r.studentId?.name || '').toLowerCase().includes(q) ||
      (r.studentId?.rollNumber || '').toLowerCase().includes(q) ||
      (r.qrToken || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-emerald">
            <QrCode className="w-4 h-4" />
            Live Check-In & Verification Terminal
          </div>
          <h1 className="font-serif text-3xl font-bold text-content-primary mt-1">
            QR Attendance Scanner
          </h1>
          <p className="text-xs sm:text-sm text-content-secondary mt-1">
            Scan student QR passes via camera or token input with idempotent duplicate protection and audit-logged overrides.
          </p>
        </div>

        <div className="w-full md:w-72">
          <label className="block text-[11px] font-semibold text-content-secondary mb-1">
            Active Event Session
          </label>
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs font-semibold text-content-primary"
          >
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title} ({ev.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scanner & Verification Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera & Token Input Card */}
        <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-content-primary">
              1. Camera & Pass Token Scanner
            </h2>
            {!cameraActive ? (
              <button
                type="button"
                onClick={handleStartCamera}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600"
              >
                <Camera className="w-4 h-4" />
                Start Camera Scan
              </button>
            ) : (
              <button
                type="button"
                onClick={handleStopCamera}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-semantic-error text-white text-xs font-semibold"
              >
                <CameraOff className="w-4 h-4" />
                Stop Camera
              </button>
            )}
          </div>

          <div
            id="cf-qr-reader"
            className={`w-full rounded-2xl overflow-hidden border border-surface-border bg-surface-elevated ${
              cameraActive ? 'min-h-[250px]' : 'h-0 border-0'
            }`}
          />

          {cameraError && (
            <div className="p-3 rounded-xl bg-champagne/15 border border-champagne/40 text-xs text-content-primary">
              {cameraError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleVerifyToken();
            }}
            className="space-y-3"
          >
            <label className="block text-xs font-semibold text-content-primary">
              Scan or Enter Cryptographic Pass Token
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={qrInput}
                onChange={(e) => setQrInput(e.target.value)}
                placeholder="e.g., CFPASS-PAVAN-TECHFEST2026"
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface-elevated border border-surface-border text-xs font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald text-white text-xs font-semibold hover:bg-emerald-600"
              >
                Verify Pass
              </button>
            </div>
          </form>

          {/* Quick Demo Pass Simulator Buttons */}
          <div className="pt-2 border-t border-surface-border space-y-2">
            <div className="text-[11px] font-semibold text-content-secondary">
              Quick Test — Simulate Scanning Registered Student Passes:
            </div>
            <div className="flex flex-wrap gap-2">
              {(attendanceData.registrations || []).slice(0, 4).map((r: any) => (
                <button
                  key={r._id}
                  type="button"
                  onClick={() => handleVerifyToken(r.qrToken)}
                  className="px-3 py-1.5 rounded-xl bg-surface-elevated border border-surface-border hover:border-champagne text-xs font-medium"
                >
                  Scan {r.studentId?.name || 'Student'} ({r.status})
                </button>
              ))}
            </div>
          </div>

          {/* Scan Result Banner */}
          {scanFeedback && (
            <div
              className={`p-4 rounded-2xl border flex items-start gap-3 ${
                !scanFeedback.success
                  ? 'bg-semantic-error/10 border-semantic-error/40 text-semantic-error'
                  : scanFeedback.alreadyScanned
                  ? 'bg-champagne/20 border-champagne/50 text-content-primary'
                  : 'bg-emerald/15 border-emerald/40 text-emerald'
              }`}
            >
              {scanFeedback.success ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-bold">
                  {!scanFeedback.success
                    ? 'Pass Rejected'
                    : scanFeedback.alreadyScanned
                    ? 'Duplicate Scan Detected'
                    : 'Attendance Verified'}
                </div>
                <div className="text-content-primary">{scanFeedback.message}</div>
                {scanFeedback.attendee && (
                  <div className="text-content-secondary">
                    Student: <strong>{scanFeedback.attendee.studentName}</strong> ({scanFeedback.attendee.rollNumber}) • {scanFeedback.attendee.department}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Manual Lookup & Attendance Stats */}
        <div className="bg-surface-card rounded-2xl p-6 border border-surface-border shadow-cf-card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-content-primary">
              2. Attendee Lookup & Audit Override
            </h2>
            <span className="px-3 py-1 rounded-full bg-emerald/15 text-emerald text-xs font-bold">
              {attendanceData.stats?.totalAttended || 0} /{' '}
              {attendanceData.stats?.totalRegistered || 0} Checked In (
              {attendanceData.stats?.attendanceRate || 0}%)
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-content-secondary absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={searchAttendee}
                onChange={(e) => setSearchAttendee(e.target.value)}
                placeholder="Search student or roll no..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
              />
            </div>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="Audit reason for manual check-in..."
              className="w-full px-3 py-2 rounded-xl bg-surface-elevated border border-surface-border text-xs"
            />
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-surface-border border border-surface-border rounded-xl">
            {filteredRegistrations.length === 0 ? (
              <div className="p-6 text-center text-xs text-content-secondary">
                No matching attendees for this event.
              </div>
            ) : (
              filteredRegistrations.map((reg: any) => (
                <div
                  key={reg._id}
                  className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-surface-elevated"
                >
                  <div>
                    <div className="font-bold text-content-primary">
                      {reg.studentId?.name}{' '}
                      <span className="font-mono text-champagne">
                        ({reg.studentId?.rollNumber})
                      </span>
                    </div>
                    <div className="text-[11px] text-content-secondary font-mono">
                      {reg.qrToken}
                    </div>
                  </div>

                  {reg.status === 'ATTENDED' ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald/15 text-emerald font-bold text-[10px]">
                      <CheckCircle2 className="w-3 h-3" /> Checked In
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleManualOverride(reg._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-champagne text-[#1E1714] font-bold text-[11px] hover:opacity-95"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Manual Check-In
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
