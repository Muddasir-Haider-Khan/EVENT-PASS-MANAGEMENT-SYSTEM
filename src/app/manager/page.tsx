'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  DoorOpen,
  Inbox,
  LogIn,
  LogOut,
  ScanLine,
  ShieldX,
  Ticket,
  Users,
} from 'lucide-react';
import { PageHead, Stat } from '@/components/AppShell';

interface DashboardStats {
  totalSubmissions: number;
  totalParticipants: number;
  totalGates: number;
  pendingSubmissions: number;
  insideNow: number;
}

interface Activity {
  submissions: Record<string, number>;
  entry: Record<string, number>;
  recentScans: Array<{
    id: string;
    result: string;
    scannedAt: string;
    gate: { name: string; type: 'ENTRY' | 'EXIT' };
    participant: { name: string | null; email: string } | null;
  }>;
  pendingQueue: Array<{
    id: string;
    email: string;
    submittedAt: string;
    participantType: { name: string } | null;
  }>;
  gates: Array<{ id: string; name: string; type: 'ENTRY' | 'EXIT'; scansToday: number }>;
}

const SCAN_LABELS: Record<string, { text: string; tone: 'good' | 'bad' | 'neutral' }> = {
  ENTRY_GRANTED: { text: 'admitted at', tone: 'good' },
  EXIT_GRANTED: { text: 'exited via', tone: 'neutral' },
  ENTRY_DENIED_ALREADY_INSIDE: { text: 'was refused at', tone: 'bad' },
  ENTRY_DENIED_EXPIRED: { text: 'used an expired pass at', tone: 'bad' },
  EXIT_DENIED_NOT_INSIDE: { text: 'was refused exit at', tone: 'bad' },
  INVALID_QR: { text: 'invalid pass scanned at', tone: 'bad' },
};

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

const pct = (n: number, of: number) => (of > 0 ? Math.round((n / of) * 100) : 0);

function CardHead({ title, href, aside }: { title: string; href?: string; aside?: React.ReactNode }) {
  return (
    <div className="card-head mb-3">
      <h2 className="card-title">{title}</h2>
      <div className="flex items-center gap-2">
        {aside}
        {href && (
          <Link href={href} className="ibtn ibtn--plain" aria-label={`Open ${title}`}>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}

export default function ManagerDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [eventName, setEventName] = useState('');

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/manager/dashboard?include=activity');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setActivity(data.activity);
        setEventName(data.event.name);
      }
    }
    load();
  }, []);

  if (!stats || !activity) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="skeleton h-[72px] w-full max-w-[640px]" />
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4">
          <div className="skeleton h-[360px] !rounded-card" />
          <div className="skeleton h-[360px] !rounded-card" />
        </div>
      </div>
    );
  }

  const holders = stats.totalParticipants;
  const notEntered = activity.entry.NOT_ENTERED || 0;
  const inside = activity.entry.INSIDE || 0;
  const exited = activity.entry.EXITED || 0;
  const approved = activity.submissions.APPROVED || 0;
  const declined = activity.submissions.DECLINED || 0;
  const reviewed = approved + declined;
  const approvalRate = pct(approved, reviewed);

  const entryMix = [
    { key: 'inside', label: 'Inside venue', value: inside, swatch: 'bg-tomato' },
    { key: 'exited', label: 'Checked out', value: exited, swatch: 'bg-butter' },
    { key: 'waiting', label: 'Not arrived yet', value: notEntered, swatch: 'bg-cream' },
  ];

  // Ring geometry for the review progress card
  const R = 70;
  const C = 2 * Math.PI * R;
  const reviewedShare = pct(reviewed, stats.totalSubmissions);

  return (
    <>
      <PageHead
        title={
          <>
            {eventName || 'Event'}
            <br />
            <span className="text-muted">Overview</span>
          </>
        }
        stats={
          <>
            <Stat
              icon={Ticket}
              value={holders.toLocaleString()}
              label="Passes issued"
              badge={
                stats.pendingSubmissions > 0 ? (
                  <span className="badge badge-warning">{stats.pendingSubmissions} awaiting review</span>
                ) : undefined
              }
            />
            <Stat icon={DoorOpen} value={inside.toLocaleString()} label="Inside the venue now" />
            <Stat icon={ScanLine} value={stats.totalGates} label={stats.totalGates === 1 ? 'Gate configured' : 'Gates configured'} />
          </>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-4">
        {/* Attendance */}
        <section className="card p-[18px]">
          <CardHead title="Attendance" href="/manager/participants" />
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <b className="hero-num">{inside.toLocaleString()}</b>
            <span className="text-[13px] text-muted">
              inside now · <b className="text-fg">{pct(inside + exited, holders)}%</b> of pass holders have arrived
            </span>
          </div>

          {holders > 0 ? (
            <>
              <div className="flex gap-1.5 h-11 mt-6" role="img" aria-label={entryMix.map((m) => `${m.label} ${m.value}`).join(', ')}>
                {entryMix
                  .filter((m) => m.value > 0)
                  .map((m) => (
                    <span key={m.key} className={`${m.swatch} rounded-[12px] ring-1 ring-inset ring-line`} style={{ flex: m.value, minWidth: 18 }} />
                  ))}
              </div>
              <ul className="mt-5">
                {entryMix.map((m) => (
                  <li key={m.key} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0 text-[13.5px]">
                    <span className={`w-2.5 h-2.5 rounded-full ${m.swatch} ring-1 ring-line`} aria-hidden="true" />
                    <span className="flex-1">{m.label}</span>
                    <b className="num w-16 text-right">{m.value.toLocaleString()}</b>
                    <span className="num w-12 text-right text-muted">{pct(m.value, holders)}%</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-6 text-[13px] text-muted">
              No passes issued yet. Approve submissions to start issuing QR passes.
            </p>
          )}
        </section>

        {/* Review queue */}
        <section className="card p-[18px]">
          <CardHead
            title="Awaiting review"
            href="/manager/submissions"
            aside={<span className="text-[13px] text-muted hidden sm:inline">oldest first</span>}
          />
          {activity.pendingQueue.length === 0 ? (
            <div className="rounded-tile border border-dashed border-line-2 px-5 py-10 text-center">
              <Inbox className="w-5 h-5 mx-auto text-muted" />
              <p className="mt-3 text-[14px] font-semibold">You&apos;re all caught up</p>
              <p className="text-[13px] text-muted mt-1">New registrations will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activity.pendingQueue.map((sub, i) => (
                <Link
                  key={sub.id}
                  href="/manager/submissions"
                  className={`tile flex flex-col min-h-[150px] transition-transform duration-150 hover:-translate-y-0.5 ${i === 0 ? 'tile--tomato' : ''}`}
                >
                  <span className="text-[12px] font-semibold opacity-80">Submitted {timeAgo(sub.submittedAt)}</span>
                  <span className="mt-2 text-[17px] font-semibold leading-tight break-all" style={{ letterSpacing: '-0.01em' }}>
                    {sub.email}
                  </span>
                  <span className="mt-auto pt-4 flex items-center justify-between text-[12.5px] font-semibold opacity-85">
                    {sub.participantType?.name || 'General registration'}
                    <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,1.15fr)] items-start gap-4 mt-4">
        {/* Review progress */}
        <section className="card p-[18px] !bg-pine text-[var(--on-pine)] !border-transparent">
          <CardHead title="Review progress" />
          <div className="relative w-[180px] h-[180px] mx-auto my-2">
            <svg viewBox="0 0 180 180" className="w-full h-full -rotate-90" aria-hidden="true">
              <circle cx="90" cy="90" r={R} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="14" />
              <circle
                cx="90"
                cy="90"
                r={R}
                fill="none"
                stroke="var(--butter)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={`${(C * reviewedShare) / 100} ${C}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <b className="text-[36px] font-semibold num leading-none">{reviewedShare}%</b>
              <span className="text-[12.5px] opacity-75 mt-1">reviewed</span>
            </div>
          </div>
          <dl className="grid grid-cols-3 text-center mt-3">
            {[
              ['Approved', approved],
              ['Pending', stats.pendingSubmissions],
              ['Declined', declined],
            ].map(([label, v]) => (
              <div key={label as string}>
                <dt className="text-[12px] opacity-75">{label}</dt>
                <dd className="text-[17px] font-bold num">{(v as number).toLocaleString()}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 rounded-full bg-white/10 px-4 py-2.5 text-center text-[13px]">
            {reviewed > 0 ? (
              <>
                <b>{approvalRate}%</b> approval rate across {reviewed.toLocaleString()} decisions
              </>
            ) : (
              'No submissions reviewed yet'
            )}
          </p>
        </section>

        {/* Gates */}
        <section className="card p-[18px]">
          <CardHead title="Gates today" href="/manager/gates" />
          {activity.gates.length === 0 ? (
            <p className="text-[13px] text-muted py-6">
              No gates yet.{' '}
              <Link href="/manager/gates" className="underline underline-offset-2 text-fg">
                Create an entry gate
              </Link>{' '}
              to start scanning.
            </p>
          ) : (
            <ul>
              {activity.gates.map((g) => {
                const busiest = Math.max(...activity.gates.map((x) => x.scansToday), 1);
                return (
                  <li key={g.id} className="py-3 border-b border-line last:border-0">
                    <div className="flex items-center gap-3">
                      <span className="ibtn ibtn--sm" aria-hidden="true">
                        {g.type === 'ENTRY' ? <LogIn className="w-3.5 h-3.5" /> : <LogOut className="w-3.5 h-3.5" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-[14px] font-semibold truncate">{g.name}</span>
                        <span className="block text-[12px] text-muted">{g.type === 'ENTRY' ? 'Entry gate' : 'Exit gate'}</span>
                      </span>
                      <b className="num text-[14px]">{g.scansToday}</b>
                    </div>
                    <div className="meter mt-2.5 ml-11">
                      <span style={{ width: `${pct(g.scansToday, busiest)}%`, background: g.type === 'ENTRY' ? 'var(--tomato)' : 'var(--text)' }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Recent scans */}
        <section className="card p-[18px] md:col-span-2 xl:col-span-1">
          <CardHead title="Recent scans" href="/manager/participants" />
          {activity.recentScans.length === 0 ? (
            <p className="text-[13px] text-muted py-6">Gate scans will stream in here once the event opens.</p>
          ) : (
            <ul>
              {activity.recentScans.map((scan) => {
                const label = SCAN_LABELS[scan.result] || { text: 'scanned at', tone: 'neutral' as const };
                const who = scan.participant ? scan.participant.name || scan.participant.email : 'Unknown pass';
                const Icon = label.tone === 'bad' ? ShieldX : scan.gate.type === 'ENTRY' ? LogIn : LogOut;
                return (
                  <li key={scan.id} className="flex gap-3 py-3 border-b border-line last:border-0">
                    <span
                      className={`w-9 h-9 rounded-full flex-none flex items-center justify-center ${
                        label.tone === 'bad'
                          ? 'bg-negative-500/15 text-negative-400'
                          : label.tone === 'good'
                          ? 'bg-pine text-[var(--on-pine)]'
                          : 'bg-surface-2 text-fg'
                      }`}
                      aria-hidden="true"
                    >
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="min-w-0 text-[13.5px] leading-snug">
                      <b className="font-semibold">{who}</b> <span className="text-muted">{label.text}</span>{' '}
                      <span className="underline underline-offset-2 decoration-line-2">{scan.gate.name}</span>
                      <span className="block text-[12px] text-faint mt-0.5">{timeAgo(scan.scannedAt)}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <p className="mt-6 text-[12.5px] text-faint flex items-center gap-2">
        <Users className="w-3.5 h-3.5" />
        {stats.totalSubmissions.toLocaleString()} registrations received in total
      </p>
    </>
  );
}
