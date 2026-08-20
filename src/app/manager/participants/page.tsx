'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';

interface Participant {
  id: string;
  name: string | null;
  email: string;
  entryStatus: 'NOT_ENTERED' | 'INSIDE' | 'EXITED';
  lastScanAt: string | null;
  createdAt: string;
}

export default function ParticipantsPage() {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadParticipants = useCallback(async (q = '') => {
    try {
      const res = await fetch(`/api/manager/participants?search=${encodeURIComponent(q)}`);
      if (res.ok) {
        const d = await res.json();
        setParticipants(d.participants || []);
      }
    } catch {
      toast('Failed to load participants roster', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  useEffect(() => {
    const t = setTimeout(() => loadParticipants(search), 300);
    return () => clearTimeout(t);
  }, [search, loadParticipants]);

  const badgeMap: Record<string, string> = {
    NOT_ENTERED: 'badge-neutral',
    INSIDE: 'badge-gold',
    EXITED: 'badge-warning',
  };

  const labelMap: Record<string, string> = {
    NOT_ENTERED: 'Not Entered',
    INSIDE: 'Inside Venue',
    EXITED: 'Exited Venue',
  };

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="text-overline" style={{ color: 'var(--gold-light)' }}>27 MEDIA AGENCY • ATTENDEE ROSTER</span>
          <h1 className="text-headline gold-gradient-text" style={{ marginTop: 4 }}>
            Pass Holders ({participants.length})
          </h1>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Real-time status of all generated digital passes and venue access logs.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <input
            className="input"
            style={{ maxWidth: 260, height: 38, fontSize: 13 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email..."
          />
          <a
            href="/api/manager/participants/export"
            className="btn btn-gold btn-sm"
            download
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            ↓ Export Attendees CSV
          </a>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--gold-primary)' }} />
        </div>
      ) : participants.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎟️</div>
          No approved pass holders found matching your search.
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="card desktop-only-table" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Attendee Name</th>
                    <th>Email Address</th>
                    <th>Venue Entry Status</th>
                    <th>Last Gate Activity</th>
                    <th>Issued Date</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: '#F8FAFC' }}>{p.name || '—'}</td>
                      <td className="text-mono" style={{ fontSize: 13, color: 'var(--gold-light)' }}>
                        {p.email}
                      </td>
                      <td>
                        <span className={`badge ${badgeMap[p.entryStatus]}`}>
                          {labelMap[p.entryStatus]}
                        </span>
                      </td>
                      <td className="text-caption" style={{ color: 'var(--text-muted)' }}>
                        {p.lastScanAt ? new Date(p.lastScanAt).toLocaleString() : 'No gate scan recorded'}
                      </td>
                      <td className="text-caption" style={{ color: 'var(--text-muted)' }}>
                        {new Date(p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View (Fluent App Experience) */}
          <div className="mobile-only-cards" style={{ display: 'none', flexDirection: 'column', gap: 12 }}>
            {participants.map((p) => (
              <div key={p.id} className="card card-elevated" style={{ padding: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#F8FAFC' }}>
                    {p.name || 'Anonymous Pass Holder'}
                  </div>
                  <span className={`badge ${badgeMap[p.entryStatus]}`}>
                    {labelMap[p.entryStatus]}
                  </span>
                </div>
                <div className="text-mono" style={{ fontSize: 12.5, color: 'var(--gold-light)', marginBottom: 8 }}>
                  ✉ {p.email}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', paddingTop: 8, borderTop: '1px solid var(--border-default)' }}>
                  <span>Last Activity: {p.lastScanAt ? new Date(p.lastScanAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Never'}</span>
                  <span>Issued: {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          <style>{`
            @media (max-width: 768px) {
              .desktop-only-table { display: none !important; }
              .mobile-only-cards { display: flex !important; }
            }
          `}</style>
        </>
      )}
    </div>
  );
}
