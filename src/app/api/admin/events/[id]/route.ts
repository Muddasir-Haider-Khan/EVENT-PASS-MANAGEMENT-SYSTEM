import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { updateEventSchema } from '@/lib/validation';
import { deleteEventFolder } from '@/lib/imagekit';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('super_admin');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: {
      eventManager: { select: { loginId: true, contactEmail: true, id: true } },
      _count: { select: { participants: true, submissions: true, gates: true, formFields: true } },
    },
  });

  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  return NextResponse.json({ event });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('super_admin');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : undefined,
      },
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Update event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('super_admin');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const eventId = params.id;

    // Delete ImageKit folder for this event
    try {
      await deleteEventFolder(eventId);
    } catch (e) {
      console.error('ImageKit folder deletion error:', e);
    }

    // Safely delete all dependent records in transaction order
    await prisma.$transaction(async (tx) => {
      // 1. Delete ScanLogs linked to gates or participants of this event
      await tx.scanLog.deleteMany({
        where: {
          OR: [
            { gate: { eventId } },
            { participant: { eventId } },
          ],
        },
      });

      // 2. Delete Participants
      await tx.participant.deleteMany({ where: { eventId } });

      // 3. Delete Submissions
      await tx.submission.deleteMany({ where: { eventId } });

      // 4. Delete ParticipantGroups
      await tx.participantGroup.deleteMany({ where: { eventId } });

      // 5. Delete ParticipantTypes
      await tx.participantType.deleteMany({ where: { eventId } });

      // 6. Delete FormFields & Gates
      await tx.formField.deleteMany({ where: { eventId } });
      await tx.gate.deleteMany({ where: { eventId } });

      // 7. Delete EventManager
      await tx.eventManager.deleteMany({ where: { eventId } });

      // 8. Delete Event
      await tx.event.delete({ where: { id: eventId } });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete event' }, { status: 500 });
  }
}

