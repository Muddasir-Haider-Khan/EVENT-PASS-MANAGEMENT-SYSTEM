import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const groups = await prisma.participantGroup.findMany({
    where: { eventId: session.eventId },
    orderBy: { createdAt: 'desc' },
    include: {
      members: { select: { id: true, email: true, name: true, phone: true, photoUrl: true } },
      _count: {
        select: {
          members: true,
        },
      },
    },
  });

  return NextResponse.json({ groups });
}

export async function POST(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, leaderId } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Group / Delegation name is required' }, { status: 400 });
    }

    const group = await prisma.participantGroup.create({
      data: {
        eventId: session.eventId,
        name: name.trim(),
        leaderId: leaderId || null,
      },
    });

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { participantId, groupId, isLeader } = await req.json();
    if (!participantId) {
      return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });
    }

    // Verify participant belongs to manager's event
    const participant = await prisma.participant.findFirst({
      where: { id: participantId, eventId: session.eventId },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const updatedParticipant = await prisma.participant.update({
      where: { id: participantId },
      data: { groupId: groupId || null },
    });

    if (groupId && isLeader) {
      await prisma.participantGroup.update({
        where: { id: groupId },
        data: { leaderId: participantId },
      });
    }

    return NextResponse.json({ success: true, participant: updatedParticipant });
  } catch (error) {
    console.error('Update group membership error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const group = await prisma.participantGroup.findFirst({
      where: { id, eventId: session.eventId },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    await prisma.participantGroup.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
