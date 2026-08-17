'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { ImageUpload } from '@/components/ImageUpload';

export default function ManagerSettings() {
  const { toast } = useToast();
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/manager/settings');
      if (res.ok) {
        const data = await res.json();
        setAccountNumber(data.accountNumber || '');
        setPaymentPhone(data.paymentPhone || '');
        if (data.event) {
          setLogoUrl(data.event.logoUrl || '');
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/manager/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountNumber, paymentPhone, logoUrl }),
      });
      if (res.ok) {
        toast('Settings updated successfully', 'success');
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
          Manage your event logo, header graphics, payment instructions, and account details.
        </p>
      </div>

      <form onSubmit={handleSave}>
        {/* ImageKit Logo Upload */}
        <div className="card" style={{ padding: 28, marginBottom: 24 }}>
          <h3 className="text-title" style={{ color: '#F8FAFC', marginBottom: 18 }}>
            1. Event Logo & ImageKit Graphic Assets
          </h3>

          <ImageUpload
            label="Event Branding Logo (ImageKit Hosted)"
            value={logoUrl}
            onChange={(url) => setLogoUrl(url)}
            folder="/epms/events/logos"
            helpText="This logo will be displayed on the public registration page and attendee pass headers."
          />
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
          {saving ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : 'Save Settings & Update Assets →'}
        </button>
      </form>
    </div>
  );
}
