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

  try {
    const body = await req.json();
    const parsed = scanSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { qrToken } = parsed.data;

    // Look up participant by QR token
    const participant = await prisma.participant.findUnique({
      where: { qrToken },
      include: { event: true },
    });

    // Invalid or unknown token
    if (!participant) {
      await prisma.scanLog.create({
        data: {
          gateId: session.gateId,
          result: 'INVALID_QR',
          qrTokenUsed: qrToken,
        },
      });
      return NextResponse.json({
        result: 'INVALID_QR',
        message: 'Invalid or unknown QR code',
        color: 'red',
      });
    }

    // Token belongs to different event
    if (participant.eventId !== session.eventId) {
      await prisma.scanLog.create({
        data: {
          gateId: session.gateId,
          participantId: participant.id,
          result: 'INVALID_QR',
          qrTokenUsed: qrToken,
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
        message = 'Entry granted';
        color = 'green';
      } else {
        // Already INSIDE
        result = 'ENTRY_DENIED_ALREADY_INSIDE';
        message = `Already inside since ${participant.lastScanAt?.toLocaleTimeString() || 'earlier'}`;
        color = 'amber';
        newStatus = currentStatus;
      }
    } else {
      // Exit gate logic
      if (currentStatus === 'INSIDE') {
        result = 'EXIT_GRANTED';
        newStatus = 'EXITED';
        message = 'Exit granted';
        color = 'green';
      } else {
        result = 'EXIT_DENIED_NOT_INSIDE';
        message = 'Not currently inside the event';
        color = 'amber';
        newStatus = currentStatus;
      }
    }

    // Update participant status if changed
    if (newStatus !== currentStatus) {
      await prisma.participant.update({
        where: { id: participant.id },
        data: {
          entryStatus: newStatus as EntryStatus,
          lastScanAt: now,
        },
      });
    }

    // Log the scan
    await prisma.scanLog.create({
      data: {
        participantId: participant.id,
        gateId: session.gateId,
        result: result as ScanResult,
        qrTokenUsed: qrToken,
      },
    });

    return NextResponse.json({
      result,
      message,
      color,
      participant: {
        name: participant.name || participant.email,
        email: participant.email,
        entryStatus: newStatus,
      },
    });
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
