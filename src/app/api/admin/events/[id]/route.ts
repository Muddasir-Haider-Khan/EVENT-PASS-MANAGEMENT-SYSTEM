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
    // Delete ImageKit folder for this event
    try {
      await deleteEventFolder(params.id);
    } catch (e) {
      console.error('ImageKit folder deletion error:', e);
    }

    // Cascade delete will remove manager, form fields, submissions, participants, gates, scan logs
    await prisma.event.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
