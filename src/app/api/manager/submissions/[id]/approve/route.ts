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


    // Extract responses object
    const responses = (submission.responses || {}) as Record<string, unknown>;
    const groupMembers = Array.isArray(responses.groupMembers)
      ? (responses.groupMembers as Array<{
          name: string;
          email: string;
          phone?: string;
          photoUrl?: string;
          isLeader?: boolean;
        }>)
      : [];

    const groupName = responses.groupName ? String(responses.groupName) : null;

    // Check if this is a group submission
    if (groupMembers.length > 0) {
      // Create group
      const createdGroup = await prisma.participantGroup.create({
        data: {
          eventId: session.eventId,
          participantTypeId: submission.participantTypeId,
          name: groupName || `${submission.email}'s Delegation`,
        },
      });

      let leaderParticipantId: string | null = null;

      // Process each member
      for (const member of groupMembers) {
        const qrToken = generateQRToken();
        const qrDataUrl = await generateQRCodeDataURL(qrToken);

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
        } catch (uploadErr) {
          console.error('QR upload failed for group member:', uploadErr);
        }

        const participant = await prisma.participant.create({
          data: {
            eventId: session.eventId,
            submissionId: params.id,
            participantTypeId: submission.participantTypeId,
            groupId: createdGroup.id,
            name: member.name || 'Delegation Member',
            email: member.email.trim().toLowerCase(),
            phone: member.phone || submission.phone,
            photoUrl: member.photoUrl || submission.photoUrl,
            qrToken,
            entryStatus: 'NOT_ENTERED',
          },
        });

        if (member.isLeader) {
          leaderParticipantId = participant.id;
        }

        // Send individual QR pass email to member
        try {
          await sendQRPass({
            to: member.email.trim().toLowerCase(),
            participantName: member.name || 'Delegation Member',
            eventName: submission.event.name,
            venue: submission.event.venue,
            eventDate: submission.event.eventDate?.toISOString() || null,
            qrImageUrl,
            groupName: groupName,
          });
        } catch (emailErr) {
          console.error(`Failed to send QR pass email to member (${member.email}):`, emailErr);
        }
      }

      if (leaderParticipantId) {
        await prisma.participantGroup.update({
          where: { id: createdGroup.id },
          data: { leaderId: leaderParticipantId },
        });
      }

      // Mark submission as APPROVED
      await prisma.submission.update({
        where: { id: params.id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      });

      return NextResponse.json({ success: true, message: 'Group delegation passes generated & dispatched successfully' });
    }

    // --- Standard single participant approval ---
    const qrToken = generateQRToken();
    const qrDataUrl = await generateQRCodeDataURL(qrToken);

    let singleQrImageUrl = qrDataUrl;
    try {
      const uploadRes = await uploadFile(
        qrDataUrl,
        `qr_${qrToken}.png`,
        `/epms/events/${session.eventId}/qrcodes`
      );
      if (uploadRes && uploadRes.url) {
        singleQrImageUrl = uploadRes.url;
      }
    } catch (uploadError) {
      console.error('ImageKit QR Upload Error (falling back to data URL):', uploadError);
    }

    const nameField = Object.entries(responses).find(
      ([key]) => (key || '').toLowerCase().includes('name') && !(key || '').toLowerCase().includes('email')
    );
    const participantName = nameField ? String(nameField[1]) : null;

    const [, participant] = await prisma.$transaction([
      prisma.submission.update({
        where: { id: params.id },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      }),
      prisma.participant.create({
        data: {
          eventId: session.eventId,
          submissionId: params.id,
          participantTypeId: submission.participantTypeId,
          name: participantName,
          email: submission.email,
          phone: submission.phone,
          photoUrl: submission.photoUrl,
          qrToken,
          entryStatus: 'NOT_ENTERED',
        },
      }),
    ]);

    try {
      await sendQRPass({
        to: submission.email,
        participantName: participantName || '',
        eventName: submission.event.name,
        venue: submission.event.venue,
        eventDate: submission.event.eventDate?.toISOString() || null,
        qrImageUrl: singleQrImageUrl,
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
