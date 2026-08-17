'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';

interface ScanResult {
  result: string;
  message: string;
  color: string;
  participant?: { name: string; email: string; entryStatus: string };
}

interface GateSession {
  gate: { id: string; name: string; type: string };
  event: { id: string; name: string; venue: string; logoUrl: string | null; primaryColor: string; secondaryColor: string; accentColor: string };
}

export default function ScanPage() {
  const router = useRouter();
  const [gateSession, setGateSession] = useState<GateSession | null>(null);
  const [lastScan, setLastScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [useCam, setUseCam] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('gateSession');
    if (!saved) { router.push('/gate'); return; }
    try { setGateSession(JSON.parse(saved)); } catch { router.push('/gate'); }
  }, [router]);

  // Focus the hidden input for hardware scanner
  useEffect(() => {
    if (!useCam) {
      const interval = setInterval(() => inputRef.current?.focus(), 500);
      return () => clearInterval(interval);
    }
  }, [useCam]);

  const processScan = useCallback(async (token: string) => {
    if (scanning || !token.trim()) return;
    setScanning(true);
    try {
      const res = await fetch('/api/gate/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrToken: token.trim() }),
      });
      const data = await res.json();
      setLastScan(data);
      setScanCount(c => c + 1);
      // Auto-clear after 4 seconds
      setTimeout(() => setLastScan(null), 4000);
    } catch {
      setLastScan({ result: 'ERROR', message: 'Network error', color: 'red' });
      setTimeout(() => setLastScan(null), 4000);
    }
    finally { setScanning(false); }
  }, [scanning]);

  // Hardware scanner input handler (fast burst detection)
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = bufferRef.current;
      bufferRef.current = '';
      if (inputRef.current) inputRef.current.value = '';
      if (val.length >= 8) processScan(val);
      return;
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    bufferRef.current = e.target.value;
    // Reset fast-burst timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      // If we have content after a pause, it might be manual typing — clear
      // Hardware scanners are instant, so a 200ms pause means manual input
    }, 200);
  }

  // Camera fallback using html5-qrcode
  useEffect(() => {
    if (!useCam) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let scanner: any = null;
    async function startCamera() {
      const { Html5Qrcode } = await import('html5-qrcode');
      scanner = new Html5Qrcode('qr-reader');
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (text: string) => { processScan(text); scanner?.pause(true); setTimeout(() => scanner?.resume(), 3000); },
          () => {}
        );
      } catch (err) { console.error('Camera error:', err); }
    }
    startCamera();
    return () => { scanner?.stop().catch(() => {}); };
  }, [useCam, processScan]);

  if (!gateSession) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;

  const bgColor = lastScan ? (lastScan.color === 'green' ? '#0A2A0A' : lastScan.color === 'red' ? '#2A0A0A' : '#2A2A0A') : 'var(--bg-root)';
  const borderColor = lastScan ? (lastScan.color === 'green' ? 'var(--success)' : lastScan.color === 'red' ? 'var(--error)' : 'var(--warning)') : 'transparent';

  return (
    <ThemeProvider primaryColor={gateSession.event.primaryColor} secondaryColor={gateSession.event.secondaryColor} accentColor={gateSession.event.accentColor}>
      <div style={{ minHeight: '100vh', background: bgColor, transition: 'background 300ms ease' }}>
        {/* Header */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-default)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-caption" style={{ color: 'var(--text-muted)' }}>{gateSession.event.name}</div>
            <div className="text-title">
              {gateSession.gate.name}
              <span className={`badge ${gateSession.gate.type === 'ENTRY' ? 'badge-info' : 'badge-warning'}`} style={{ marginLeft: 8 }}>
                {gateSession.gate.type}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="text-mono text-caption" style={{ color: 'var(--text-muted)' }}>{scanCount} scans</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setUseCam(!useCam)}>
              {useCam ? '⌨ Scanner' : '📷 Camera'}
            </button>
          </div>
        </div>

        {/* Scan Result Display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 120px)', padding: 20 }}>
          {lastScan ? (
            <div style={{ textAlign: 'center', animation: 'modal-in 200ms ease', border: `3px solid ${borderColor}`, borderRadius: 20, padding: '40px 32px', maxWidth: 500, width: '100%' }}>
              {/* Big status icon */}
              <div style={{ fontSize: 64, marginBottom: 16 }}>
                {lastScan.color === 'green' ? '✓' : lastScan.color === 'red' ? '✕' : '⚠'}
              </div>
              {/* Participant name */}
              {lastScan.participant && (
                <div style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: 8, lineHeight: 1.1, color: borderColor }}>
                  {lastScan.participant.name}
                </div>
              )}
              {/* Status message */}
              <div style={{ fontSize: '1.25rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {lastScan.message}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>◎</div>
              <p className="text-title" style={{ color: 'var(--text-secondary)' }}>Ready to Scan</p>
              <p className="text-caption">
                {useCam ? 'Point camera at QR code' : 'Scan QR code with hardware scanner'}
              </p>
            </div>
          )}

          {/* Camera view */}
          {useCam && <div id="qr-reader" style={{ width: 300, marginTop: 24, borderRadius: 12, overflow: 'hidden' }} />}
        </div>

        {/* Hidden input for hardware scanner */}
        {!useCam && (
          <input
            ref={inputRef}
            type="text"
            style={{ position: 'fixed', top: -100, left: -100, opacity: 0 }}
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
