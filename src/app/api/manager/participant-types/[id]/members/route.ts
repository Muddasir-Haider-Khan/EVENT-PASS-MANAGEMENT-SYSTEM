import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(
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
      include: {
        formFields: { orderBy: { order: 'asc' } },
      },
    });

    if (!type) {
      return NextResponse.json({ error: 'Participant category not found' }, { status: 404 });
    }

    const submissions = await prisma.submission.findMany({
      where: { participantTypeId: params.id, eventId: session.eventId },
      orderBy: { submittedAt: 'desc' },
      include: {
        participant: {
          select: {
            id: true,
            qrToken: true,
            entryStatus: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({
      category: type,
      fields: type.formFields,
      submissions,
    });
  } catch (error) {
    console.error('Get category members error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
