'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { ThemeToggle } from '@/components/ThemeToggle';

export interface ShellTab {
  href: string;
  label: string;
  /** Extra path prefixes that should also mark this tab active (nested pages). */
  match?: string[];
}

export interface ShellAction {
  label: string;
  icon: LucideIcon;
  href?: string;
  external?: boolean;
  onClick?: () => void;
  tone?: 'default' | 'danger';
}

interface AppShellProps {
  brand: React.ReactNode;
  tabs: ShellTab[];
  /** Quick actions shown in the floating dock (desktop) and the header (mobile). */
  actions: ShellAction[];
  /** Right side of the top bar, e.g. the event or account mark. */
  identity?: React.ReactNode;
  children: React.ReactNode;
}

/** Exact route wins; otherwise the first tab whose nested prefixes cover the path. */
function activeTabHref(pathname: string, tabs: ShellTab[]) {
  const exact = tabs.find((t) => t.href === pathname);
  if (exact) return exact.href;
  return tabs.find((t) => (t.match || []).some((p) => pathname.startsWith(p)))?.href;
}

function ActionButton({ action, className }: { action: ShellAction; className: string }) {
  const Icon = action.icon;
  const cls = clsx(className, action.tone === 'danger' && 'hover:!text-negative-400');
  const content = <Icon className="w-[17px] h-[17px]" />;
  if (action.href) {
    return (
      <Link
        href={action.href}
        className={cls}
        aria-label={action.label}
        title={action.label}
        {...(action.external && { target: '_blank', rel: 'noreferrer' })}
      >
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={cls} aria-label={action.label} title={action.label}>
      {content}
    </button>
  );
}

export function AppShell({ brand, tabs, actions, identity, children }: AppShellProps) {
  const pathname = usePathname() || '';
  const activeHref = activeTabHref(pathname, tabs);

  return (
    <div className="min-h-screen text-fg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] btn btn-primary"
      >
        Skip to content
      </a>

      {/* Floating dock — desktop quick actions */}
      <nav
        aria-label="Quick actions"
        className="hidden lg:flex fixed left-3.5 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-2 p-1.5 rounded-full border border-line bg-surface-2 shadow-pop"
      >
        {actions.map((a) => (
          <ActionButton key={a.label} action={a} className="ibtn !bg-transparent !border-transparent hover:!bg-well text-fg" />
        ))}
        <span className="w-6 h-px bg-line my-0.5" aria-hidden="true" />
        <ThemeToggle className="ibtn !bg-transparent !border-transparent hover:!bg-well" />
      </nav>

      <div className="mx-auto max-w-[1840px] px-4 sm:px-5 lg:pl-[86px] lg:pr-6 pt-4 lg:pt-[22px] pb-12">
        {/* Top bar */}
        <header className="flex items-center gap-4 min-h-[48px]">
          <div className="flex-none">{brand}</div>

          <nav aria-label="Primary" className="hidden lg:flex flex-1 justify-center min-w-0">
            <div className="flex items-center gap-0.5 p-1 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => {
                const active = tab.href === activeHref;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={active ? 'page' : undefined}
                    className={clsx(
                      'px-[17px] h-10 inline-flex items-center rounded-full text-[13.5px] font-semibold whitespace-nowrap transition-colors duration-150',
                      active ? 'bg-pill text-on-pill' : 'text-fg hover:bg-well'
                    )}
                  >
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="ml-auto lg:ml-0 flex items-center gap-2 flex-none">
            <div className="flex lg:hidden items-center gap-2">
              {actions.map((a) => (
                <ActionButton key={a.label} action={a} className="ibtn" />
              ))}
              <ThemeToggle />
            </div>
            {identity}
          </div>
        </header>

        {/* Mobile / tablet tabs */}
        <nav aria-label="Primary" className="lg:hidden -mx-4 sm:-mx-5 mt-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 px-4 sm:px-5 w-max">
            {tabs.map((tab) => {
              const active = tab.href === activeHref;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  aria-current={active ? 'page' : undefined}
                  className={clsx(
                    'px-4 h-9 inline-flex items-center rounded-full text-[13px] font-semibold whitespace-nowrap',
                    active ? 'bg-pill text-on-pill' : 'text-fg bg-surface border border-line'
                  )}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>

        <main id="main" className="mt-5 lg:mt-4">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Two-line display title with optional KPI stats alongside, as used at the top of every page. */
export function PageHead({
  title,
  description,
  stats,
  actions,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  stats?: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-10 mb-5">
      <div className="min-w-0 xl:max-w-[340px]">
        <h1 className="text-display text-balance">{title}</h1>
        {description && <p className="text-caption mt-2 max-w-prose">{description}</p>}
      </div>
      {stats && <div className="flex flex-wrap items-center gap-x-10 gap-y-4 flex-1 min-w-0">{stats}</div>}
      {actions && <div className="flex flex-wrap items-center gap-2 xl:ml-auto">{actions}</div>}
    </div>
  );
}

export function Stat({
  icon: Icon,
  value,
  label,
  badge,
}: {
  icon: LucideIcon;
  value: React.ReactNode;
  label: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <div className="stat">
      <span className="stat__ico">
        <Icon className="w-[18px] h-[18px]" />
      </span>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <b className="stat__value">{value}</b>
          {badge}
        </div>
        <div className="stat__label">{label}</div>
      </div>
    </div>
  );
}
