import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateQRToken, generateQRCodeDataURL } from '@/lib/qr';
import { sendQRPass } from '@/lib/resend';
import { uploadFile } from '@/lib/imagekit';

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

    // Upload QR code to ImageKit for reliable CDN email rendering
    let qrImageUrl = qrDataUrl;
    try {
      const uploadRes = await uploadFile(
        qrDataUrl,
        `qr_${qrToken}.png`,
        `/epms/events/${session.eventId}/qrcodes`
      );
      if (uploadRes && uploadRes.url) {
        qrImageUrl = uploadRes.url;
      }
    } catch (uploadError) {
      console.error('ImageKit QR Upload Error (falling back to data URL):', uploadError);
    }

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
          photoUrl: submission.photoUrl,
          participantTypeId: (submission as any).participantTypeId,
          groupId: (submission as any).groupId,
          qrExpired: false,
        },
      }),
    ]);


    // Send QR pass email with hosted ImageKit QR URL
    try {
      await sendQRPass({
        to: submission.email,
        participantName: participantName || '',
        eventName: submission.event.name,
        venue: submission.event.venue,
        eventDate: submission.event.eventDate?.toISOString() || null,
        qrImageUrl,
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
