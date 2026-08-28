'use client';

import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';

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

  const loadSubmissions = useCallback(async () => {
    try {
      const res = await fetch('/api/manager/submissions');
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data.submissions || []);
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

  const filtered = filter === 'ALL' ? submissions : submissions.filter((s) => s.status === filter);

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--gold-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <span className="text-overline" style={{ color: 'var(--gold-light)' }}>27 MEDIA AGENCY • SUBMISSION TRIAGE</span>
          <h1 className="text-headline gold-gradient-text" style={{ marginTop: 4 }}>
            Attendee Registrations
          </h1>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Review pending form entries, delete obsolete entries, or issue authorized event passes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['ALL', 'PENDING', 'APPROVED', 'DECLINED'].map((f) => {
            const count = f === 'ALL' ? submissions.length : submissions.filter((s) => s.status === f).length;
            const active = filter === f;
            return (
              <button
                key={f}
                className={`btn btn-sm ${active ? 'btn-gold' : 'btn-ghost'}`}
                onClick={() => setFilter(f)}
              >
                {f} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📥</div>
          No registration submissions found {filter !== 'ALL' && `matching status "${filter}"`}.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {filtered.map((sub) => (
            <div key={sub.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div className="text-mono" style={{ fontSize: 16, fontWeight: 600, color: '#F8FAFC' }}>
                    {sub.email}
                  </div>
                  <div className="text-caption" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                    Submitted on {new Date(sub.submittedAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    className={`badge ${
                      sub.status === 'PENDING'
                        ? 'badge-warning'
                        : sub.status === 'APPROVED'
                        ? 'badge-gold'
                        : 'badge-error'
                    }`}
                  >
                    {sub.status}
                  </span>

                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: '#EF4444', padding: '4px 8px', fontSize: 12 }}
                    onClick={() => setDeleteTarget(sub)}
                    title="Delete Submission"
                    disabled={processing === sub.id}
                  >
                    🗑 Delete
                  </button>
                </div>
              </div>

              {/* Submitted Answers Grid */}
              <div
                className="card-elevated"
                style={{
                  padding: 16,
                  marginBottom: 16,
                  borderRadius: 10,
                  border: '1px solid var(--border-default)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: 12,
                }}
              >
                {Object.entries(sub.responses).map(([key, value]) => {
                  if (key === 'groupMembers' && Array.isArray(value)) {
                    return (
                      <div key={key} style={{ gridColumn: '1 / -1' }}>
                        <div className="text-overline" style={{ color: 'var(--gold-light)', marginBottom: 6 }}>
                          DELEGATION MEMBERS ({value.length})
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                          {(value as Array<Record<string, unknown>>).map((m, idx) => (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                              <div style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>
                                {String(m.name || 'Member')} {m.isLeader ? '⭐ (Leader)' : ''}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{String(m.email || '')}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }

                  let displayVal = 'N/A';
                  if (typeof value === 'object' && value !== null) {
                    displayVal = JSON.stringify(value);
                  } else if (value !== undefined && value !== null) {
                    displayVal = String(value);
                  }

                  return (
                    <div key={key}>
                      <div className="text-overline" style={{ color: 'var(--gold-light)' }}>
                        {key}
                      </div>
                      <div className="text-caption" style={{ color: '#F8FAFC', wordBreak: 'break-word', marginTop: 2 }}>
                        {displayVal}
                      </div>
                    </div>
                  );
                })}
              </div>

              {sub.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-gold btn-sm"
                    onClick={() => handleApprove(sub.id)}
                    disabled={processing === sub.id}
                  >
                    {processing === sub.id ? <span className="spinner" style={{ borderTopColor: '#070709', width: 14, height: 14 }} /> : '✓ Approve & Issue Pass'}
                  </button>

                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--error)' }}
                    onClick={() => setDeclineTarget(sub)}
                    disabled={processing === sub.id}
                  >
                    ✕ Decline Submission
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decline Dialog */}
      <ConfirmDialog
        open={!!declineTarget}
        title="Decline Registration"
        message={`Are you sure you want to decline the submission for ${declineTarget?.email}?`}
        confirmLabel="Decline Registration"
        variant="danger"
        onConfirm={handleDecline}
        onCancel={() => setDeclineTarget(null)}
        loading={!!processing}
      />

      {/* Delete Submission Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Registration Submission"
        message={`Are you sure you want to delete the submission for ${deleteTarget?.email}? This will permanently remove the submission record.`}
        confirmLabel="Delete Submission"
        variant="danger"
        onConfirm={handleDeleteSubmission}
        onCancel={() => setDeleteTarget(null)}
        loading={!!processing}
      />
    </div>
  );
}
