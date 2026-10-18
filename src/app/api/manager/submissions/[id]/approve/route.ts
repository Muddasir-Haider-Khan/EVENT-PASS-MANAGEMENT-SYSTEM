import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { generateQRToken, generateQRCodeDataURL } from '@/lib/qr';
import { sendQRPass } from '@/lib/resend';
import { uploadFile } from '@/lib/imagekit';

class AlreadyReviewedError extends Error {}

interface PassToIssue {
  name: string | null;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  qrToken: string;
  isLeader: boolean;
}

/** Render the QR, host it on ImageKit (falling back to the inline data URL) and email it. */
async function deliverPass(
  pass: PassToIssue,
  eventId: string,
  event: { name: string; venue: string; eventDate: Date | null },
  groupName: string | null
) {
  const qrDataUrl = await generateQRCodeDataURL(pass.qrToken);
  let qrImageUrl = qrDataUrl;
  try {
    const uploadRes = await uploadFile(qrDataUrl, `qr_${pass.qrToken}.png`, `/epms/events/${eventId}/qrcodes`);
    if (uploadRes && uploadRes.url) {
      qrImageUrl = uploadRes.url;
    }
  } catch (uploadError) {
    console.error('ImageKit QR Upload Error (falling back to data URL):', uploadError);
  }

  try {
    await sendQRPass({
      to: pass.email,
      participantName: pass.name || '',
      eventName: event.name,
      venue: event.venue,
      eventDate: event.eventDate?.toISOString() || null,
      qrImageUrl,
      ...(groupName && { groupName }),
    });
  } catch (emailError) {
    console.error(`Failed to send QR pass email (${pass.email}):`, emailError);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const eventId = session.eventId;

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
      include: { event: true },
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    if (submission.eventId !== eventId) {
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
    const isGroup = groupMembers.length > 0;
    const groupName = responses.groupName ? String(responses.groupName) : null;

    let passes: PassToIssue[];
    if (isGroup) {
      passes = groupMembers
        .map((member) => ({
          name: (member.name || '').trim() || 'Delegation Member',
          email: (member.email || submission.email || '').trim().toLowerCase(),
          phone: member.phone || submission.phone,
          photoUrl: member.photoUrl || submission.photoUrl,
          qrToken: generateQRToken(),
          isLeader: Boolean(member.isLeader),
        }))
        .filter((p) => p.email);
    } else {
      const nameField = Object.entries(responses).find(
        ([key]) => (key || '').toLowerCase().includes('name') && !(key || '').toLowerCase().includes('email')
      );
      passes = [
        {
          name: nameField ? String(nameField[1]) : null,
          email: submission.email,
          phone: submission.phone,
          photoUrl: submission.photoUrl,
          qrToken: generateQRToken(),
          isLeader: false,
        },
      ];
    }

    // All database writes commit together or not at all. Claiming the submission
    // (PENDING → APPROVED) first also stops a double-click or a second manager
    // from issuing a duplicate set of passes.
    const participants = await prisma.$transaction(async (tx) => {
      const claimed = await tx.submission.updateMany({
        where: { id: params.id, status: 'PENDING' },
        data: { status: 'APPROVED', reviewedAt: new Date() },
      });
      if (claimed.count === 0) throw new AlreadyReviewedError();

      const group = isGroup
        ? await tx.participantGroup.create({
            data: {
              eventId,
              participantTypeId: submission.participantTypeId,
              name: groupName || `${submission.email}'s Delegation`,
            },
          })
        : null;

      const created = [];
      for (const pass of passes) {
        created.push(
          await tx.participant.create({
            data: {
              eventId,
              submissionId: params.id,
              participantTypeId: submission.participantTypeId,
              groupId: group?.id ?? null,
              name: pass.name,
              email: pass.email,
              phone: pass.phone,
              photoUrl: pass.photoUrl,
              qrToken: pass.qrToken,
              entryStatus: 'NOT_ENTERED',
            },
          })
        );
      }

      const leaderIndex = passes.findIndex((p) => p.isLeader);
      if (group && leaderIndex !== -1) {
        await tx.participantGroup.update({
          where: { id: group.id },
          data: { leaderId: created[leaderIndex].id },
        });
      }

      return created;
    }, { timeout: 15_000 }); // large delegations insert many rows

    // Passes are committed — delivery failures are logged per recipient, never roll back.
    for (const pass of passes) {
      await deliverPass(pass, eventId, submission.event, isGroup ? groupName : null);
    }

    if (isGroup) {
      return NextResponse.json({ success: true, message: 'Group delegation passes generated & dispatched successfully' });
    }
    return NextResponse.json({ success: true, participant: participants[0] });
  } catch (error) {
    if (error instanceof AlreadyReviewedError) {
      return NextResponse.json({ error: 'Submission has already been reviewed' }, { status: 400 });
    }
    console.error('Approve error:', error);
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
