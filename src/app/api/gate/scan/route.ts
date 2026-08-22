import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { scanSchema } from '@/lib/validation';
import { EntryStatus, ScanResult } from '@prisma/client';

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req, 'gate');
  if (!session || !session.eventId || !session.gateId || !session.gateType) {
    return NextResponse.json({ error: 'Unauthorized — invalid gate session' }, { status: 401 });
  }

  const gateId = session.gateId;

  try {
    const body = await req.json();
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const rawToken = parsed.data.qrToken.trim().replaceAll('"', '').replaceAll("'", "");

    // Fast lookup participant by QR token (with insensitive fallback)
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

    // Invalid or unknown token
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
        message: 'Invalid or unknown QR code pass',
        color: 'red',
      });
    }

    // Check if QR pass is expired / revoked
    if (participant.qrExpired) {
      await prisma.scanLog.create({
        data: {
          gateId,
          participantId: participant.id,
          result: 'INVALID_QR',
          qrTokenUsed: rawToken,
        },
      });
      return NextResponse.json({
        result: 'EXPIRED_QR',
        message: 'Pass QR code has expired or has been revoked by management',
        color: 'red',
        participant: {
          name: participant.name || participant.email,
          email: participant.email,
          photoUrl: participant.photoUrl,
        },
      });
    }

    // Token belongs to different event
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
        message: 'This pass belongs to a different event',
        color: 'red',
      });
    }


    const isEntryGate = session.gateType === 'ENTRY';
    const currentStatus = participant.entryStatus;
    const now = new Date();

    let result: string;
    let newStatus: string;
    let message: string;
    let color: string;

    if (isEntryGate) {
      // Entry gate logic
      if (currentStatus === 'NOT_ENTERED' || currentStatus === 'EXITED') {
        result = 'ENTRY_GRANTED';
        newStatus = 'INSIDE';
        message = 'ENTRY APPROVED — Pass Activated';
        color = 'green';
      } else {
        // Already INSIDE
        result = 'ENTRY_DENIED_ALREADY_INSIDE';
        message = 'ALREADY IN EVENT — Pass is active inside venue';
        color = 'amber';
        newStatus = currentStatus;
      }
    } else {
      // Exit gate logic
      if (currentStatus === 'INSIDE') {
        result = 'EXIT_GRANTED';
        newStatus = 'EXITED';
        message = 'EXIT APPROVED — Pass Deactivated';
        color = 'green';
      } else {
        result = 'EXIT_DENIED_NOT_INSIDE';
        message = 'ALREADY OUTSIDE — Pass is deactive';
        color = 'amber';
        newStatus = currentStatus;
      }
    }

    let statusUpdated = true;

    // Atomic conditional update to prevent double-scan race conditions
    if (newStatus !== currentStatus) {
      await prisma.$transaction(async (tx) => {
        const updateData: any = {
          entryStatus: newStatus as EntryStatus,
          lastScanAt: now,
        };

        if (participant.event.eventType === 'MUN' && !isEntryGate) {
          updateData.qrExpired = true;
        }

        const updateResult = await tx.participant.updateMany({
          where: {
            id: participant.id,
            entryStatus: currentStatus as EntryStatus,
          },
          data: updateData,
        });

        if (updateResult.count === 0) {
          // A concurrent scan updated entryStatus first!
          statusUpdated = false;
        }

        const finalResult = statusUpdated
          ? result
          : isEntryGate
          ? 'ENTRY_DENIED_ALREADY_INSIDE'
          : 'EXIT_DENIED_NOT_INSIDE';

        await tx.scanLog.create({
          data: {
            participantId: participant.id,
            gateId,
            result: finalResult as ScanResult,
            qrTokenUsed: rawToken,
          },
        });
      });
    } else {
      await prisma.scanLog.create({
        data: {
          participantId: participant.id,
          gateId,
          result: result as ScanResult,
          qrTokenUsed: rawToken,
        },
      });
    }

    // Handle race condition fallback response if concurrent update failed
    if (!statusUpdated) {
      if (isEntryGate) {
        return NextResponse.json({
          result: 'ENTRY_DENIED_ALREADY_INSIDE',
          message: 'ALREADY IN EVENT — Pass is active inside venue',
          color: 'amber',
          participant: {
            name: participant.name || participant.email,
            email: participant.email,
            entryStatus: 'INSIDE',
            photoUrl: participant.photoUrl,
            participantTypeName: participant.participantType?.name,
            groupName: participant.group?.name,
          },
        });
      } else {
        return NextResponse.json({
          result: 'EXIT_DENIED_NOT_INSIDE',
          message: 'ALREADY OUTSIDE — Pass is deactive',
          color: 'amber',
          participant: {
            name: participant.name || participant.email,
            email: participant.email,
            entryStatus: 'EXITED',
            photoUrl: participant.photoUrl,
            participantTypeName: participant.participantType?.name,
            groupName: participant.group?.name,
          },
        });
      }
    }

    return NextResponse.json({
      result,
      message,
      color,
      participant: {
        name: participant.name || participant.email,
        email: participant.email,
        entryStatus: newStatus,
        photoUrl: participant.photoUrl,
        participantTypeName: participant.participantType?.name,
        groupName: participant.group?.name,
      },
    });

  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
