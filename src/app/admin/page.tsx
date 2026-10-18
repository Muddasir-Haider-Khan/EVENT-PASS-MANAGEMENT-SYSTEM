'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, CalendarDays, Inbox, Mail, Pencil, Plus, Search, Ticket, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/Toast';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PageHead, Stat } from '@/components/AppShell';

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
        const data = await res.json().catch(() => ({}));
        toast(data.error || 'Failed to delete event', 'error');
      }
    } catch {
      toast('Network error while deleting event', 'error');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  const filteredEvents = events.filter(e =>
    (e.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.venue || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (e.slug && e.slug.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (e.eventManager && e.eventManager.loginId && e.eventManager.loginId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalParticipants = events.reduce((s, e) => s + e._count.participants, 0);
  const totalSubmissions = events.reduce((s, e) => s + e._count.submissions, 0);
  const activeEvents = events.filter(e => e.status === 'ACTIVE').length;

  return (
    <>
      <PageHead
        title={<>Event<br />Directory</>}
        stats={
          <>
            <Stat icon={CalendarDays} value={events.length} label="Events configured" badge={activeEvents > 0 ? <span className="badge badge-success">{activeEvents} live</span> : undefined} />
            <Stat icon={Ticket} value={totalParticipants.toLocaleString()} label="Passes issued" />
            <Stat icon={Inbox} value={totalSubmissions.toLocaleString()} label="Registrations received" />
          </>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
        <label className="relative flex-1 sm:max-w-[320px]">
          <span className="sr-only">Search events</span>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-faint pointer-events-none" />
          <input
            type="search"
            className="input !rounded-full !pl-11"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event, venue, slug, manager…"
          />
        </label>
        <span className="text-[13px] text-muted sm:mr-auto">
          {filteredEvents.length} of {events.length} events
        </span>
        <Link href="/admin/events/new" className="btn btn-primary">
          <Plus className="w-4 h-4" /> New event
        </Link>
      </div>

      <section className="card overflow-hidden">
        {loading ? (
          <div className="p-14 flex items-center justify-center gap-3 text-muted text-[13px]">
            <span className="spinner" /> Loading events…
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="px-6 py-14 text-center">
            <CalendarDays className="w-5 h-5 mx-auto text-muted" />
            <p className="mt-3 text-[14px] font-semibold">{searchQuery ? 'No matching events' : 'No events yet'}</p>
            <p className="mt-1 text-[13px] text-muted">
              {searchQuery ? 'Try a different name, venue or slug.' : 'Create the first event to provision a manager account.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>Venue</th>
                  <th>Public link</th>
                  <th>Manager</th>
                  <th className="!text-right">Passes</th>
                  <th>Status</th>
                  <th className="!text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {event.logoUrl ? (
                          <img src={event.logoUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-none" />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-surface-2 ring-1 ring-line flex items-center justify-center font-bold text-[13px] flex-none">
                            {event.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <span className="min-w-0">
                          <span className="block font-semibold">{event.name}</span>
                          <span className="block text-[12px] text-muted">Created {new Date(event.createdAt).toLocaleDateString([], { dateStyle: 'medium' })}</span>
                        </span>
                      </div>
                    </td>
                    <td className="!text-muted">{event.venue}</td>
                    <td>
                      {event.slug ? (
                        <a href={`/event/${event.slug}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline underline-offset-2 decoration-line-2 hover:decoration-fg">
                          /{event.slug}
                          <ArrowUpRight className="w-3.5 h-3.5 text-muted" />
                        </a>
                      ) : (
                        <span className="text-faint">Not published</span>
                      )}
                    </td>
                    <td>
                      <span className="block num">{event.eventManager?.loginId || 'Unassigned'}</span>
                      {event.eventManager?.contactEmail && (
                        <span className="block text-[12px] text-muted">{event.eventManager.contactEmail}</span>
                      )}
                    </td>
                    <td className="!text-right num font-semibold">{event._count.participants.toLocaleString()}</td>
                    <td>
                      <span className={`chip ${event.status === 'ACTIVE' ? '' : '!text-muted'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${event.status === 'ACTIVE' ? 'bg-positive-400' : 'bg-faint'}`} aria-hidden="true" />
                        {event.status === 'ACTIVE' ? 'Active' : 'Archived'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1.5">
                        {event.eventManager && (
                          <button
                            className="btn btn-ghost btn-sm"
                            disabled={resendingId === event.id}
                            onClick={() => handleResendCredentials(event)}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            {resendingId === event.id ? 'Sending…' : 'Resend login'}
                          </button>
                        )}
                        <Link href={`/admin/events/${event.id}`} className="ibtn ibtn--sm ibtn--plain" aria-label={`Edit ${event.name}`} title="Edit">
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          className="ibtn ibtn--sm ibtn--plain hover:!text-negative-400"
                          aria-label={`Delete ${event.name}`}
                          title="Delete"
                          onClick={() => setDeleteTarget(event)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {resendResult && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="resend-title">
          <div className="modal">
            <div className="card-head mb-1">
              <h3 id="resend-title" className="text-headline">New manager login</h3>
              <button className="ibtn ibtn--plain" onClick={() => setResendResult(null)} aria-label="Close">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-caption mb-5">
              A fresh password was generated for <b className="text-fg">{resendResult.eventName}</b>. The previous password no longer works.
            </p>

            <dl className="rounded-tile bg-well p-4 space-y-3 mb-4">
              <div>
                <dt className="text-[12px] text-muted">Login ID</dt>
                <dd className="text-[15px] font-semibold num select-all">{resendResult.loginId}</dd>
              </div>
              <div>
                <dt className="text-[12px] text-muted">Password</dt>
                <dd className="text-[15px] font-semibold num select-all">{resendResult.password}</dd>
              </div>
            </dl>

            <p className={`text-[13px] mb-5 flex gap-2 ${resendResult.emailSent ? 'text-muted' : 'text-caution-400'}`}>
              {resendResult.emailSent ? (
                <>Sent to <b className="text-fg">{resendResult.email}</b>.</>
              ) : (
                <>Email could not be sent ({resendResult.emailError || 'sender domain not verified'}). Share these credentials securely.</>
              )}
            </p>

            <button className="btn btn-primary w-full" onClick={() => setResendResult(null)}>
              Done
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete event"
        message={`Delete "${deleteTarget?.name}"? Every submission, pass and gate key for this event is removed permanently.`}
        confirmLabel="Delete event"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </>
  );
}
