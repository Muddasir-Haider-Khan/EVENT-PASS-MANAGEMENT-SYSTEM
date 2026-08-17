'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ToastProvider, useToast } from '@/components/Toast';

function EditEventContent() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', venue: '', eventDate: '', description: '',
    primaryColor: '#0F172A', secondaryColor: '#3B82F6', accentColor: '#F59E0B',
    logoUrl: '', logoFileId: '',
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/events/${params.id}`);
        if (res.status === 401) { router.push('/login'); return; }
        const data = await res.json();
        const e = data.event;
        setForm({
          name: e.name, venue: e.venue,
          eventDate: e.eventDate ? new Date(e.eventDate).toISOString().slice(0, 16) : '',
          description: e.description || '',
          primaryColor: e.primaryColor, secondaryColor: e.secondaryColor, accentColor: e.accentColor,
          logoUrl: e.logoUrl || '', logoFileId: e.logoFileId || '',
        });
      } catch { toast('Failed to load event', 'error'); }
      finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/events/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast('Event updated', 'success');
        router.push('/admin');
      } else {
        const data = await res.json();
        toast(data.error || 'Update failed', 'error');
      }
    } catch { toast('Network error', 'error'); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid var(--border-default)', padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/admin')}>← Back</button>
        <h1 className="text-title">Edit Event</h1>
      </header>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 24px' }}>
        <form onSubmit={handleSubmit}>
          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 className="text-title" style={{ marginBottom: 16 }}>Event Details</h3>
            <div style={{ display: 'grid', gap: 16 }}>
              <div>
                <label className="input-label">Event Name</label>
                <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required />
              </div>
              <div>
                <label className="input-label">Venue</label>
                <input className="input" value={form.venue} onChange={(e) => update('venue', e.target.value)} required />
              </div>
              <div>
                <label className="input-label">Event Date</label>
                <input type="datetime-local" className="input" value={form.eventDate} onChange={(e) => update('eventDate', e.target.value)} />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea className="input" rows={3} value={form.description} onChange={(e) => update('description', e.target.value)} style={{ resize: 'vertical' }} />
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 24, marginBottom: 20 }}>
            <h3 className="text-title" style={{ marginBottom: 16 }}>Branding</h3>
            <div>
              <label className="input-label">Logo URL</label>
              <input className="input" value={form.logoUrl} onChange={(e) => update('logoUrl', e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 16 }}>
              <div>
                <label className="input-label">Primary</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                  <input className="input text-mono" value={form.primaryColor} onChange={(e) => update('primaryColor', e.target.value)} style={{ fontSize: 13 }} />
                </div>
              </div>
              <div>
                <label className="input-label">Secondary</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                  <input className="input text-mono" value={form.secondaryColor} onChange={(e) => update('secondaryColor', e.target.value)} style={{ fontSize: 13 }} />
                </div>
              </div>
              <div>
                <label className="input-label">Accent</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="color" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                  <input className="input text-mono" value={form.accentColor} onChange={(e) => update('accentColor', e.target.value)} style={{ fontSize: 13 }} />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={saving}>
            {saving ? <span className="spinner" /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function EditEventPage() {
  return (
    <ToastProvider>
      <EditEventContent />
    </ToastProvider>
  );
}
