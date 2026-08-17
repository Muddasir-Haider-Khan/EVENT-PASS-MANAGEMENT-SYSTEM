'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

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
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
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
      setError('Network error. Please try again.');
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
        setChangeError(data.error || 'Failed to change password');
        return;
      }

      // Re-check session to redirect
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="card" style={{ maxWidth: 420, width: '100%', padding: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <div className="text-overline" style={{ color: 'var(--warning)', marginBottom: 8 }}>
              Password Change Required
            </div>
            <h1 className="text-headline">Set New Password</h1>
            <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Your temporary password must be changed before continuing.
            </p>
          </div>

          <form onSubmit={handleChangePassword}>
            <div style={{ marginBottom: 16 }}>
              <label className="input-label">New Password</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, uppercase, lowercase, number"
                required
                minLength={8}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="input-label">Confirm Password</label>
              <input
                type="password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                required
              />
            </div>

            {changeError && (
              <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 16, padding: '10px 14px', background: 'var(--error-bg)', borderRadius: 8 }}>
                {changeError}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? <span className="spinner" /> : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="card" style={{ maxWidth: 420, width: '100%', padding: 32 }}>
        <div style={{ marginBottom: 28 }}>
          <div className="text-overline" style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
            Event Pass Management
          </div>
          <h1 className="text-headline">Sign In</h1>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Super Admin or Event Manager access
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 16 }}>
            <label className="input-label" htmlFor="login-id">Email or Login ID</label>
            <input
              id="login-id"
              type="text"
              className="input"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="admin@example.com or login-id"
              required
              autoComplete="username"
              autoFocus
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="input-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 16, padding: '10px 14px', background: 'var(--error-bg)', borderRadius: 8 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Sign In →'}
          </button>
        </form>

        <div style={{ marginTop: 24, textAlign: 'center' }}>
          <p className="text-caption" style={{ color: 'var(--text-dim)' }}>
            Event Pass Management System
          </p>
        </div>
      </div>
    </div>
  );
}
