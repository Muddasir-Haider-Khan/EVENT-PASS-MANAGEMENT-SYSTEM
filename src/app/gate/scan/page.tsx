'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Camera,
  Keyboard,
  QrCode,
  History,
  ShieldAlert,
  UserCheck,
  UserX,
  User,
} from 'lucide-react';

interface ScanResult {
  result: string;
  message: string;
  color: string;
  requiresApproval?: boolean;
  autoDecline?: boolean;
  participant?: {
    id: string;
    name: string;
    email: string;
    photoUrl?: string | null;
    participantType?: string | null;
    group?: string | null;
    entryStatus: string;
  };
  scannedAt?: string;
}

interface ScanHistoryItem {
  id: string;
  time: string;
  name: string;
  statusMessage: string;
  color: string;
  result: string;
}

interface GateSession {
  gate: { id: string; name: string; type: string };
  event: { id: string; name: string; venue: string; logoUrl: string | null; primaryColor: string; secondaryColor: string; accentColor: string };
}

// Web Audio API Sound Synthesizer for instant audio feedback
function playAudioFeedback(type: 'SUCCESS' | 'DENIED' | 'WARNING' | 'NEUTRAL') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'SUCCESS') {
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.35);
    } else if (type === 'DENIED') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'NEUTRAL') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(330, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {
    // Silently ignore audio errors if blocked by browser policy
  }
}

export default function ScanPage() {
  const router = useRouter();
  const [gateSession, setGateSession] = useState<GateSession | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [useCam, setUseCam] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef('');
  const autoDismissTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('gateSession');
    if (!saved) { router.push('/gate'); return; }
    try { setGateSession(JSON.parse(saved)); } catch { router.push('/gate'); }
  }, [router]);

  useEffect(() => {
    if (!useCam && !lastScan?.requiresApproval) {
      const interval = setInterval(() => inputRef.current?.focus(), 500);
      return () => clearInterval(interval);
    }
  }, [useCam, lastScan]);

  const isScanningActiveRef = useRef(false);

  const processScan = useCallback(async (token: string) => {
    let cleanToken = token.trim();
    if (!cleanToken) return;

    if (cleanToken.includes('http')) {
      try {
        const urlObj = new URL(cleanToken);
        cleanToken = urlObj.searchParams.get('token') || urlObj.pathname.split('/').pop() || cleanToken;
      } catch {
        // keep cleanToken
      }
    }

    if (scanning || confirming) return;
    setScanning(true);

    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      const res = await fetch('/api/gate/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: cleanToken }),
      });
      const data: ScanResult = await res.json();
      setLastScan(data);
      setScanCount((c) => c + 1);

      if (data.requiresApproval) {
        // Play soft chime to alert gate officer to verify photo & click approve
        playAudioFeedback('NEUTRAL');
      } else if (data.autoDecline || data.color === 'red') {
        // Instant rejection — play denied buzzer
        playAudioFeedback('DENIED');
        const historyItem: ScanHistoryItem = {
          id: Math.random().toString(36).substring(2, 9),
          time: now,
          name: data.participant?.name || 'Unknown Pass Holder',
          statusMessage: data.message,
          color: 'red',
          result: data.result,
        };
        setScanHistory((prev) => [historyItem, ...prev.slice(0, 4)]);

        // Auto dismiss rejection card after 4 seconds
        autoDismissTimerRef.current = setTimeout(() => {
          setLastScan(null);
        }, 4000);
      } else {
        playAudioFeedback('SUCCESS');
      }
    } catch {
      setLastScan({ result: 'ERROR', message: 'Network communication error', color: 'red', autoDecline: true });
      playAudioFeedback('DENIED');
      autoDismissTimerRef.current = setTimeout(() => setLastScan(null), 4000);
    } finally {
      setScanning(false);
    }
  }, [scanning, confirming]);

  // Handle Gate Officer Decision (Approve or Decline Entry)
  async function handleGateOfficerDecision(decision: 'APPROVE' | 'DECLINE') {
    if (!lastScan?.participant?.id || confirming) return;
    setConfirming(true);

    if (autoDismissTimerRef.current) {
      clearTimeout(autoDismissTimerRef.current);
      autoDismissTimerRef.current = null;
    }

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    try {
      const res = await fetch('/api/gate/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmAction: decision,
          participantId: lastScan.participant.id,
        }),
      });
      const data: ScanResult = await res.json();
      setLastScan(data);

      if (decision === 'APPROVE') {
        playAudioFeedback('SUCCESS');
      } else {
        playAudioFeedback('DENIED');
      }

      const historyItem: ScanHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        time: now,
        name: data.participant?.name || 'Attendee Pass',
        statusMessage: data.message,
        color: decision === 'APPROVE' ? 'green' : 'red',
        result: data.result,
      };

      setScanHistory((prev) => [historyItem, ...prev.slice(0, 4)]);

      // Auto dismiss after 3 seconds
      autoDismissTimerRef.current = setTimeout(() => {
        setLastScan(null);
      }, 3500);
    } catch {
      setLastScan({ result: 'ERROR', message: 'Network error confirming entry', color: 'red', autoDecline: true });
      playAudioFeedback('DENIED');
      autoDismissTimerRef.current = setTimeout(() => setLastScan(null), 3500);
    } finally {
      setConfirming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = bufferRef.current;
      bufferRef.current = '';
      if (inputRef.current) inputRef.current.value = '';
      if (val.length >= 6) processScan(val);
      return;
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    bufferRef.current = e.target.value;
  }

  useEffect(() => {
    if (!useCam || lastScan?.requiresApproval) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null;
    let isMounted = true;

    async function startCamera() {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        scanner = new Html5Qrcode('qr-reader');
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (text: string) => {
            if (isScanningActiveRef.current) return;
            isScanningActiveRef.current = true;

            processScan(text).finally(() => {
              setTimeout(() => {
                isScanningActiveRef.current = false;
              }, 2500);
            });
          },
          () => {}
        );
      } catch (err) {
        console.error('Camera initialization error:', err);
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [useCam, lastScan, processScan]);

  if (!gateSession) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isEntryGate = gateSession.gate.type === 'ENTRY';

  const bgColor = lastScan
    ? lastScan.requiresApproval
      ? 'bg-slate-950'
      : lastScan.color === 'green'
      ? 'bg-emerald-950/90'
      : lastScan.color === 'red'
      ? 'bg-red-950/90'
      : 'bg-amber-950/90'
    : 'bg-slate-950';

  const borderColor = lastScan
    ? lastScan.requiresApproval
      ? 'border-indigo-500/80 shadow-indigo-500/20'
      : lastScan.color === 'green'
      ? 'border-emerald-500 shadow-emerald-500/20'
      : lastScan.color === 'red'
      ? 'border-red-500 shadow-red-500/20'
      : 'border-amber-500 shadow-amber-500/20'
    : 'border-slate-800';

  return (
    <ThemeProvider
      primaryColor={gateSession.event.primaryColor}
      secondaryColor={gateSession.event.secondaryColor}
      accentColor={gateSession.event.accentColor}
    >
      <div className={`min-h-screen ${bgColor} transition-colors duration-300 text-slate-100 flex flex-col antialiased`}>
        {/* Header */}
        <header className="px-4 py-3 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              {gateSession.event.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-base font-bold text-white">{gateSession.gate.name}</h1>
              <Badge
                variant={isEntryGate ? 'indigo' : 'amber'}
                size="sm"
              >
                {gateSession.gate.type} GATE
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400 hidden sm:inline">
              {scanCount} total scans
            </span>
            <Button
              variant="outline"
              size="sm"
              leftIcon={useCam ? <Keyboard className="w-3.5 h-3.5" /> : <Camera className="w-3.5 h-3.5" />}
              onClick={() => setUseCam(!useCam)}
            >
              {useCam ? 'Hardware Mode' : 'Camera Mode'}
            </Button>
          </div>
        </header>

        {/* Main Scanner Viewport */}
        <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center">
          {lastScan ? (
            <div
              className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-900/95 border-2 ${borderColor} shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-150 space-y-5`}
            >
              {/* ------------------------------------------------------------- */}
              {/* STATE 1: PENDING APPROVAL (PHOTO + APPROVE & DECLINE BUTTONS) */}
              {/* ------------------------------------------------------------- */}
              {lastScan.requiresApproval && lastScan.participant ? (
                <>
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Gate Verification Required</span>
                    </span>
                    <p className="text-xs text-slate-400 pt-1">
                      Verify attendee photo and identity below before approving entry.
                    </p>
                  </div>

                  {/* ATTENDEE PHOTO & PROFILE CARD */}
                  <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-slate-950/80 rounded-2xl border border-slate-800">
                    {lastScan.participant.photoUrl ? (
                      <img
                        src={lastScan.participant.photoUrl}
                        alt={lastScan.participant.name}
                        className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover border-2 border-indigo-500 shadow-xl shadow-indigo-500/10"
                      />
                    ) : (
                      <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-slate-900 border-2 border-slate-700 flex flex-col items-center justify-center text-slate-400">
                        <User className="w-12 h-12 text-slate-500" />
                        <span className="text-[10px] text-slate-500 mt-1">No Photo Uploaded</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                        {lastScan.participant.name}
                      </h2>
                      <p className="text-xs font-mono text-indigo-300">
                        {lastScan.participant.email}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                      {lastScan.participant.participantType && (
                        <Badge variant="indigo" size="sm">
                          {lastScan.participant.participantType}
                        </Badge>
                      )}
                      {lastScan.participant.group && (
                        <Badge variant="green" size="sm">
                          👥 {lastScan.participant.group}
                        </Badge>
                      )}
                      <Badge variant="slate" size="sm">
                        STATUS: {lastScan.participant.entryStatus}
                      </Badge>
                    </div>
                  </div>

                  {/* APPROVE & DECLINE ACTION BUTTONS */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => handleGateOfficerDecision('DECLINE')}
                      isLoading={confirming}
                      className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 font-bold py-3.5"
                      leftIcon={<UserX className="w-5 h-5 text-red-400" />}
                    >
                      Decline Entry
                    </Button>

                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => handleGateOfficerDecision('APPROVE')}
                      isLoading={confirming}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-lg shadow-emerald-600/30 py-3.5"
                      leftIcon={<UserCheck className="w-5 h-5 text-white" />}
                    >
                      Approve Entry
                    </Button>
                  </div>
                </>
              ) : (
                /* ------------------------------------------------------------- */
                /* STATE 2: INSTANT REJECTION / GRANTED RESULT (NO POPUP BUTTONS) */
                /* ------------------------------------------------------------- */
                <>
                  <div className="flex justify-center">
                    {lastScan.color === 'green' ? (
                      <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-bounce" />
                    ) : lastScan.color === 'red' ? (
                      <XCircle className="w-16 h-16 text-red-400" />
                    ) : (
                      <AlertTriangle className="w-16 h-16 text-amber-400" />
                    )}
                  </div>

                  {/* If rejection had participant photo & info, show it cleanly */}
                  {lastScan.participant && (
                    <div className="flex items-center gap-4 p-3 bg-slate-950/70 rounded-2xl border border-slate-800 text-left">
                      {lastScan.participant.photoUrl ? (
                        <img
                          src={lastScan.participant.photoUrl}
                          alt={lastScan.participant.name}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                          <User className="w-7 h-7" />
                        </div>
                      )}
                      <div className="overflow-hidden">
                        <h3 className="font-bold text-white text-base truncate">
                          {lastScan.participant.name}
                        </h3>
                        <p className="text-xs font-mono text-indigo-300 truncate">
                          {lastScan.participant.email}
                        </p>
                        {lastScan.participant.group && (
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            👥 {lastScan.participant.group}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      {lastScan.result === 'ENTRY_DENIED_ALREADY_INSIDE'
                        ? 'ALREADY IN THE EVENT'
                        : lastScan.result === 'ENTRY_GRANTED'
                        ? 'ENTRY APPROVED'
                        : lastScan.result === 'ENTRY_DECLINED'
                        ? 'ENTRY DECLINED'
                        : 'ACCESS DENIED'}
                    </h2>
                    <p className="text-sm font-semibold text-slate-300">
                      {lastScan.message}
                    </p>
                  </div>

                  <Badge
                    variant={
                      lastScan.color === 'green'
                        ? 'green'
                        : lastScan.color === 'red'
                        ? 'red'
                        : 'amber'
                    }
                    size="md"
                  >
                    RESULT: {lastScan.result}
                  </Badge>

                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLastScan(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Scan Next Pass
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center max-w-sm">
              <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 shadow-inner">
                <QrCode className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Ready for Pass Scan</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                {useCam
                  ? 'Align attendee QR code within the camera viewfinder.'
                  : 'Point hardware laser scanner at attendee QR code.'}
              </p>
            </div>
          )}

          {useCam && !lastScan?.requiresApproval && (
            <div
              id="qr-reader"
              className="w-72 mt-6 rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-xl"
            />
          )}
        </main>

        {/* Live Recent 5 Activity Feed */}
        {scanHistory.length > 0 && (
          <footer className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="max-w-2xl mx-auto space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                <History className="w-3 h-3" />
                <span>Recent Gate Activity Log</span>
              </div>
              <div className="space-y-1.5">
                {scanHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {item.color === 'green' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : item.color === 'red' ? (
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
                      )}
                      <span className="font-semibold text-white truncate">{item.name}</span>
                      <span className="text-slate-400 truncate">— {item.statusMessage}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-2">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </footer>
        )}

        {/* Hardware scanner hidden input */}
        {!useCam && !lastScan?.requiresApproval && (
          <input
            ref={inputRef}
            type="text"
            className="fixed -top-32 -left-32 opacity-0"
            onKeyDown={handleKeyDown}
            onChange={handleInput}
            autoFocus
            autoComplete="off"
          />
        )}
      </div>
    </ThemeProvider>
  );
}
