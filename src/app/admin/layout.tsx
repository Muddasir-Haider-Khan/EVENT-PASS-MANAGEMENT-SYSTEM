'use client';

import { useRouter } from 'next/navigation';
import { ToastProvider } from '@/components/Toast';
import { Media27Logo } from '@/components/27MediaLogo';
import { AppShell, type ShellAction, type ShellTab } from '@/components/AppShell';
import { LogOut, Plus, QrCode } from 'lucide-react';

const ADMIN_TABS: ShellTab[] = [
  { href: '/admin', label: 'Events', match: ['/admin/events/'] },
  { href: '/admin/events/new', label: 'New event' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const actions: ShellAction[] = [
    { label: 'Create event', icon: Plus, href: '/admin/events/new' },
    { label: 'Open gate scanner', icon: QrCode, href: '/gate' },
    { label: 'Sign out', icon: LogOut, onClick: handleLogout, tone: 'danger' },
  ];

  const identity = (
    <span className="hidden sm:inline-flex items-center h-11 px-4 rounded-full border border-line bg-surface text-[12.5px] font-semibold">
      Super admin
    </span>
  );

  return (
    <ToastProvider>
      <AppShell brand={<Media27Logo size="sm" />} tabs={ADMIN_TABS} actions={actions} identity={identity}>
        {children}
      </AppShell>
    </ToastProvider>
  );
}
