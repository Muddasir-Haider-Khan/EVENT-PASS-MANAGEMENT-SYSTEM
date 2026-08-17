'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';

interface GateItem {
  id: string;
  name: string;
  type: 'ENTRY' | 'EXIT';
  otpCode: string;
  _count: { scanLogs: number };
}

export default function GatesPage() {
  const { toast } = useToast();
  const [gates, setGates] = useState<GateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [type, setType] = useState<'ENTRY' | 'EXIT'>('ENTRY');
  const [creating, setCreating] = useState(false);

  const loadGates = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/gates');
      if (res.ok) {
        const d = await res.json();
        setGates(d.gates || []);
      }
    } catch {
      toast('Failed to load gate configurations', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadGates();
  }, [loadGates]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch('/api/manager/gates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
      });
      if (res.ok) {
        toast('Gate created successfully', 'success');
        setName('');
        loadGates();
      } else {
        const d = await res.json();
        toast(d.error || 'Failed to create gate', 'error');
      }
    } catch {
      toast('Network error while creating gate', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function regenerateOtp(gateId: string) {
    try {
      const res = await fetch(`/api/manager/gates/${gateId}/regenerate-otp`, { method: 'POST' });
      if (res.ok) {
        toast('Gate access OTP regenerated', 'success');
        loadGates();
      }
    } catch {
      toast('Network error while regenerating OTP', 'error');
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--gold-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <span className="text-overline" style={{ color: 'var(--gold-light)' }}>27 MEDIA AGENCY • SCANNER CONTROL</span>
        <h1 className="text-headline gold-gradient-text" style={{ marginTop: 4 }}>
          Gate & Access Point Management
        </h1>
        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Provision entry/exit gates and generate access OTP keys for event gate officers.
        </p>
      </div>

      {/* Gate Provisioning Card */}
      <form onSubmit={handleCreate} className="card" style={{ padding: 24, marginBottom: 28 }}>
        <h3 className="text-title" style={{ color: '#F8FAFC', marginBottom: 16 }}>
          Provision New Access Gate
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input
            className="input"
            style={{ flex: 1, minWidth: 200 }}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gate 1 - VIP Main Entry"
            required
          />
          <select className="select" style={{ width: 160 }} value={type} onChange={(e) => setType(e.target.value as 'ENTRY' | 'EXIT')}>
            <option value="ENTRY">Entry Gate</option>
            <option value="EXIT">Exit Gate</option>
          </select>
          <button type="submit" className="btn btn-gold" disabled={creating} style={{ height: 42 }}>
            {creating ? <span className="spinner" style={{ borderTopColor: '#070709', width: 14, height: 14 }} /> : '+ Add Access Gate'}
          </button>
        </div>
      </form>

      {/* Gates Roster */}
      {gates.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🚪</div>
          No gates created yet. Provision your first gate above to enable mobile scanning.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {gates.map((gate) => (
            <div key={gate.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 18, color: '#F8FAFC' }}>{gate.name}</span>
                    <span className={`badge ${gate.type === 'ENTRY' ? 'badge-gold' : 'badge-warning'}`}>
                      {gate.type}
                    </span>
                  </div>
                  <div className="text-caption" style={{ color: 'var(--text-muted)' }}>
                    📊 {gate._count.scanLogs} attendee check-in scans recorded
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg-elevated)', padding: '10px 18px', borderRadius: 12, border: '1px solid var(--border-default)' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div className="text-overline" style={{ color: 'var(--gold-light)' }}>
                      Scanner Access OTP
                    </div>
                    <div className="text-mono" style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.14em', color: '#F8FAFC' }}>
                      {gate.otpCode}
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost btn-sm"
                    title="Regenerate OTP Code"
                    onClick={() => regenerateOtp(gate.id)}
                    style={{ color: 'var(--gold-light)' }}
                  >
                    ↻
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
