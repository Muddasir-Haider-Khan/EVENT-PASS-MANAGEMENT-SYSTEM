'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ToastProvider } from '@/components/Toast';
import { Media27Logo } from '@/components/27MediaLogo';

const ADMIN_NAV_ITEMS = [
  { href: '/admin', label: 'Events Overview', icon: '📊' },
  { href: '/admin/events/new', label: 'Create New Event', icon: '➕' },
  { href: '/gate', label: 'Gate Scanner App', icon: '📱' },
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
      <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-root)' }}>
        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 40, backdropFilter: 'blur(4px)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Super Admin Fixed Sidebar */}
        <aside
          className="admin-sidebar"
          style={{
            width: 260,
            background: 'var(--bg-surface)',
            borderRight: '1px solid var(--border-default)',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0,
            left: sidebarOpen ? 0 : -260,
            bottom: 0,
            zIndex: 50,
            transition: 'left 200ms ease',
          }}
        >
          {/* Brand Header */}
          <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border-default)' }}>
            <Media27Logo size="sm" />
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--gold-light)',
                background: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                padding: '3px 8px',
                borderRadius: 100,
                marginTop: 12,
                display: 'inline-block',
                textTransform: 'uppercase',
              }}
            >
              Master Super Admin Panel
            </div>
          </div>

          {/* Navigation Links */}
          <nav style={{ flex: 1, padding: '16px 12px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--text-muted)', padding: '0 12px 10px', textTransform: 'uppercase' }}>
              Management Tabs
            </div>
            {ADMIN_NAV_ITEMS.map((item) => {
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
                    padding: '11px 14px',
                    borderRadius: 10,
                    border: active ? '1px solid var(--border-hover)' : '1px solid transparent',
                    background: active ? 'rgba(212, 175, 55, 0.12)' : 'transparent',
                    color: active ? 'var(--gold-light)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: active ? 600 : 400,
                    marginBottom: 4,
                    textAlign: 'left',
                    transition: 'all 150ms ease',
                  }}
                >
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Footer Controls */}
          <div style={{ padding: '16px', borderTop: '1px solid var(--border-default)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a
              href="https://www.27mediaagency.com"
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '8px',
                fontSize: 12,
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                background: 'var(--bg-root)',
                borderRadius: 8,
                border: '1px solid var(--border-default)',
              }}
            >
              🌐 27mediaagency.com ↗
            </a>
            <button className="btn btn-ghost btn-sm" style={{ width: '100%', color: 'var(--error)' }} onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main" style={{ flex: 1, marginLeft: 260, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          {/* Mobile Top Navigation Header */}
          <div
            className="admin-mobile-header"
            style={{
              padding: '12px 20px',
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
            <button className="btn btn-gold btn-sm" onClick={() => router.push('/admin/events/new')}>
              + New Event
            </button>
          </div>

          <div style={{ flex: 1 }}>{children}</div>
        </main>

        <style>{`
          @media (max-width: 768px) {
            .admin-sidebar { left: ${sidebarOpen ? '0' : '-260px'} !important; }
            .admin-main { margin-left: 0 !important; }
            .admin-mobile-header { display: flex !important; }
          }
        `}</style>
      </div>
    </ToastProvider>
  );
}
