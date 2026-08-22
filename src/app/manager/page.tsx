'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardStats {
  totalSubmissions: number;
  totalParticipants: number;
  totalGates: number;
  pendingSubmissions: number;
  insideNow: number;
}

export default function ManagerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [eventName, setEventName] = useState('');
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/manager/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setEventName(data.event.name);
        setSlug(data.event.slug);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Welcome Banner */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
          paddingBottom: 20,
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div>
          <div className="text-overline" style={{ color: 'var(--gold-light)' }}>
            27 MEDIA AGENCY • EVENT MANAGER CONTROL
          </div>
          <h1 className="text-display gold-gradient-text" style={{ marginTop: 4 }}>
            {eventName || 'Event Operations'}
          </h1>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Live attendance tracking, submission review, pass distribution, and gate entry metrics.
          </p>
        </div>

        {slug && (
          <a
            href={`/event/${slug}`}
            target="_blank"
            rel="noreferrer"
            className="btn btn-gold"
            style={{ textDecoration: 'none' }}
          >
            🌐 View Public Registration Form ↗
          </a>
        )}
      </div>

      {/* Stats Cards */}
      {!stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 36 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card card-gold-glow" style={{ padding: 22 }}>
              <div className="skeleton" style={{ width: 80, height: 12, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 60, height: 32 }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 36 }}>
          <div className="card card-gold-glow" style={{ padding: 22 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Total Submissions</div>
            <div className="text-display text-mono" style={{ marginTop: 8, color: '#F8FAFC' }}>{stats.totalSubmissions}</div>
          </div>

          <div className="card card-gold-glow" style={{ padding: 22 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Pending Review</div>
            <div className="text-display text-mono" style={{ color: 'var(--warning)', marginTop: 8 }}>{stats.pendingSubmissions}</div>
          </div>

          <div className="card card-gold-glow" style={{ padding: 22 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Approved Pass Holders</div>
            <div className="text-display text-mono" style={{ color: 'var(--gold-light)', marginTop: 8 }}>{stats.totalParticipants}</div>
          </div>

          <div className="card card-gold-glow" style={{ padding: 22 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Inside Venue Now</div>
            <div className="text-display text-mono" style={{ color: 'var(--success)', marginTop: 8 }}>{stats.insideNow}</div>
          </div>

          <div className="card card-gold-glow" style={{ padding: 22 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Active Gate Points</div>
            <div className="text-display text-mono" style={{ marginTop: 8, color: '#F8FAFC' }}>{stats.totalGates}</div>
          </div>
        </div>
      )}

      {/* Quick Action Hub */}
      <h2 className="text-title" style={{ color: '#F8FAFC', marginBottom: 16 }}>
        Quick Management Actions
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        <div
          className="card"
          style={{ padding: 24, cursor: 'pointer', transition: 'all 150ms ease' }}
          onClick={() => router.push('/manager/submissions')}
        >
          <div style={{ fontSize: 24, marginBottom: 10 }}>◫</div>
          <h3 className="text-title" style={{ color: 'var(--gold-light)' }}>Review Registrations</h3>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Approve or decline incoming attendee submissions and trigger instant digital pass generation.
          </p>
        </div>

        <div
          className="card"
          style={{ padding: 24, cursor: 'pointer', transition: 'all 150ms ease' }}
          onClick={() => router.push('/manager/gates')}
        >
          <div style={{ fontSize: 24, marginBottom: 10 }}>⊞</div>
          <h3 className="text-title" style={{ color: 'var(--gold-light)' }}>Gate Control & Scanner Accounts</h3>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Provision gate scanner login accounts and generate secure OTP codes for gate officers.
          </p>
        </div>

        <div
          className="card"
          style={{ padding: 24, cursor: 'pointer', transition: 'all 150ms ease' }}
          onClick={() => router.push('/manager/settings')}
        >
          <div style={{ fontSize: 24, marginBottom: 10 }}>⚙</div>
          <h3 className="text-title" style={{ color: 'var(--gold-light)' }}>Branding & ImageKit Banners</h3>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Upload high-resolution event logos, pass header graphics, and customize color schemes.
          </p>
        </div>
      </div>
    </div>
  );
}
