import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'EPMS — Event Pass Management System',
  description: 'Production-grade event registration and QR-based gate access control platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
