import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function GET() {
  // Check super admin session
  const saSession = getSession('super_admin');
  if (saSession) {
    return NextResponse.json({
      authenticated: true,
      role: 'super_admin',
      sub: saSession.sub,
    });
  }

  // Check event manager session
  const emSession = getSession('event_manager');
  if (emSession) {
    return NextResponse.json({
      authenticated: true,
      role: 'event_manager',
      sub: emSession.sub,
      eventId: emSession.eventId,
    });
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
