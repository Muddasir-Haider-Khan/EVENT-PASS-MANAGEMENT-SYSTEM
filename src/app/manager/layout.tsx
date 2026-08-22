'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { Media27Logo } from '@/components/27MediaLogo';
import {
  LayoutDashboard,
  Sliders,
  Inbox,
  Users,
  Shield,
  Share2,
  QrCode,
  Globe,
  LogOut,
  Menu,
  X,
  Tags,
  Building,
  Mail,
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

const MANAGER_NAV_ITEMS = [
  { href: '/manager', label: 'Dashboard Overview', icon: LayoutDashboard },
  { href: '/manager/types', label: 'Participant Categories / Types', icon: Tags },
  { href: '/manager/groups', label: 'Delegations & Groups', icon: Building },
  { href: '/manager/broadcast', label: 'Targeted Email Broadcaster', icon: Mail },
  { href: '/manager/settings', label: 'Event Branding & Settings', icon: Sliders },
  { href: '/manager/submissions', label: 'Submissions Triage', icon: Inbox },
  { href: '/manager/participants', label: 'Pass Holders & Attendees', icon: Users },
  { href: '/manager/gates', label: 'Gate Control & Scanner Accounts', icon: Shield },
  { href: '/manager/publish', label: 'Publish & QR Distribution', icon: Share2 },
  { href: '/gate', label: 'Open Gate Scanner', icon: QrCode },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Loading Manager Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider
      primaryColor={event.primaryColor}
      secondaryColor={event.secondaryColor}
      accentColor={event.accentColor}
    >
      <ToastProvider>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Manager Sidebar */}
          <aside
            className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
              sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Header Brand */}
            <div className="p-5 border-b border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <Media27Logo size="sm" />
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="md:hidden text-slate-400 hover:text-white p-1"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
                {event.logoUrl ? (
                  <img
                    src={event.logoUrl}
                    alt={event.name}
                    className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs">
                    {event.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-white truncate">{event.name}</p>
                  <p className="text-[10px] font-medium text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {event.status} Manager
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              <div className="text-[10px] font-bold tracking-wider text-slate-400 px-3 pb-2 uppercase">
                Event Management
              </div>
              {MANAGER_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      router.push(item.href);
                      setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 shadow-sm'
                        : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${active ? 'text-indigo-400' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800 space-y-2">
              {event.slug && (
                <a
                  href={`/event/${event.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full p-2 text-xs font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-xl transition"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Public Pass Form ↗</span>
                </a>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full p-2 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </aside>

          {/* Main Content & Mobile Viewport */}
          <main className="flex-1 md:ml-64 min-h-screen flex flex-col pb-20 md:pb-0 min-w-0">
            {/* Mobile Top Header */}
            <header className="md:hidden sticky top-0 z-30 px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 hover:text-white"
                  aria-label="Open Navigation"
                >
                  <Menu className="w-5 h-5" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xs font-bold text-white truncate max-w-[160px]">{event.name}</h1>
                  <p className="text-[10px] text-indigo-400 font-medium">Enterprise Portal</p>
                </div>
              </div>

              <button
                onClick={() => router.push('/gate')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-indigo-600/30"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Gate Scan</span>
              </button>
            </header>

            <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>

            {/* Mobile Bottom Navigation Bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-slate-900/95 border-t border-slate-800 backdrop-blur-lg z-30 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)]">
              {[
                { href: '/manager', label: 'Overview', icon: LayoutDashboard },
                { href: '/manager/submissions', label: 'Requests', icon: Inbox },
                { href: '/manager/participants', label: 'Attendees', icon: Users },
                { href: '/manager/gates', label: 'Gates', icon: Shield },
                { href: '/manager/settings', label: 'Branding', icon: Sliders },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = pathname === tab.href;
                return (
                  <button
                    key={tab.href}
                    onClick={() => router.push(tab.href)}
                    className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer transition ${
                      active ? 'text-indigo-400 font-semibold' : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'scale-110 text-indigo-400' : ''}`} />
                    <span className="text-[10px] mt-0.5">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </main>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
