import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const types = await prisma.participantType.findMany({
    where: { eventId: session.eventId },
    orderBy: { createdAt: 'asc' },
    include: {
      formFields: {
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          submissions: true,
          participants: true,
          formFields: true,
        },
      },
    },
  });

  return NextResponse.json({ participantTypes: types });
}

export async function POST(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, description, isGroup, groupSize, validDays } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Participant type name is required' }, { status: 400 });
    }

    const type = await prisma.participantType.create({
      data: {
        eventId: session.eventId,
        name: name.trim(),
        description: description ? description.trim() : null,
        isGroup: Boolean(isGroup),
        groupSize: isGroup ? Math.max(1, parseInt(groupSize, 10) || 1) : 1,
        validDays: Math.max(1, parseInt(validDays, 10) || 1),
      },
    });

    return NextResponse.json({ participantType: type }, { status: 201 });
  } catch (error) {
    console.error('Create participant type error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id, name, description, isGroup, groupSize, validDays } = await req.json();
    if (!id) {
      return NextResponse.json({ error: 'Participant type ID is required' }, { status: 400 });
    }

    const existing = await prisma.participantType.findFirst({
      where: { id, eventId: session.eventId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Participant type not found' }, { status: 404 });
    }

    const updated = await prisma.participantType.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description ? description.trim() : null }),
        ...(isGroup !== undefined && { isGroup: Boolean(isGroup) }),
        ...(groupSize !== undefined && { groupSize: isGroup ? Math.max(1, parseInt(groupSize, 10) || 1) : 1 }),
        ...(validDays !== undefined && { validDays: Math.max(1, parseInt(validDays, 10) || 1) }),
      },
    });

    return NextResponse.json({ participantType: updated });
  } catch (error) {
    console.error('Update participant type error:', error);
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
      return NextResponse.json({ error: 'Participant type ID is required' }, { status: 400 });
    }

    // Verify ownership
    const type = await prisma.participantType.findFirst({
      where: { id, eventId: session.eventId },
    });

    if (!type) {
      return NextResponse.json({ error: 'Participant type not found' }, { status: 404 });
    }

    await prisma.participantType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete participant type error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
