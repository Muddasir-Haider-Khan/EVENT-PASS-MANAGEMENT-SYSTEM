'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';
import { ImageUpload } from '@/components/ImageUpload';

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    venue: '',
    eventDate: '',
    description: '',
    primaryColor: '#070709',
    secondaryColor: '#D4AF37',
    accentColor: '#E5C158',
    managerEmail: '',
    logoUrl: '',
    logoFileId: '',
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
    } catch {
      toast('Network error while creating event', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (credentials) {
    return (
      <div style={{ padding: '40px 24px', maxWidth: 560, margin: '0 auto' }}>
        <div className="card card-gold-glow" style={{ padding: 36 }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <span className="badge badge-gold" style={{ marginBottom: 12 }}>
              ✓ Event Configured & Manager Assigned
            </span>
            <h2 className="text-headline gold-gradient-text">Manager Credentials</h2>
            <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
              Login credentials have been generated for <strong>{form.managerEmail}</strong>. Please copy or save these credentials.
            </p>
          </div>

          <div className="card-elevated" style={{ padding: 20, marginBottom: 28, border: '1px solid var(--border-hover)' }}>
            <div style={{ marginBottom: 16 }}>
              <span className="text-overline" style={{ color: 'var(--gold-light)' }}>Manager Login ID</span>
              <div className="text-mono" style={{ fontSize: 18, marginTop: 4, color: '#F8FAFC', fontWeight: 600 }}>
                {credentials.loginId}
              </div>
            </div>
            <div>
              <span className="text-overline" style={{ color: 'var(--gold-light)' }}>Temporary Password</span>
              <div className="text-mono" style={{ fontSize: 18, marginTop: 4, color: '#F8FAFC', fontWeight: 600 }}>
                {credentials.password}
              </div>
            </div>
          </div>

          <button className="btn btn-gold" style={{ width: '100%', height: 44 }} onClick={() => router.push('/admin')}>
            ← Return to Super Admin Roster
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 28px', maxWidth: 800, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push('/admin')}>
          ← Back
        </button>
        <div>
          <span className="text-overline" style={{ color: 'var(--gold-light)' }}>SUPER ADMIN ACTION</span>
          <h1 className="text-headline gold-gradient-text">Initialize New Event</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic Details */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 className="text-title" style={{ color: '#F8FAFC', marginBottom: 20 }}>
            1. Event Specifications
          </h3>
          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <label className="input-label">Event Name *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
                placeholder="e.g. 27 Media Annual Music Gala 2026"
              />
            </div>

            <div>
              <label className="input-label">Venue & Location *</label>
              <input
                className="input"
                value={form.venue}
                onChange={(e) => update('venue', e.target.value)}
                required
                placeholder="e.g. PC Hotel Arena, Lahore"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
                <label className="input-label">Manager Contact Email *</label>
                <input
                  type="email"
                  className="input"
                  value={form.managerEmail}
                  onChange={(e) => update('managerEmail', e.target.value)}
                  required
                  placeholder="manager@27mediaagency.com"
                />
              </div>
            </div>

            <div>
              <label className="input-label">Event Overview / Description</label>
              <textarea
                className="input"
                rows={3}
                value={form.description}
                onChange={(e) => update('description', e.target.value)}
                placeholder="Details regarding artist lineup, VIP pass guidelines..."
                style={{ resize: 'vertical' }}
              />
            </div>
          </div>
        </div>

        {/* ImageKit Logo Upload & Colors */}
        <div className="card" style={{ padding: 28, marginBottom: 28 }}>
          <h3 className="text-title" style={{ color: '#F8FAFC', marginBottom: 20 }}>
            2. Event Branding & ImageKit Assets
          </h3>

          <ImageUpload
            label="Event Logo (Uploaded directly to ImageKit)"
            value={form.logoUrl}
            onChange={(url) => update('logoUrl', url)}
            folder="/epms/events/logos"
            helpText="Recommended: Transparent PNG or SVG logo file"
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 24 }}>
            <div>
              <label className="input-label">Primary Background Color</label>
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
              <label className="input-label">Secondary Brand Color</label>
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
              <label className="input-label">Accent Highlight Color</label>
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

        <button type="submit" className="btn btn-gold" style={{ width: '100%', height: 46, fontSize: 15 }} disabled={loading}>
          {loading ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : 'Create Event & Provision Credentials →'}
        </button>
      </form>
    </div>
  );
}
