'use client';

import { useEffect, useState } from 'react';
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

  async function load() {
    const res = await fetch('/api/manager/submissions');
    if (res.ok) {
      const data = await res.json();
      setSubmissions(data.submissions);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(id: string) {
    setProcessing(id);
    try {
      const res = await fetch(`/api/manager/submissions/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        toast('Submission approved — QR pass sent', 'success');
        load();
      } else {
        const data = await res.json();
        toast(data.error || 'Approve failed', 'error');
      }
    } catch { toast('Network error', 'error'); }
    finally { setProcessing(null); }
  }

  async function handleDecline() {
    if (!declineTarget) return;
    setProcessing(declineTarget.id);
    try {
      const res = await fetch(`/api/manager/submissions/${declineTarget.id}/decline`, { method: 'POST' });
      if (res.ok) {
        toast('Submission declined', 'success');
        load();
      } else {
        const data = await res.json();
        toast(data.error || 'Decline failed', 'error');
      }
    } catch { toast('Network error', 'error'); }
    finally { setProcessing(null); setDeclineTarget(null); }
  }

  const filtered = filter === 'ALL' ? submissions : submissions.filter(s => s.status === filter);

  if (loading) return <div style={{ padding: 24 }}><div className="spinner" /></div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="text-headline">Submissions</h1>
        <div style={{ display: 'flex', gap: 6 }}>
          {['ALL', 'PENDING', 'APPROVED', 'DECLINED'].map((f) => (
            <button
              key={f}
              className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setFilter(f)}
            >
              {f} {f !== 'ALL' && `(${submissions.filter(s => s.status === f).length})`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
          No submissions {filter !== 'ALL' ? `with status "${filter}"` : 'yet'}
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filtered.map((sub) => (
            <div key={sub.id} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span className="text-mono" style={{ fontSize: 14, fontWeight: 500 }}>{sub.email}</span>
                  <div className="text-caption" style={{ color: 'var(--text-muted)', marginTop: 2 }}>
                    {new Date(sub.submittedAt).toLocaleString()}
                  </div>
                </div>
                <span className={`badge ${
                  sub.status === 'PENDING' ? 'badge-warning' :
                  sub.status === 'APPROVED' ? 'badge-success' : 'badge-error'
                }`}>
                  {sub.status}
                </span>
              </div>

              {/* Show responses */}
              <div className="card-elevated" style={{ padding: 12, marginBottom: 12 }}>
                {Object.entries(sub.responses).map(([key, value]) => (
                  <div key={key} style={{ marginBottom: 6 }}>
                    <span className="text-caption" style={{ color: 'var(--text-muted)' }}>{key}: </span>
                    <span className="text-caption" style={{ color: 'var(--text-primary)' }}>{String(value)}</span>
                  </div>
                ))}
              </div>

              {sub.status === 'PENDING' && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleApprove(sub.id)}
                    disabled={processing === sub.id}
                  >
                    {processing === sub.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '✓ Approve'}
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ color: 'var(--error)' }}
                    onClick={() => setDeclineTarget(sub)}
                    disabled={processing === sub.id}
                  >
                    ✕ Decline
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!declineTarget}
        title="Decline Submission"
        message={`Are you sure you want to decline the submission from ${declineTarget?.email}? A notification email will be sent.`}
        confirmLabel="Decline"
        variant="danger"
        onConfirm={handleDecline}
        onCancel={() => setDeclineTarget(null)}
        loading={!!processing}
      />
    </div>
  );
}
