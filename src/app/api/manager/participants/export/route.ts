import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const participants = await prisma.participant.findMany({
    where: { eventId: session.eventId },
    orderBy: { createdAt: 'desc' },
  });

  // Build CSV
  const headers = ['Name', 'Email', 'Entry Status', 'Last Scan', 'Registered At'];
  const rows = participants.map((p) => [
    p.name || '',
    p.email,
    p.entryStatus,
    p.lastScanAt?.toISOString() || '',
    p.createdAt.toISOString(),
  ]);

  const csv = [headers.join(','), ...rows.map((r) => r.map(v => `"${v}"`).join(','))].join('\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="participants-${session.eventId}.csv"`,
    },
  });
}
