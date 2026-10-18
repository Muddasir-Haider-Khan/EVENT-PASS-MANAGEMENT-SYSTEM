import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { redisCache } from '@/lib/redis';
import { EntryStatus, ScanResult } from '@prisma/client';

// Passes encode a 64-char hex token (see generateQRToken). Anything else is not a pass.
const QR_TOKEN_PATTERN = /[0-9a-f]{64}/i;

interface ParticipantSummarySource {
  id: string;
  name: string | null;
  email: string;
  photoUrl: string | null;
  entryStatus: EntryStatus | string;
  participantType?: { name: string } | null;
  group?: { name: string } | null;
}

function summarize(p: ParticipantSummarySource, entryStatus: EntryStatus | string = p.entryStatus) {
  return {
    id: p.id,
    name: p.name || p.email,
    email: p.email,
    photoUrl: p.photoUrl,
    participantType: p.participantType?.name || null,
    group: p.group?.name || null,
    entryStatus,
  };
}

export async function POST(req: NextRequest) {
  const session = getSessionFromRequest(req, 'gate');
  if (!session || !session.eventId || !session.gateId || !session.gateType) {
    return NextResponse.json(
      {
        result: 'UNAUTHORIZED',
        message: 'Gate session expired or invalid. Please re-authenticate with Gate OTP.',
        color: 'red',
        autoDecline: true,
        error: 'Unauthorized — invalid gate session',
      },
      { status: 401 }
    );
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
        include: { participantType: true, group: true, event: true },
      });

      if (!participant) {
        return NextResponse.json(
          {
            result: 'NOT_FOUND',
            message: 'Participant record not found in system',
            color: 'red',
            autoDecline: true,
            error: 'Participant not found',
          },
          { status: 404 }
        );
      }

      if (confirmAction === 'APPROVE') {
        const maxAllowedEntries = participant.participantType?.validDays || 1;

        // Every check and the state transition run under a row lock on the participant,
        // so two gates approving the same pass at once are serialized: the second one
        // re-reads the committed state and is denied instead of double-granting.
        const outcome = await prisma.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT id FROM "Participant" WHERE id = ${participant.id} FOR UPDATE`;

          const current = await tx.participant.findUniqueOrThrow({
            where: { id: participant.id },
            select: { entryStatus: true, isExpired: true },
          });
          const entriesGranted = await tx.scanLog.count({
            where: { participantId: participant.id, result: 'ENTRY_GRANTED' },
          });

          let denial: ScanResult | null = null;
          if (current.isExpired) denial = 'INVALID_QR';
          else if (isEntryGate && entriesGranted >= maxAllowedEntries) denial = 'ENTRY_DENIED_EXPIRED';
          else if (isEntryGate && current.entryStatus === 'INSIDE') denial = 'ENTRY_DENIED_ALREADY_INSIDE';
          else if (!isEntryGate && current.entryStatus !== 'INSIDE') denial = 'EXIT_DENIED_NOT_INSIDE';

          if (denial) {
            await tx.scanLog.create({
              data: { participantId: participant.id, gateId, result: denial, qrTokenUsed: participant.qrToken },
            });
            return { granted: false as const, result: denial, entryStatus: current.entryStatus, entriesGranted };
          }

          const newStatus: EntryStatus = isEntryGate ? 'INSIDE' : 'EXITED';
          const scanResult: ScanResult = isEntryGate ? 'ENTRY_GRANTED' : 'EXIT_GRANTED';
          const updatedEntriesGranted = isEntryGate ? entriesGranted + 1 : entriesGranted;
          // Pass is spent once the holder walks out after their final allowed entry
          const isNowExpired = !isEntryGate && updatedEntriesGranted >= maxAllowedEntries;

          await tx.participant.update({
            where: { id: participant.id },
            data: {
              entryStatus: newStatus,
              lastScanAt: new Date(),
              ...(isNowExpired && { isExpired: true }),
            },
          });
          await tx.scanLog.create({
            data: { participantId: participant.id, gateId, result: scanResult, qrTokenUsed: participant.qrToken },
          });

          return { granted: true as const, result: scanResult, entryStatus: newStatus, entriesGranted: updatedEntriesGranted };
        });

        // Invalidate Redis cache for instant update
        await redisCache.del(`participant:qr:${participant.qrToken}`);

        if (!outcome.granted) {
          const messages: Record<string, { result: string; message: string; color: string }> = {
            INVALID_QR: { result: 'EXPIRED_PASS', message: 'EXPIRED PASS — Pass is revoked or expired', color: 'red' },
            ENTRY_DENIED_EXPIRED: {
              result: 'ENTRY_DENIED_EXPIRED',
              message: `ENTRY DENIED — Pass limit of ${maxAllowedEntries} entry/entries reached for category "${participant.participantType?.name || 'Category'}"`,
              color: 'red',
            },
            ENTRY_DENIED_ALREADY_INSIDE: {
              result: 'ENTRY_DENIED_ALREADY_INSIDE',
              message: 'ALREADY IN THE EVENT — Attendee was admitted at another gate moments ago',
              color: 'red',
            },
            EXIT_DENIED_NOT_INSIDE: {
              result: 'EXIT_DENIED_NOT_INSIDE',
              message: 'ALREADY OUTSIDE — Attendee is not recorded inside venue',
              color: 'amber',
            },
          };
          return NextResponse.json({
            ...messages[outcome.result],
            autoDecline: true,
            participant: summarize(participant, outcome.entryStatus),
          });
        }

        return NextResponse.json({
          result: outcome.result,
          message: isEntryGate
            ? `ENTRY APPROVED — (${outcome.entriesGranted}/${maxAllowedEntries} Entries Used)`
            : `EXIT APPROVED — (${outcome.entriesGranted}/${maxAllowedEntries} Entries Used)`,
          color: 'green',
          participant: summarize(participant, outcome.entryStatus),
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

        await redisCache.del(`participant:qr:${participant.qrToken}`);

        return NextResponse.json({
          result: 'ENTRY_DECLINED',
          message: 'ENTRY DECLINED — Access denied by gate officer',
          color: 'red',
          autoDecline: true,
          participant: summarize(participant),
        });
      }
    }

    // -------------------------------------------------------------
    // INITIAL QR TOKEN SCAN LOOKUP WITH REDIS CACHING
    // -------------------------------------------------------------
    if (!body.qrToken) {
      return NextResponse.json(
        {
          result: 'MISSING_TOKEN',
          message: 'QR pass token is required',
          color: 'red',
          autoDecline: true,
          error: 'QR token is required',
        },
        { status: 400 }
      );
    }

    // Extract the token from whatever the scanner delivered (bare token, URL,
    // scanner prefix/suffix noise, caps-lock). Lookup is exact-match only:
    // partial or fuzzy matching would let a short guess resolve to a real pass.
    const scannedInput = String(body.qrToken).trim();
    const qrToken = scannedInput.match(QR_TOKEN_PATTERN)?.[0].toLowerCase();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let participant: any = null;
    if (qrToken) {
      const cacheKey = `participant:qr:${qrToken}`;
      participant = await redisCache.get(cacheKey);
      if (!participant) {
        participant = await prisma.participant.findUnique({
          where: { qrToken },
          include: { event: true, participantType: true, group: true },
        });
        if (participant) {
          // Store in Redis cache for 1 hour
          await redisCache.set(cacheKey, participant, 3600);
        }
      }
    }

    // INVALID OR UNKNOWN QR PASS
    if (!participant) {
      await prisma.scanLog.create({
        data: {
          gateId,
          result: 'INVALID_QR',
          qrTokenUsed: (qrToken || scannedInput).slice(0, 256),
        },
      });
      return NextResponse.json({
        result: 'INVALID_QR',
        message: 'INVALID QR — Pass not found in system',
        color: 'red',
        autoDecline: true,
      });
    }

    // BELONGS TO DIFFERENT EVENT
    if (participant.eventId !== session.eventId) {
      await prisma.scanLog.create({
        data: {
          gateId,
          participantId: participant.id,
          result: 'INVALID_QR',
          qrTokenUsed: qrToken,
        },
      });
      return NextResponse.json({
        result: 'WRONG_EVENT',
        message: `WRONG EVENT — Pass belongs to "${participant.event?.name || 'another event'}"`,
        color: 'red',
        autoDecline: true,
        participant: summarize(participant),
      });
    }

    // EXPIRED OR REVOKED PASS
    if (participant.isExpired) {
      await prisma.scanLog.create({
        data: {
          gateId,
          participantId: participant.id,
          result: 'INVALID_QR',
          qrTokenUsed: qrToken,
        },
      });
      return NextResponse.json({
        result: 'EXPIRED_PASS',
        message: 'EXPIRED PASS — Pass is revoked or expired',
        color: 'red',
        autoDecline: true,
        participant: summarize(participant),
      });
    }

    const currentStatus = participant.entryStatus;

    // ENTRY GATE SCAN LOGIC
    if (isEntryGate) {
      const maxAllowedEntries = participant.participantType?.validDays || 1;
      const totalEntriesGranted = await prisma.scanLog.count({
        where: {
          participantId: participant.id,
          result: 'ENTRY_GRANTED',
        },
      });

      if (totalEntriesGranted >= maxAllowedEntries) {
        await prisma.scanLog.create({
          data: {
            gateId,
            participantId: participant.id,
            result: 'ENTRY_DENIED_EXPIRED',
            qrTokenUsed: qrToken,
          },
        });

        return NextResponse.json({
          result: 'ENTRY_DENIED_EXPIRED',
          message: `QR VALIDITY EXCEEDED — Allowed ${maxAllowedEntries} entry/entries (${totalEntriesGranted} used)`,
          color: 'red',
          autoDecline: true,
          participant: summarize(participant),
        });
      }
      // IF ALREADY INSIDE -> AUTOMATIC INSTANT DECLINE (NO POPUP)
      if (currentStatus === 'INSIDE') {
        await prisma.scanLog.create({
          data: {
            gateId,
            participantId: participant.id,
            result: 'ENTRY_DENIED_ALREADY_INSIDE',
            qrTokenUsed: qrToken,
          },
        });

        return NextResponse.json({
          result: 'ENTRY_DENIED_ALREADY_INSIDE',
          message: 'ALREADY IN THE EVENT — Attendee is already inside venue',
          color: 'red',
          autoDecline: true,
          participant: summarize(participant, 'INSIDE'),
        });
      }

      // IF NOT_ENTERED OR EXITED -> REQUIRES GATE OFFICER APPROVAL
      return NextResponse.json({
        result: 'PENDING_APPROVAL',
        message: 'Please verify photo & details, then tap Approve or Decline.',
        color: 'indigo',
        requiresApproval: true,
        participant: summarize(participant),
      });
    }

    // EXIT GATE SCAN LOGIC
    else {
      if (currentStatus !== 'INSIDE') {
        await prisma.scanLog.create({
          data: {
            gateId,
            participantId: participant.id,
            result: 'EXIT_DENIED_NOT_INSIDE',
            qrTokenUsed: qrToken,
          },
        });

        return NextResponse.json({
          result: 'EXIT_DENIED_NOT_INSIDE',
          message: 'ALREADY OUTSIDE — Attendee is not recorded inside venue',
          color: 'amber',
          autoDecline: true,
          participant: summarize(participant),
        });
      }

      return NextResponse.json({
        result: 'PENDING_APPROVAL',
        message: 'Please verify photo & details, then tap Approve or Decline exit.',
        color: 'indigo',
        requiresApproval: true,
        participant: summarize(participant),
      });
    }
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      {
        result: 'SERVER_ERROR',
        message: 'Internal server error processing scan',
        color: 'red',
        autoDecline: true,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
