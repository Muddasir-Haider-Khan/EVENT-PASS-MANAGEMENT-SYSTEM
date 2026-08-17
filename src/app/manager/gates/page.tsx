'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

interface GateItem { id: string; name: string; type: 'ENTRY' | 'EXIT'; otpCode: string; _count: { scanLogs: number }; }

export default function GatesPage() {
  const { toast } = useToast();
  const [gates, setGates] = useState<GateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [creating, setCreating] = useState(false);

  async function load() {
    const res = await fetch('/api/manager/gates');
    if (res.ok) { const d = await res.json(); setGates(d.gates); }
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/manager/gates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });
      if (res.ok) { toast('Gate created', 'success'); setName(''); load(); }
      else { const d = await res.json(); toast(d.error || 'Failed', 'error'); }
    } catch { toast('Network error', 'error'); }
    finally { setCreating(false); }
  }

  async function regenerateOtp(gateId: string) {
    try {
      const res = await fetch(`/api/manager/gates/${gateId}/regenerate-otp`, { method: 'POST' });
      if (res.ok) { toast('OTP regenerated', 'success'); load(); }
    } catch { toast('Network error', 'error'); }
  }

  if (loading) return <div style={{ padding: 24 }}><div className="spinner" /></div>;

  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-headline" style={{ marginBottom: 20 }}>Gates</h1>

      <form onSubmit={handleCreate} className="card" style={{ padding: 20, marginBottom: 24, maxWidth: 500 }}>
        <h3 className="text-title" style={{ marginBottom: 12 }}>Create Gate</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input className="input" style={{ flex: 1, minWidth: 150 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Gate name" required />
          <select className="select" style={{ width: 140 }} value={type} onChange={(e) => setType(e.target.value as 'ENTRY' | 'EXIT')}>
            <option value="ENTRY">Entry Gate</option>
            <option value="EXIT">Exit Gate</option>
          </select>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '+ Create'}
          </button>
        </div>
      </form>

      {gates.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No gates yet</div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {gates.map((gate) => (
            <div key={gate.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{gate.name}</span>
                    <span className={`badge ${gate.type === 'ENTRY' ? 'badge-info' : 'badge-warning'}`}>{gate.type}</span>
                  </div>
                  <div className="text-caption" style={{ color: 'var(--text-muted)' }}>{gate._count.scanLogs} scans logged</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-overline" style={{ color: 'var(--text-muted)' }}>OTP Code</div>
                    <div className="text-mono" style={{ fontSize: 20, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--color-accent)' }}>{gate.otpCode}</div>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => regenerateOtp(gate.id)}>↻</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
