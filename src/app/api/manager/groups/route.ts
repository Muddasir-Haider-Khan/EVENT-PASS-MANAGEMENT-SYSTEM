import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const createGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required').max(150),
  leaderName: z.string().optional().nullable(),
  leaderEmail: z.string().email().optional().nullable(),
  leaderPhone: z.string().optional().nullable(),
  institution: z.string().optional().nullable(),
});

export async function GET() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groups = await prisma.participantGroup.findMany({
    where: { eventId: session.eventId },
    include: {
      participants: {
        select: {
          id: { select: true },
          name: true,
          email: true,
          phone: true,
          status: true,
        },
      },
      submissions: {
        select: {
          id: true,
          email: true,
          status: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createGroupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const group = await prisma.participantGroup.create({
      data: {
        eventId: session.eventId,
        ...parsed.data,
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Create participant group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
