'use client';

import { useEffect, useState } from 'react';

interface DashboardStats {
  totalSubmissions: number;
  totalParticipants: number;
  totalGates: number;
  pendingSubmissions: number;
  insideNow: number;
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/manager/dashboard');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setEventName(data.event.name);
      }
    }
    load();
  }, []);

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="text-headline">Dashboard</h1>
        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Overview for {eventName}
        </p>
      </div>

      {!stats ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div className="skeleton" style={{ width: 80, height: 12, marginBottom: 8 }} />
              <div className="skeleton" style={{ width: 60, height: 32 }} />
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Submissions</div>
            <div className="text-display text-mono" style={{ marginTop: 4 }}>{stats.totalSubmissions}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Pending</div>
            <div className="text-display text-mono" style={{ color: 'var(--warning)', marginTop: 4 }}>{stats.pendingSubmissions}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Participants</div>
            <div className="text-display text-mono" style={{ color: 'var(--success)', marginTop: 4 }}>{stats.totalParticipants}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Inside Now</div>
            <div className="text-display text-mono" style={{ color: 'var(--info)', marginTop: 4 }}>{stats.insideNow}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Gates</div>
            <div className="text-display text-mono" style={{ marginTop: 4 }}>{stats.totalGates}</div>
          </div>
        </div>
      )}
    </div>
  );
}
