'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { ImageUpload } from '@/components/ImageUpload';

export default function ManagerSettings() {
  const { toast } = useToast();
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#070709');
  const [secondaryColor, setSecondaryColor] = useState('#D4AF37');
  const [accentColor, setAccentColor] = useState('#E5C158');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/manager/settings');
      if (res.ok) {
        const data = await res.json();
        setAccountNumber(data.accountNumber || '');
        setPaymentPhone(data.paymentPhone || '');
        if (data.event) {
          setLogoUrl(data.event.logoUrl || '');
          setPrimaryColor(data.event.primaryColor || '#070709');
          setSecondaryColor(data.event.secondaryColor || '#D4AF37');
          setAccentColor(data.event.accentColor || '#E5C158');
          setFontFamily(data.event.fontFamily || 'Inter');
          setEventName(data.event.name || '');
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  function applyPreset(preset: { primary: string; secondary: string; accent: string }) {
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentColor(preset.accent);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/manager/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountNumber,
          paymentPhone,
          logoUrl,
          primaryColor,
          secondaryColor,
          accentColor,
          fontFamily,
        }),
      });
      if (res.ok) {
        toast('Settings & Event Branding updated successfully', 'success');
      } else {
        toast('Failed to save settings', 'error');
      }
    } catch {
      toast('Network connection error', 'error');
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
      <div style={{ marginBottom: 28 }}>
        <span className="text-overline" style={{ color: 'var(--gold-light)' }}>27 MEDIA AGENCY • BRANDING & SETTINGS</span>
        <h1 className="text-headline gold-gradient-text" style={{ marginTop: 4 }}>
          Event Configurations
        </h1>
        <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
          Manage your event logo, color theme, typography, payment instructions, and account details.
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* ImageKit Logo Upload & Theme Suite */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 className="text-title" style={{ color: '#F8FAFC', marginBottom: 18 }}>
            1. Event Logo, Colors & Typography Suite
          </h3>

          <ImageUpload
            label="Event Branding Logo (ImageKit Hosted)"
            value={logoUrl}
            onChange={(url) => setLogoUrl(url)}
            folder="/epms/events/logos"
            helpText="This logo will be displayed on the public registration page and attendee pass headers."
          />

          {/* Color Palette Presets */}
          <div style={{ marginTop: 24 }}>
            <label className="input-label" style={{ marginBottom: 10, display: 'block' }}>
              🎨 Enterprise Color Palette Presets
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {PALETTE_PRESETS.map((preset) => {
                const isActive = primaryColor === preset.primary && secondaryColor === preset.secondary;
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
              <label className="input-label">Primary Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'none' }}
                />
                <input
                  className="input text-mono"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Secondary Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'none' }}
                />
                <input
                  className="input text-mono"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Accent Color</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{ width: 40, height: 38, border: 'none', cursor: 'pointer', borderRadius: 6, background: 'none' }}
                />
                <input
                  className="input text-mono"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  style={{ fontSize: 13 }}
                />
              </div>
            </div>
          </div>

          {/* Typography Selector */}
          <div style={{ marginTop: 24 }}>
            <label className="input-label" style={{ marginBottom: 8, display: 'block' }}>
              🔤 Event Typography (Google Font Family)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
              {FONT_OPTIONS.map((font) => {
                const isSelected = fontFamily === font.name;
                return (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => setFontFamily(font.name)}
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
              backgroundColor: primaryColor,
              border: `1px solid ${secondaryColor}40`,
              boxShadow: `0 8px 24px ${primaryColor}80`,
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
                  backgroundColor: `${accentColor}20`,
                  color: accentColor,
                  border: `1px solid ${accentColor}40`,
                }}
              >
                LIVE BRANDING PREVIEW
              </span>
              <span style={{ fontSize: 12, color: '#94A3B8' }}>Font: <strong>{fontFamily}</strong></span>
            </div>

            <div style={{ fontFamily: fontFamily }}>
              <h4 style={{ fontSize: 20, fontWeight: 700, color: '#FFFFFF', marginBottom: 6 }}>
                {eventName || 'Event Title Preview'}
              </h4>
              <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 16 }}>
                Public Registration Form & Attendee Pass Styling
              </p>
              <button
                type="button"
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  backgroundColor: secondaryColor,
                  color: primaryColor,
                  fontWeight: 700,
                  fontSize: 13,
                  border: 'none',
                  boxShadow: `0 4px 14px ${secondaryColor}40`,
                  cursor: 'pointer',
                }}
              >
                Sample Action Button →
              </button>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="card" style={{ padding: 28, marginBottom: 28 }}>
          <h3 className="text-title" style={{ color: '#F8FAFC', marginBottom: 12 }}>
            2. Payment & Confirmation Details
          </h3>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>
            Instructions shown to attendees for fee collection or deposit verification.
          </p>

          <div style={{ display: 'grid', gap: 18 }}>
            <div>
              <label className="input-label">Account / IBAN Number</label>
              <input
                className="input"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="e.g. PK36 HABB 0001 2345 6789 0102"
              />
            </div>
            <div>
              <label className="input-label">Payment Verification Phone / WhatsApp</label>
              <input
                className="input"
                value={paymentPhone}
                onChange={(e) => setPaymentPhone(e.target.value)}
                placeholder="e.g. +92 300 1526303"
              />
            </div>
          </div>
        </div>

        <button type="submit" className="btn btn-gold" style={{ width: '100%', height: 46, fontSize: 15 }} disabled={saving}>
          {saving ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : 'Save Settings & Update Branding Suite →'}
        </button>
      </form>
    </div>
  );
}
