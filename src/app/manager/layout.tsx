'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';

interface EventData {
  id: string;
  name: string;
  logoUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

const NAV_ITEMS = [
  { href: '/manager', label: 'Dashboard', icon: '◈' },
  { href: '/manager/settings', label: 'Settings', icon: '⚙' },
  { href: '/manager/form-builder', label: 'Form Builder', icon: '▤' },
  { href: '/manager/publish', label: 'Publish', icon: '◉' },
  { href: '/manager/submissions', label: 'Submissions', icon: '◫' },
  { href: '/manager/participants', label: 'Participants', icon: '◑' },
  { href: '/manager/gates', label: 'Gates', icon: '⊞' },
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
        if (res.status === 401) { router.push('/login'); return; }
        const data = await res.json();
        setEvent(data.event);
      } catch { router.push('/login'); }
      finally { setLoading(false); }
    }
    check();
  }, [router]);

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  if (loading || !event) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <ThemeProvider primaryColor={event.primaryColor} secondaryColor={event.secondaryColor} accentColor={event.accentColor}>
      <ToastProvider>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          {/* Sidebar Overlay (mobile) */}
          {sidebarOpen && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside
            style={{
              width: 240,
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              position: 'fixed',
              top: 0,
              left: sidebarOpen ? 0 : -240,
              bottom: 0,
              zIndex: 50,
              transition: 'left 200ms ease',
            }}
            className="sidebar-desktop"
          >
            <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {event.logoUrl && (
                  <img src={event.logoUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                )}
                <div>
                  <div className="text-body" style={{ fontWeight: 600, lineHeight: 1.2 }}>{event.name}</div>
                  <div className="text-caption" style={{ color: 'var(--text-muted)' }}>Manager Portal</div>
                </div>
              </div>
            </div>

            <nav style={{ flex: 1, padding: '12px 8px' }}>
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: 'none',
                      background: active ? 'var(--bg-hover)' : 'transparent',
                      color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: 14,
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      marginBottom: 2,
                      transition: 'all 100ms ease',
                    }}
                  >
                    <span style={{ fontSize: 16, width: 20, textAlign: 'center' }}>{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-default)' }}>
              <button className="btn btn-ghost btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main style={{ flex: 1, marginLeft: 0 }} className="main-with-sidebar">
            {/* Mobile header */}
            <div className="mobile-header" style={{ padding: '10px 16px', borderBottom: '1px solid var(--border-default)', display: 'none', alignItems: 'center', gap: 10 }}>
              <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 20, cursor: 'pointer' }}>
                ☰
              </button>
              <span className="text-title">{event.name}</span>
            </div>
            {children}
          </main>
        </div>

        <style>{`
          @media (min-width: 769px) {
            .sidebar-desktop { left: 0 !important; }
            .main-with-sidebar { margin-left: 240px !important; }
          }
          @media (max-width: 768px) {
            .mobile-header { display: flex !important; }
          }
        `}</style>
      </ToastProvider>
    </ThemeProvider>
  );
}
