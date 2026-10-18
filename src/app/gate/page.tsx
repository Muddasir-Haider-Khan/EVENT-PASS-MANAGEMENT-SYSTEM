'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ScanLine } from 'lucide-react';
import { AuthFrame, FormError } from '@/components/AuthFrame';

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
    <AuthFrame title="Gate scanner" description="Enter the gate access code your event manager shared with you.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label" htmlFor="gate-code">Access code</label>
          <input
            id="gate-code"
            type="text"
            inputMode="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="XXXXXXXX"
            required
            autoFocus
            autoComplete="one-time-code"
            autoCapitalize="characters"
            maxLength={16}
            className="input !h-14 text-center !text-[22px] font-bold num tracking-[0.2em] placeholder:tracking-[0.2em]"
          />
        </div>

        {error && <FormError>{error}</FormError>}

        <button type="submit" className="btn btn-primary w-full !h-12" disabled={loading || !otp}>
          {loading ? <span className="spinner" /> : <ScanLine className="w-4 h-4" />}
          Open scanner
        </button>
      </form>
    </AuthFrame>
  );
}
