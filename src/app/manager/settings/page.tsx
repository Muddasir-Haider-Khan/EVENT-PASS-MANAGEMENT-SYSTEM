'use client';

import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';

export default function ManagerSettings() {
  const { toast } = useToast();
  const [accountNumber, setAccountNumber] = useState('');
  const [paymentPhone, setPaymentPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/manager/settings');
      if (res.ok) {
        const data = await res.json();
        setAccountNumber(data.accountNumber || '');
        setPaymentPhone(data.paymentPhone || '');
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
        body: JSON.stringify({ accountNumber, paymentPhone }),
      });
      if (res.ok) toast('Settings saved', 'success');
      else toast('Failed to save', 'error');
    } catch { toast('Network error', 'error'); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ padding: 24 }}><div className="spinner" /></div>;

  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-headline" style={{ marginBottom: 20 }}>Settings</h1>

      <form onSubmit={handleSave}>
        <div className="card" style={{ padding: 24, maxWidth: 500 }}>
          <h3 className="text-title" style={{ marginBottom: 16 }}>Payment Information</h3>
          <p className="text-caption" style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
            Participants will see this on the confirmation page after submitting the form.
          </p>

          <div style={{ display: 'grid', gap: 16 }}>
            <div>
              <label className="input-label">Account Number</label>
              <input className="input" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="e.g. 1234-5678-9012" />
            </div>
            <div>
              <label className="input-label">Payment Screenshot Phone</label>
              <input className="input" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value)} placeholder="e.g. +92 300 1234567" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: 20 }} disabled={saving}>
            {saving ? <span className="spinner" /> : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
