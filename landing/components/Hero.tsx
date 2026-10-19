'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'framer-motion';
import { Check, MailCheck, ShieldX, Users } from 'lucide-react';
import { WhatsAppIcon } from './WhatsAppIcon';
import { audienceLink } from '@/lib/site';

const EASE = [0.2, 0.8, 0.2, 1] as const;

const HEADLINE = ['Event passes,', 'minus the', 'print shop.'];

const EVENTS = [
  { icon: MailCheck, tone: 'var(--brand)', title: 'Pass emailed', sub: 'Approved after payment check' },
  { icon: Check, tone: '#3fa26f', title: 'Entry granted', sub: 'Main gate, day 1 of 3' },
  { icon: ShieldX, tone: '#d6474c', title: 'Already inside', sub: 'A copied pass was stopped' },
];

export function Hero({ qrSvg }: { qrSvg: string }) {
  const reduce = useReducedMotion();

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="wrap hero__grid">
        <div>
          <motion.a
            href="https://27mediaagency.com"
            target="_blank"
            rel="noopener noreferrer"
            className="maker glass"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: EASE }}
          >
            <span className="brand-mark" style={{ height: 20 }} aria-hidden="true" />
            <span>
              A product of <strong>27 Media Agency</strong>
            </span>
          </motion.a>

          <h1 className="display" id="hero-title">
            {HEADLINE.map((line, i) => (
              <span className="headline-line" key={line}>
                <motion.span
                  initial={reduce ? false : { y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.9, delay: 0.25 + i * 0.11, ease: EASE }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            className="lede"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.65, ease: EASE }}
          >
            EPMS emails every delegate and guest a QR pass the moment you approve them, and your gate team scans it on any
            phone. Nothing to print, nothing to reprint when a name is misspelt, and a photocopied pass can’t walk a second
            person through the door.
          </motion.p>

          <motion.div
            className="hero__actions"
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.78, ease: EASE }}
          >
            <a className="btn btn--primary" href={audienceLink('general')} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon />
              Get EPMS for your event
            </a>
            <a className="btn btn--ghost" href="#gate">
              Try the gate demo
            </a>
          </motion.div>

          <motion.ul
            className="hero__proof"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.95 }}
          >
            <li>
              <Check size={16} strokeWidth={3} aria-hidden="true" />
              Made for MUNs and student societies
            </li>
            <li>
              <Check size={16} strokeWidth={3} aria-hidden="true" />
              Your own registration link
            </li>
            <li>
              <Check size={16} strokeWidth={3} aria-hidden="true" />
              Scanners and phone cameras
            </li>
          </motion.ul>
        </div>

        <PassStage qrSvg={qrSvg} />
      </div>
    </section>
  );
}

function PassStage({ qrSvg }: { qrSvg: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  // Pointer position over the stage, -0.5..0.5, eased through springs
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 140, damping: 18 });
  const sy = useSpring(py, { stiffness: 140, damping: 18 });
  const rotateY = useTransform(sx, [-0.5, 0.5], [-14, 14]);
  const rotateX = useTransform(sy, [-0.5, 0.5], [12, -12]);
  const gx = useTransform(sx, [-0.5, 0.5], ['0%', '100%']);
  const gy = useTransform(sy, [-0.5, 0.5], ['0%', '100%']);
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgba(255,255,255,0.22), transparent 45%)`;

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse' || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  const [step, setStep] = useState(0);
  const [inside, setInside] = useState(386);
  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => {
      setStep((s) => (s + 1) % EVENTS.length);
      setInside((n) => (n >= 412 ? 386 : n + 1 + Math.floor(Math.random() * 4)));
    }, 2800);
    return () => window.clearInterval(id);
  }, [reduce]);
  const ev = EVENTS[step];

  return (
    <motion.div
      ref={ref}
      className="pass-stage"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      initial={reduce ? false : { opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1.1, delay: 0.35, ease: EASE }}
    >
      <div className="pass-halo" aria-hidden="true" />

      <motion.div
        className="pass"
        style={{ rotateX, rotateY }}
        animate={reduce ? undefined : { y: [0, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        role="img"
        aria-label="Sample EPMS pass for a MUN delegate. The QR code opens a WhatsApp chat with 27 Media."
      >
        <motion.div className="pass__glare" style={{ background: glare }} aria-hidden="true" />
        <span className="pass__notch" style={{ left: -12 }} aria-hidden="true" />
        <span className="pass__notch" style={{ right: -12 }} aria-hidden="true" />

        <div className="pass__head">
          <div>
            <div className="pass__event">Model UN 2026</div>
            <div className="pass__meta">3-day conference</div>
          </div>
          <span className="pass__type">Delegate</span>
        </div>

        <div className="pass__holder">
          <span className="avatar" aria-hidden="true">
            AK
          </span>
          <div>
            <div className="pass__name">Ayesha Khan</div>
            <div className="pass__role">DISEC, Pakistan</div>
          </div>
        </div>

        <div className="pass__qr">
          <div dangerouslySetInnerHTML={{ __html: qrSvg }} />
          {!reduce && (
            <motion.span
              className="pass__beam"
              aria-hidden="true"
              initial={{ top: '6%' }}
              animate={{ top: ['6%', '92%', '6%'] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </div>

        <div className="pass__foot">
          <span>
            Valid for <strong>3 entries</strong>
          </span>
          <span>Scan me to chat with us</span>
        </div>
      </motion.div>

      <div className="status-toast status-toast--a glass glass--strong" aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <span className="status-toast__dot" style={{ background: ev.tone }}>
              <ev.icon size={18} aria-hidden="true" />
            </span>
            <span>
              <span className="status-toast__title" style={{ display: 'block' }}>
                {ev.title}
              </span>
              <span className="status-toast__sub">{ev.sub}</span>
            </span>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="status-toast status-toast--b glass glass--strong">
        <span className="status-toast__dot" style={{ background: 'var(--navy)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)' }}>
          <Users size={18} aria-hidden="true" />
        </span>
        <span>
          <span className="status-toast__title num" style={{ display: 'block' }}>
            {inside} inside right now
          </span>
          <span className="status-toast__sub">of 450 approved delegates</span>
        </span>
      </div>
    </motion.div>
  );
}
