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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
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
