'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Reveal } from './Reveal';

const QA = [
  {
    q: 'Do delegates need to download an app?',
    a: 'No. The pass arrives by email and they show the QR on their phone at the gate. If someone prefers paper, they can print the email themselves.',
  },
  {
    q: 'What do our gate volunteers need?',
    a: 'Any smartphone or laptop with a camera, or a USB or Bluetooth QR scanner if you have one. They open the gate page, type the gate code you give them, and start scanning.',
  },
  {
    q: 'Does it work if the venue’s internet is weak?',
    a: 'Each scan is checked online, so gates need mobile data or Wi-Fi. A scan is a tiny request and ordinary 4G handles it. For peace of mind, download the pass holder spreadsheet before the event as a backup list.',
  },
  {
    q: 'Does EPMS collect payments?',
    a: 'Not directly. Your registration page shows your account number and the WhatsApp number for payment screenshots. You approve each delegate once you’ve confirmed their payment, and only then is the pass sent.',
  },
  {
    q: 'Our conference runs over three days. Do delegates get three passes?',
    a: 'One pass covers it. You set how many entries each category gets, and the same QR works every day until those entries are used.',
  },
  {
    q: 'Can delegates and the Executive Board fill different forms?',
    a: 'Yes. Each category can ask its own questions, and a delegation can be registered together by its head delegate.',
  },
  {
    q: 'Can we use our own logo and colours?',
    a: 'Yes. Your logo, colours and font appear on the registration page, your dashboard and the gate scanner.',
  },
  {
    q: 'How do we get started, and what does it cost?',
    a: 'Message 27 Media on WhatsApp with your event date and how many people you expect. We’ll send pricing for your event, set it up with your branding, and hand your team the login.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const reduce = useReducedMotion();
  return (
    <section className="section" id="faq" aria-labelledby="faq-title">
      <div className="wrap">
        <Reveal className="section-head section-head--center">
          <h2 className="h2" id="faq-title">
            Questions organisers ask us
          </h2>
        </Reveal>
        <div className="faq">
          {QA.map((item, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={item.q} delay={Math.min(i, 4) * 0.04} className="faq__item glass">
                <h3 style={{ margin: 0 }}>
                  <button
                    type="button"
                    className="faq__q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    id={`faq-q-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    {item.q}
                    <span className="faq__icon" aria-hidden="true">
                      <Plus size={17} />
                    </span>
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`faq-a-${i}`}
                      role="region"
                      aria-labelledby={`faq-q-${i}`}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={reduce ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <p className="faq__a" style={{ margin: 0 }}>
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
