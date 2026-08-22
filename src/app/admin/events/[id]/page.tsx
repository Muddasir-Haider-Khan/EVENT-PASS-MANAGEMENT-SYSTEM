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
    fontFamily: 'Inter',
    eventType: 'NORMAL',
    customFontFileUrl: '',
    customFontUrl: '',
  });

  const PALETTE_PRESETS = [
    { name: 'Gold Luxe (27 Media)', primary: '#070709', secondary: '#D4AF37', accent: '#E5C158' },
    { name: 'Cyberpunk Neon', primary: '#0A0A12', secondary: '#FF007A', accent: '#00F0FF' },
    { name: 'Midnight Sapphire', primary: '#0A1128', secondary: '#0066FF', accent: '#38BDF8' },
    { name: 'Emerald Royale', primary: '#062016', secondary: '#10B981', accent: '#6EE7B7' },
    { name: 'Sunset Crimson', primary: '#18080C', secondary: '#F43F5E', accent: '#FB923C' },
    { name: 'Violet Electric', primary: '#120924', secondary: '#8B5CF6', accent: '#C084FC' },
    { name: 'Minimal Slate', primary: '#0F172A', secondary: '#38BDF8', accent: '#818CF8' },
  ];

  const FONT_OPTIONS = [
    { name: 'Inter', category: 'Modern Clean Sans' },
    { name: 'Outfit', category: 'Geometric Tech Sans' },
    { name: 'Space Grotesk', category: 'Futuristic Display' },
    { name: 'Plus Jakarta Sans', category: 'Enterprise Modern' },
    { name: 'Playfair Display', category: 'Luxury Editorial Serif' },
    { name: 'Syne', category: 'Artistic High-Fashion' },
    { name: 'Roboto', category: 'Classic Neo-Grotesque' },
    { name: 'Cinzel', category: 'Classical High Luxury' },
  ];

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
        fontFamily: e.fontFamily || 'Inter',
        eventType: e.eventType || 'NORMAL',
        customFontFileUrl: e.customFontFileUrl || '',
        customFontUrl: e.customFontUrl || '',
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

  function applyPreset(preset: { primary: string; secondary: string; accent: string }) {
    setForm((prev) => ({
      ...prev,
      primaryColor: preset.primary,
      secondaryColor: preset.secondary,
      accentColor: preset.accent,
    }));
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
              <label className="input-label">Event Type Architecture</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => update('eventType', 'NORMAL')}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: form.eventType === 'NORMAL' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: form.eventType === 'NORMAL' ? '2px solid #6366F1' : '1px solid var(--border-hover)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 700, color: form.eventType === 'NORMAL' ? '#818CF8' : '#F8FAFC', fontSize: 14 }}>
                    Standard / Corporate Event
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Standard multi-ticket registration, barcode / standard QR passes, direct approval.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => update('eventType', 'MUN')}
                  style={{
                    padding: '14px 16px',
                    borderRadius: 10,
                    background: form.eventType === 'MUN' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255,255,255,0.03)',
                    border: form.eventType === 'MUN' ? '2px solid #EAB308' : '1px solid var(--border-hover)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ fontWeight: 700, color: form.eventType === 'MUN' ? '#FACC15' : '#F8FAFC', fontSize: 14 }}>
                    MUN (Model United Nations)
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    Delegates/Chairs/Groups, Photo Verification, Single-Use Gate QR, Manual Manager Approval.
                  </div>
                </button>
              </div>
            </div>

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

          {/* Color Palette Presets */}
          <div style={{ marginTop: 24 }}>
            <label className="input-label" style={{ marginBottom: 10, display: 'block' }}>
              🎨 Enterprise Color Palette Presets (1-Click Selection)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {PALETTE_PRESETS.map((preset) => {
                const isActive = form.primaryColor === preset.primary && form.secondaryColor === preset.secondary;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: isActive ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isActive ? '1px solid var(--gold-primary)' : '1px solid var(--border-hover)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 3 }}>
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: preset.primary, border: '1px solid rgba(255,255,255,0.2)' }} />
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: preset.secondary }} />
                      <div style={{ width: 14, height: 14, borderRadius: '50%', background: preset.accent }} />
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: isActive ? 'var(--gold-light)' : '#E2E8F0' }}>
                      {preset.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

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

          {/* Typography Selector */}
          <div style={{ marginTop: 24 }}>
            <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>
              🔤 Primary Typography (Google Font Family)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {FONT_OPTIONS.map((font) => {
                const isSelected = form.fontFamily === font.name;
                return (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => update('fontFamily', font.name)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 8,
                      background: isSelected ? 'rgba(212, 175, 55, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                      border: isSelected ? '1px solid var(--gold-primary)' : '1px solid var(--border-hover)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontFamily: font.name, fontSize: 15, fontWeight: 600, color: isSelected ? 'var(--gold-light)' : '#F8FAFC' }}>
                      {font.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                      {font.category}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Font File / Stylesheet Override */}
          <div style={{ marginTop: 20, padding: 16, borderRadius: 8, background: 'rgba(255, 255, 255, 0.02)', border: '1px dashed var(--border-hover)' }}>
            <label className="input-label" style={{ marginBottom: 6, display: 'block' }}>
              ✨ Custom Typography Font Override (.ttf / .otf / .woff2 or Stylesheet URL)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label className="input-label" style={{ fontSize: 11 }}>Font File Direct URL (.ttf/.otf/.woff2)</label>
                <input
                  className="input"
                  value={form.customFontFileUrl}
                  onChange={(e) => update('customFontFileUrl', e.target.value)}
                  placeholder="https://ik.imagekit.io/epms/fonts/mycustomfont.ttf"
                  style={{ fontSize: 12 }}
                />
              </div>
              <div>
                <label className="input-label" style={{ fontSize: 11 }}>External Stylesheet CSS URL (Google Fonts / Adobe)</label>
                <input
                  className="input"
                  value={form.customFontUrl}
                  onChange={(e) => update('customFontUrl', e.target.value)}
                  placeholder="https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap"
                  style={{ fontSize: 12 }}
                />
              </div>
            </div>
          </div>

          {/* Live Brand Preview Card */}
          <div
            style={{
              marginTop: 28,
              padding: 24,
              borderRadius: 12,
              backgroundColor: form.primaryColor,
              border: `1px solid ${form.secondaryColor}40`,
              boxShadow: `0 8px 24px ${form.primaryColor}80`,
              transition: 'all 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  padding: '4px 10px',
                  borderRadius: 20,
                  backgroundColor: `${form.accentColor}20`,
                  color: form.accentColor,
                  border: `1px solid ${form.accentColor}40`,
                }}
              >
                LIVE BRANDING PREVIEW
              </span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Font: <strong>{form.fontFamily}</strong></span>
            </div>

            <div style={{ fontFamily: form.fontFamily }}>
              <h4 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
                {form.name || 'Event Title Preview'}
              </h4>
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
                {form.venue || 'Venue Location'} • Registration Form & VIP Email Pass Preview
              </p>
              <button
                type="button"
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  backgroundColor: form.secondaryColor,
                  color: form.primaryColor,
                  fontWeight: 700,
                  fontSize: 13,
                  border: 'none',
                  boxShadow: `0 4px 14px ${form.secondaryColor}40`,
                  cursor: 'pointer',
                }}
              >
                Sample Action Button →
              </button>
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
