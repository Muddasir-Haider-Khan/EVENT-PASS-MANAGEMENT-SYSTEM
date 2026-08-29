import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { redisCache } from '@/lib/redis';
import { EntryStatus, ScanResult } from '@prisma/client';

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
        const totalEntriesGranted = await prisma.scanLog.count({
          where: {
            participantId: participant.id,
            result: 'ENTRY_GRANTED',
          },
        });

        if (isEntryGate && totalEntriesGranted >= maxAllowedEntries) {
          await prisma.scanLog.create({
            data: {
              participantId: participant.id,
              gateId,
              result: 'ENTRY_DENIED_EXPIRED',
              qrTokenUsed: participant.qrToken,
            },
          });

          if (participant.qrToken) {
            await redisCache.del(`participant:qr:${participant.qrToken}`);
          }

          return NextResponse.json({
            result: 'ENTRY_DENIED_EXPIRED',
            message: `ENTRY DENIED — Pass limit of ${maxAllowedEntries} entry/entries reached for category "${participant.participantType?.name || 'Category'}"`,
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

        const newStatus = isEntryGate ? 'INSIDE' : 'EXITED';
        const scanResult: ScanResult = isEntryGate ? 'ENTRY_GRANTED' : 'EXIT_GRANTED';

        const updatedEntriesGranted = isEntryGate ? totalEntriesGranted + 1 : totalEntriesGranted;
        const isNowExpired = updatedEntriesGranted >= maxAllowedEntries && !isEntryGate;

        await prisma.participant.update({
          where: { id: participant.id },
          data: {
            entryStatus: newStatus as EntryStatus,
            lastScanAt: new Date(),
            ...(isNowExpired && { isExpired: true }),
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

        // Invalidate Redis cache for instant update
        if (participant.qrToken) {
          await redisCache.del(`participant:qr:${participant.qrToken}`);
        }

        return NextResponse.json({
          result: scanResult,
          message: isEntryGate
            ? `ENTRY APPROVED — (${updatedEntriesGranted}/${maxAllowedEntries} Entries Used)`
            : `EXIT APPROVED — (${totalEntriesGranted}/${maxAllowedEntries} Entries Used)`,
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

        if (participant.qrToken) {
          await redisCache.del(`participant:qr:${participant.qrToken}`);
        }

        return NextResponse.json({
          result: 'ENTRY_DECLINED',
          message: 'ENTRY DECLINED — Access denied by gate officer',
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

    let rawToken = String(body.qrToken).trim().replaceAll('"', '').replaceAll("'", "");
    
    // Extract token if input is a URL or contains parameters
    if (rawToken.includes('http://') || rawToken.includes('https://') || rawToken.includes('/')) {
      try {
        if (rawToken.includes('?')) {
          const urlObj = new URL(rawToken);
          const paramToken = urlObj.searchParams.get('token') || urlObj.searchParams.get('qrToken') || urlObj.searchParams.get('id');
          if (paramToken) rawToken = paramToken;
        } else {
          const parts = rawToken.split('/').filter(Boolean);
          if (parts.length > 0) {
            rawToken = parts[parts.length - 1];
          }
        }
      } catch {
        // keep rawToken as fallback
      }
    }

    rawToken = rawToken.trim();
    const cacheKey = `participant:qr:${rawToken}`;

    // Try Redis Cache First
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let participant: any = await redisCache.get(cacheKey);

    if (!participant) {
      // 1. Direct Lookup by qrToken
      participant = await prisma.participant.findUnique({
        where: { qrToken: rawToken },
        include: { event: true, participantType: true, group: true },
      });

      // 2. Fallback: Insensitive Match
      if (!participant) {
        participant = await prisma.participant.findFirst({
          where: { qrToken: { equals: rawToken, mode: 'insensitive' } },
          include: { event: true, participantType: true, group: true },
        });
      }

      // 3. Fallback: Search by ID or Substring Containment
      if (!participant) {
        participant = await prisma.participant.findFirst({
          where: {
            OR: [
              { id: rawToken },
              { qrToken: { contains: rawToken, mode: 'insensitive' } },
            ],
          },
          include: { event: true, participantType: true, group: true },
        });
      }

      // 4. Fallback: Check if rawToken contains participant's qrToken
      if (!participant && rawToken.length > 10) {
        const allParticipants = await prisma.participant.findMany({
          where: { eventId: session.eventId },
          include: { event: true, participantType: true, group: true },
          take: 200,
        });
        participant = allParticipants.find(p => p.qrToken && rawToken.toLowerCase().includes(p.qrToken.toLowerCase())) || null;
      }

      if (participant) {
        // Store in Redis cache for 1 hour
        await redisCache.set(cacheKey, participant, 3600);
      }
    }

    // INVALID OR UNKNOWN QR PASS
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

    // BELONGS TO DIFFERENT EVENT
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
        result: 'WRONG_EVENT',
        message: `WRONG EVENT — Pass belongs to "${participant.event?.name || 'another event'}"`,
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

    // EXPIRED OR REVOKED PASS
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
            qrTokenUsed: rawToken,
          },
        });

        return NextResponse.json({
          result: 'ENTRY_DENIED_EXPIRED',
          message: `QR VALIDITY EXCEEDED — Allowed ${maxAllowedEntries} entry/entries (${totalEntriesGranted} used)`,
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
          autoDecline: true,
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

      // IF NOT_ENTERED OR EXITED -> REQUIRES GATE OFFICER APPROVAL
      return NextResponse.json({
        result: 'PENDING_APPROVAL',
        message: 'Please verify photo & details, then tap Approve or Decline.',
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

    // EXIT GATE SCAN LOGIC
    else {
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

      return NextResponse.json({
        result: 'PENDING_APPROVAL',
        message: 'Please verify photo & details, then tap Approve or Decline exit.',
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
