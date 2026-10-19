import type { Metadata } from 'next';
import { Michroma, Urbanist } from 'next/font/google';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';
import { THEME_STORAGE_KEY } from '@/lib/theme';

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-sans',
  display: 'swap',
});

// Wide display face standing in for the brand's Vipnagorgialla (not web-licensed);
// used only for the wordmark and page titles.
const brandDisplay = Michroma({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-display',
  display: 'swap',
});

// Runs before first paint so a saved light theme never flashes dark
const themeBootstrap = `try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='light'||t==='dark')document.documentElement.setAttribute('data-theme',t)}catch(e){}`;

export const metadata: Metadata = {
  title: '27 Media EPMS — Event Pass Management',
  description: 'Production-grade event registration and QR-based gate access control platform',
  manifest: '/manifest.json',
  themeColor: '#0B0F19',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EPMS',
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=4', sizes: 'any' },
      { url: '/favicon-32x32.png?v=4', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png?v=4', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/favicon.ico?v=4',
    apple: '/apple-touch-icon.png?v=4',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark" className={`${urbanist.variable} ${brandDisplay.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <link rel="icon" href="/favicon.ico?v=4" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=4" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=4" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=4" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0B0F19" />
      </head>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
