'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/Toast';
import { Media27Logo } from '@/components/27MediaLogo';
import {
  LayoutDashboard,
  PlusCircle,
  QrCode,
  Globe,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Events Overview', icon: LayoutDashboard },
  { href: '/admin/events/new', label: 'Create New Event', icon: PlusCircle },
  { href: '/gate', label: 'Gate Scanner App', icon: QrCode },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased">
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/80 z-40 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Super Admin Fixed Sidebar */}
        <aside
          className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Brand Header */}
          <div className="p-6 border-b border-slate-800 flex flex-col items-start gap-2">
            <div className="flex items-center justify-between w-full">
              <Media27Logo size="sm" />
              <button
                onClick={() => setSidebarOpen(false)}
                className="md:hidden text-slate-400 hover:text-white p-1"
                aria-label="Close sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <span className="text-[10px] font-bold tracking-widest text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-0.5 rounded-full uppercase">
              Super Admin Portal
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4 space-y-1">
            <div className="text-[11px] font-bold tracking-wider text-slate-400 px-3 pb-2 uppercase">
              Management Tabs
            </div>
            {ADMIN_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    router.push(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 cursor-pointer ${
                    active
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-sm'
                      : 'border-transparent text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Footer Controls */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            <a
              href="https://www.27mediaagency.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full p-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-950 border border-slate-800 rounded-xl transition hover:border-slate-700"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>27mediaagency.com ↗</span>
            </a>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center gap-2 w-full p-2.5 text-xs font-medium text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl transition cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-64 min-h-screen flex flex-col">
          {/* Mobile Top Navigation Header */}
          <header className="md:hidden sticky top-0 z-30 px-4 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-slate-200 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                aria-label="Open navigation sidebar"
              >
                <Menu className="w-6 h-6" />
              </button>
              <Media27Logo size="sm" showSubtitle={false} />
            </div>
            <button
              onClick={() => router.push('/admin/events/new')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl transition shadow-sm"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Event</span>
            </button>
          </header>

          <div className="flex-1 p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </ToastProvider>
  );
}
