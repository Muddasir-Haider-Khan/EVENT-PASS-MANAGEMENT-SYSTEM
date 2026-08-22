import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const updateQRStatusSchema = z.object({
  qrExpired: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateQRStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const participant = await prisma.participant.findFirst({
      where: { id: params.id, eventId: session.eventId },
    });
    if (!participant) return NextResponse.json({ error: 'Participant pass not found' }, { status: 404 });

    const updated = await prisma.participant.update({
      where: { id: params.id },
      data: { qrExpired: parsed.data.qrExpired },
    });

    return NextResponse.json({ success: true, participant: updated });
  } catch (error) {
    console.error('Update QR expiration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
