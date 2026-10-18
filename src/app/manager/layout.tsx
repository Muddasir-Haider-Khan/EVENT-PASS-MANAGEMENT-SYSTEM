'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { Media27Logo } from '@/components/27MediaLogo';
import { AppShell, type ShellAction, type ShellTab } from '@/components/AppShell';
import { Globe, LogOut, QrCode } from 'lucide-react';

interface EventData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  slug: string | null;
  status: string;
}

const MANAGER_TABS: ShellTab[] = [
  { href: '/manager', label: 'Overview' },
  { href: '/manager/submissions', label: 'Submissions' },
  { href: '/manager/participants', label: 'Pass holders' },
  { href: '/manager/types', label: 'Categories' },
  { href: '/manager/groups', label: 'Delegations' },
  { href: '/manager/gates', label: 'Gates' },
  { href: '/manager/broadcast', label: 'Broadcast' },
  { href: '/manager/publish', label: 'Publish' },
  { href: '/manager/settings', label: 'Settings' },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/manager/dashboard');
        if (res.status === 401) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setEvent(data.event);
      } catch {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    check();
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted">
          <span className="spinner" />
          <p className="text-[13px] font-medium">Loading event workspace…</p>
        </div>
      </div>
    );
  }

  const actions: ShellAction[] = [
    { label: 'Open gate scanner', icon: QrCode, href: '/gate' },
    ...(event.slug
      ? [{ label: 'View public registration form', icon: Globe, href: `/event/${event.slug}`, external: true }]
      : []),
    { label: 'Sign out', icon: LogOut, onClick: handleLogout, tone: 'danger' as const },
  ];

  const identity = (
    <div className="hidden sm:flex items-center gap-2.5 pl-1.5 pr-1 h-11 rounded-full border border-line bg-surface max-w-[260px]">
      <span className="text-right min-w-0 hidden md:block">
        <span className="block text-[13px] font-semibold truncate">{event.name}</span>
        <span className="block text-[11.5px] text-muted capitalize">{event.status.toLowerCase()} · Event manager</span>
      </span>
      {event.logoUrl ? (
        <img src={event.logoUrl} alt="" className="w-9 h-9 rounded-full object-cover flex-none" />
      ) : (
        <span className="w-9 h-9 rounded-full bg-pill text-on-pill flex items-center justify-center text-[13px] font-bold flex-none">
          {event.name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );

  return (
    <ThemeProvider
      primaryColor={event.primaryColor}
      secondaryColor={event.secondaryColor}
      accentColor={event.accentColor}
    >
      <ToastProvider>
        <AppShell brand={<Media27Logo size="sm" showSubtitle={false} />} tabs={MANAGER_TABS} actions={actions} identity={identity}>
          {children}
        </AppShell>
      </ToastProvider>
    </ThemeProvider>
  );
}
