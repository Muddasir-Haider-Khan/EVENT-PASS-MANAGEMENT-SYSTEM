import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const createParticipantTypeSchema = z.object({
  name: z.string().min(1, 'Type name is required').max(100),
  description: z.string().max(500).optional().nullable(),
  fee: z.number().min(0).default(0),
  isGroupType: z.boolean().default(false),
  minGroupSize: z.number().int().min(1).default(1),
  maxGroupSize: z.number().int().min(1).default(10),
  order: z.number().int().default(0),
});

export async function GET() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const types = await prisma.participantType.findMany({
    where: { eventId: session.eventId },
    include: {
      customFields: { orderBy: { order: 'asc' } },
      _count: { select: { participants: true, submissions: true } },
    },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({ types });
}

export async function POST(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createParticipantTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const newType = await prisma.participantType.create({
      data: {
        eventId: session.eventId,
        ...parsed.data,
      },
      include: {
        customFields: true,
      },
    });

    return NextResponse.json({ type: newType }, { status: 201 });
  } catch (error) {
    console.error('Create participant type error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
