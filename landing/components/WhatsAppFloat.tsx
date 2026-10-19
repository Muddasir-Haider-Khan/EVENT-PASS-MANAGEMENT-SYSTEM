'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { WhatsAppIcon } from './WhatsAppIcon';
import { audienceLink } from '@/lib/site';

/** Appears once the hero call to action has scrolled away. */
export function WhatsAppFloat() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > window.innerHeight * 0.8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <AnimatePresence>
      {show && (
        <motion.a
          className="wa-float"
          href={audienceLink('general')}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with 27 Media on WhatsApp"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 360, damping: 26 }}
        >
          <WhatsAppIcon size={22} />
          <span>Chat with us</span>
        </motion.a>
      )}
    </AnimatePresence>
  );
}
