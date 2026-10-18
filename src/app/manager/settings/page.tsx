'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { ImageUpload } from '@/components/ImageUpload';
import { PageHead } from '@/components/AppShell';
import { FontPreviewStyles } from '@/components/FontPreviewStyles';

export default function ManagerSettings() {
  const { toast } = useToast();
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#020617');
  const [secondaryColor, setSecondaryColor] = useState('#6366F1');
  const [accentColor, setAccentColor] = useState('#38BDF8');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [eventName, setEventName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const PALETTE_PRESETS = [
    { name: 'Indigo Obsidian (27 Media Official)', primary: '#020617', secondary: '#6366F1', accent: '#38BDF8' },
    { name: 'Midnight Sapphire', primary: '#0A1128', secondary: '#0066FF', accent: '#38BDF8' },
    { name: 'Emerald Royale', primary: '#062016', secondary: '#10B981', accent: '#6EE7B7' },
    { name: 'Violet Electric', primary: '#120924', secondary: '#8B5CF6', accent: '#C084FC' },
    { name: 'Sunset Crimson', primary: '#18080C', secondary: '#F43F5E', accent: '#FB923C' },
    { name: 'Gold Luxe (Legacy)', primary: '#070709', secondary: '#D4AF37', accent: '#E5C158' },
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
      <div className="p-14 flex items-center justify-center gap-3 text-muted text-[13px]">
        <span className="spinner" /> Loading settings…
      </div>
    );
  }

  const colorFields = [
    { label: 'Background', value: primaryColor, set: setPrimaryColor },
    { label: 'Buttons', value: secondaryColor, set: setSecondaryColor },
    { label: 'Highlights', value: accentColor, set: setAccentColor },
  ];

  return (
    <>
      <FontPreviewStyles families={FONT_OPTIONS.map((f) => f.name)} />
      <PageHead
        title={<>Event<br />Settings</>}
        description="Branding for the public registration form and attendee passes, plus payment instructions."
      />

      <form onSubmit={handleSave} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-4 items-start">
        <div className="space-y-4 min-w-0">
          <section className="card p-[18px]">
            <h2 className="card-title mb-4">Logo</h2>
            <ImageUpload
              label="Event logo"
              value={logoUrl}
              onChange={(url) => setLogoUrl(url)}
              folder="/epms/events/logos"
              helpText="Shown on the public registration page and on attendee passes."
            />
          </section>

          <section className="card p-[18px]">
            <h2 className="card-title mb-4">Colors</h2>
            <p className="input-label">Presets</p>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
              {PALETTE_PRESETS.map((preset) => {
                const isActive = primaryColor === preset.primary && secondaryColor === preset.secondary;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => applyPreset(preset)}
                    aria-pressed={isActive}
                    className={`flex items-center gap-2.5 h-11 px-3 rounded-field border text-left text-[13px] font-semibold transition-colors ${
                      isActive ? 'border-fg bg-surface-2' : 'border-line bg-surface hover:border-line-2'
                    }`}
                  >
                    <span className="flex -space-x-1 flex-none" aria-hidden="true">
                      {[preset.primary, preset.secondary, preset.accent].map((c) => (
                        <span key={c} className="w-4 h-4 rounded-full ring-2 ring-[var(--solid)]" style={{ background: c }} />
                      ))}
                    </span>
                    <span className="truncate">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
              {colorFields.map((c) => (
                <div key={c.label}>
                  <label className="input-label" htmlFor={`color-${c.label}`}>{c.label}</label>
                  <div className="flex items-center gap-2 h-11 px-2 rounded-field border border-line-2 bg-surface focus-within:border-fg">
                    <input
                      type="color"
                      value={c.value}
                      onChange={(e) => c.set(e.target.value)}
                      className="w-8 h-8 rounded-full border-0 bg-transparent cursor-pointer flex-none"
                      aria-label={`${c.label} color picker`}
                    />
                    <input
                      id={`color-${c.label}`}
                      className="flex-1 min-w-0 bg-transparent border-0 focus:ring-0 p-0 text-[14px] num uppercase"
                      value={c.value}
                      onChange={(e) => c.set(e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-[18px]">
            <h2 className="card-title mb-4">Typography</h2>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
              {FONT_OPTIONS.map((font) => {
                const isSelected = fontFamily === font.name;
                return (
                  <button
                    key={font.name}
                    type="button"
                    onClick={() => setFontFamily(font.name)}
                    aria-pressed={isSelected}
                    className={`px-3.5 py-3 rounded-field border text-left transition-colors ${
                      isSelected ? 'border-fg bg-surface-2' : 'border-line bg-surface hover:border-line-2'
                    }`}
                  >
                    <span className="block text-[15px] font-semibold" style={{ fontFamily: font.name }}>{font.name}</span>
                    <span className="block text-[12px] text-muted mt-0.5">{font.category}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="card p-[18px]">
            <h2 className="card-title">Payment details</h2>
            <p className="text-caption mt-1 mb-4">Shown to attendees after they register, for fee collection and verification.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="input-label" htmlFor="account">Account / IBAN</label>
                <input id="account" className="input" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="PK36 HABB 0001 2345 6789 0102" />
              </div>
              <div>
                <label className="input-label" htmlFor="pay-phone">Verification phone / WhatsApp</label>
                <input id="pay-phone" className="input" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} placeholder="+92 300 1234567" />
              </div>
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-5 space-y-3">
          <section className="card p-[18px]">
            <div className="card-head mb-3">
              <h2 className="card-title">Preview</h2>
              <span className="text-[12.5px] text-muted">{fontFamily}</span>
            </div>
            {/* Rendered in the event's own colors, independent of the dashboard theme */}
            <div className="rounded-tile p-5" style={{ backgroundColor: primaryColor, fontFamily }}>
              {logoUrl && <img src={logoUrl} alt="" className="w-10 h-10 rounded-full object-cover mb-4" />}
              <p className="text-[11px] font-bold mb-2" style={{ color: accentColor }}>Registration open</p>
              <h3 className="text-[20px] font-bold leading-tight" style={{ color: '#F8FAFC' }}>{eventName || 'Event title'}</h3>
              <p className="text-[13px] mt-1 mb-5" style={{ color: '#CBD5E1' }}>Public registration form &amp; attendee pass</p>
              <span className="inline-flex h-10 items-center px-5 rounded-full text-[13px] font-bold" style={{ backgroundColor: secondaryColor, color: primaryColor }}>
                Register now
              </span>
            </div>
          </section>
          <button type="submit" className="btn btn-primary w-full !h-12" disabled={saving}>
            {saving ? <span className="spinner" /> : 'Save settings'}
          </button>
        </aside>
      </form>
    </>
  );
}
