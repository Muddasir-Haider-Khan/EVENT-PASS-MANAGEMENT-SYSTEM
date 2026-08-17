'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Media27Logo } from '@/components/27MediaLogo';

export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'manager' | 'super_admin'>('manager');
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
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg-root)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          backgroundImage: 'radial-gradient(ellipse at 50% 20%, rgba(212, 175, 55, 0.08) 0%, rgba(7, 7, 9, 1) 75%)',
        }}
      >
        <div className="card card-gold-glow" style={{ maxWidth: 440, width: '100%', padding: 36 }}>
          <div style={{ marginBottom: 28, textAlign: 'center' }}>
            <div style={{ display: 'inline-block', marginBottom: 16 }}>
              <Media27Logo size="md" />
            </div>
            <h1 className="text-headline" style={{ color: '#F8FAFC', marginTop: 12 }}>
              Update Required
            </h1>
            <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              Your account requires setting a secure custom password before proceeding.
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
            <div style={{ marginBottom: 24 }}>
              <label className="input-label">Confirm New Password</label>
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

            <button type="submit" className="btn btn-gold" style={{ width: '100%', height: 44 }} disabled={loading}>
              {loading ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : 'Set Password & Access Portal'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg-root)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(212, 175, 55, 0.1) 0%, rgba(7, 7, 9, 1) 70%)',
      }}
    >
      {/* Background Decorative Rings */}
      <div
        style={{
          position: 'absolute',
          width: 600,
          height: 600,
          borderRadius: '50%',
          border: '1px solid rgba(212, 175, 55, 0.08)',
          pointerEvents: 'none',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div className="card card-gold-glow" style={{ maxWidth: 450, width: '100%', padding: '40px 36px', zIndex: 10 }}>
        {/* Header Branding */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28, textAlign: 'center' }}>
          <Media27Logo size="lg" />
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.12em',
              color: 'var(--gold-light)',
              background: 'rgba(212, 175, 55, 0.1)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              padding: '4px 12px',
              borderRadius: 100,
              marginTop: 16,
              textTransform: 'uppercase',
            }}
          >
            Official Enterprise Portal
          </div>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
            padding: 4,
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-default)',
            borderRadius: 10,
            marginBottom: 24,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('manager')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'manager' ? 'var(--gold-gradient)' : 'transparent',
              color: activeTab === 'manager' ? '#070709' : 'var(--text-secondary)',
              transition: 'all 150ms ease',
            }}
          >
            Event Manager
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('super_admin')}
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              background: activeTab === 'super_admin' ? 'var(--gold-gradient)' : 'transparent',
              color: activeTab === 'super_admin' ? '#070709' : 'var(--text-secondary)',
              transition: 'all 150ms ease',
            }}
          >
            Super Admin
          </button>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 18 }}>
            <label className="input-label" htmlFor="login-id">
              {activeTab === 'super_admin' ? 'Master Admin Username / Email' : 'Event Manager Login ID'}
            </label>
            <input
              id="login-id"
              type="text"
              className="input"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder={activeTab === 'super_admin' ? 'admin' : 'manager-login-id'}
              required
              autoComplete="username"
              autoFocus
              style={{ height: 44, fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="input-label" htmlFor="password">
              Security Password
            </label>
            <input
              id="password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              style={{ height: 44, fontSize: 14 }}
            />
          </div>

          {error && (
            <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 20, padding: '12px 14px', background: 'var(--error-bg)', borderRadius: 8, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn btn-gold" style={{ width: '100%', height: 46, fontSize: 14 }} disabled={loading}>
            {loading ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : `Sign In to ${activeTab === 'super_admin' ? 'Super Admin' : 'Event Manager'} →`}
          </button>
        </form>

        <div style={{ marginTop: 28, textAlign: 'center', borderTop: '1px solid var(--border-default)', paddingTop: 20 }}>
          <p className="text-caption" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            © {new Date().getFullYear()} 27 MEDIA AGENCY. All Rights Reserved.
          </p>
          <a
            href="https://www.27mediaagency.com"
            target="_blank"
            rel="noreferrer"
            style={{ color: 'var(--gold-light)', fontSize: 11, textDecoration: 'none', marginTop: 4, display: 'inline-block' }}
          >
            www.27mediaagency.com
          </a>
        </div>
      </div>
    </div>
  );
}
