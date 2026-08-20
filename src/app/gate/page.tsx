'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Media27Logo } from '@/components/27MediaLogo';

export default function GateOTPPage() {
  const router = useRouter();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/gate/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otpCode: otp.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid scanner OTP code');
        return;
      }
      sessionStorage.setItem('gateSession', JSON.stringify(data));
      router.push('/gate/scan');
    } catch {
      setError('Network communication error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#070709', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card card-gold-glow" style={{ maxWidth: 420, width: '100%', padding: 36, textAlign: 'center' }}>
        <div style={{ marginBottom: 20 }}>
          <Media27Logo size="sm" />
        </div>

        <span className="badge badge-gold" style={{ marginBottom: 12 }}>
          Mobile Gate Access Point
        </span>

        <h1 className="text-headline gold-gradient-text" style={{ marginBottom: 6 }}>
          Enter Gate OTP
        </h1>
        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 28 }}>
          Enter the Gate Access OTP provided by your 27 Media Event Manager.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            className="input text-mono"
            style={{
              textAlign: 'center',
              fontSize: 22,
              letterSpacing: '0.12em',
              padding: '14px 16px',
              color: 'var(--gold-light)',
              fontWeight: 800,
              background: 'rgba(0,0,0,0.6)',
              border: '1px solid var(--border-hover)',
              width: '100%',
              boxSizing: 'border-box',
            }}
            value={otp}
            onChange={(e) => setOtp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="ENTER OTP CODE"
            required
            autoFocus
            autoComplete="off"
            maxLength={16}
          />

          {error && (
            <div
              style={{
                color: 'var(--error)',
                fontSize: 13,
                marginTop: 14,
                padding: '10px 14px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 8,
              }}
            >
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-gold" style={{ width: '100%', height: 46, marginTop: 20, fontSize: 15 }} disabled={loading}>
            {loading ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : 'Authenticate Gate Scanner →'}
          </button>
        </form>
      </div>
    </div>
  );
}
