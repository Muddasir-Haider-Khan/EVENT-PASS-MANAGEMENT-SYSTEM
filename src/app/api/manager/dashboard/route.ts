import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const event = await prisma.event.findUnique({
    where: { id: session.eventId },
    include: {
      eventManager: { select: { loginId: true, contactEmail: true, accountNumber: true, paymentPhone: true } },
      _count: {
        select: {
          participants: true,
          submissions: true,
          gates: true,
          formFields: true,
        },
      },
    },
  });

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

  // Get status counts
  const [pendingCount, insideCount] = await Promise.all([
    prisma.submission.count({ where: { eventId: session.eventId, status: 'PENDING' } }),
    prisma.participant.count({ where: { eventId: session.eventId, entryStatus: 'INSIDE' } }),
  ]);

  return NextResponse.json({
    event,
    stats: {
      totalSubmissions: event._count.submissions,
      totalParticipants: event._count.participants,
      totalGates: event._count.gates,
      totalFields: event._count.formFields,
      pendingSubmissions: pendingCount,
      insideNow: insideCount,
    },
  });
}
