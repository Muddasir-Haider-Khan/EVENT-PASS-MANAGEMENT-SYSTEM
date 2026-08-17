import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { managerSettingsSchema } from '@/lib/validation';

export async function GET() {
  const session = getSession('event_manager');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const manager = await prisma.eventManager.findUnique({
    where: { id: session.sub },
    include: { event: true },
  });

  if (!manager) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({
    accountNumber: manager.accountNumber,
    paymentPhone: manager.paymentPhone,
    event: manager.event,
  });
}

export async function PUT(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = managerSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { accountNumber, paymentPhone, logoUrl } = parsed.data;

    const updated = await prisma.eventManager.update({
      where: { id: session.sub },
      data: {
        accountNumber,
        paymentPhone,
        ...(logoUrl !== undefined && {
          event: {
            update: { logoUrl },
          },
        }),
      },
      include: { event: true },
    });

    return NextResponse.json({
      success: true,
      accountNumber: updated.accountNumber,
      paymentPhone: updated.paymentPhone,
      event: updated.event,
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
