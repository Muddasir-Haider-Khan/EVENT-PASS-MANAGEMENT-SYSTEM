import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, signToken } from '@/lib/auth';
import { loginSchema } from '@/lib/validation';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
  const rl = rateLimit(`login:${ip}`, RATE_LIMITS.login);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many login attempts. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { loginId, password } = parsed.data;
    const trimmedId = loginId.trim();

    // 1. Try Super Admin first (email match)
    const superAdmin = await prisma.superAdmin.findFirst({
      where: {
        email: { equals: trimmedId, mode: 'insensitive' },
      },
    });

    if (superAdmin) {
      const valid = await verifyPassword(password, superAdmin.passwordHash);
      if (valid) {
        const token = signToken({ sub: superAdmin.id, scope: 'super_admin' });
        const response = NextResponse.json({
          success: true,
          role: 'super_admin',
          mustChangePassword: superAdmin.mustChangePassword,
        });
        response.cookies.set('epms_sa_session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
          path: '/',
        });
        return response;
      }
    }

    // 2. Try Event Manager (loginId match)
    const manager = await prisma.eventManager.findFirst({
      where: {
        loginId: { equals: trimmedId, mode: 'insensitive' },
      },
      include: { event: true },
    });

    if (manager) {
      const valid = await verifyPassword(password, manager.passwordHash);
      if (valid) {
        const token = signToken({
          sub: manager.id,
          scope: 'event_manager',
          eventId: manager.eventId,
        });
        const response = NextResponse.json({
          success: true,
          role: 'event_manager',
          mustChangePassword: manager.mustChangePassword,
          eventId: manager.eventId,
        });
        response.cookies.set('epms_em_session', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24,
          path: '/',
        });
        return response;
      }
    }

    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
