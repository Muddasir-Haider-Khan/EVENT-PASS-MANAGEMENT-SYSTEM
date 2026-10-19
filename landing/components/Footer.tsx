import { Lockup } from './Lockup';
import { APP_URL, audienceLink } from '@/lib/site';

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__row">
          <Lockup size="md" />
          <ul className="footer__links">
            <li>
              <a href="#features">Features</a>
            </li>
            <li>
              <a href="#gate">Gate demo</a>
            </li>
            <li>
              <a href="#faq">FAQ</a>
            </li>
            <li>
              <a href={audienceLink('general')} target="_blank" rel="noopener noreferrer">
                WhatsApp
              </a>
            </li>
            <li>
              <a href={`${APP_URL}/login`}>Organiser login</a>
            </li>
          </ul>
        </div>
        <p className="footer__fine">
          EPMS is designed, built and run by{' '}
          <a href="https://27mediaagency.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--muted)' }}>
            27 Media Agency
          </a>
          . © {new Date().getFullYear()} 27 Media Agency. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
