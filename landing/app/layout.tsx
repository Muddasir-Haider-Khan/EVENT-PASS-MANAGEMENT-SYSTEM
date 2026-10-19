import type { Metadata, Viewport } from 'next';
import { Michroma, Urbanist } from 'next/font/google';
import './globals.css';
import { SITE_URL } from '@/lib/site';

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

// Same stand-in as the product for the brand's Vipnagorgialla (not web-licensed)
const brandDisplay = Michroma({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

const title = 'EPMS by 27 Media — Digital event passes for MUNs and events';
const description =
  'Stop printing passes. EPMS by 27 Media Agency emails every delegate and guest a QR pass, runs your registration form on your own link, and lets your gate team scan entries and exits from a phone.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: 'EPMS',
  authors: [{ name: '27 Media Agency' }],
  keywords: [
    'MUN passes',
    'digital event pass',
    'QR event pass Pakistan',
    'event registration',
    'gate entry scanning',
    'delegate passes',
    '27 Media Agency',
    'EPMS',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    url: SITE_URL,
    siteName: 'EPMS by 27 Media',
    title,
    description,
    locale: 'en_PK',
  },
  twitter: { card: 'summary_large_image', title, description },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0B0F19',
  width: 'device-width',
  initialScale: 1,
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'EPMS — Event Pass Management System',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  url: SITE_URL,
  description,
  publisher: { '@type': 'Organization', name: '27 Media Agency', url: 'https://27mediaagency.com' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${urbanist.variable} ${brandDisplay.variable}`}>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <div className="atmos" aria-hidden="true">
          <div className="atmos__pool atmos__pool--a" />
          <div className="atmos__pool atmos__pool--b" />
          <div className="atmos__pool atmos__pool--c" />
          <div className="atmos__grain" />
        </div>
        {children}
      </body>
    </html>
  );
}
