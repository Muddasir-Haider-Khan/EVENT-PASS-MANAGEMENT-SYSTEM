'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Media27Logo } from '@/components/27MediaLogo';

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[] | null;
  order: number;
}

interface EventInfo {
  id: string;
  name: string;
  venue: string;
  eventDate: string | null;
  description: string | null;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

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
      try {
        const res = await fetch(`/api/public/${slug}/form`);
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const data = await res.json();
        setEvent(data.event);
        setFields(data.fields || []);
        setPayment(data.payment || {});
      } catch {
        // Handled silently
      } finally {
        setLoading(false);
      }
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
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || 'Submission failed');
      }
    } catch {
      setError('Network communication error');
    } finally {
      setSubmitting(false);
    }
  }

  function updateResponse(fieldId: string, value: unknown) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#070709', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" style={{ borderTopColor: '#D4AF37' }} />
      </div>
    );
  }

  if (!event) {
    return (
      <div style={{ minHeight: '100vh', background: '#070709', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="card" style={{ maxWidth: 480, width: '100%', padding: 40, textAlign: 'center' }}>
          <Media27Logo size="sm" />
          <h1 className="text-headline" style={{ marginTop: 20, color: '#F8FAFC' }}>Event Not Found</h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>
            This event pass registration page is either unavailable or has expired.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <ThemeProvider primaryColor={event.primaryColor} secondaryColor={event.secondaryColor} accentColor={event.accentColor}>
        <div style={{ minHeight: '100vh', background: 'var(--bg-root)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card card-gold-glow" style={{ maxWidth: 540, width: '100%', padding: 40, textAlign: 'center' }}>
            <div style={{ marginBottom: 20 }}>
              <Media27Logo size="sm" />
            </div>

            {event.logoUrl ? (
              <img src={event.logoUrl} alt="" style={{ width: 72, height: 72, borderRadius: 16, objectFit: 'cover', margin: '0 auto 20px', border: '1px solid var(--border-default)' }} />
            ) : (
              <div style={{ fontSize: 48, marginBottom: 12 }}>🎫</div>
            )}

            <span className="badge badge-gold" style={{ marginBottom: 12 }}>✓ Registration Submitted</span>
            <h1 className="text-headline gold-gradient-text">Registration Complete!</h1>
            <p className="text-body" style={{ color: 'var(--text-secondary)', margin: '14px 0 24px', lineHeight: 1.6 }}>
              Your registration for <strong>{event.name}</strong> has been received. Your digital pass and QR code will be generated upon review.
            </p>

            {(payment.accountNumber || payment.paymentPhone) && (
              <div className="card-elevated" style={{ padding: 24, textAlign: 'left', borderRadius: 12, border: '1px solid var(--border-hover)' }}>
                <h3 className="text-title" style={{ color: 'var(--gold-light)', marginBottom: 14 }}>
                  Payment & Verification Instructions
                </h3>
                {payment.accountNumber && (
                  <div style={{ marginBottom: 12 }}>
                    <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Bank Account / IBAN</div>
                    <div className="text-mono" style={{ fontSize: 16, marginTop: 4, color: '#F8FAFC', fontWeight: 600 }}>
                      {payment.accountNumber}
                    </div>
                  </div>
                )}
                {payment.paymentPhone && (
                  <div>
                    <div className="text-overline" style={{ color: 'var(--text-muted)' }}>Send Payment Receipt To</div>
                    <div className="text-mono" style={{ fontSize: 16, marginTop: 4, color: 'var(--gold-light)', fontWeight: 600 }}>
                      {payment.paymentPhone}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider primaryColor={event.primaryColor} secondaryColor={event.secondaryColor} accentColor={event.accentColor}>
      <div style={{ minHeight: '100vh', background: 'var(--bg-root)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
        <div style={{ maxWidth: 600, width: '100%' }}>
          {/* Top Brand Banner */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Media27Logo size="sm" />

            <div style={{ marginTop: 24 }}>
              {event.logoUrl && (
                <img
                  src={event.logoUrl}
                  alt=""
                  style={{ width: 80, height: 80, borderRadius: 16, objectFit: 'cover', margin: '0 auto 16px', border: '1px solid var(--border-default)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}
                />
              )}
              <h1 className="text-display gold-gradient-text" style={{ fontSize: '2.2rem' }}>
                {event.name}
              </h1>
              <p className="text-body" style={{ color: 'var(--text-secondary)', marginTop: 6, fontWeight: 500 }}>
                📍 {event.venue}
              </p>
              {event.eventDate && (
                <p className="text-caption" style={{ color: 'var(--gold-light)', marginTop: 4, fontWeight: 600 }}>
                  📅 {new Date(event.eventDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {event.description && (
                <p className="text-caption" style={{ color: 'var(--text-muted)', marginTop: 10, maxWidth: 480, marginInline: 'auto', lineHeight: 1.5 }}>
                  {event.description}
                </p>
              )}
            </div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="card card-gold-glow" style={{ padding: 32 }}>
            <div style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: 16, marginBottom: 24 }}>
              <h2 className="text-title" style={{ color: '#F8FAFC', fontSize: 18 }}>
                Attendee Pass Registration
              </h2>
              <p className="text-caption" style={{ color: 'var(--text-secondary)', marginTop: 2 }}>
                Please fill out all required details to issue your event entry pass.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 20 }}>
              {fields.map((field) => (
                <div key={field.id}>
                  <label className="input-label" style={{ marginBottom: 6 }}>
                    {field.label} {field.required && <span style={{ color: 'var(--gold-light)' }}>*</span>}
                  </label>

                  {field.type === 'EMAIL' ? (
                    <input
                      type="email"
                      className="input"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        updateResponse(field.id, e.target.value);
                      }}
                      required={field.required}
                      placeholder="your.email@example.com"
                    />
                  ) : field.type === 'SHORT_TEXT' ? (
                    <input
                      className="input"
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                    />
                  ) : field.type === 'PARAGRAPH' ? (
                    <textarea
                      className="input"
                      rows={3}
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      style={{ resize: 'vertical' }}
                    />
                  ) : field.type === 'NUMBER' ? (
                    <input
                      type="number"
                      className="input"
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                    />
                  ) : field.type === 'DATE' ? (
                    <input
                      type="date"
                      className="input"
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                    />
                  ) : field.type === 'DROPDOWN' ? (
                    <select
                      className="select"
                      value={(responses[field.id] as string) || ''}
                      onChange={(e) => updateResponse(field.id, e.target.value)}
                      required={field.required}
                    >
                      <option value="">-- Choose Option --</option>
                      {(field.options || []).map((opt, i) => (
                        <option key={i} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'RADIO' ? (
                    <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
                      {(field.options || []).map((opt, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name={field.id}
                            value={opt}
                            checked={responses[field.id] === opt}
                            onChange={() => updateResponse(field.id, opt)}
                            required={field.required}
                            style={{ accentColor: 'var(--gold-primary)', width: 16, height: 16 }}
                          />
                          <span className="text-body" style={{ color: '#F8FAFC' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : field.type === 'CHECKBOX' ? (
                    <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
                      {(field.options || []).map((opt, i) => (
                        <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={((responses[field.id] as string[]) || []).includes(opt)}
                            onChange={(e) => {
                              const cur = (responses[field.id] as string[]) || [];
                              updateResponse(
                                field.id,
                                e.target.checked ? [...cur, opt] : cur.filter((v: string) => v !== opt)
                              );
                            }}
                            style={{ accentColor: 'var(--gold-primary)', width: 16, height: 16 }}
                          />
                          <span className="text-body" style={{ color: '#F8FAFC' }}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {error && (
              <div
                style={{
                  color: 'var(--error)',
                  fontSize: 13,
                  marginTop: 20,
                  padding: '12px 16px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: 10,
                }}
              >
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-gold" style={{ width: '100%', height: 48, marginTop: 24, fontSize: 15 }} disabled={submitting}>
              {submitting ? <span className="spinner" style={{ borderTopColor: '#070709' }} /> : 'Submit Event Pass Registration →'}
            </button>
          </form>
        </div>
      </div>
    </ThemeProvider>
  );
}
