'use client';

import { useState } from 'react';
import { Phone } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Reveal } from './Reveal';
import { WHATSAPP_DISPLAY, audienceLink, whatsappLink } from '@/lib/site';

const KINDS = ['MUN conference', 'Society event', 'Corporate event', 'Concert or show', 'Something else'];

export function Enquiry() {
  const [kind, setKind] = useState(KINDS[0]);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');
  const [size, setSize] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const details = [
      name.trim() && `Name: ${name.trim()}`,
      org.trim() && `Organisation: ${org.trim()}`,
      `Event type: ${kind}`,
      size && `Expected attendees: ${size}`,
      date && `Event date: ${date}`,
      notes.trim() && `Details: ${notes.trim()}`,
    ].filter(Boolean);
    const message = ['Hi 27 Media, I’d like to use EPMS for our event.', '', ...details].join('\n');
    window.open(whatsappLink(message), '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="section" id="contact" aria-labelledby="contact-title">
      <div className="wrap">
        <Reveal className="enquiry glass">
          <span className="brand-mark enquiry__mark" aria-hidden="true" />
          <div style={{ position: 'relative' }}>
            <h2 className="h2" id="contact-title">
              Tell us about your event.
            </h2>
            <p className="lede">
              Fill in what you know and we’ll pick it up on WhatsApp with pricing and a setup plan. Prefer to just chat?
              Message us directly.
            </p>
            <div className="contact-line">
              <a className="btn btn--ghost" href={audienceLink('general')} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon />
                Open WhatsApp chat
              </a>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <Phone size={16} aria-hidden="true" />
                <a href={`tel:+923001526303`}>{WHATSAPP_DISPLAY}</a>
              </span>
            </div>
          </div>

          <form className="form" onSubmit={onSubmit} style={{ position: 'relative' }}>
            <div>
              <label className="input-label" htmlFor="q-name">
                Your name
              </label>
              <input id="q-name" className="input" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Hamza Ali" />
            </div>
            <div>
              <label className="input-label" htmlFor="q-org">
                School, society or company
              </label>
              <input id="q-org" className="input" autoComplete="organization" value={org} onChange={(e) => setOrg(e.target.value)} placeholder="Lahore Grammar MUN Society" />
            </div>
            <fieldset className="form__full" style={{ border: 0, margin: 0, padding: 0 }}>
              <legend className="input-label">What are you organising?</legend>
              <div className="chips">
                {KINDS.map((k) => (
                  <button key={k} type="button" className="chip" aria-pressed={kind === k} onClick={() => setKind(k)}>
                    {k}
                  </button>
                ))}
              </div>
            </fieldset>
            <div>
              <label className="input-label" htmlFor="q-size">
                Expected attendees
              </label>
              <input
                id="q-size"
                className="input"
                inputMode="numeric"
                value={size}
                onChange={(e) => setSize(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="450"
              />
            </div>
            <div>
              <label className="input-label" htmlFor="q-date">
                Event date
              </label>
              <input id="q-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ colorScheme: 'dark' }} />
            </div>
            <div className="form__full">
              <label className="input-label" htmlFor="q-notes">
                Anything else we should know
              </label>
              <textarea
                id="q-notes"
                className="input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Number of days, committees, gates at the venue…"
                maxLength={600}
              />
            </div>
            <div className="form__full">
              <button type="submit" className="btn btn--primary btn--block">
                <WhatsAppIcon />
                Continue on WhatsApp
              </button>
              <p style={{ margin: '12px 0 0', fontSize: 13.5, color: 'var(--faint)', textAlign: 'center' }}>
                Opens WhatsApp with your details filled in. Nothing is sent until you press send.
              </p>
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
