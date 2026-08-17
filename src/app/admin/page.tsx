'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<EventItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [resendingId, setResendingId] = useState<string | null>(null);
  const [resendResult, setResendResult] = useState<{
    eventName: string;
    email: string;
    loginId: string;
    password: string;
    emailSent: boolean;
    emailError?: string | null;
  } | null>(null);

  const loadEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/events');
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      setEvents(data.events || []);
    } catch {
      toast('Failed to load events', 'error');
    } finally {
      setLoading(false);
    }
  }, [router, toast]);

  async function handleResendCredentials(event: EventItem) {
    setResendingId(event.id);
    try {
      const res = await fetch(`/api/admin/events/${event.id}/resend-credentials`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setResendResult({
          eventName: event.name,
          email: data.managerCredentials.email,
          loginId: data.managerCredentials.loginId,
          password: data.managerCredentials.password,
          emailSent: data.emailSent,
          emailError: data.emailError,
        });
        toast(data.emailSent ? 'Credentials email sent to manager' : 'Credentials updated (email notice shown)', data.emailSent ? 'success' : 'info');
      } else {
        toast(data.error || 'Failed to resend credentials', 'error');
      }
    } catch {
      toast('Network error while sending email', 'error');
    } finally {
      setResendingId(null);
    }
  }

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/events/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        toast('Event deleted successfully', 'success');
        setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
      } else {
        toast('Failed to delete event', 'error');
      }
    } catch {
      toast('Network error while deleting event', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const filteredEvents = events.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.slug && e.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.eventManager && e.eventManager.loginId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalParticipants = events.reduce((s, e) => s + e._count.participants, 0);
  const totalSubmissions = events.reduce((s, e) => s + e._count.submissions, 0);
  const activeEvents = events.filter(e => e.status === 'ACTIVE').length;

  return (
    <div style={{ padding: '32px 28px', maxWidth: 1300, margin: '0 auto' }}>
      {/* Top Banner Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 32,
          paddingBottom: 20,
          borderBottom: '1px solid var(--border-default)',
        }}
      >
        <div>
          <div className="text-overline" style={{ color: 'var(--gold-light)', letterSpacing: '0.12em' }}>
            27 MEDIA AGENCY • SUPER ADMIN PORTAL
          </div>
          <h1 className="text-display gold-gradient-text" style={{ marginTop: 4 }}>
            Event Pass Management
          </h1>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
            Monitor events, assign manager accounts, and oversee pass issuance across all active shows.
          </p>
        </div>

        <button className="btn btn-gold" onClick={() => router.push('/admin/events/new')}>
          + Create New Event
        </button>
      </div>

      {/* Analytics KPI Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
        <div className="card card-gold-glow" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-overline" style={{ color: 'var(--text-muted)' }}>Total Events</span>
            <span style={{ fontSize: 18 }}>🎫</span>
          </div>
          <div className="text-display text-mono" style={{ marginTop: 8, color: '#F8FAFC' }}>
            {events.length}
          </div>
        </div>

        <div className="card card-gold-glow" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-overline" style={{ color: 'var(--text-muted)' }}>Active Events</span>
            <span style={{ fontSize: 18 }}>🟢</span>
          </div>
          <div className="text-display text-mono" style={{ marginTop: 8, color: 'var(--success)' }}>
            {activeEvents}
          </div>
        </div>

        <div className="card card-gold-glow" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-overline" style={{ color: 'var(--text-muted)' }}>Pass Holders</span>
            <span style={{ fontSize: 18 }}>🎟️</span>
          </div>
          <div className="text-display text-mono" style={{ marginTop: 8, color: 'var(--gold-light)' }}>
            {totalParticipants}
          </div>
        </div>

        <div className="card card-gold-glow" style={{ padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-overline" style={{ color: 'var(--text-muted)' }}>Total Form Submissions</span>
            <span style={{ fontSize: 18 }}>📥</span>
          </div>
          <div className="text-display text-mono" style={{ marginTop: 8, color: '#F8FAFC' }}>
            {totalSubmissions}
          </div>
        </div>
      </div>

      {/* Events Control Panel */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div>
            <h2 className="text-title" style={{ color: '#F8FAFC' }}>
              Master Event Roster
            </h2>
            <span className="text-caption" style={{ color: 'var(--text-muted)' }}>
              Showing {filteredEvents.length} of {events.length} configured events
            </span>
          </div>

          <div style={{ maxWidth: 300, width: '100%' }}>
            <input
              type="text"
              className="input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event, venue, slug..."
              style={{ height: 38, fontSize: 13 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--gold-primary)' }} />
            <div style={{ marginTop: 12, fontSize: 13, color: 'var(--text-muted)' }}>Loading events...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎪</div>
            {searchQuery ? 'No events matched your search query.' : 'No events created yet. Click "+ Create New Event" to get started.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event Name & Branding</th>
                  <th>Venue & Location</th>
                  <th>Public Link Slug</th>
                  <th>Assigned Manager</th>
                  <th>Pass Holders</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {event.logoUrl ? (
                          <img
                            src={event.logoUrl}
                            alt=""
                            style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-default)' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 8,
                              background: 'var(--gold-gradient)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#070709',
                              fontWeight: 800,
                              fontSize: 14,
                            }}
                          >
                            {event.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div style={{ fontWeight: 600, color: '#F8FAFC' }}>{event.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            ID: {event.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{event.venue}</td>
                    <td>
                      {event.slug ? (
                        <a
                          href={`/event/${event.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-mono"
                          style={{ fontSize: 12, color: 'var(--gold-light)', textDecoration: 'none' }}
                        >
                          /{event.slug} ↗
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-dim)' }}>Draft</span>
                      )}
                    </td>
                    <td>
                      <div className="text-mono" style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                        {event.eventManager?.loginId || 'Unassigned'}
                      </div>
                      {event.eventManager?.contactEmail && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {event.eventManager.contactEmail}
                        </div>
                      )}
                    </td>
                    <td className="text-mono" style={{ fontWeight: 600, color: 'var(--gold-light)' }}>
                      {event._count.participants}
                    </td>
                    <td>
                      <span className={`badge ${event.status === 'ACTIVE' ? 'badge-gold' : 'badge-neutral'}`}>
                        {event.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {event.eventManager && (
                          <button
                            className="btn btn-ghost btn-sm"
                            style={{ color: 'var(--gold-light)' }}
                            disabled={resendingId === event.id}
                            onClick={() => handleResendCredentials(event)}
                          >
                            {resendingId === event.id ? 'Sending...' : '✉️ Resend Email'}
                          </button>
                        )}
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => router.push(`/admin/events/${event.id}`)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--error)' }}
                          onClick={() => setDeleteTarget(event)}
                        >
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

      {resendResult && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
          <div className="card card-gold-glow" style={{ maxWidth: 500, width: '100%', padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <span className="badge badge-gold">Manager Credentials</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setResendResult(null)}>✕</button>
            </div>
            <h3 className="text-headline gold-gradient-text" style={{ fontSize: 18, marginBottom: 4 }}>
              Credentials Dispatched
            </h3>
            <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
              Credentials for <strong>{resendResult.eventName}</strong> assigned to <strong>{resendResult.email}</strong>.
            </p>

            <div className="card-elevated" style={{ padding: 18, marginBottom: 16 }}>
              <div style={{ marginBottom: 14 }}>
                <span className="text-overline" style={{ color: 'var(--gold-light)' }}>Manager Login ID</span>
                <div className="text-mono" style={{ fontSize: 16, marginTop: 2, color: '#F8FAFC', fontWeight: 600 }}>
                  {resendResult.loginId}
                </div>
              </div>
              <div>
                <span className="text-overline" style={{ color: 'var(--gold-light)' }}>New System Password</span>
                <div className="text-mono" style={{ fontSize: 16, marginTop: 2, color: '#F8FAFC', fontWeight: 600 }}>
                  {resendResult.password}
                </div>
              </div>
            </div>

            {resendResult.emailSent ? (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ADE80', fontSize: 12, marginBottom: 20 }}>
                ✅ Email successfully sent to <strong>{resendResult.email}</strong> via Resend API.
              </div>
            ) : (
              <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#FACC15', fontSize: 12, marginBottom: 20 }}>
                ⚠️ Notice: {resendResult.emailError || 'Resend requires verified domain'}. Please copy credentials manually above.
              </div>
            )}

            <button className="btn btn-gold" style={{ width: '100%', height: 40 }} onClick={() => setResendResult(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? All associated submissions, passes, and gate access keys will be permanently removed.`}
        confirmLabel="Delete Event"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
