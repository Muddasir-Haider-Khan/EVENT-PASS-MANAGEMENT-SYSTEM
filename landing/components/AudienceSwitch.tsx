'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  BadgeCheck,
  Building2,
  CalendarRange,
  Download,
  FileText,
  GraduationCap,
  Link2,
  Mail,
  ScanLine,
  ShieldCheck,
  Users,
  UserX,
  Wallet,
  DoorOpen,
  Activity,
  Palette,
  type LucideIcon,
} from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { Reveal } from './Reveal';
import { audienceLink, type Audience } from '@/lib/site';

type Item = { icon: LucideIcon; title: string; body: string };

const CONTENT: Record<Audience, { tab: string; icon: LucideIcon; quote: string; body: string; cta: string; items: Item[] }> = {
  mun: {
    tab: 'MUNs and societies',
    icon: GraduationCap,
    quote: 'Run registration, payments and entry for your conference from one dashboard your OC can share.',
    body: 'Made for student organising committees who are tired of chasing a print shop the night before day one. Pick MUN when your event is created and delegate categories are ready to go.',
    cta: 'Get EPMS for our MUN',
    items: [
      {
        icon: Users,
        title: 'Delegates and Executive Board, ready made',
        body: 'MUN events start with both categories. Add Press, Faculty Advisors or OC members whenever you need.',
      },
      {
        icon: FileText,
        title: 'Different questions for each category',
        body: 'Ask delegates for committee and country preferences and ask the EB something else, on the same link.',
      },
      {
        icon: BadgeCheck,
        title: 'Delegation sign-ups',
        body: 'A head delegate registers the whole school delegation in one go, with the group size you set.',
      },
      {
        icon: Wallet,
        title: 'Payment check before approval',
        body: 'Delegates see your account number and WhatsApp for the screenshot. You approve once the payment lands.',
      },
      {
        icon: CalendarRange,
        title: 'One pass for all three days',
        body: 'Set how many entries a category gets. The pass works each day and retires itself after the last one.',
      },
      {
        icon: Mail,
        title: 'Email a committee or a delegation',
        body: 'Send schedule changes to all delegates, one group, or everyone still waiting for approval.',
      },
    ],
  },
  enterprise: {
    tab: 'Enterprise events',
    icon: Building2,
    quote: 'Controlled entry for summits, expos and concerts, with a record of every scan.',
    body: 'For organisers who need to know who is inside, keep gate queues moving, and hand the client a clean attendance report after the event.',
    cta: 'Discuss EPMS for our event',
    items: [
      {
        icon: DoorOpen,
        title: 'Separate entry and exit gates',
        body: 'Create as many gates as your venue has. Each one opens with its own access code, with no staff accounts to manage.',
      },
      {
        icon: ScanLine,
        title: 'Hardware scanners or any phone',
        body: 'USB and Bluetooth QR scanners work straight away. Without one, the gate uses the phone or laptop camera.',
      },
      {
        icon: Activity,
        title: 'Live headcount',
        body: 'See who hasn’t arrived, who is inside and who has left, updated as each pass is scanned.',
      },
      {
        icon: Download,
        title: 'Attendance export',
        body: 'Download every pass holder as a spreadsheet for accreditation desks, backup lists or the client report.',
      },
      {
        icon: UserX,
        title: 'Revoke a pass instantly',
        body: 'Remove a pass holder and their QR stops working at every gate on the next scan.',
      },
      {
        icon: Palette,
        title: 'Your brand, not ours',
        body: 'Your logo, colours and font across the registration page, the dashboard and the gate screens.',
      },
    ],
  },
};

const ORDER: Audience[] = ['mun', 'enterprise'];

export function AudienceSwitch() {
  const [active, setActive] = useState<Audience>('mun');
  const reduce = useReducedMotion();
  const c = CONTENT[active];

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const next = ORDER[(ORDER.indexOf(active) + 1) % ORDER.length];
    setActive(next);
    document.getElementById(`tab-${next}`)?.focus();
  };

  return (
    <section className="section" id="who" aria-labelledby="who-title">
      <div className="wrap">
        <Reveal className="section-head">
          <h2 className="h2" id="who-title">
            Same system, set up for the event you’re running.
          </h2>
          <p className="lede">
            Most of our organisers are students running MUNs and society events. The same platform runs corporate summits
            and ticketed shows with a few more gates.
          </p>
        </Reveal>

        <Reveal>
          <div className="switch glass" role="tablist" aria-label="Choose your event type" onKeyDown={onKey}>
            {ORDER.map((key) => {
              const Icon = CONTENT[key].icon;
              const selected = key === active;
              return (
                <button
                  key={key}
                  id={`tab-${key}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls="who-panel"
                  tabIndex={selected ? 0 : -1}
                  className="switch__btn"
                  onClick={() => setActive(key)}
                >
                  {selected && (
                    <motion.span
                      layoutId="switch-pill"
                      className="switch__pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <Icon size={18} aria-hidden="true" />
                  {CONTENT[key].tab}
                </button>
              );
            })}
          </div>
        </Reveal>

        <div id="who-panel" role="tabpanel" aria-labelledby={`tab-${active}`}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              className="aud"
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="aud__story glass">
                <p className="aud__quote" style={{ margin: 0 }}>
                  {c.quote}
                </p>
                <p className="body">{c.body}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 'auto', paddingTop: 8 }}>
                  <a className="btn btn--primary" href={audienceLink(active)} target="_blank" rel="noopener noreferrer">
                    <WhatsAppIcon />
                    {c.cta}
                  </a>
                </div>
                <div className="url-bar" style={{ marginTop: 6 }}>
                  {active === 'mun' ? <Link2 size={16} aria-hidden="true" /> : <ShieldCheck size={16} aria-hidden="true" />}
                  {active === 'mun' ? (
                    <span>
                      <b>yourmun</b>.27mediaagency.com
                    </span>
                  ) : (
                    <span>A pass only ever works at its own event</span>
                  )}
                </div>
              </div>

              <div className="aud__list">
                {c.items.map((it, i) => (
                  <motion.div
                    className="aud__item"
                    key={it.title}
                    initial={reduce ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 + i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <span className="aud__ico">
                      <it.icon size={19} aria-hidden="true" />
                    </span>
                    <div>
                      <h3>{it.title}</h3>
                      <p>{it.body}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
