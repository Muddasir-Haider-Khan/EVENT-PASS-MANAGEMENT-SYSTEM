'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHead } from '@/components/AppShell';
import { FontPreviewStyles } from '@/components/FontPreviewStyles';
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
        <div className="spinner" style={{ margin: '0 auto', borderTopColor: 'currentColor' }} />
      </div>
    );
  }

  return (
    <div className="max-w-[880px]">
      <FontPreviewStyles families={FONT_OPTIONS.map((f) => f.name)} />
      <Link href="/admin" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-muted hover:text-fg mb-3">
        <ArrowLeft className="w-4 h-4" /> Events
      </Link>
      <PageHead title={<>Edit<br />Event</>} />

      <form onSubmit={handleSubmit}>
        <div className="card p-[18px] sm:p-6 mb-4">
          <h3 className="card-title mb-5">
            Event details
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

        <div className="card p-[18px] sm:p-6 mb-4">
          <h3 className="card-title mb-5">
            Branding
          </h3>

          <ImageUpload
            label="Event logo"
            value={form.logoUrl}
            onChange={(url) => update('logoUrl', url)}
            folder={`/epms/events/${params.id}`}
            helpText="Shown on the public registration page and on attendee passes."
          />

          {/* Color Palette Presets */}
          <div style={{ marginTop: 24 }}>
            <label className="input-label" style={{ marginBottom: 10, display: 'block' }}>
              Color presets
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
                      background: isActive ? 'var(--surface-2)' : 'var(--surface)',
                      border: isActive ? '1px solid var(--text)' : '1px solid var(--border-hover)',
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
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>
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
              Typography
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
                      background: isSelected ? 'var(--surface-2)' : 'var(--surface)',
                      border: isSelected ? '1px solid var(--text)' : '1px solid var(--border-hover)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <div style={{ fontFamily: font.name, fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>
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
                                    padding: '4px 10px',
                  borderRadius: 20,
                  backgroundColor: `${form.accentColor}20`,
                  color: form.accentColor,
                  border: `1px solid ${form.accentColor}40`,
                }}
              >
                Preview
              </span>
              <span style={{ fontSize: 12, color: '#CBD5E1' }}>Font: <strong>{form.fontFamily}</strong></span>
            </div>

            <div style={{ fontFamily: form.fontFamily }}>
              <h4 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', marginBottom: 6 }}>
                {form.name || 'Event Title Preview'}
              </h4>
              <p style={{ fontSize: 13, color: '#CBD5E1', marginBottom: 16 }}>
                {form.venue || 'Venue Location'} · registration form and pass
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
                Sample button
              </button>
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-gold" style={{ width: '100%', height: 46, fontSize: 15 }} disabled={saving}>
          {saving ? <span className="spinner" style={{ borderTopColor: 'var(--on-pill)' }} /> : 'Save changes'}
        </button>
      </form>
    </div>
  );
}
