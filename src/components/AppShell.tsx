'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { Menu, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Media27Logo } from '@/components/27MediaLogo';

export interface ShellTab {
  href: string;
  label: string;
  icon?: LucideIcon;
  /** Sidebar section heading this item sits under. */
  group?: string;
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
        className="glass hidden lg:flex fixed left-3.5 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-2 p-1.5 rounded-full"
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
            <SlidingTabs tabs={tabs} activeHref={activeHref} />
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

        {/* key restarts the entrance stagger on every route change */}
        <main id="main" key={pathname} className="page-enter mt-5 lg:mt-4">
          {children}
        </main>
      </div>
    </div>
  );
}


const SIDEBAR_STORAGE_KEY = 'epms-sidebar';

interface SidebarShellProps {
  tabs: ShellTab[];
  actions: ShellAction[];
  /** Event (or account) shown at the top of the sidebar. */
  identity: { name: string; subtitle: string; logoUrl?: string | null };
  children: React.ReactNode;
}

/**
 * Event-manager layout: a floating glass sidebar that collapses to an icon rail
 * (choice remembered per browser) and becomes a slide-in drawer below `lg`.
 */
export function SidebarShell({ tabs, actions, identity, children }: SidebarShellProps) {
  const pathname = usePathname() || '';
  const activeHref = activeTabHref(pathname, tabs);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);

  // A closed drawer must not be focusable or announced (React 18 has no `inert` prop)
  useEffect(() => {
    drawerRef.current?.toggleAttribute('inert', !drawerOpen);
  }, [drawerOpen]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'collapsed');
    } catch {
      // storage unavailable — stay expanded
    }
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, c ? 'expanded' : 'collapsed');
      } catch {
        // ignore
      }
      return !c;
    });
  }

  // Close the drawer on navigation and on Escape
  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawerOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-screen text-fg" style={{ ['--sb-w' as string]: collapsed ? '76px' : '256px' }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] btn btn-primary">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        id="app-sidebar"
        className="glass sidebar hidden lg:flex fixed top-3 bottom-3 left-3 z-40 flex-col rounded-[24px]"
        style={{ width: 'var(--sb-w)' }}
        data-collapsed={collapsed || undefined}
      >
        <SidebarBody
          tabs={tabs}
          actions={actions}
          identity={identity}
          activeHref={activeHref}
          collapsed={collapsed}
          headerControl={
            <button
              type="button"
              onClick={toggleCollapsed}
              className="ibtn ibtn--sm !bg-transparent !border-transparent hover:!bg-well flex-none"
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-expanded={!collapsed}
              aria-controls="app-sidebar"
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
            </button>
          }
        />
      </aside>

      {/* Mobile top bar + drawer */}
      <header className="glass lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 h-14 !rounded-none !border-x-0 !border-t-0">
        <button
          type="button"
          className="ibtn ibtn--sm"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls="app-drawer"
        >
          <Menu className="w-4 h-4" />
        </button>
        <Media27Logo size="sm" />
        <div className="ml-auto">
          <ThemeToggle className="ibtn ibtn--sm" />
        </div>
      </header>
      <div
        className={clsx('lg:hidden fixed inset-0 z-50 bg-[var(--scrim)] transition-opacity duration-300', drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}
        onClick={() => setDrawerOpen(false)}
        aria-hidden="true"
      />
      <aside
        id="app-drawer"
        className={clsx(
          'glass glass--strong lg:hidden fixed top-2 bottom-2 left-2 z-50 w-[272px] max-w-[calc(100vw-16px)] flex flex-col rounded-[24px] transition-transform duration-300 ease-out',
          drawerOpen ? 'translate-x-0' : '-translate-x-[110%]'
        )}
        ref={drawerRef}
        aria-hidden={!drawerOpen}
      >
        <SidebarBody
          tabs={tabs}
          actions={actions}
          identity={identity}
          activeHref={activeHref}
          collapsed={false}
          headerControl={
            <button type="button" className="ibtn ibtn--sm flex-none" onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <X className="w-4 h-4" />
            </button>
          }
        />
      </aside>

      <div className="sidebar-content">
        <main id="main" key={pathname} className="page-enter mx-auto max-w-[1600px]">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarBody({
  tabs,
  actions,
  identity,
  activeHref,
  collapsed,
  headerControl,
}: {
  tabs: ShellTab[];
  actions: ShellAction[];
  identity: SidebarShellProps['identity'];
  activeHref?: string;
  collapsed: boolean;
  headerControl: React.ReactNode;
}) {
  const navRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ y: number; h: number } | null>(null);

  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const measure = () => {
      const el = nav.querySelector<HTMLElement>('[aria-current="page"]');
      setIndicator(el ? { y: el.offsetTop, h: el.offsetHeight } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(nav);
    return () => ro.disconnect();
  }, [activeHref, collapsed]);

  const groups = tabs.reduce<Array<{ name?: string; items: ShellTab[] }>>((acc, tab) => {
    const last = acc[acc.length - 1];
    if (last && last.name === tab.group) last.items.push(tab);
    else acc.push({ name: tab.group, items: [tab] });
    return acc;
  }, []);

  return (
    <>
      <div className={clsx('flex items-center gap-2 px-3 pt-3.5 pb-2', collapsed ? 'flex-col' : 'justify-between pl-4')}>
        <Media27Logo size="sm" showSubtitle={!collapsed} />
        {headerControl}
      </div>

      {/* Event identity */}
      <div className={clsx('mx-3 my-2 flex items-center gap-2.5 rounded-[16px] bg-well', collapsed ? 'justify-center p-1.5' : 'p-2')} title={collapsed ? identity.name : undefined}>
        {identity.logoUrl ? (
          <img src={identity.logoUrl} alt="" className="w-9 h-9 rounded-[12px] object-cover flex-none" />
        ) : (
          <span className="w-9 h-9 rounded-[12px] bg-pill text-on-pill flex items-center justify-center text-[13px] font-bold flex-none">
            {identity.name.charAt(0).toUpperCase()}
          </span>
        )}
        {!collapsed && (
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold truncate">{identity.name}</span>
            <span className="block text-[11.5px] text-muted truncate">{identity.subtitle}</span>
          </span>
        )}
      </div>

      <nav aria-label="Primary" className={clsx('flex-1 min-h-0 px-3 py-1', collapsed ? 'overflow-visible' : 'overflow-y-auto no-scrollbar')}>
        <div ref={navRef} className="relative">
          <span
            className="sidebar-indicator"
            aria-hidden="true"
            style={{ height: indicator?.h ?? 0, transform: `translateY(${indicator?.y ?? 0}px)`, opacity: indicator ? 1 : 0 }}
          />
          {groups.map((group, gi) => (
            <div key={group.name ?? gi} className={gi > 0 ? 'mt-3' : undefined}>
              {group.name &&
                (collapsed ? (
                  gi > 0 && <span className="block mx-auto mb-2 w-6 h-px bg-line" aria-hidden="true" />
                ) : (
                  <p className="px-3 pb-1.5 text-[11.5px] font-semibold text-faint">{group.name}</p>
                ))}
              {group.items.map((tab) => {
                const active = tab.href === activeHref;
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    aria-current={active ? 'page' : undefined}
                    title={collapsed ? tab.label : undefined}
                    className={clsx(
                      'sidebar-link group relative flex items-center gap-3 h-10 rounded-[12px] text-[13.5px] font-semibold transition-colors duration-200',
                      collapsed ? 'justify-center' : 'px-3',
                      active ? 'text-on-pill' : 'text-muted hover:text-fg hover:bg-well'
                    )}
                  >
                    {Icon && <Icon className="w-[18px] h-[18px] flex-none" aria-hidden="true" />}
                    {collapsed ? <span className="sidebar-tip">{tab.label}</span> : <span className="truncate">{tab.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </nav>

      <div className={clsx('border-t border-line p-3 flex gap-1', collapsed ? 'flex-col items-center' : 'flex-col')}>
        {actions.map((action) => (
          <SidebarAction key={action.label} action={action} collapsed={collapsed} />
        ))}
        <div className={clsx('flex items-center', collapsed ? 'justify-center' : 'justify-between pl-3 pr-1 h-10')}>
          {!collapsed && <span className="text-[13px] font-semibold text-muted">Appearance</span>}
          <ThemeToggle className="ibtn ibtn--sm !bg-transparent hover:!bg-well" />
        </div>
      </div>
    </>
  );
}

function SidebarAction({ action, collapsed }: { action: ShellAction; collapsed: boolean }) {
  const Icon = action.icon;
  const cls = clsx(
    'group relative flex items-center gap-3 h-10 rounded-[12px] text-[13px] font-semibold text-muted hover:bg-well transition-colors',
    collapsed ? 'w-10 justify-center' : 'px-3',
    action.tone === 'danger' ? 'hover:text-negative-400' : 'hover:text-fg'
  );
  const content = (
    <>
      <Icon className="w-[17px] h-[17px] flex-none" aria-hidden="true" />
      {collapsed ? <span className="sidebar-tip">{action.label}</span> : <span className="truncate">{action.label}</span>}
    </>
  );
  if (action.href) {
    return (
      <Link href={action.href} className={cls} aria-label={collapsed ? action.label : undefined} {...(action.external && { target: '_blank', rel: 'noreferrer' })}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={action.onClick} className={cls} aria-label={collapsed ? action.label : undefined}>
      {content}
    </button>
  );
}

/** Desktop tab strip whose active pill slides to the selected tab. */
function SlidingTabs({ tabs, activeHref }: { tabs: ShellTab[]; activeHref?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = useState<{ x: number; w: number } | null>(null);

  useLayoutEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const el = track.querySelector<HTMLElement>('[aria-current="page"]');
      setIndicator(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    // Webfonts change tab widths after first paint
    document.fonts?.ready.then(measure).catch(() => {});
    return () => ro.disconnect();
  }, [activeHref]);

  return (
    <div ref={trackRef} className="glass relative flex items-center gap-0.5 p-1 rounded-full overflow-x-auto no-scrollbar">
      <span
        className="tab-indicator"
        aria-hidden="true"
        style={{ width: indicator?.w ?? 0, transform: `translateX(${indicator?.x ?? 0}px)`, opacity: indicator ? 1 : 0 }}
      />
      {tabs.map((tab) => {
        const active = tab.href === activeHref;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={clsx(
              'relative px-[17px] h-10 inline-flex items-center rounded-full text-[13.5px] font-semibold whitespace-nowrap transition-colors duration-200',
              active ? 'text-on-pill' : 'text-fg hover:bg-well'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

/** Counts a numeric KPI up from zero on mount; non-numeric values render as-is. */
function CountUp({ value }: { value: React.ReactNode }) {
  const target = typeof value === 'number' ? value : typeof value === 'string' && /^[\d,]+$/.test(value) ? Number(value.replace(/,/g, '')) : null;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (target === null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || target === 0) {
      setShown(target);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const duration = 700;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setShown(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  if (target === null) return <>{value}</>;
  return <>{shown.toLocaleString()}</>;
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
          <b className="stat__value"><CountUp value={value} /></b>
          {badge}
        </div>
        <div className="stat__label">{label}</div>
      </div>
    </div>
  );
}
