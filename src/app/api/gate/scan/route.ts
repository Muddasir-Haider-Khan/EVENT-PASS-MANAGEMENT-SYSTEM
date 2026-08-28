import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { EntryStatus, ScanResult } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req, 'gate');
  if (!session || !session.eventId || !session.gateId || !session.gateType) {
    return NextResponse.json({ error: 'Unauthorized — invalid gate session' }, { status: 401 });
  }

  const gateId = session.gateId;
  const isEntryGate = session.gateType === 'ENTRY';

  try {
    const body = await req.json();

    // -------------------------------------------------------------
    // HANDLE GATE OFFICER CONFIRMATION (APPROVE / DECLINE)
    // -------------------------------------------------------------
    if (body.confirmAction && body.participantId) {
      const { confirmAction, participantId } = body;

      const participant = await prisma.participant.findFirst({
        where: { id: participantId, eventId: session.eventId },
        include: { participantType: true, group: true },
      });

      if (!participant) {
        return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
      }

      if (confirmAction === 'APPROVE') {
        const newStatus = isEntryGate ? 'INSIDE' : 'EXITED';
        const scanResult: ScanResult = isEntryGate ? 'ENTRY_GRANTED' : 'EXIT_GRANTED';

        await prisma.participant.update({
          where: { id: participant.id },
          data: {
            entryStatus: newStatus as EntryStatus,
            lastScanAt: new Date(),
          },
        });

        await prisma.scanLog.create({
          data: {
            participantId: participant.id,
            gateId,
            result: scanResult,
            qrTokenUsed: participant.qrToken,
          },
        });

        return NextResponse.json({
          result: scanResult,
          message: isEntryGate
            ? 'ENTRY APPROVED — Attendee is now Inside Event'
            : 'EXIT APPROVED — Attendee has Exited Event',
          color: 'green',
          participant: {
            id: participant.id,
            name: participant.name || participant.email,
            email: participant.email,
            photoUrl: participant.photoUrl,
            participantType: participant.participantType?.name || null,
            group: participant.group?.name || null,
            entryStatus: newStatus,
          },
        });
      } else {
        // DECLINE ACTION BY GATE OFFICER
        const scanResult: ScanResult = isEntryGate
          ? 'ENTRY_DENIED_ALREADY_INSIDE'
          : 'EXIT_DENIED_NOT_INSIDE';

        await prisma.scanLog.create({
          data: {
            participantId: participant.id,
            gateId,
            result: scanResult,
            qrTokenUsed: participant.qrToken,
          },
        });

        return NextResponse.json({
          result: 'ENTRY_DECLINED',
          message: 'ENTRY DECLINED — Access denied by gate officer',
          color: 'red',
          participant: {
            id: participant.id,
            name: participant.name || participant.email,
            email: participant.email,
            photoUrl: participant.photoUrl,
            participantType: participant.participantType?.name || null,
            group: participant.group?.name || null,
            entryStatus: participant.entryStatus,
          },
        });
      }
    }

    // -------------------------------------------------------------
    // INITIAL QR TOKEN SCAN LOOKUP
    // -------------------------------------------------------------
    if (!body.qrToken) {
      return NextResponse.json({ error: 'QR token is required' }, { status: 400 });
    }

    let rawToken = String(body.qrToken).trim().replaceAll('"', '').replaceAll("'", "");
    if (rawToken.includes('http')) {
      try {
        const urlObj = new URL(rawToken);
        rawToken = urlObj.searchParams.get('token') || urlObj.pathname.split('/').pop() || rawToken;
      } catch {
        // keep rawToken
      }
    }

    // Lookup participant
    let participant = await prisma.participant.findUnique({
      where: { qrToken: rawToken },
      include: { event: true, participantType: true, group: true },
    });

    if (!participant) {
      participant = await prisma.participant.findFirst({
        where: { qrToken: { equals: rawToken, mode: 'insensitive' } },
        include: { event: true, participantType: true, group: true },
      });
    }

    // 1. Invalid or Unknown QR
    if (!participant) {
      await prisma.scanLog.create({
        data: {
          gateId,
          result: 'INVALID_QR',
          qrTokenUsed: rawToken,
        },
      });
      return NextResponse.json({
        result: 'INVALID_QR',
        message: 'INVALID QR — Pass not found in system',
        color: 'red',
        autoDecline: true,
      });
    }

    // 2. Belongs to different event
    if (participant.eventId !== session.eventId) {
      await prisma.scanLog.create({
        data: {
          gateId,
          participantId: participant.id,
          result: 'INVALID_QR',
          qrTokenUsed: rawToken,
        },
      });
      return NextResponse.json({
        result: 'INVALID_QR',
        message: 'WRONG EVENT — Pass belongs to another event',
        color: 'red',
        autoDecline: true,
      });
    }

    // 3. Expired or Revoked Pass
    if (participant.isExpired) {
      await prisma.scanLog.create({
        data: {
          gateId,
          participantId: participant.id,
          result: 'INVALID_QR',
          qrTokenUsed: rawToken,
        },
      });
      return NextResponse.json({
        result: 'EXPIRED_PASS',
        message: 'EXPIRED PASS — Pass is revoked or expired',
        color: 'red',
        autoDecline: true,
        participant: {
          id: participant.id,
          name: participant.name || participant.email,
          email: participant.email,
          photoUrl: participant.photoUrl,
          participantType: participant.participantType?.name || null,
          group: participant.group?.name || null,
          entryStatus: participant.entryStatus,
        },
      });
    }

    const currentStatus = participant.entryStatus;

    // -------------------------------------------------------------
    // ENTRY GATE SCAN LOGIC
    // -------------------------------------------------------------
    if (isEntryGate) {
      // IF ALREADY INSIDE -> AUTOMATIC INSTANT DECLINE (NO POPUP)
      if (currentStatus === 'INSIDE') {
        await prisma.scanLog.create({
          data: {
            gateId,
            participantId: participant.id,
            result: 'ENTRY_DENIED_ALREADY_INSIDE',
            qrTokenUsed: rawToken,
          },
        });

        return NextResponse.json({
          result: 'ENTRY_DENIED_ALREADY_INSIDE',
          message: 'ALREADY IN THE EVENT — Attendee is already inside venue',
          color: 'red',
          autoDecline: true, // Signals frontend NOT to show approve/decline buttons
          participant: {
            id: participant.id,
            name: participant.name || participant.email,
            email: participant.email,
            photoUrl: participant.photoUrl,
            participantType: participant.participantType?.name || null,
            group: participant.group?.name || null,
            entryStatus: 'INSIDE',
          },
        });
      }

      // IF NOT_ENTERED OR EXITED -> REQUIRES APPROVE / DECLINE BUTTONS
      return NextResponse.json({
        result: 'PENDING_APPROVAL',
        message: 'Please verify photo & details, then Approve or Decline entry.',
        color: 'indigo',
        requiresApproval: true, // Signals frontend to show photo with Approve/Decline buttons
        participant: {
          id: participant.id,
          name: participant.name || participant.email,
          email: participant.email,
          photoUrl: participant.photoUrl,
          participantType: participant.participantType?.name || null,
          group: participant.group?.name || null,
          entryStatus: currentStatus,
        },
      });
    }

    // -------------------------------------------------------------
    // EXIT GATE SCAN LOGIC
    // -------------------------------------------------------------
    else {
      // IF NOT INSIDE -> AUTOMATIC INSTANT DECLINE
      if (currentStatus !== 'INSIDE') {
        await prisma.scanLog.create({
          data: {
            gateId,
            participantId: participant.id,
            result: 'EXIT_DENIED_NOT_INSIDE',
            qrTokenUsed: rawToken,
          },
        });

        return NextResponse.json({
          result: 'EXIT_DENIED_NOT_INSIDE',
          message: 'ALREADY OUTSIDE — Attendee is not recorded inside venue',
          color: 'amber',
          autoDecline: true,
          participant: {
            id: participant.id,
            name: participant.name || participant.email,
            email: participant.email,
            photoUrl: participant.photoUrl,
            participantType: participant.participantType?.name || null,
            group: participant.group?.name || null,
            entryStatus: currentStatus,
          },
        });
      }

      // IF INSIDE -> REQUIRES CONFIRMATION TO EXIT
      return NextResponse.json({
        result: 'PENDING_APPROVAL',
        message: 'Please verify photo & details, then Approve or Decline exit.',
        color: 'indigo',
        requiresApproval: true,
        participant: {
          id: participant.id,
          name: participant.name || participant.email,
          email: participant.email,
          photoUrl: participant.photoUrl,
          participantType: participant.participantType?.name || null,
          group: participant.group?.name || null,
          entryStatus: currentStatus,
        },
      });
    }
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
