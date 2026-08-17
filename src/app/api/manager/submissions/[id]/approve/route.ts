import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateQRToken, generateQRCodeDataURL } from '@/lib/qr';
import { sendQRPass } from '@/lib/resend';

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

    // Generate QR token and code
    const qrToken = generateQRToken();
    const qrDataUrl = await generateQRCodeDataURL(qrToken);

    // Extract name from responses if available
    const responses = submission.responses as Record<string, string>;
    const nameField = Object.entries(responses).find(
      ([key]) => key.toLowerCase().includes('name') && !key.toLowerCase().includes('email')
    );
    const participantName = nameField ? String(nameField[1]) : null;

    // Transaction: update submission + create participant
    const [, participant] = await prisma.$transaction([
      prisma.submission.update({
        where: { id: params.id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      }),
      prisma.participant.create({
        data: {
          eventId: session.eventId,
          submissionId: params.id,
          name: participantName,
          email: submission.email,
          qrToken,
          entryStatus: 'NOT_ENTERED',
        },
      }),
    ]);

    // Send QR pass email
    try {
      await sendQRPass({
        to: submission.email,
        participantName: participantName || '',
        eventName: submission.event.name,
        venue: submission.event.venue,
        eventDate: submission.event.eventDate?.toISOString() || null,
        qrDataUrl,
        primaryColor: submission.event.primaryColor,
        secondaryColor: submission.event.secondaryColor,
      });
    } catch (emailError) {
      console.error('Failed to send QR pass email:', emailError);
    }

    return NextResponse.json({ success: true, participant });
  } catch (error) {
    console.error('Approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
