'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Media27Logo } from '@/components/27MediaLogo';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 antialiased">
      <Card variant="glass" className="max-w-md w-full p-8 text-center border-slate-800 shadow-2xl">
        <div className="flex justify-center mb-6">
          <Media27Logo size="sm" />
        </div>

        <div className="mb-4">
          <Badge variant="indigo" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
            Mobile Gate Access Point
          </Badge>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
          Enter Gate OTP
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Enter the Access OTP code provided by your Event Manager to initialize scanner.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">
              <KeyRound className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="ENTER OTP CODE"
              required
              autoFocus
              autoComplete="off"
              maxLength={16}
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 text-center font-mono text-xl tracking-widest text-indigo-300 placeholder-slate-600 rounded-xl py-3.5 pl-11 pr-4 transition outline-none"
            />
          </div>

          {error && (
            <div className="p-3 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
              {error}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full"
          >
            Authenticate Gate Scanner
          </Button>
        </form>
      </Card>
    </div>
  );
}
