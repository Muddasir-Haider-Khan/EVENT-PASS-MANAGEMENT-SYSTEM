import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
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

  // Overview page asks for the activity breakdown; the layout's session check does not.
  const activity = req.nextUrl.searchParams.get('include') === 'activity'
    ? await loadActivity(session.eventId)
    : undefined;

  return NextResponse.json({
    event,
    ...(activity && { activity }),
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

async function loadActivity(eventId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [submissionsByStatus, participantsByStatus, recentScans, pendingQueue, gates, scansToday] = await Promise.all([
    prisma.submission.groupBy({ by: ['status'], where: { eventId }, _count: { _all: true } }),
    prisma.participant.groupBy({ by: ['entryStatus'], where: { eventId }, _count: { _all: true } }),
    prisma.scanLog.findMany({
      where: { gate: { eventId } },
      orderBy: { scannedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        result: true,
        scannedAt: true,
        gate: { select: { name: true, type: true } },
        participant: { select: { name: true, email: true } },
      },
    }),
    prisma.submission.findMany({
      where: { eventId, status: 'PENDING' },
      orderBy: { submittedAt: 'asc' },
      take: 4,
      select: { id: true, email: true, submittedAt: true, participantType: { select: { name: true } } },
    }),
    prisma.gate.findMany({ where: { eventId }, orderBy: { createdAt: 'asc' }, select: { id: true, name: true, type: true } }),
    prisma.scanLog.groupBy({
      by: ['gateId'],
      where: { gate: { eventId }, scannedAt: { gte: startOfDay } },
      _count: { _all: true },
    }),
  ]);

  const count = <K extends string>(rows: Array<Record<K, string> & { _count: { _all: number } }>, key: K) =>
    Object.fromEntries(rows.map((r) => [r[key], r._count._all])) as Record<string, number>;
  const todayByGate = Object.fromEntries(scansToday.map((r) => [r.gateId, r._count._all]));

  return {
    submissions: count(submissionsByStatus, 'status'),
    entry: count(participantsByStatus, 'entryStatus'),
    recentScans,
    pendingQueue,
    gates: gates.map((g) => ({ ...g, scansToday: todayByGate[g.id] || 0 })),
  };
}
