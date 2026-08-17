import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

const SALT_ROUNDS = 12;

export type SessionScope = 'super_admin' | 'event_manager' | 'gate';

export interface TokenPayload {
  sub: string;
  scope: SessionScope;
  eventId?: string;
  gateId?: string;
  gateType?: string;
  iat?: number;
  exp?: number;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

// ── Password hashing ──

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ── JWT tokens ──

export function signToken(payload: Omit<TokenPayload, 'iat' | 'exp'>, expiresIn: number | `${number}${'s' | 'm' | 'h' | 'd'}` = '24h'): string {
  return jwt.sign(payload, getSecret(), { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, getSecret()) as TokenPayload;
}

// ── Cookie names ──

const COOKIE_NAMES: Record<SessionScope, string> = {
  super_admin: 'epms_sa_session',
  event_manager: 'epms_em_session',
  gate: 'epms_gate_session',
};

export function getCookieName(scope: SessionScope): string {
  return COOKIE_NAMES[scope];
}

// ── Set session cookie ──

export function setSessionCookie(scope: SessionScope, token: string): void {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAMES[scope], token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

// ── Clear session cookie ──

export function clearSessionCookie(scope: SessionScope): void {
  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAMES[scope], '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}

// ── Get session from request ──

export function getSessionFromRequest(req: NextRequest, scope: SessionScope): TokenPayload | null {
  const token = req.cookies.get(COOKIE_NAMES[scope])?.value;
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    if (payload.scope !== scope) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Get session from cookies() (server components / route handlers) ──

export function getSession(scope: SessionScope): TokenPayload | null {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAMES[scope])?.value;
  if (!token) return null;
  try {
    const payload = verifyToken(token);
    if (payload.scope !== scope) return null;
    return payload;
  } catch {
    return null;
  }
}

// ── Generate strong random password ──

export function generatePassword(length = 16): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(length);
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

// ── Generate login ID from event name ──

export function generateLoginId(eventName: string): string {
  const base = eventName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}
