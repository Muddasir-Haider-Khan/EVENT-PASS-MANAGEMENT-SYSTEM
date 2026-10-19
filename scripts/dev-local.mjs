#!/usr/bin/env node
/**
 * Local development without Neon: runs an embedded Postgres (PGlite) on
 * 127.0.0.1:54329, syncs the Prisma schema, seeds the super admins from .env,
 * then starts `next dev` pointed at it. Data persists in ./.local-db.
 *
 * Usage: npm run dev:local   (extra args are passed to next dev, e.g. -- -p 3001)
 */
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { PGLiteSocketServer } from '@electric-sql/pglite-socket';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DATA_DIR = join(ROOT, '.local-db');
const PORT = 54329;
// PGlite is a single Postgres session shared by every socket: one Prisma
// connection and no prepared statements keep queries from interleaving.
const LOCAL_URL = `postgresql://postgres:postgres@127.0.0.1:${PORT}/postgres?sslmode=disable&connection_limit=1&pgbouncer=true`;

/** .env values for child processes (tsx does not load .env on its own). */
function loadDotEnv() {
  const file = join(ROOT, '.env');
  if (!existsSync(file)) return {};
  return Object.fromEntries(
    readFileSync(file, 'utf8')
      .split('\n')
      .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i), line.slice(i + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
      })
  );
}

const env = { ...loadDotEnv(), ...process.env, DATABASE_URL: LOCAL_URL, DIRECT_URL: LOCAL_URL };

function run(cmd, args, { allowFail = false } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: ROOT, env, stdio: 'inherit' });
    child.on('exit', (code) => (code === 0 || allowFail ? resolve(code) : reject(new Error(`${cmd} ${args.join(' ')} exited with ${code}`))));
  });
}

const bin = (name) => join(ROOT, 'node_modules', '.bin', name);

console.log(`[local-db] starting Postgres (PGlite) — data in ${DATA_DIR}`);
const db = await PGlite.create(DATA_DIR);
const server = new PGLiteSocketServer({ db, port: PORT, host: '127.0.0.1', maxConnections: 10 });
await server.start();
console.log(`[local-db] listening on 127.0.0.1:${PORT}`);

let next;
async function shutdown(code = 0) {
  if (next && next.exitCode === null) next.kill('SIGTERM');
  await server.stop().catch(() => {});
  await db.close().catch(() => {});
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

try {
  console.log('[local-db] syncing Prisma schema…');
  await run(bin('prisma'), ['db', 'push', '--skip-generate']);
  console.log('[local-db] seeding super admins from .env…');
  await run(bin('tsx'), ['prisma/seed.ts']);
} catch (err) {
  console.error(`[local-db] setup failed: ${err.message}`);
  await shutdown(1);
}

console.log('[local-db] starting Next.js — open the "Local" URL below, then /login');
next = spawn(bin('next'), ['dev', ...process.argv.slice(2)], { cwd: ROOT, env, stdio: 'inherit' });
next.on('exit', (code) => shutdown(code ?? 0));
