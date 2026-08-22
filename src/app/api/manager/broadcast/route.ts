import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendCustomBroadcastEmail } from '@/lib/resend';

export async function POST(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { subject, body, targetType, participantTypeId, groupId, statusFilter } = await req.json();

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json({ error: 'Email subject is required' }, { status: 400 });
    }

    if (!body || typeof body !== 'string' || !body.trim()) {
      return NextResponse.json({ error: 'Email body is required' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: session.eventId },
      select: { name: true },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Determine target recipient emails
    let recipientEmails: string[] = [];

    if (targetType === 'participant_type' && participantTypeId) {
      const participants = await prisma.participant.findMany({
        where: { eventId: session.eventId, participantTypeId },
        select: { email: true },
      });
      recipientEmails = participants.map((p) => p.email);
    } else if (targetType === 'group' && groupId) {
      const participants = await prisma.participant.findMany({
        where: { eventId: session.eventId, groupId },
        select: { email: true },
      });
      recipientEmails = participants.map((p) => p.email);
    } else if (targetType === 'submission_status' && statusFilter) {
      const submissions = await prisma.submission.findMany({
        where: { eventId: session.eventId, status: statusFilter },
        select: { email: true },
      });
      recipientEmails = submissions.map((s) => s.email);
    } else {
      // Default: All participants in the event
      const participants = await prisma.participant.findMany({
        where: { eventId: session.eventId },
        select: { email: true },
      });
      recipientEmails = participants.map((p) => p.email);
    }

    // Deduplicate emails
    const uniqueEmails = Array.from(new Set(recipientEmails.filter(Boolean)));

    if (uniqueEmails.length === 0) {
      return NextResponse.json({ error: 'No recipients matched the selected criteria' }, { status: 400 });
    }

    // Format body line breaks to HTML
    const formattedHtml = body.replace(/\n/g, '<br />');

    // Dispatch broadcast emails
    let sentCount = 0;
    const errors: string[] = [];

    for (const toEmail of uniqueEmails) {
      try {
        await sendCustomBroadcastEmail({
          to: toEmail,
          eventName: event.name,
          subject: subject.trim(),
          htmlContent: formattedHtml,
        });
        sentCount++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Send failed';
        errors.push(`${toEmail}: ${msg}`);
      }
    }

    return NextResponse.json({
      success: true,
      totalRecipients: uniqueEmails.length,
      sentCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Broadcast email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
