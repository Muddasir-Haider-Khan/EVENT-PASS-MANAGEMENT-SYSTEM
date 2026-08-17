import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateGateOTP } from '@/lib/qr';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const gate = await prisma.gate.findUnique({ where: { id: params.id } });
    if (!gate || gate.eventId !== session.eventId) {
      return NextResponse.json({ error: 'Gate not found' }, { status: 404 });
    }

    const otpCode = generateGateOTP();
    const updated = await prisma.gate.update({
      where: { id: params.id },
      data: { otpCode },
    });

    return NextResponse.json({ gate: updated });
  } catch (error) {
    console.error('Regenerate OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
