import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword, hashPassword, getSession, signToken } from '@/lib/auth';
import { changePasswordSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    // Check super admin session
    const saSession = getSession('super_admin');
    if (saSession) {
      const admin = await prisma.superAdmin.findUnique({ where: { id: saSession.sub } });
      if (!admin) return NextResponse.json({ error: 'Session invalid' }, { status: 401 });

      const valid = await verifyPassword(currentPassword, admin.passwordHash);
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

      const newHash = await hashPassword(newPassword);
      await prisma.superAdmin.update({
        where: { id: admin.id },
        data: { passwordHash: newHash, mustChangePassword: false },
      });

      // Reissue token
      const token = signToken({ sub: admin.id, scope: 'super_admin' });
      const response = NextResponse.json({ success: true });
      response.cookies.set('epms_sa_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
      return response;
    }

    // Check event manager session
    const emSession = getSession('event_manager');
    if (emSession) {
      const manager = await prisma.eventManager.findUnique({ where: { id: emSession.sub } });
      if (!manager) return NextResponse.json({ error: 'Session invalid' }, { status: 401 });

      const valid = await verifyPassword(currentPassword, manager.passwordHash);
      if (!valid) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

      const newHash = await hashPassword(newPassword);
      await prisma.eventManager.update({
        where: { id: manager.id },
        data: { passwordHash: newHash, mustChangePassword: false },
      });

      const token = signToken({
        sub: manager.id,
        scope: 'event_manager',
        eventId: manager.eventId,
      });
      const response = NextResponse.json({ success: true });
      response.cookies.set('epms_em_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
