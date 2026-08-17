'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/Toast';
import { Media27Logo } from '@/components/27MediaLogo';

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
  { href: '/manager', label: 'Dashboard Overview', icon: '◈' },
  { href: '/manager/settings', label: 'Event Branding & Settings', icon: '⚙' },
  { href: '/manager/form-builder', label: 'Form Builder', icon: '▤' },
  { href: '/manager/submissions', label: 'Submissions Triage', icon: '◫' },
  { href: '/manager/participants', label: 'Pass Holders & Attendees', icon: '◑' },
  { href: '/manager/gates', label: 'Gate Control & Scanner Accounts', icon: '⊞' },
  { href: '/manager/publish', label: 'Publish & QR Distribution', icon: '◉' },
  { href: '/gate', label: 'Open Gate Scanner', icon: '📱' },
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
      <div style={{ minHeight: '100vh', background: 'var(--bg-root)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ borderTopColor: 'var(--gold-primary)', margin: '0 auto' }} />
          <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>Loading 27 Media Manager Portal...</div>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider primaryColor={event.primaryColor} secondaryColor={event.secondaryColor} accentColor={event.accentColor}>
      <ToastProvider>
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-root)' }}>
          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, backdropFilter: 'blur(4px)' }}
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* Manager Sidebar */}
          <aside
            className="manager-sidebar"
            style={{
              width: 270,
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              position: 'fixed',
              top: 0,
              left: sidebarOpen ? 0 : -270,
              bottom: 0,
              zIndex: 50,
              transition: 'left 200ms ease',
            }}
          >
            {/* Header Brand */}
            <div style={{ padding: '20px 18px', borderBottom: '1px solid var(--border-default)' }}>
              <Media27Logo size="sm" />
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 10,
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                {event.logoUrl ? (
                  <img
                    src={event.logoUrl}
                    alt=""
                    style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-default)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 8,
                      background: 'var(--gold-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#070709',
                      fontWeight: 800,
                      fontSize: 14,
                    }}
                  >
                    {event.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ overflow: 'hidden' }}>
                  <div className="truncate" style={{ fontWeight: 600, fontSize: 13, color: '#F8FAFC' }}>
                    {event.name}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gold-light)' }}>
                    ● {event.status} Manager
                  </div>
                </div>
              </div>
            </div>

            {/* All Tabs Navigation */}
            <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--text-muted)', padding: '0 10px 8px', textTransform: 'uppercase' }}>
                Event Management Tabs
              </div>
              {MANAGER_NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => { router.push(item.href); setSidebarOpen(false); }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 8,
                      border: active ? '1px solid var(--border-hover)' : '1px solid transparent',
                      background: active ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                      color: active ? 'var(--gold-light)' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontSize: 13.5,
                      fontWeight: active ? 600 : 400,
                      marginBottom: 3,
                      textAlign: 'left',
                      transition: 'all 120ms ease',
                    }}
                  >
                    <span style={{ fontSize: 15, width: 20, textAlign: 'center' }}>{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Footer */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {event.slug && (
                <a
                  href={`/event/${event.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px',
                    fontSize: 12,
                    color: 'var(--gold-light)',
                    textDecoration: 'none',
                    background: 'var(--bg-root)',
                    borderRadius: 8,
                    border: '1px solid var(--border-default)',
                  }}
                >
                  🌐 View Public Pass Form ↗
                </a>
              )}
              <button className="btn btn-ghost btn-sm" style={{ width: '100%', color: 'var(--error)' }} onClick={handleLogout}>
                Sign Out
              </button>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="manager-main" style={{ flex: 1, marginLeft: 270, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Mobile Header */}
            <div
              className="manager-mobile-header"
              style={{
                padding: '12px 16px',
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border-default)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  onClick={() => setSidebarOpen(true)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: 22, cursor: 'pointer' }}
                >
                  ☰
                </button>
                <Media27Logo size="sm" showSubtitle={false} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gold-light)' }} className="truncate">
                {event.name}
              </div>
            </div>

            <div style={{ flex: 1 }}>{children}</div>
          </main>

          <style>{`
            @media (max-width: 768px) {
              .manager-sidebar { left: ${sidebarOpen ? '0' : '-270px'} !important; }
              .manager-main { margin-left: 0 !important; }
              .manager-mobile-header { display: flex !important; }
            }
          `}</style>
        </div>
      </ToastProvider>
    </ThemeProvider>
  );
}
