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
  participant?: { id: string; entryStatus: string } | null;
}

export default function SubmissionsPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('ALL');
  const [declineTarget, setDeclineTarget] = useState<Submission | null>(null);
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
            Review pending form entries and issue authorized event passes.
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
                {Object.entries(sub.responses).map(([key, value]) => (
                  <div key={key}>
                    <div className="text-overline" style={{ color: 'var(--gold-light)' }}>
                      {key}
                    </div>
                    <div className="text-caption" style={{ color: '#F8FAFC', wordBreak: 'break-word', marginTop: 2 }}>
                      {String(value || 'N/A')}
                    </div>
                  </div>
                ))}
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
    </div>
  );
}
