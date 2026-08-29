import type { Metadata } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/PwaRegister';

export const metadata: Metadata = {
  title: 'EPMS — Event Pass Management System',
  description: 'Production-grade event registration and QR-based gate access control platform',
  manifest: '/manifest.json',
  themeColor: '#020617',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'EPMS',
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=3', sizes: 'any' },
      { url: '/favicon-32x32.png?v=3', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png?v=3', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/favicon.ico?v=3',
    apple: '/apple-touch-icon.png?v=3',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico?v=3" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=3" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=3" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#020617" />
      </head>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
