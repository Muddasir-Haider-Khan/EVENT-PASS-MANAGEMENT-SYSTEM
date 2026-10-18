'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { PageHead, Stat } from '@/components/AppShell';
import { Clock, DoorOpen, Download, Search, Ticket, Trash2, X } from 'lucide-react';

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
  const [statusFilter, setStatusFilter] = useState<'ALL' | Participant['entryStatus']>('ALL');

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

  const counts = {
    ALL: participants.length,
    INSIDE: participants.filter((p) => p.entryStatus === 'INSIDE').length,
    EXITED: participants.filter((p) => p.entryStatus === 'EXITED').length,
    NOT_ENTERED: participants.filter((p) => p.entryStatus === 'NOT_ENTERED').length,
  };
  const visible = statusFilter === 'ALL' ? participants : participants.filter((p) => p.entryStatus === statusFilter);

  return (
    <>
      <PageHead
        title={<>Pass<br />Holders</>}
        stats={
          <>
            <Stat icon={Ticket} value={counts.ALL} label={search ? 'Matching passes' : 'Passes issued'} />
            <Stat icon={DoorOpen} value={counts.INSIDE} label="Inside the venue" />
            <Stat icon={Clock} value={counts.NOT_ENTERED} label="Not arrived yet" />
          </>
        }
      />

      <div className="flex flex-col lg:flex-row lg:items-center gap-3 mb-4">
        <label className="relative lg:w-[320px]">
          <span className="sr-only">Search pass holders</span>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
          <input
            type="search"
            className="input !rounded-full !pl-11"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by entry status">
          {(['ALL', 'INSIDE', 'EXITED', 'NOT_ENTERED'] as const).map((f) => (
            <button key={f} className="chip" aria-pressed={statusFilter === f} onClick={() => setStatusFilter(f)}>
              {f === 'ALL' ? 'All' : ENTRY_LABEL[f]}
              <span className="num opacity-60">{counts[f]}</span>
            </button>
          ))}
        </div>
        <a href="/api/manager/participants/export" download className="btn btn-ghost lg:ml-auto self-start lg:self-auto">
          <Download className="w-4 h-4" /> Export CSV
        </a>
      </div>

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          <div className="skeleton h-14" />
          <div className="skeleton h-14" />
          <div className="skeleton h-14" />
        </div>
      ) : visible.length === 0 ? (
        <section className="card px-6 py-14 text-center">
          <Ticket className="w-5 h-5 mx-auto text-muted" />
          <p className="mt-3 text-[14px] font-semibold">No pass holders found</p>
          <p className="mt-1 text-[13px] text-muted">
            {search || statusFilter !== 'ALL' ? 'Try a different search or filter.' : 'Passes appear here once submissions are approved.'}
          </p>
        </section>
      ) : (
        <section className="card overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Pass holder</th>
                  <th>Category</th>
                  <th>Entry status</th>
                  <th>Last gate activity</th>
                  <th className="!text-right"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Initials name={p.name || p.email} />
                        <span className="min-w-0">
                          <span className="block font-semibold">{p.name || 'Unnamed'}</span>
                          <span className="block text-[12px] text-muted truncate">{p.email}</span>
                        </span>
                      </div>
                    </td>
                    <td>
                      {p.participantType ? <span className="chip">{p.participantType.name}</span> : <span className="text-faint">—</span>}
                      {p.group && <span className="block mt-1 text-[12px] text-muted">{p.group.name}</span>}
                    </td>
                    <td><EntryStatus status={p.entryStatus} /></td>
                    <td className="!text-muted">
                      {p.lastScanAt ? new Date(p.lastScanAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'No scans yet'}
                    </td>
                    <td className="!text-right">
                      <button
                        onClick={() => setDeletingParticipant(p)}
                        className="ibtn ibtn--sm ibtn--plain hover:!text-negative-400"
                        aria-label={`Revoke pass for ${p.name || p.email}`}
                        title="Revoke pass"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <ul className="md:hidden">
            {visible.map((p) => (
              <li key={p.id} className="flex items-start gap-3 p-4 border-b border-line last:border-0">
                <Initials name={p.name || p.email} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{p.name || 'Unnamed'}</p>
                  <p className="text-[12px] text-muted truncate">{p.email}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <EntryStatus status={p.entryStatus} />
                    {p.participantType && <span className="text-[12px] text-muted">{p.participantType.name}</span>}
                  </div>
                </div>
                <button
                  onClick={() => setDeletingParticipant(p)}
                  className="ibtn ibtn--sm ibtn--plain"
                  aria-label={`Revoke pass for ${p.name || p.email}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {deletingParticipant && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="revoke-title">
          <div className="modal">
            <div className="card-head mb-1">
              <h3 id="revoke-title" className="text-headline">Revoke pass</h3>
              <button onClick={() => setDeletingParticipant(null)} className="ibtn ibtn--plain" aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-caption mb-5">
              Remove <b className="text-fg">{deletingParticipant.name || deletingParticipant.email}</b>? Their QR code stops working at every gate immediately.
            </p>
            <div className="flex justify-end gap-2">
              <button className="btn btn-ghost" onClick={() => setDeletingParticipant(null)} disabled={isDeleting}>
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleDeletePassHolder} disabled={isDeleting}>
                {isDeleting && <span className="spinner !w-3.5 !h-3.5" />}
                Revoke pass
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const ENTRY_LABEL: Record<Participant['entryStatus'], string> = {
  NOT_ENTERED: 'Not arrived',
  INSIDE: 'Inside',
  EXITED: 'Checked out',
};

function EntryStatus({ status }: { status: Participant['entryStatus'] }) {
  const dot = status === 'INSIDE' ? 'bg-positive-400' : status === 'EXITED' ? 'bg-caution-400' : 'bg-faint';
  return (
    <span className="inline-flex items-center gap-2 text-[13px] font-semibold">
      <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />
      {ENTRY_LABEL[status]}
    </span>
  );
}

function Initials({ name }: { name: string }) {
  const letters = name
    .split(/[\s.@]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <span className="w-9 h-9 rounded-full bg-surface-2 ring-1 ring-line flex-none flex items-center justify-center text-[12px] font-bold" aria-hidden="true">
      {letters}
    </span>
  );
}
