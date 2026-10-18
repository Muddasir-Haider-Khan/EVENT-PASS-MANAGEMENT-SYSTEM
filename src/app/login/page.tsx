'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthFrame, FormError } from '@/components/AuthFrame';

export default function LoginPage() {
  const router = useRouter();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeError, setChangeError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginId, password }),
      });
      
      let data;
      try {
        data = await res.json();
      } catch {
        setError(`Server returned status ${res.status}. Please check database connection.`);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Authentication failed');
        return;
      }

      if (data.mustChangePassword) {
        setShowChangePassword(true);
        setCurrentPassword(password);
        return;
      }

      if (data.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/manager');
      }
    } catch {
      setError('Network connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setChangeError('');

    if (newPassword !== confirmPassword) {
      setChangeError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setChangeError(data.error || 'Failed to update password');
        return;
      }

      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();

      if (sessionData.role === 'super_admin') {
        router.push('/admin');
      } else {
        router.push('/manager');
      }
    } catch {
      setChangeError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (showChangePassword) {
    return (
      <AuthFrame
        title="Set a new password"
        description="Your account was issued a temporary password. Choose your own before continuing."
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="input-label" htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              className="input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
              autoFocus
            />
            <p className="mt-1.5 text-[12px] text-muted">Use upper and lower case letters and a number.</p>
          </div>
          <div>
            <label className="input-label" htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          {changeError && <FormError>{changeError}</FormError>}

          <button type="submit" className="btn btn-primary w-full !h-11" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Save password and continue'}
          </button>
        </form>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame title="Sign in" description="For event managers and system administrators.">
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="input-label" htmlFor="login-id">Login ID or email</label>
          <input
            id="login-id"
            type="text"
            className="input"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
            autoComplete="username"
            autoFocus
          />
        </div>

        <div>
          <label className="input-label" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        {error && <FormError>{error}</FormError>}

        <button type="submit" className="btn btn-primary w-full !h-11" disabled={loading}>
          {loading ? <span className="spinner" /> : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 pt-5 border-t border-line text-[12.5px] text-muted">
        Gate staff sign in with a gate code at{' '}
        <Link href="/gate" className="text-fg underline underline-offset-2 decoration-line-2 hover:decoration-fg">
          the scanner
        </Link>
        .
      </p>
    </AuthFrame>
  );
}
