'use client';

import { motion, useReducedMotion } from 'framer-motion';
import {
  Camera,
  Download,
  FormInput,
  Gauge,
  Globe,
  KeyRound,
  ListChecks,
  Mail,
  Megaphone,
  Palette,
  Smartphone,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

type Tile = { icon: LucideIcon; title: string; body: string; span: string; feature?: boolean; visual?: ReactNode };

function Fields() {
  const rows = [
    ['Full name', 'Short text'],
    ['Email', 'Always required'],
    ['Committee preference', 'Dropdown'],
    ['Country preference', 'Dropdown'],
    ['Previous MUNs', 'Number'],
    ['Profile photo', 'Upload'],
  ];
  return (
    <div className="fields">
      {rows.map(([l, t]) => (
        <div key={l}>
          <span>{l}</span>
          <em>{t}</em>
        </div>
      ))}
    </div>
  );
}

function Bars() {
  const reduce = useReducedMotion();
  const h = [38, 62, 90, 74, 48, 82, 100, 66, 40, 56];
  return (
    <div className="bars" aria-hidden="true">
      {h.map((v, i) => (
        <motion.span
          key={i}
          style={{ height: `${v}%` }}
          initial={reduce ? false : { scaleY: 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 + i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
        />
      ))}
    </div>
  );
}

const TILES: Tile[] = [
  {
    icon: FormInput,
    title: 'A form builder that fits your event',
    body: 'Short answers, paragraphs, dropdowns, multiple choice, checkboxes, numbers and dates, with different fields for each category.',
    span: 'tile--w2 tile--h2',
    visual: <Fields />,
  },
  {
    icon: Globe,
    title: 'Registration on your own link',
    body: 'Publish with a short name and the form is live on its own web address, ready to drop into your Instagram bio.',
    span: 'tile--w4',
    feature: true,
    visual: (
      <div className="url-bar">
        <Globe size={16} aria-hidden="true" />
        <span>
          <b>lumun</b>.27mediaagency.com
        </span>
      </div>
    ),
  },
  {
    icon: Gauge,
    title: 'Live headcount',
    body: 'Not arrived, inside and left, counted as each pass is scanned.',
    span: 'tile--w2',
    visual: (
      <div className="counts">
        <div>
          <b>64</b>
          <span>Not in</span>
        </div>
        <div>
          <b>371</b>
          <span>Inside</span>
        </div>
        <div>
          <b>15</b>
          <span>Left</span>
        </div>
      </div>
    ),
  },
  {
    icon: Palette,
    title: 'Your colours and logo',
    body: 'Registration, dashboard and gate screens all carry your event’s look.',
    span: 'tile--w2',
    visual: (
      <div className="swatches" aria-hidden="true">
        <span style={{ background: '#1A2C56' }} />
        <span style={{ background: '#3A54A5' }} />
        <span style={{ background: '#93A6DC' }} />
        <span style={{ background: '#EEF1F8' }} />
      </div>
    ),
  },
  {
    icon: Mail,
    title: 'Passes delivered by email',
    body: 'Approving a registration sends the QR pass with your event name, venue and date. Declines get a polite email too.',
    span: 'tile--w2',
  },
  {
    icon: KeyRound,
    title: 'Gates open with a code',
    body: 'Give each volunteer a gate code. No accounts, no passwords, and you can change a code if it leaks.',
    span: 'tile--w2',
  },
  {
    icon: ListChecks,
    title: 'A record of every scan',
    body: 'Granted or refused, every scan is saved with the gate and time.',
    span: 'tile--w2',
    visual: <Bars />,
  },
  {
    icon: Camera,
    title: 'Photo check at the door',
    body: 'Collect a photo with each registration. Gate staff see it on every scan, so a forwarded pass doesn’t get someone else in.',
    span: 'tile--w3',
  },
  {
    icon: Smartphone,
    title: 'Runs on the phones you already have',
    body: 'The dashboard and scanner work in the browser and can be added to the home screen like an app. Nothing to install from a store.',
    span: 'tile--w3',
  },
  {
    icon: Megaphone,
    title: 'Announcements by email',
    body: 'Message everyone, one category, one group, or people still waiting for approval.',
    span: 'tile--w2',
  },
  {
    icon: Download,
    title: 'Spreadsheet export',
    body: 'Download every pass holder for accreditation desks, certificates or your sponsors.',
    span: 'tile--w2',
  },
  {
    icon: UserX,
    title: 'Revoke in one click',
    body: 'Delete a pass holder and their QR stops working at every gate.',
    span: 'tile--w2',
  },
];

export function Capabilities() {
  return (
    <section className="section" id="features" aria-labelledby="features-title">
      <div className="wrap">
        <Reveal className="section-head">
          <h2 className="h2" id="features-title">
            Everything between the sign-up form and the gate.
          </h2>
          <p className="lede">
            EPMS replaces the Google Form, the payment spreadsheet, the print order and the paper list at the door with one
            system your whole team can use.
          </p>
        </Reveal>

        <div className="bento">
          {TILES.map((t, i) => (
            <Reveal key={t.title} delay={(i % 3) * 0.06} className={`tile glass ${t.span} ${t.feature ? 'tile--feature' : ''}`}>
              <span className="tile__ico">
                <t.icon size={21} aria-hidden="true" />
              </span>
              <h3>{t.title}</h3>
              <p>{t.body}</p>
              {t.visual && <div className="tile__visual">{t.visual}</div>}
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
