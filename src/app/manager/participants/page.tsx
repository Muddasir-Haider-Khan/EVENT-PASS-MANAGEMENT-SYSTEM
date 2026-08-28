'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Download, Search, Mail, Clock, Ticket, Trash2, AlertTriangle, X } from 'lucide-react';

interface Participant {
  id: string;
  name: string | null;
  email: string;
  entryStatus: 'NOT_ENTERED' | 'INSIDE' | 'EXITED';
  lastScanAt: string | null;
  createdAt: string;
  participantType?: { id: string; name: string } | null;
  group?: { id: string; name: string } | null;
}

export default function ParticipantsPage() {
  const { toast } = useToast();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingParticipant, setDeletingParticipant] = useState<Participant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  async function handleDeletePassHolder() {
    if (!deletingParticipant) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/manager/participants?id=${deletingParticipant.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast(`Pass holder ${deletingParticipant.name || deletingParticipant.email} deleted successfully.`, 'success');
        setDeletingParticipant(null);
        loadParticipants(search);
      } else {
        const d = await res.json();
        toast(d.error || 'Failed to delete pass holder', 'error');
      }
    } catch {
      toast('Network error deleting pass holder', 'error');
    } finally {
      setIsDeleting(false);
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
    <div className="max-w-7xl mx-auto space-y-6 antialiased pb-12">
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
            Real-time status of generated digital passes, gate access, and pass management.
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
          <Card variant="glass" padding="none" className="hidden md:block overflow-hidden border-slate-800">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="py-3.5 px-6">Attendee Name</th>
                    <th className="py-3.5 px-6">Email Address</th>
                    <th className="py-3.5 px-6">Category / Group</th>
                    <th className="py-3.5 px-6">Venue Entry Status</th>
                    <th className="py-3.5 px-6">Last Gate Activity</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {participants.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6 font-semibold text-white">{p.name || '—'}</td>
                      <td className="py-4 px-6 font-mono text-xs text-indigo-300">{p.email}</td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        <div className="space-y-0.5">
                          {p.participantType && (
                            <span className="inline-block bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded text-[10px] font-medium">
                              {p.participantType.name}
                            </span>
                          )}
                          {p.group && (
                            <span className="block text-[11px] text-indigo-400 font-medium">
                              👥 {p.group.name}
                            </span>
                          )}
                          {!p.participantType && !p.group && <span>—</span>}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <Badge variant={badgeVariantMap[p.entryStatus]}>
                          {labelMap[p.entryStatus]}
                        </Badge>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400">
                        {p.lastScanAt ? new Date(p.lastScanAt).toLocaleString() : 'No scan recorded'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingParticipant(p)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-1"
                          leftIcon={<Trash2 className="w-4 h-4" />}
                        >
                          Delete
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
              <Card key={p.id} variant="glass" padding="sm" className="space-y-3 border-slate-800">
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
                {(p.participantType || p.group) && (
                  <div className="flex flex-wrap gap-1 text-[10px]">
                    {p.participantType && (
                      <span className="bg-slate-900 border border-slate-700 text-slate-300 px-2 py-0.5 rounded">
                        {p.participantType.name}
                      </span>
                    )}
                    {p.group && (
                      <span className="bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded">
                        👥 {p.group.name}
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    {p.lastScanAt
                      ? new Date(p.lastScanAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Never'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingParticipant(p)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-0.5"
                    leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Delete Pass
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* CONFIRMATION DELETE MODAL */}
      {deletingParticipant && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <Card variant="glass" className="max-w-md w-full p-6 border-slate-800 space-y-4 bg-slate-950/95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Confirm Pass Holder Deletion
              </h3>
              <button onClick={() => setDeletingParticipant(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-300">
              <p>
                Are you sure you want to delete pass holder{' '}
                <strong className="text-white">{deletingParticipant.name || deletingParticipant.email}</strong>?
              </p>
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-300 text-[11px]">
                ⚠️ Warning: This will immediately revoke their QR code entry pass. They will no longer be able to scan at gate entry points.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button variant="ghost" onClick={() => setDeletingParticipant(null)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                isLoading={isDeleting}
                onClick={handleDeletePassHolder}
                className="bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20"
              >
                Delete Pass Holder
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
