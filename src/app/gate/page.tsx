'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      if (!res.ok) { setError(data.error || 'Invalid OTP'); return; }
      // Store gate info in sessionStorage for the scanner page
      sessionStorage.setItem('gateSession', JSON.stringify(data));
      router.push('/gate/scan');
    } catch { setError('Network error'); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ maxWidth: 400, width: '100%', padding: 32, textAlign: 'center' }}>
        <div className="text-overline" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>Gate Access</div>
        <h1 className="text-headline" style={{ marginBottom: 4 }}>Enter Gate OTP</h1>
        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Enter the OTP code provided by the event manager
        </p>
        <form onSubmit={handleSubmit}>
          <input
            className="input text-mono"
            style={{ textAlign: 'center', fontSize: 24, letterSpacing: '0.15em', padding: '14px 16px' }}
            value={otp}
            onChange={(e) => setOtp(e.target.value.toUpperCase())}
            placeholder="GATE OTP"
            required
            autoFocus
            autoComplete="off"
          />
          {error && (
            <div style={{ color: 'var(--error)', fontSize: 13, marginTop: 12, padding: '10px', background: 'var(--error-bg)', borderRadius: 8 }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Access Gate →'}
          </button>
        </form>
      </div>
    </div>
  );
}
