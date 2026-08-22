import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { FieldType } from '@prisma/client';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const type = await prisma.participantType.findFirst({
      where: { id: params.id, eventId: session.eventId },
      include: {
        formFields: { orderBy: { order: 'asc' } },
      },
    });

    if (!type) {
      return NextResponse.json({ error: 'Participant category not found' }, { status: 404 });
    }

    return NextResponse.json({ fields: type.formFields });
  } catch (error) {
    console.error('Get category fields error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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

  try {
    const type = await prisma.participantType.findFirst({
      where: { id: params.id, eventId: session.eventId },
    });

    if (!type) {
      return NextResponse.json({ error: 'Participant category not found' }, { status: 404 });
    }

    const body = await req.json();
    const { fields } = body;

    if (!Array.isArray(fields)) {
      return NextResponse.json({ error: 'Fields must be an array' }, { status: 400 });
    }

    const eventId = session.eventId;

    // Delete existing form fields for this category
    await prisma.formField.deleteMany({
      where: { participantTypeId: params.id, eventId },
    });

    // Create new form fields for this category
    const createdFields = await Promise.all(
      fields.map((f: { label: string; type: FieldType; required?: boolean; options?: string[]; order: number; isLocked?: boolean }, index: number) =>
        prisma.formField.create({
          data: {
            eventId,
            participantTypeId: params.id,
            label: f.label,
            type: f.type,
            required: !!f.required,
            options: f.options && f.options.length > 0 ? f.options : undefined,
            order: typeof f.order === 'number' ? f.order : index,
            isLocked: !!f.isLocked,
          },
        })
      )
    );

    return NextResponse.json({ fields: createdFields }, { status: 200 });
  } catch (error) {
    console.error('Save category fields error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
