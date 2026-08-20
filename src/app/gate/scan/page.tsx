'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';

interface ScanResult {
  result: string;
  message: string;
  color: string;
  participant?: { name: string; email: string; entryStatus: string };
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

// Web Audio API Sound Synthesizer for instant feedback without external audio assets
function playAudioFeedback(type: 'SUCCESS' | 'DENIED' | 'WARNING') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'SUCCESS') {
      // Pleasant high dual chime (D5 -> A5)
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
      // Low warning buzz (Sawtooth 150Hz -> 100Hz)
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
    } else {
      // Warning amber tone (Square 440Hz -> 330Hz)
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
  const [useCam, setUseCam] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const bufferRef = useRef('');

  useEffect(() => {
    const saved = sessionStorage.getItem('gateSession');
    if (!saved) { router.push('/gate'); return; }
    try { setGateSession(JSON.parse(saved)); } catch { router.push('/gate'); }
  }, [router]);

  // Continuously refocus the hidden input for hardware scanners
  useEffect(() => {
    if (!useCam) {
      const interval = setInterval(() => inputRef.current?.focus(), 500);
      return () => clearInterval(interval);
    }
  }, [useCam]);

  const isScanningActiveRef = useRef(false);

  const processScan = useCallback(async (token: string) => {
    let cleanToken = token.trim();
    if (!cleanToken) return;

    // Extract token if scanned as a URL
    if (cleanToken.includes('http')) {
      try {
        const urlObj = new URL(cleanToken);
        cleanToken = urlObj.searchParams.get('token') || urlObj.pathname.split('/').pop() || cleanToken;
      } catch {
        // keep cleanToken as is
      }
    }

    if (scanning) return;
    setScanning(true);
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

      // Play synthesized audio feedback
      if (data.color === 'green') {
        playAudioFeedback('SUCCESS');
      } else if (data.color === 'red') {
        playAudioFeedback('DENIED');
      } else {
        playAudioFeedback('WARNING');
      }

      // Record scan in live history log
      const historyItem: ScanHistoryItem = {
        id: Math.random().toString(36).substring(2, 9),
        time: now,
        name: data.participant?.name || 'Unknown Holder',
        statusMessage: data.message,
        color: data.color,
        result: data.result,
      };

      setScanHistory((prev) => [historyItem, ...prev.slice(0, 4)]);

      // Auto-clear prominent status box after 5 seconds
      setTimeout(() => setLastScan(null), 5000);
    } catch {
      setLastScan({ result: 'ERROR', message: 'Network communication error', color: 'red' });
      playAudioFeedback('DENIED');
      setTimeout(() => setLastScan(null), 4000);
    } finally {
      setScanning(false);
    }
  }, [scanning]);

  // Hardware scanner input handler (fast burst detection)
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

  // Camera scanner via html5-qrcode (exception-safe)
  useEffect(() => {
    if (!useCam) return;
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
          () => {} // silent on frame scan miss
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
  }, [useCam, processScan]);

  if (!gateSession) {
    return (
      <div style={{ minHeight: '100vh', background: '#070709', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderTopColor: '#D4AF37' }} />
      </div>
    );
  }

  const bgColor = lastScan ? (lastScan.color === 'green' ? '#06200B' : lastScan.color === 'red' ? '#260606' : '#261C04') : 'var(--bg-root)';
  const borderColor = lastScan ? (lastScan.color === 'green' ? 'var(--success)' : lastScan.color === 'red' ? 'var(--error)' : 'var(--warning)') : 'var(--border-default)';

  return (
    <ThemeProvider primaryColor={gateSession.event.primaryColor} secondaryColor={gateSession.event.secondaryColor} accentColor={gateSession.event.accentColor}>
      <div style={{ minHeight: '100vh', background: bgColor, transition: 'background 300ms ease', color: '#F8FAFC', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-default)', background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="text-overline" style={{ color: 'var(--gold-light)' }}>{gateSession.event.name}</div>
            <div style={{ fontSize: 18, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
              {gateSession.gate.name}
              <span className={`badge ${gateSession.gate.type === 'ENTRY' ? 'badge-gold' : 'badge-warning'}`}>
                {gateSession.gate.type} GATE
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="text-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>{scanCount} total scans</span>
            <button className="btn btn-ghost btn-sm" style={{ border: '1px solid var(--border-default)', background: useCam ? 'var(--bg-elevated)' : 'transparent' }} onClick={() => setUseCam(!useCam)}>
              {useCam ? '⌨ Hardware Mode' : '📷 Camera Mode'}
            </button>
          </div>
        </div>

        {/* Scan Display Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
          {lastScan ? (
            <div
              style={{
                textAlign: 'center',
                animation: 'modal-in 200ms ease',
                border: `3px solid ${borderColor}`,
                background: 'rgba(0,0,0,0.6)',
                borderRadius: 24,
                padding: '44px 32px',
                maxWidth: 520,
                width: '100%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
              }}
            >
              <div style={{ fontSize: 72, marginBottom: 12, lineHeight: 1 }}>
                {lastScan.color === 'green' ? '✓' : lastScan.color === 'red' ? '✕' : '⚠️'}
              </div>

              {lastScan.participant && (
                <div style={{ fontSize: '2.4rem', fontWeight: 800, color: borderColor, marginBottom: 6, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  {lastScan.participant.name}
                </div>
              )}

              <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#F8FAFC', marginTop: 8 }}>
                {lastScan.message}
              </div>

              <div style={{ marginTop: 20 }}>
                <span className={`badge ${lastScan.color === 'green' ? 'badge-gold' : lastScan.color === 'red' ? 'badge-error' : 'badge-warning'}`} style={{ padding: '6px 16px', fontSize: 13 }}>
                  RESULT: {lastScan.result}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
              <div style={{ fontSize: 56, marginBottom: 16, opacity: 0.4 }}>📱</div>
              <h2 className="text-headline" style={{ color: '#F8FAFC' }}>Ready for Gate Scanning</h2>
              <p className="text-body" style={{ color: 'var(--text-secondary)', marginTop: 6, maxWidth: 380 }}>
                {useCam ? 'Align attendee pass QR code within camera viewfinder.' : 'Scan pass using rapid barcode/QR scanner laser.'}
              </p>
            </div>
          )}

          {useCam && <div id="qr-reader" style={{ width: 280, marginTop: 20, borderRadius: 16, overflow: 'hidden', border: '2px solid var(--gold-primary)' }} />}
        </div>

        {/* Live Recent 5 Scan History Feed */}
        {scanHistory.length > 0 && (
          <div style={{ padding: '16px 20px 24px', borderTop: '1px solid var(--border-default)', background: 'var(--bg-surface)' }}>
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <div className="text-overline" style={{ color: 'var(--text-muted)', marginBottom: 10 }}>RECENT GATE ACTIVITY LOG</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {scanHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border-default)',
                      fontSize: 13,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: item.color === 'green' ? 'var(--success)' : item.color === 'red' ? 'var(--error)' : 'var(--warning)', fontWeight: 700 }}>
                        {item.color === 'green' ? '✓' : item.color === 'red' ? '✕' : '⚠'}
                      </span>
                      <span style={{ fontWeight: 600, color: '#F8FAFC' }}>{item.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>— {item.statusMessage}</span>
                    </div>
                    <span className="text-mono text-caption" style={{ color: 'var(--text-muted)' }}>{item.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

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

