'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ToastProvider, useToast } from '@/components/Toast';

function CreateEventContent() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', venue: '', eventDate: '', description: '',
    primaryColor: '#0F172A', secondaryColor: '#3B82F6', accentColor: '#F59E0B',
    managerEmail: '', logoUrl: '', logoFileId: '',
  });
  const [credentials, setCredentials] = useState<{ loginId: string; password: string } | null>(null);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        toast(data.error || 'Failed to create event', 'error');
        return;
      }

      setCredentials(data.managerCredentials);
      toast('Event created successfully', 'success');
    } catch { toast('Network error', 'error'); }
    finally { setLoading(false); }
  }

  if (credentials) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="card" style={{ maxWidth: 500, width: '100%', padding: 32 }}>
          <div style={{ marginBottom: 20 }}>
            <span className="badge badge-success" style={{ marginBottom: 8 }}>✓ Event Created</span>
            <h2 className="text-headline">Manager Credentials</h2>
            <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
              These credentials have been emailed to {form.managerEmail}. Save them now — the password won&apos;t be shown again.
            </p>
          </div>

          <div className="card-elevated" style={{ padding: 20, marginBottom: 24 }}>
            <div style={{ marginBottom: 12 }}>
              <span className="text-overline" style={{ color: 'var(--text-muted)' }}>Login ID</span>
              <div className="text-mono" style={{ fontSize: 16, marginTop: 4 }}>{credentials.loginId}</div>
            </div>
            <div>
              <span className="text-overline" style={{ color: 'var(--text-muted)' }}>Temporary Password</span>
              <div className="text-mono" style={{ fontSize: 16, marginTop: 4 }}>{credentials.password}</div>
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => router.push('/admin')}>
            ← Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid var(--border-default)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/admin')}>← Back</button>
        <h1 className="text-title">Create Event</h1>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
        <form onSubmit={handleSubmit}>
          {/* Event Details */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 className="text-title" style={{ marginBottom: 16 }}>Event Details</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label className="input-label">Event Name *</label>
                <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required placeholder="e.g. LYMUN 2026" />
              </div>
              <div>
                <label className="input-label">Venue *</label>
                <input className="input" value={form.venue} onChange={(e) => update('venue', e.target.value)} required placeholder="e.g. Grand Ballroom, Marriott" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="input-label">Event Date</label>
                  <input type="datetime-local" className="input" value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)} />
                </div>
                <div>
                  <label className="input-label">Manager Email *</label>
                  <input type="email" className="input" value={form.managerEmail} onChange={(e) => update('managerEmail', e.target.value)} required placeholder="manager@example.com" />
                </div>
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="Optional event description..." style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 className="text-title" style={{ marginBottom: 16 }}>Branding</h3>
            <div>
              <label className="input-label">Logo URL</label>
              <input className="input" value={form.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} placeholder="https://ik.imagekit.io/..." />
              <p className="text-caption" style={{ color: 'var(--text-dim)', marginTop: 4 }}>Upload your logo to ImageKit and paste the URL here</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
              <div>
                <label className="input-label">Primary Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                  <input className="input text-mono" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} style={{ fontSize: 13 }} />
                </div>
              </div>
              <div>
                <label className="input-label">Secondary Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                  <input className="input text-mono" value={form.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} style={{ fontSize: 13 }} />
                </div>
              </div>
              <div>
                <label className="input-label">Accent Color</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                  <input className="input text-mono" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} style={{ fontSize: 13 }} />
                </div>
              </div>
            </div>
            {/* Preview */}
            <div style={{ marginTop: 16, padding: 16, borderRadius: 8, background: form.primaryColor, display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 20, height: 20, borderRadius: 4, background: form.secondaryColor }} />
              <div style={{ width: 20, height: 20, borderRadius: 4, background: form.accentColor }} />
              <span style={{ color: '#fff', fontSize: 13, marginLeft: 8, opacity: 0.8 }}>Preview</span>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
            {loading ? <span className="spinner" /> : 'Create Event & Send Credentials →'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function CreateEventPage() {
  return (
    <ToastProvider>
      <CreateEventContent />
    </ToastProvider>
  );
}
