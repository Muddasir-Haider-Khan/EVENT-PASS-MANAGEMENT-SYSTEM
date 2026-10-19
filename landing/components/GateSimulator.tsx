'use client';

import { useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle, Check, LogIn, LogOut, QrCode, ScanLine, X } from 'lucide-react';
import { Reveal } from './Reveal';

// Mirrors the real gate rules in src/app/api/gate/scan/route.ts
type Status = 'NOT_ENTERED' | 'INSIDE' | 'EXITED';
type Tone = 'idle' | 'good' | 'bad' | 'warn';
type Result = { tone: Tone; verdict: string; note: string; gate: string };
type LogEntry = { id: number; time: string; tone: Tone; text: string };

const MAX_ENTRIES = 3;
const STATUS_LABEL: Record<Status, string> = { NOT_ENTERED: 'Not entered', INSIDE: 'Inside', EXITED: 'Exited' };
const TONE_COLOR: Record<Tone, string> = { idle: 'var(--faint)', good: 'var(--good)', bad: 'var(--bad)', warn: 'var(--warn)' };

const IDLE: Result = {
  tone: 'idle',
  verdict: 'Ready to scan',
  note: 'Pick a gate on the right to scan Ayesha’s pass.',
  gate: 'Main gate',
};

export function GateSimulator() {
  const reduce = useReducedMotion();
  const [status, setStatus] = useState<Status>('NOT_ENTERED');
  const [entries, setEntries] = useState(0);
  const [expired, setExpired] = useState(false);
  const [result, setResult] = useState<Result>(IDLE);
  const [scanning, setScanning] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [entryTime, setEntryTime] = useState('');
  const clock = useRef(9 * 60);
  const seq = useRef(0);

  const tick = () => {
    clock.current += 3 + Math.floor(Math.random() * 40);
    const h = Math.floor(clock.current / 60) % 24;
    const m = clock.current % 60;
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  };

  const resolve = (kind: 'entry' | 'exit' | 'invalid'): { res: Result; next?: Partial<{ status: Status; entries: number; expired: boolean }> } => {
    const gate = kind === 'exit' ? 'Exit gate' : 'Main gate';
    if (kind === 'invalid') {
      return { res: { tone: 'warn', verdict: 'Invalid pass', note: 'This QR doesn’t belong to this event. Nobody gets in on it.', gate } };
    }
    if (expired) {
      return { res: { tone: 'warn', verdict: 'Pass expired', note: `All ${MAX_ENTRIES} entries on this pass have been used.`, gate } };
    }
    if (kind === 'entry') {
      if (entries >= MAX_ENTRIES) {
        return { res: { tone: 'warn', verdict: 'No entries left', note: `This pass was valid for ${MAX_ENTRIES} entries.`, gate } };
      }
      if (status === 'INSIDE') {
        return {
          res: {
            tone: 'bad',
            verdict: 'Already inside',
            note: `This pass came in at ${entryTime}. A copy of it can’t bring a second person in.`,
            gate,
          },
        };
      }
      const n = entries + 1;
      return {
        res: { tone: 'good', verdict: 'Entry granted', note: `Entry ${n} of ${MAX_ENTRIES}. Check the photo, then wave them through.`, gate },
        next: { status: 'INSIDE', entries: n },
      };
    }
    if (status !== 'INSIDE') {
      return { res: { tone: 'bad', verdict: 'Not inside', note: 'This pass hasn’t entered, so it can’t be checked out.', gate } };
    }
    const last = entries >= MAX_ENTRIES;
    return {
      res: {
        tone: 'good',
        verdict: 'Exit recorded',
        note: last ? 'That was the last entry on this pass, so it now retires.' : 'They can come back in on their next entry.',
        gate,
      },
      next: { status: 'EXITED', expired: last },
    };
  };

  const scan = (kind: 'entry' | 'exit' | 'invalid') => {
    if (scanning) return;
    setScanning(true);
    window.setTimeout(
      () => {
        const { res, next } = resolve(kind);
        const time = tick();
        if (next?.status) setStatus(next.status);
        if (next?.entries !== undefined) {
          setEntries(next.entries);
          setEntryTime(time);
        }
        if (next?.expired) setExpired(true);
        setResult(res);
        setLog((l) => [{ id: ++seq.current, time, tone: res.tone, text: `${res.gate}: ${res.verdict}` }, ...l].slice(0, 5));
        setScanning(false);
      },
      reduce ? 0 : 750
    );
  };

  const reset = () => {
    setStatus('NOT_ENTERED');
    setEntries(0);
    setExpired(false);
    setResult(IDLE);
    setLog([]);
    clock.current = 9 * 60;
  };

  const ResultIcon = result.tone === 'good' ? Check : result.tone === 'bad' ? X : result.tone === 'warn' ? AlertTriangle : QrCode;

  return (
    <section className="section" id="gate" aria-labelledby="gate-title">
      <div className="wrap gate">
        <Reveal>
          <div className="phone" aria-label="Gate scanner screen">
            <div className="phone__screen">
              <span className="phone__island" aria-hidden="true" />
              <div className="phone__bar">
                <span className="phone__gate">
                  <span className="phone__live" aria-hidden="true" />
                  {result.gate}
                </span>
                <span>Model UN 2026</span>
              </div>

              <div className="phone__result" data-tone={result.tone} aria-live="assertive" aria-atomic="true">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={log[0]?.id ?? 'idle'}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                    initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0, scale: 1.04 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  >
                    <span className="phone__result-ico">
                      <ResultIcon size={38} strokeWidth={2.6} aria-hidden="true" />
                    </span>
                    <div className="phone__verdict">{result.verdict}</div>
                    {result.tone !== 'idle' && (
                      <div className="phone__who">
                        <span className="avatar" aria-hidden="true">
                          AK
                        </span>
                        <span>
                          <span className="phone__who-name" style={{ display: 'block' }}>
                            Ayesha Khan
                          </span>
                          <span className="phone__who-role">Delegate, DISEC</span>
                        </span>
                      </div>
                    )}
                    <p className="phone__note">{result.note}</p>
                  </motion.div>
                </AnimatePresence>

                <AnimatePresence>
                  {scanning && (
                    <motion.div
                      className="phone__scan"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="phone__reticle">
                        <motion.span initial={{ top: '8%' }} animate={{ top: '90%' }} transition={{ duration: 0.7, ease: 'easeInOut' }} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <h2 className="h2" id="gate-title">
            Try the gate yourself.
          </h2>
          <p className="lede">
            This is how the scanner behaves at your door. Let Ayesha in, scan her again as if someone copied her pass, walk
            her out, and use up her three-day pass.
          </p>

          <div className="gate__controls">
            <button type="button" className="gate-btn" onClick={() => scan('entry')} disabled={scanning}>
              <span className="gate-btn__title">
                <LogIn size={18} aria-hidden="true" />
                Scan at entry
              </span>
              <span className="gate-btn__sub">Main gate</span>
            </button>
            <button type="button" className="gate-btn" onClick={() => scan('exit')} disabled={scanning}>
              <span className="gate-btn__title">
                <LogOut size={18} aria-hidden="true" />
                Scan at exit
              </span>
              <span className="gate-btn__sub">Exit gate</span>
            </button>
            <button type="button" className="gate-btn gate-btn--wide" onClick={() => scan('invalid')} disabled={scanning}>
              <span className="gate-btn__title">
                <ScanLine size={18} aria-hidden="true" />
                Scan a pass from another event
              </span>
              <span className="gate-btn__sub">Or a QR someone made themselves</span>
            </button>
          </div>

          <div className="gate__state">
            <span>Pass status</span>
            {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
              <span key={s} className="state-chip" data-on={!expired && status === s}>
                {STATUS_LABEL[s]}
              </span>
            ))}
            {expired && (
              <span className="state-chip" data-on="true" style={{ background: 'var(--warn-deep)' }}>
                Retired
              </span>
            )}
            <span className="entries" aria-label={`${entries} of ${MAX_ENTRIES} entries used`}>
              {Array.from({ length: MAX_ENTRIES }, (_, i) => (
                <i key={i} data-used={i < entries} />
              ))}
            </span>
          </div>

          <ul className="log" aria-label="Scan log">
            {log.length === 0 ? (
              <li className="log__empty">Every scan is recorded with the gate and time. Yours will show up here.</li>
            ) : (
              <AnimatePresence initial={false}>
                {log.map((l) => (
                  <motion.li
                    key={l.id}
                    layout={!reduce}
                    initial={reduce ? false : { opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <span className="log__dot" style={{ background: TONE_COLOR[l.tone] }} aria-hidden="true" />
                    <span>{l.text}</span>
                    <span className="log__time">{l.time}</span>
                  </motion.li>
                ))}
              </AnimatePresence>
            )}
          </ul>
          {log.length > 0 && (
            <p style={{ marginTop: 14 }}>
              <button type="button" className="text-btn" onClick={reset}>
                Reset the demo
              </button>
            </p>
          )}
        </Reveal>
      </div>
    </section>
  );
}
