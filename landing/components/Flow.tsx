'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from 'framer-motion';
import { Reveal } from './Reveal';

const STEPS = [
  {
    title: 'We set up your event',
    body: '27 Media creates your event with your logo and colours, and your organising team gets its own login.',
    who: '27 Media',
  },
  {
    title: 'Build your form and publish',
    body: 'Choose the questions, pick a short name, and your form goes live at yourname.27mediaagency.com.',
    who: 'Your team',
  },
  {
    title: 'Approve registrations',
    body: 'Every sign-up lands in one list. Check the payment screenshot on WhatsApp, then approve or decline.',
    who: 'Your team',
  },
  {
    title: 'The pass arrives by email',
    body: 'Approval sends a QR pass straight to the attendee, with your event name, venue and date on it.',
    who: 'Automatic',
  },
  {
    title: 'Scan at the gate',
    body: 'Gate volunteers open the scanner with a code, check the photo, and let people in or out.',
    who: 'Gate team',
  },
];

export function Flow() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 75%', 'end 55%'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const [reached, setReached] = useState(reduce ? STEPS.length : 0);

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (reduce) return;
    setReached(Math.min(STEPS.length, Math.floor(v * STEPS.length + 0.35)));
  });

  return (
    <section className="section" id="how" aria-labelledby="how-title">
      <div className="wrap">
        <Reveal className="section-head">
          <h2 className="h2" id="how-title">
            From the first sign-up to the last person through the door.
          </h2>
          <p className="lede">
            We do the setup and the passes send themselves. Your team approves sign-ups and runs the gates, all from a phone.
          </p>
        </Reveal>

        <div className="flow-wrap">
          <span className="flow__rail" aria-hidden="true">
            <motion.span style={{ ['--p' as string]: progress }} />
          </span>
          <ol className="flow" ref={ref}>
          {STEPS.map((s, i) => (
            <li className="flow__step" key={s.title} data-on={i < reached}>
              <span className="flow__num" aria-hidden="true">
                {i + 1}
              </span>
              <div className="flow__card">
                <h3>{s.title}</h3>
                <p>{s.body}</p>
                <span className="flow__who">{s.who}</span>
              </div>
            </li>
          ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
