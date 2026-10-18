'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHead, Stat } from '@/components/AppShell';
import { Check, CheckCircle2, Clock, Inbox, Trash2, XCircle } from 'lucide-react';

interface Submission {
  id: string;
  email: string;
  responses: Record<string, unknown>;
  status: 'PENDING' | 'APPROVED' | 'DECLINED';
  submittedAt: string;
  participants?: Array<{ id: string; entryStatus: string }> | null;
}

export default function SubmissionsPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [declineTarget, setDeclineTarget] = useState<Submission | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [fieldLabels, setFieldLabels] = useState<Record<string, string>>({});

  const loadSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
        setFieldLabels(data.fieldLabels || {});
      }
    } catch {
      toast('Failed to load submissions', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  async function handleApprove(id: string) {
    setProcessing(id);
    try {
      const res = await fetch(`/api/manager/submissions/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        toast('Submission approved — Pass & QR generated', 'success');
        loadSubmissions();
      } else {
        const data = await res.json();
        toast(data.error || 'Approve failed', 'error');
      }
    } catch {
      toast('Network error while approving', 'error');
    } finally {
      setProcessing(null);
    }
  }

  async function handleDecline() {
    if (!declineTarget) return;
    setProcessing(declineTarget.id);
    try {
      const res = await fetch(`/api/manager/submissions/${declineTarget.id}/decline`, { method: 'POST' });
      if (res.ok) {
        toast('Submission declined', 'success');
        loadSubmissions();
      } else {
        const data = await res.json();
        toast(data.error || 'Decline failed', 'error');
      }
    } catch {
      toast('Network error while declining', 'error');
    } finally {
      setProcessing(null);
      setDeclineTarget(null);
    }
  }

  async function handleDeleteSubmission() {
    if (!deleteTarget) return;
    setProcessing(deleteTarget.id);
    try {
      const res = await fetch(`/api/manager/submissions?id=${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Submission deleted successfully', 'success');
        loadSubmissions();
      } else {
        const data = await res.json();
        toast(data.error || 'Delete failed', 'error');
      }
    } catch {
      toast('Network error while deleting submission', 'error');
    } finally {
      setProcessing(null);
      setDeleteTarget(null);
    }
  }

  // Pending first so the review queue never hides below already-decided records
  const STATUS_ORDER: Record<string, number> = { PENDING: 0, APPROVED: 1, DECLINED: 2 };
  const filtered = (filter === 'ALL' ? submissions : submissions.filter((s) => s.status === filter))
    .slice()
    .sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  const countOf = (st: string) => (st === 'ALL' ? submissions.length : submissions.filter((s) => s.status === st).length);

  if (loading) {
    return (
      <div className="p-14 flex items-center justify-center gap-3 text-muted text-[13px]">
        <span className="spinner" /> Loading submissions…
      </div>
    );
  }

  return (
    <>
      <PageHead
        title={<>Registration<br />Submissions</>}
        stats={
          <>
            <Stat icon={Clock} value={countOf('PENDING')} label="Awaiting review" />
            <Stat icon={CheckCircle2} value={countOf('APPROVED')} label="Approved, pass issued" />
            <Stat icon={XCircle} value={countOf('DECLINED')} label="Declined" />
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="seg" role="group" aria-label="Filter by status">
          {(['ALL', 'PENDING', 'APPROVED', 'DECLINED'] as const).map((f) => (
            <button key={f} className="seg__btn" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {STATUS_LABEL[f]} <span className="num opacity-60 ml-1">{countOf(f)}</span>
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <section className="card px-6 py-14 text-center">
          <Inbox className="w-5 h-5 mx-auto text-muted" />
          <p className="mt-3 text-[14px] font-semibold">No submissions{filter !== 'ALL' && ` marked ${STATUS_LABEL[filter].toLowerCase()}`}</p>
          <p className="mt-1 text-[13px] text-muted">New registrations from the public form appear here.</p>
        </section>
      ) : (
        <section className="card overflow-hidden">
          <ul>
            {filtered.map((sub) => {
              const members = Array.isArray(sub.responses.groupMembers)
                ? (sub.responses.groupMembers as Array<Record<string, unknown>>)
                : null;
              const answers = Object.entries(sub.responses).filter(([key]) => key !== 'groupMembers');
              return (
                <li key={sub.id} className="p-[18px] border-b border-line last:border-0">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-semibold break-all">{sub.email}</p>
                      <p className="text-[12.5px] text-muted mt-0.5">
                        Submitted {new Date(sub.submittedAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                    <span className={`badge ${STATUS_BADGE[sub.status]}`}>{STATUS_LABEL[sub.status]}</span>
                    <button
                      className="ibtn ibtn--sm ibtn--plain hover:!text-negative-400"
                      onClick={() => setDeleteTarget(sub)}
                      aria-label={`Delete submission from ${sub.email}`}
                      title="Delete"
                      disabled={processing === sub.id}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {answers.length > 0 && (
                    <dl className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-x-6 gap-y-2.5 rounded-tile bg-well px-4 py-3">
                      {answers.map(([key, value]) => (
                        <div key={key} className="min-w-0">
                          <dt className="text-[12px] text-muted">{fieldLabels[key] || humanizeKey(key)}</dt>
                          <dd className="text-[13.5px] break-words">
                            {value === undefined || value === null || value === ''
                              ? '—'
                              : typeof value === 'object'
                              ? JSON.stringify(value)
                              : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  )}

                  {members && (
                    <div className="mt-3">
                      <p className="text-[12px] text-muted mb-2">Delegation members · {members.length}</p>
                      <div className="flex flex-wrap gap-2">
                        {members.map((m, idx) => (
                          <span key={idx} className="inline-flex flex-col rounded-[14px] border border-line bg-surface px-3 py-2">
                            <span className="text-[13px] font-semibold">
                              {String(m.name || 'Member')}
                              {m.isLeader ? <span className="text-muted font-medium"> · Leader</span> : null}
                            </span>
                            <span className="text-[12px] text-muted">{String(m.email || '')}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {sub.status === 'PENDING' && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <button className="btn btn-primary btn-sm" onClick={() => handleApprove(sub.id)} disabled={processing === sub.id}>
                        {processing === sub.id ? <span className="spinner !w-3.5 !h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                        Approve and issue pass
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => setDeclineTarget(sub)} disabled={processing === sub.id}>
                        Decline
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ConfirmDialog
        open={!!declineTarget}
        title="Decline registration"
        message={`Decline the submission from ${declineTarget?.email}? No pass will be issued.`}
        confirmLabel="Decline"
        variant="danger"
        onConfirm={handleDecline}
        onCancel={() => setDeclineTarget(null)}
        loading={!!processing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete submission"
        message={`Delete the submission from ${deleteTarget?.email}? The record is removed permanently.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDeleteSubmission}
        onCancel={() => setDeleteTarget(null)}
        loading={!!processing}
      />
    </>
  );
}

const STATUS_LABEL: Record<string, string> = {
  ALL: 'All',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  DECLINED: 'Declined',
};

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-warning',
  APPROVED: 'badge-success',
  DECLINED: 'badge-error',
};

/** Response keys are field labels or camelCase ids — make them readable. */
function humanizeKey(key: string) {
  const spaced = key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
