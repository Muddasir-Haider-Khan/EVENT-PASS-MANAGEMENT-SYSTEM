'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';

interface Field { id: string; label: string; type: string; required: boolean; options: string[] | null; order: number; }
interface EventInfo { id: string; name: string; venue: string; eventDate: string | null; description: string | null; logoUrl: string | null; primaryColor: string; secondaryColor: string; accentColor: string; }

export default function PublicEventPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [payment, setPayment] = useState<{ accountNumber?: string; paymentPhone?: string }>({});
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/public/${slug}/form`);
      if (!res.ok) { setLoading(false); return; }
      const data = await res.json();
      setEvent(data.event);
      setFields(data.fields);
      setPayment(data.payment);
      setLoading(false);
    }
    load();
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`/api/public/${slug}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses, email }),
      });
      const data = await res.json();
      if (res.ok) setSubmitted(true);
      else setError(data.error || 'Submission failed');
    } catch { setError('Network error'); }
    finally { setSubmitting(false); }
  }

  function updateResponse(fieldId: string, value: unknown) {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  }

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>;
  if (!event) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="card" style={{ padding: 32, textAlign: 'center' }}><h1 className="text-headline">Event Not Found</h1><p className="text-body" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>This event does not exist or is no longer active.</p></div></div>;

  if (submitted) {
    return (
      <ThemeProvider primaryColor={event.primaryColor} secondaryColor={event.secondaryColor} accentColor={event.accentColor}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ maxWidth: 500, width: '100%', padding: 32, textAlign: 'center' }}>
            {event.logoUrl && <img src={event.logoUrl} alt="" style={{ width: 64, height: 64, borderRadius: 12, objectFit: 'cover', margin: '0 auto 16px' }} />}
            <div style={{ fontSize: 48, marginBottom: 8 }}>✓</div>
            <h1 className="text-headline">Thank You!</h1>
            <p className="text-body" style={{ color: 'var(--text-secondary)', margin: '12px 0 24px' }}>
              Your registration for <strong>{event.name}</strong> has been submitted. You will receive an email once your registration is approved.
            </p>
            {(payment.accountNumber || payment.paymentPhone) && (
              <div className="card-elevated" style={{ padding: 20, textAlign: 'left' }}>
                <h3 className="text-title" style={{ marginBottom: 12 }}>Payment Information</h3>
                {payment.accountNumber && (<div style={{ marginBottom: 8 }}><div className="text-overline" style={{ color: 'var(--text-muted)' }}>Account Number</div><div className="text-mono" style={{ fontSize: 15, marginTop: 2 }}>{payment.accountNumber}</div></div>)}
                {payment.paymentPhone && (<div><div className="text-overline" style={{ color: 'var(--text-muted)' }}>Send Screenshot To</div><div className="text-mono" style={{ fontSize: 15, marginTop: 2 }}>{payment.paymentPhone}</div></div>)}
              </div>
            )}
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider primaryColor={event.primaryColor} secondaryColor={event.secondaryColor} accentColor={event.accentColor}>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ maxWidth: 560, width: '100%' }}>
          {/* Event Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            {event.logoUrl && <img src={event.logoUrl} alt="" style={{ width: 72, height: 72, borderRadius: 14, objectFit: 'cover', margin: '0 auto 12px' }} />}
            <h1 className="text-display" style={{ fontSize: '1.75rem' }}>{event.name}</h1>
            <p className="text-body" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>{event.venue}</p>
            {event.eventDate && <p className="text-caption" style={{ color: 'var(--text-muted)', marginTop: 2 }}>{new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>}
            {event.description && <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>{event.description}</p>}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
            <h2 className="text-title" style={{ marginBottom: 20 }}>Registration</h2>
            <div style={{ display: 'grid', gap: 16 }}>
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="input-label">
                    {field.label} {field.required && <span style={{ color: 'var(--error)' }}>*</span>}
                  </label>
                  {field.type === 'EMAIL' ? (
                    <input type="email" className="input" value={email} onChange={(e) => { setEmail(e.target.value); updateResponse(field.id, e.target.value); }} required={field.required} placeholder="your@email.com" />
                  ) : field.type === 'SHORT_TEXT' ? (
                    <input className="input" value={(responses[field.id] as string) || ''} onChange={(e) => updateResponse(field.id, e.target.value)} required={field.required} />
                  ) : field.type === 'PARAGRAPH' ? (
                    <textarea className="input" rows={3} value={(responses[field.id] as string) || ''} onChange={(e) => updateResponse(field.id, e.target.value)} required={field.required} style={{ resize: 'vertical' }} />
                  ) : field.type === 'NUMBER' ? (
                    <input type="number" className="input" value={(responses[field.id] as string) || ''} onChange={(e) => updateResponse(field.id, e.target.value)} required={field.required} />
                  ) : field.type === 'DATE' ? (
                    <input type="date" className="input" value={(responses[field.id] as string) || ''} onChange={(e) => updateResponse(field.id, e.target.value)} required={field.required} />
                  ) : field.type === 'DROPDOWN' ? (
                    <select className="select" value={(responses[field.id] as string) || ''} onChange={(e) => updateResponse(field.id, e.target.value)} required={field.required}>
                      <option value="">Select...</option>
                      {(field.options || []).map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                  ) : field.type === 'RADIO' ? (
                    <div style={{ display: 'grid', gap: 6 }}>
                      {(field.options || []).map((opt, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="radio" name={field.id} value={opt} checked={responses[field.id] === opt} onChange={() => updateResponse(field.id, opt)} required={field.required} style={{ accentColor: 'var(--color-secondary)' }} />
                          <span className="text-body">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'CHECKBOX' ? (
                    <div style={{ display: 'grid', gap: 6 }}>
                      {(field.options || []).map((opt, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                          <input type="checkbox" checked={((responses[field.id] as string[]) || []).includes(opt)} onChange={(e) => {
                            const cur = (responses[field.id] as string[]) || [];
                            updateResponse(field.id, e.target.checked ? [...cur, opt] : cur.filter((v: string) => v !== opt));
                          }} style={{ accentColor: 'var(--color-secondary)' }} />
                          <span className="text-body">{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {error && <div style={{ color: 'var(--error)', fontSize: 13, marginTop: 16, padding: '10px 14px', background: 'var(--error-bg)', borderRadius: 8 }}>{error}</div>}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 20 }} disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Submit Registration →'}
            </button>
          </form>
        </div>
      </div>
    </ThemeProvider>
  );
}
