'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Lockup } from './Lockup';
import { WhatsAppIcon } from './WhatsAppIcon';
import { audienceLink } from '@/lib/site';

const LINKS = [
  { href: '#cost', label: 'Print vs digital' },
  { href: '#who', label: 'Who it’s for' },
  { href: '#gate', label: 'Gate demo' },
  { href: '#features', label: 'Features' },
  { href: '#faq', label: 'FAQ' },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <motion.header
      className="nav"
      initial={{ y: -24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="wrap">
        <nav className="nav__bar glass glass--strong" data-scrolled={scrolled || open} aria-label="Main">
          <a href="#top" aria-label="EPMS by 27 Media, back to top" style={{ textDecoration: 'none' }}>
            <Lockup size="sm" />
          </a>
          <ul className="nav__links">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href}>{l.label}</a>
              </li>
            ))}
          </ul>
          <a className="btn btn--primary btn--sm nav__cta" href={audienceLink('general')} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={18} />
            Talk to 27 Media
          </a>
          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </nav>
        <AnimatePresence>
          {open && (
            <motion.div
              id="mobile-menu"
              className="nav__sheet glass glass--strong"
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <ul>
                {LINKS.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} onClick={() => setOpen(false)}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
              <a className="btn btn--primary btn--block" href={audienceLink('general')} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon size={18} />
                Talk to 27 Media on WhatsApp
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
