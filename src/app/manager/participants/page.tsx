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
            Real-time status of all generated digital passes and gate access records.
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
                    <th className="py-3.5 px-6">Attendee Name</th>
                    <th className="py-3.5 px-6">Email Address</th>
                    <th className="py-3.5 px-6">Venue Entry Status</th>
                    <th className="py-3.5 px-6">Last Gate Activity</th>
                    <th className="py-3.5 px-6">Issued Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6 font-semibold text-white">{p.name || '—'}</td>
                      <td className="py-4 px-6 font-mono text-xs text-indigo-300">{p.email}</td>
                      <td className="py-4 px-6">
                        <Badge variant={badgeVariantMap[p.entryStatus]}>
                          {labelMap[p.entryStatus]}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {p.lastScanAt ? new Date(p.lastScanAt).toLocaleString() : 'No scan recorded'}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {new Date(p.createdAt).toLocaleDateString()}
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
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-white text-base">
                    {p.name || 'Anonymous Pass Holder'}
                  </h3>
                  <Badge variant={badgeVariantMap[p.entryStatus]}>
                    {labelMap[p.entryStatus]}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-indigo-300">
                  <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{p.email}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {p.lastScanAt
                      ? new Date(p.lastScanAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Never'}
                  </span>
                  <span>Issued: {new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
