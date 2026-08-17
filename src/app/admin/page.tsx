'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToastProvider, useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';

interface EventItem {
  id: string;
  name: string;
  venue: string;
  eventDate: string | null;
  slug: string | null;
  status: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string | null;
  createdAt: string;
  eventManager: { loginId: string; contactEmail: string } | null;
  _count: { participants: number; submissions: number };
}

function AdminDashboardContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function loadEvents() {
    try {
      const res = await fetch('/api/admin/events');
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      setEvents(data.events || []);
    } catch { toast('Failed to load events', 'error'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadEvents(); }, []);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/events/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Event deleted', 'success');
        setEvents(events.filter(e => e.id !== deleteTarget.id));
      } else {
        toast('Failed to delete event', 'error');
      }
    } catch { toast('Network error', 'error'); }
    finally { setDeleting(false); setDeleteTarget(null); }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const totalParticipants = events.reduce((s, e) => s + e._count.participants, 0);
  const activeEvents = events.filter(e => e.status === 'ACTIVE').length;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border-default)', padding: '14px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span className="text-overline" style={{ color: 'var(--text-muted)' }}>EPMS</span>
          <h1 className="text-title" style={{ marginTop: 2 }}>Super Admin</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-primary btn-sm" onClick={() => router.push('/admin/events/new')}>
            + New Event
          </button>
          <button className="btn btn-ghost btn-sm" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div className="card" style={{ padding: 20 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Total Events</div>
            <div className="text-display text-mono" style={{ marginTop: 4 }}>{events.length}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Active</div>
            <div className="text-display text-mono" style={{ color: 'var(--success)', marginTop: 4 }}>{activeEvents}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Total Participants</div>
            <div className="text-display text-mono" style={{ marginTop: 4 }}>{totalParticipants}</div>
          </div>
        </div>

        {/* Events Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-default)' }}>
            <h2 className="text-title">Events</h2>
          </div>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : events.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              No events yet. Create your first event to get started.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Venue</th>
                    <th>Slug</th>
                    <th>Manager</th>
                    <th>Participants</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => (
                    <tr key={event.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: event.secondaryColor, flexShrink: 0 }} />
                          <span style={{ fontWeight: 500 }}>{event.name}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>{event.venue}</td>
                      <td>
                        {event.slug ? (
                          <span className="text-mono" style={{ fontSize: 12, color: 'var(--info)' }}>
                            {event.slug}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-dim)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <span className="text-mono" style={{ fontSize: 12 }}>
                          {event.eventManager?.loginId || '—'}
                        </span>
                      </td>
                      <td className="text-mono">{event._count.participants}</td>
                      <td>
                        <span className={`badge ${event.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}`}>
                          {event.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => router.push(`/admin/events/${event.id}`)}>
                            Edit
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }} onClick={() => setDeleteTarget(event)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event"
        message={`This will permanently delete "${deleteTarget?.name}" and all its data (submissions, participants, gates, form fields). This cannot be undone.`}
        confirmLabel="Delete Event"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}

export default function AdminPage() {
  return (
    <ToastProvider>
      <AdminDashboardContent />
    </ToastProvider>
  );
}
