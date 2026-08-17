'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { ImageUpload } from '@/components/ImageUpload';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    venue: '',
    eventDate: '',
    description: '',
    primaryColor: '#070709',
    secondaryColor: '#D4AF37',
    accentColor: '#E5C158',
    logoUrl: '',
    logoFileId: '',
  });

  const loadEvent = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/events/${params.id}`);
      if (res.status === 401) { router.push('/login'); return; }
      const data = await res.json();
      const e = data.event;
      setForm({
        name: e.name,
        venue: e.venue,
        eventDate: e.eventDate ? new Date(e.eventDate).toISOString().slice(0, 16) : '',
        description: e.description || '',
        primaryColor: e.primaryColor || '#070709',
        secondaryColor: e.secondaryColor || '#D4AF37',
        accentColor: e.accentColor || '#E5C158',
        logoUrl: e.logoUrl || '',
        logoFileId: e.logoFileId || '',
      });
    } catch {
      toast('Failed to load event details', 'error');
    } finally {
      setLoading(false);
    }
  }, [params.id, router, toast]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

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
        toast('Event updated successfully', 'success');
        router.push('/admin');
      } else {
        const data = await res.json();
        toast(data.error || 'Update failed', 'error');
      }
    } catch {
      toast('Network error while updating event', 'error');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'var(--gold-primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/admin')}>
          ← Back to Events
        </button>
        <div>
          <span className="text-overline" style={{ color: 'var(--gold-light)' }}>SUPER ADMIN EDIT</span>
          <h1 className="text-headline gold-gradient-text">Modify Event #{params.id?.slice(0, 8)}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 className="text-title" style={{ color: '#F8FAFC', marginBottom: 20 }}>
            Event Information
          </h3>
          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <label className="input-label">Event Name</label>
              <input className="input" value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </div>

            <div>
              <label className="input-label">Venue</label>
              <input className="input" value={form.venue} onChange={(e) => update('venue', e.target.value)} required />
            </div>

            <div>
              <label className="input-label">Event Date & Time</label>
              <input
                type="datetime-local"
                className="input"
                value={form.eventDate}
                onChange={(e) => update('eventDate', e.target.value)}
              />
            </div>

            <div>
              <label className="input-label">Description</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 28, marginBottom: 28 }}>
          <h3 className="text-title" style={{ color: '#F8FAFC', marginBottom: 20 }}>
            ImageKit Branding & Themes
          </h3>

          <ImageUpload
            label="Event Logo (ImageKit Hosted)"
            value={form.logoUrl}
            onChange={(url) => update('logoUrl', url)}
            folder={`/epms/events/${params.id}`}
            helpText="Upload new logo file to replace current ImageKit logo"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 24 }}>
            <div>
              <label className="input-label">Primary Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.primaryColor}
                  onChange={(e) => update('primaryColor', e.target.value)}
                  style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'none' }}
                />
                <input
                  className="input text-mono"
                  value={form.primaryColor}
                  onChange={(e) => update('primaryColor', e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Secondary Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.secondaryColor}
                  onChange={(e) => update('secondaryColor', e.target.value)}
                  style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'none' }}
                />
                <input
                  className="input text-mono"
                  value={form.secondaryColor}
                  onChange={(e) => update('secondaryColor', e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Accent Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => update('accentColor', e.target.value)}
                  style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'none' }}
                />
                <input
                  className="input text-mono"
                  value={form.accentColor}
                  onChange={(e) => update('accentColor', e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-gold" style={{ width: '100%', height: 46, fontSize: 15 }} disabled={saving}>
          {saving ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : 'Save Changes & Update Event →'}
        </button>
      </form>
    </div>
  );
}
