import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const search = req.nextUrl.searchParams.get('search') || '';

  const participants = await prisma.participant.findMany({
    where: {
      eventId: session.eventId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    include: {
      participantType: { select: { id: true, name: true } },
      group: { select: { id: true, name: true } },
      _count: { select: { scanLogs: true } },
    },
  });

  return NextResponse.json({ participants });
}

export async function DELETE(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    const participant = await prisma.participant.findFirst({
      where: { id, eventId: session.eventId },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Pass holder not found' }, { status: 404 });
    }

    // Detach scan logs safely
    await prisma.scanLog.updateMany({
      where: { participantId: id },
      data: { participantId: null },
    });

    // Delete pass holder
    await prisma.participant.delete({
      where: { id },
    });

    // Clean up empty/orphaned approved submissions if no pass holders remain for it
    if (participant.submissionId) {
      const remainingCount = await prisma.participant.count({
        where: { submissionId: participant.submissionId },
      });

      if (remainingCount === 0) {
        await prisma.submission.delete({
          where: { id: participant.submissionId },
        }).catch(() => {});
      }
    }

    // Clean up any other orphaned approved submissions with 0 pass holders
    await prisma.submission.deleteMany({
      where: {
        eventId: session.eventId,
        status: 'APPROVED',
        participants: { none: {} },
      },
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete participant error:', error);
    return NextResponse.json({ error: 'Failed to delete pass holder' }, { status: 500 });
  }
}
