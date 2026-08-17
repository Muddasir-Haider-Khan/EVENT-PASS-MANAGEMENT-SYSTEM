import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createGateSchema } from '@/lib/validation';
import { generateGateOTP } from '@/lib/qr';

export async function GET() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gates = await prisma.gate.findMany({
    where: { eventId: session.eventId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { scanLogs: true } },
    },
  });

  return NextResponse.json({ gates });
}

export async function POST(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createGateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const otpCode = generateGateOTP();

    const gate = await prisma.gate.create({
      data: {
        eventId: session.eventId,
        name: parsed.data.name,
        type: parsed.data.type,
        otpCode,
      },
    });

    return NextResponse.json({ gate }, { status: 201 });
  } catch (error) {
    console.error('Create gate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
