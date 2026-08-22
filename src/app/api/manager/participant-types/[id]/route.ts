import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const updateParticipantTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  fee: z.number().min(0).optional(),
  isGroupType: z.boolean().optional(),
  minGroupSize: z.number().int().min(1).optional(),
  maxGroupSize: z.number().int().min(1).optional(),
  order: z.number().int().optional(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = updateParticipantTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const type = await prisma.participantType.findFirst({
      where: { id: params.id, eventId: session.eventId },
    });
    if (!type) return NextResponse.json({ error: 'Participant type not found' }, { status: 404 });

    const updated = await prisma.participantType.update({
      where: { id: params.id },
      data: parsed.data,
      include: { customFields: true },
    });

    return NextResponse.json({ type: updated });
  } catch (error) {
    console.error('Update participant type error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const type = await prisma.participantType.findFirst({
      where: { id: params.id, eventId: session.eventId },
    });
    if (!type) return NextResponse.json({ error: 'Participant type not found' }, { status: 404 });

    await prisma.participantType.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete participant type error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
