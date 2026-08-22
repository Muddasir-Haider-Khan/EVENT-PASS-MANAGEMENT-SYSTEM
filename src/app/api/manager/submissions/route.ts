import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const submissions = await prisma.submission.findMany({
    where: { eventId: session.eventId },
    orderBy: { submittedAt: 'desc' },
    include: {
      participants: { select: { id: true, entryStatus: true } },
    },
  });

  return NextResponse.json({ submissions });
}
