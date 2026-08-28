import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Clean up any orphaned approved submissions with 0 pass holders remaining
  await prisma.submission.deleteMany({
    where: {
      eventId: session.eventId,
      status: 'APPROVED',
      participants: { none: {} },
    },
  }).catch(() => {});

  const submissions = await prisma.submission.findMany({
    where: { eventId: session.eventId },
    orderBy: { submittedAt: 'desc' },
    include: {
      participants: { select: { id: true, entryStatus: true } },
    },
  });

  return NextResponse.json({ submissions });
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
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    const submission = await prisma.submission.findFirst({
      where: { id, eventId: session.eventId },
      include: { participants: true },
    });

    if (!submission) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    // Detach scan logs for any participants linked to this submission
    const participantIds = submission.participants.map((p) => p.id);
    if (participantIds.length > 0) {
      await prisma.scanLog.updateMany({
        where: { participantId: { in: participantIds } },
        data: { participantId: null },
      });

      // Delete participants linked to this submission
      await prisma.participant.deleteMany({
        where: { id: { in: participantIds } },
      });
    }

    // Delete submission
    await prisma.submission.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete submission error:', error);
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
