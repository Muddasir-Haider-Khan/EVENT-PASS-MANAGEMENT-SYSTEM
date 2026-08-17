import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendDeclineNotice } from '@/lib/resend';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: { event: true },
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (submission.eventId !== session.eventId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    if (submission.status !== 'PENDING') {
      return NextResponse.json({ error: 'Submission has already been reviewed' }, { status: 400 });
    }

    await prisma.submission.update({
      where: { id: params.id },
      data: { status: 'DECLINED', reviewedAt: new Date() },
    });

    // Send decline email
    try {
      await sendDeclineNotice({
        to: submission.email,
        eventName: submission.event.name,
      });
    } catch (emailError) {
      console.error('Failed to send decline email:', emailError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Decline error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
