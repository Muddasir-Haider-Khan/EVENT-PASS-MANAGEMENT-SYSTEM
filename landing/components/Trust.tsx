import { Fingerprint, Lock, Shuffle, Ticket } from 'lucide-react';
import { Reveal } from './Reveal';

const ITEMS = [
  {
    icon: Fingerprint,
    title: 'Passes that can’t be guessed',
    body: 'Each QR carries a long random code, not a name or roll number, so nobody can make a working pass for themselves.',
  },
  {
    icon: Ticket,
    title: 'Locked to its own event',
    body: 'A pass from another conference, or last year’s, is refused at your gate and logged as invalid.',
  },
  {
    icon: Shuffle,
    title: 'One pass, one person inside',
    body: 'If two gates scan the same pass at the same moment, only one is let in. The other sees “Already inside”.',
  },
  {
    icon: Lock,
    title: 'Separate access for each role',
    body: 'Organisers, gate volunteers and 27 Media each get their own access. Logins and forms are protected against spam and guessing.',
  },
];

export function Trust() {
  return (
    <section className="section" id="security" aria-labelledby="security-title">
      <div className="wrap">
        <Reveal className="section-head">
          <h2 className="h2" id="security-title">
            Built so the wrong people don’t get in.
          </h2>
        </Reveal>
        <div className="trust">
          {ITEMS.map((it, i) => (
            <Reveal key={it.title} delay={i * 0.06} className="trust__item">
              <h3>
                <it.icon size={19} aria-hidden="true" />
                {it.title}
              </h3>
              <p>{it.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
