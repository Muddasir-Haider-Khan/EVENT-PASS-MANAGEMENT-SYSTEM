'use client';

import { useEffect, useState } from 'react';

interface Participant {
  id: string;
  name: string | null;
  email: string;
  entryStatus: 'NOT_ENTERED' | 'INSIDE' | 'EXITED';
  lastScanAt: string | null;
  createdAt: string;
}

export default function ParticipantsPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  async function load(q = '') {
    const res = await fetch(`/api/manager/participants?search=${encodeURIComponent(q)}`);
    if (res.ok) { const d = await res.json(); setParticipants(d.participants); }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(() => load(search), 300); return () => clearTimeout(t); }, [search]);

  const badgeMap: Record<string, string> = { NOT_ENTERED: 'badge-neutral', INSIDE: 'badge-success', EXITED: 'badge-warning' };
  const labelMap: Record<string, string> = { NOT_ENTERED: 'Not Entered', INSIDE: 'Inside', EXITED: 'Exited' };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="text-headline">Participants ({participants.length})</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="input" style={{ maxWidth: 250 }} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." />
          <a href="/api/manager/participants/export" className="btn btn-ghost btn-sm" download>↓ CSV</a>
        </div>
      </div>
      {loading ? <div className="card" style={{ padding: 40, textAlign: 'center' }}><div className="spinner" style={{ margin: '0 auto' }} /></div>
      : participants.length === 0 ? <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No participants yet</div>
      : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Last Scan</th><th>Registered</th></tr></thead>
              <tbody>
                {participants.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name || '—'}</td>
                    <td className="text-mono" style={{ fontSize: 13 }}>{p.email}</td>
                    <td><span className={`badge ${badgeMap[p.entryStatus]}`}>{labelMap[p.entryStatus]}</span></td>
                    <td className="text-caption" style={{ color: 'var(--text-muted)' }}>{p.lastScanAt ? new Date(p.lastScanAt).toLocaleString() : '—'}</td>
                    <td className="text-caption" style={{ color: 'var(--text-muted)' }}>{new Date(p.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
