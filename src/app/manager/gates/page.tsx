'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { PageHead, Stat } from '@/components/AppShell';
import { Copy, LogIn, LogOut, Plus, RefreshCw, ScanLine } from 'lucide-react';

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

  async function copyCode(gate: GateItem) {
    try {
      await navigator.clipboard.writeText(gate.otpCode);
      toast(`Access code for ${gate.name} copied`, 'success');
    } catch {
      toast('Could not copy — select the code manually', 'error');
    }
  }

  if (loading) {
    return (
      <div className="p-14 flex items-center justify-center gap-3 text-muted text-[13px]">
        <span className="spinner" /> Loading gates…
      </div>
    );
  }

  const entryGates = gates.filter((g) => g.type === 'ENTRY').length;
  const totalScans = gates.reduce((n, g) => n + g._count.scanLogs, 0);

  return (
    <>
      <PageHead
        title={<>Gates &amp;<br />Scanners</>}
        stats={
          <>
            <Stat icon={LogIn} value={entryGates} label="Entry gates" />
            <Stat icon={LogOut} value={gates.length - entryGates} label="Exit gates" />
            <Stat icon={ScanLine} value={totalScans.toLocaleString()} label="Scans recorded" />
          </>
        }
      />

      <form onSubmit={handleCreate} className="card p-[18px] mb-4">
        <div className="card-head mb-3">
          <h2 className="card-title">Add a gate</h2>
          <span className="text-[13px] text-muted hidden sm:inline">Each gate gets its own access code for scanner staff.</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <label className="flex-1">
            <span className="sr-only">Gate name</span>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Gate name, e.g. Main entrance" required />
          </label>
          <div className="seg self-start sm:self-auto" role="group" aria-label="Gate type">
            {(['ENTRY', 'EXIT'] as const).map((t) => (
              <button key={t} type="button" className="seg__btn" aria-pressed={type === t} onClick={() => setType(t)}>
                {t === 'ENTRY' ? 'Entry' : 'Exit'}
              </button>
            ))}
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? <span className="spinner !w-3.5 !h-3.5" /> : <Plus className="w-4 h-4" />}
            Add gate
          </button>
        </div>
      </form>

      {gates.length === 0 ? (
        <section className="card px-6 py-14 text-center">
          <ScanLine className="w-5 h-5 mx-auto text-muted" />
          <p className="mt-3 text-[14px] font-semibold">No gates yet</p>
          <p className="mt-1 text-[13px] text-muted">Add an entry gate above, then share its access code with scanner staff.</p>
        </section>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 stagger">
          {gates.map((gate) => (
            <section key={gate.id} className="card lift p-[18px] flex flex-col">
              <div className="flex items-start gap-3">
                <span className="stat__ico !w-10 !h-10" aria-hidden="true">
                  {gate.type === 'ENTRY' ? <LogIn className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-semibold truncate">{gate.name}</h2>
                  <p className="text-[12.5px] text-muted">
                    {gate.type === 'ENTRY' ? 'Entry gate' : 'Exit gate'} · <span className="num">{gate._count.scanLogs.toLocaleString()}</span> scans
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-tile bg-well p-3.5 flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] text-muted">Scanner access code</p>
                  <p className="text-[22px] font-bold num tracking-[0.12em] select-all">{gate.otpCode}</p>
                </div>
                <button className="ibtn ibtn--sm" onClick={() => copyCode(gate)} aria-label={`Copy access code for ${gate.name}`} title="Copy code">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button className="ibtn ibtn--sm" onClick={() => regenerateOtp(gate.id)} aria-label={`Generate a new access code for ${gate.name}`} title="Generate new code">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
