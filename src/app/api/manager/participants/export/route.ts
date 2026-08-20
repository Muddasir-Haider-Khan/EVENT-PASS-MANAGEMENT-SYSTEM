import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * Escapes fields for CSV export (RFC 4180) and prevents CSV Formula Injection (DDE).
 */
function sanitizeCsvField(value: string | null | undefined): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  // Double-up embedded double quotes
  let escaped = str.replace(/"/g, '""');
  // Neutralize formula injection triggers (=, +, -, @, tab, cr)
  if (/^[=+\-@\t\r]/.test(escaped)) {
    escaped = `'${escaped}`;
  }
  return `"${escaped}"`;
}

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

  const csv = [
    headers.map(sanitizeCsvField).join(','),
    ...rows.map((row) => row.map(sanitizeCsvField).join(',')),
  ].join('\r\n');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="participants-${session.eventId}.csv"`,
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
