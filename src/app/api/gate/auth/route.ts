import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { gateOtpSchema } from '@/lib/validation';
import { signToken } from '@/lib/auth';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = rateLimit(`gate-otp:${ip}`, RATE_LIMITS.gateOtp);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many attempts. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  try {
    const body = await req.json();
    const parsed = gateOtpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const gate = await prisma.gate.findUnique({
      where: { otpCode: parsed.data.otpCode },
      include: { event: true },
    });

    if (!gate) {
      return NextResponse.json({ error: 'Invalid OTP code' }, { status: 401 });
    }

    // Issue gate session token
    const token = signToken({
      sub: gate.id,
      scope: 'gate',
      eventId: gate.eventId,
      gateId: gate.id,
      gateType: gate.type,
    }, '12h');

    const response = NextResponse.json({
      success: true,
      gate: {
        id: gate.id,
        name: gate.name,
        type: gate.type,
      },
      event: {
        id: gate.event.id,
        name: gate.event.name,
        venue: gate.event.venue,
        logoUrl: gate.event.logoUrl,
        primaryColor: gate.event.primaryColor,
        secondaryColor: gate.event.secondaryColor,
        accentColor: gate.event.accentColor,
      },
    });

    response.cookies.set('epms_gate_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 12, // 12 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Gate auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
