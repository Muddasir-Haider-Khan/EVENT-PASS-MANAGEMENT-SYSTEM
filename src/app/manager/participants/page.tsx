'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Download, Search, Mail, Clock, Ticket } from 'lucide-react';

interface Participant {
  id: string;
  name: string | null;
  email: string;
  entryStatus: 'NOT_ENTERED' | 'INSIDE' | 'EXITED';
  qrExpired: boolean;
  photoUrl?: string | null;
  participantType?: { id: string; name: string } | null;
  group?: { id: string; name: string } | null;
  lastScanAt: string | null;
  createdAt: string;
}

export default function ParticipantsPage() {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updatingQr, setUpdatingQr] = useState<string | null>(null);

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

  async function handleToggleQr(participantId: string, currentExpiredStatus: boolean) {
    setUpdatingQr(participantId);
    try {
      const res = await fetch(`/api/manager/participants/${participantId}/qr`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrExpired: !currentExpiredStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast(data.error || 'Failed to update pass status', 'error');
        return;
      }
      toast(currentExpiredStatus ? 'Pass re-activated successfully' : 'Pass QR code revoked', 'success');
      loadParticipants(search);
    } catch {
      toast('Network communication error', 'error');
    } finally {
      setUpdatingQr(null);
    }
  }

  const badgeVariantMap: Record<string, 'slate' | 'green' | 'amber'> = {
    NOT_ENTERED: 'slate',
    INSIDE: 'green',
    EXITED: 'amber',
  };

  const labelMap: Record<string, string> = {
    NOT_ENTERED: 'Not Entered',
    INSIDE: 'Inside Venue',
    EXITED: 'Exited Venue',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 antialiased">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            <Users className="w-3.5 h-3.5" />
            <span>Attendee Roster</span>
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight sm:text-3xl mt-0.5">
            Pass Holders ({participants.length})
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time status of all generated digital passes, delegate credentials, and gate access records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            placeholder="Search name, email..."
            leftIcon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64"
          />
          <a href="/api/manager/participants/export" download className="shrink-0">
            <Button
              variant="outline"
              size="md"
              leftIcon={<Download className="w-4 h-4 text-indigo-400" />}
            >
              Export CSV
            </Button>
          </a>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      ) : participants.length === 0 ? (
        <EmptyState
          icon={<Ticket className="w-6 h-6" />}
          title="No Pass Holders Found"
          description="No approved pass holders matched your search criteria."
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <Card variant="glass" padding="none" className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3.5 px-6">Attendee</th>
                    <th className="py-3.5 px-6">Type & Delegation</th>
                    <th className="py-3.5 px-6">Venue Status</th>
                    <th className="py-3.5 px-6">QR Pass Status</th>
                    <th className="py-3.5 px-6">Last Gate Scan</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {p.photoUrl ? (
                            <img
                              src={p.photoUrl}
                              alt={p.name || 'Photo'}
                              className="w-10 h-10 rounded-full object-cover border border-indigo-500/40 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">
                              {(p.name || p.email)[0].toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-semibold text-white">{p.name || '—'}</div>
                            <div className="font-mono text-xs text-indigo-300">{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          {p.participantType && (
                            <span className="inline-block px-2 py-0.5 text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded-md">
                              {p.participantType.name}
                            </span>
                          )}
                          {p.group && (
                            <div className="text-xs text-slate-400 font-medium">
                              Group: {p.group.name}
                            </div>
                          )}
                          {!p.participantType && !p.group && (
                            <span className="text-xs text-slate-500">Standard</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={badgeVariantMap[p.entryStatus]}>
                          {labelMap[p.entryStatus]}
                        </Badge>
                      </td>
                      <td className="py-4 px-6">
                        {p.qrExpired ? (
                          <Badge variant="red">REVOKED / EXPIRED</Badge>
                        ) : (
                          <Badge variant="green">ACTIVE</Badge>
                        )}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {p.lastScanAt ? new Date(p.lastScanAt).toLocaleString() : 'No scan recorded'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant={p.qrExpired ? 'primary' : 'outline'}
                          size="sm"
                          isLoading={updatingQr === p.id}
                          onClick={() => handleToggleQr(p.id, p.qrExpired)}
                        >
                          {p.qrExpired ? 'Activate QR' : 'Revoke QR'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mobile Card Grid View */}
          <div className="md:hidden space-y-3">
            {participants.map((p) => (
              <Card key={p.id} variant="glass" padding="sm" className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {p.photoUrl ? (
                      <img
                        src={p.photoUrl}
                        alt={p.name || 'Photo'}
                        className="w-10 h-10 rounded-full object-cover border border-indigo-500/40 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-400 shrink-0">
                        {(p.name || p.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-white text-sm">
                        {p.name || 'Anonymous Pass Holder'}
                      </h3>
                      <div className="flex items-center gap-1 font-mono text-xs text-indigo-300">
                        <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </div>
                    </div>
                  </div>
                  <Badge variant={badgeVariantMap[p.entryStatus]}>
                    {labelMap[p.entryStatus]}
                  </Badge>
                </div>

                {(p.participantType || p.group) && (
                  <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                    {p.participantType && (
                      <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 font-semibold rounded border border-indigo-500/20">
                        {p.participantType.name}
                      </span>
                    )}
                    {p.group && (
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 font-medium rounded border border-slate-700">
                        {p.group.name}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-2">
                    {p.qrExpired ? (
                      <Badge variant="red" size="sm">REVOKED</Badge>
                    ) : (
                      <Badge variant="green" size="sm">ACTIVE</Badge>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {p.lastScanAt
                        ? new Date(p.lastScanAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'Never'}
                    </span>
                  </div>
                  <Button
                    variant={p.qrExpired ? 'primary' : 'outline'}
                    size="sm"
                    isLoading={updatingQr === p.id}
                    onClick={() => handleToggleQr(p.id, p.qrExpired)}
                  >
                    {p.qrExpired ? 'Activate' : 'Revoke'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

