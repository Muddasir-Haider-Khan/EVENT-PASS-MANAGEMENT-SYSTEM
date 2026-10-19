'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { SidebarShell, type ShellAction, type ShellTab } from '@/components/AppShell';
import {
  Building2,
  Globe,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  QrCode,
  ScanLine,
  Settings,
  Share2,
  Tags,
  Ticket,
} from 'lucide-react';

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
  { href: '/manager', label: 'Overview', icon: LayoutDashboard, group: 'Event' },
  { href: '/manager/submissions', label: 'Submissions', icon: Inbox, group: 'Event' },
  { href: '/manager/participants', label: 'Pass holders', icon: Ticket, group: 'Event' },
  { href: '/manager/types', label: 'Categories', icon: Tags, group: 'Setup' },
  { href: '/manager/groups', label: 'Delegations', icon: Building2, group: 'Setup' },
  { href: '/manager/gates', label: 'Gates', icon: ScanLine, group: 'Setup' },
  { href: '/manager/settings', label: 'Settings', icon: Settings, group: 'Setup' },
  { href: '/manager/broadcast', label: 'Broadcast', icon: Mail, group: 'Outreach' },
  { href: '/manager/publish', label: 'Publish', icon: Share2, group: 'Outreach' },
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
    { label: 'Gate scanner', icon: QrCode, href: '/gate' },
    ...(event.slug
      ? [{ label: 'Public form', icon: Globe, href: `/event/${event.slug}`, external: true }]
      : []),
    { label: 'Sign out', icon: LogOut, onClick: handleLogout, tone: 'danger' as const },
  ];

  return (
    <ThemeProvider
      primaryColor={event.primaryColor}
      secondaryColor={event.secondaryColor}
      accentColor={event.accentColor}
    >
      <ToastProvider>
        <SidebarShell
          tabs={MANAGER_TABS}
          actions={actions}
          identity={{
            name: event.name,
            subtitle: `${event.status.charAt(0)}${event.status.slice(1).toLowerCase()} · Event manager`,
            logoUrl: event.logoUrl,
          }}
        >
          {children}
        </SidebarShell>
      </ToastProvider>
    </ThemeProvider>
  );
}
