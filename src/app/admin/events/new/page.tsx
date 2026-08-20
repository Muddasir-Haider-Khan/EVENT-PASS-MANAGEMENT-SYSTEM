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
    fontFamily: 'Inter',
  });
  const [credentials, setCredentials] = useState<{
    loginId: string;
    password: string;
    emailSent?: boolean;
    emailError?: string | null;
  } | null>(null);

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
      <div style={{ padding: '40px 24px', maxWidth: 580, margin: '0 auto' }}>
        <div className="card card-gold-glow" style={{ padding: 36 }}>
          <div style={{ marginBottom: 24, textAlign: 'center' }}>
            <span className="badge badge-gold" style={{ marginBottom: 12 }}>
              ✓ Event Configured & Manager Assigned
            </span>
            <h2 className="text-headline gold-gradient-text">Manager Permanent Credentials</h2>
            <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
              Permanent access credentials have been generated for <strong>{form.managerEmail}</strong>.
            </p>
          </div>

          <div className="card-elevated" style={{ padding: 22, marginBottom: 20, border: '1px solid var(--border-hover)' }}>
            <div style={{ marginBottom: 18 }}>
              <span className="text-overline" style={{ color: 'var(--gold-light)' }}>Manager Login ID</span>
              <div className="text-mono" style={{ fontSize: 18, marginTop: 4, color: '#F8FAFC', fontWeight: 600 }}>
                {credentials.loginId}
              </div>
            </div>
            <div>
              <span className="text-overline" style={{ color: 'var(--gold-light)' }}>Permanent System Password</span>
              <div className="text-mono" style={{ fontSize: 18, marginTop: 4, color: '#F8FAFC', fontWeight: 600 }}>
                {credentials.password}
              </div>
            </div>
          </div>

          {credentials.emailSent ? (
            <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#4ADE80', fontSize: 13, marginBottom: 24 }}>
              ✅ Email with permanent credentials successfully dispatched to <strong>{form.managerEmail}</strong>.
            </div>
          ) : (
            <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#FACC15', fontSize: 12, marginBottom: 24 }}>
              ⚠️ Email delivery info: {credentials.emailError ? credentials.emailError : 'Resend API requires domain verification'}. Please copy these credentials manually for your event manager.
            </div>
          )}

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
            2. Event Branding, Palette & Typography
          </h3>

          <ImageUpload
            label="Event Logo (Uploaded directly to ImageKit)"
            value={form.logoUrl}
            onChange={(url) => update('logoUrl', url)}
            folder="/epms/events/logos"
            helpText="Recommended: Transparent PNG or SVG logo file for consistent branding"
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

          {/* Custom Color Pickers */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 20 }}>
            <div>
              <label className="input-label">Primary Background</label>
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

        <button type="submit" className="btn btn-gold" style={{ width: '100%', height: 46, fontSize: 15 }} disabled={loading}>
          {loading ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : 'Create Event & Provision Credentials →'}
        </button>
      </form>
    </div>
  );
}
