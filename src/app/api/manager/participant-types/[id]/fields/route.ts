import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const createFieldSchema = z.object({
  label: z.string().min(1, 'Label is required').max(200),
  type: z.enum(['SHORT_TEXT', 'PARAGRAPH', 'EMAIL', 'NUMBER', 'DROPDOWN', 'RADIO', 'CHECKBOX', 'DATE']),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional().nullable(),
  order: z.number().int().default(0),
});

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
    if (!type) return NextResponse.json({ error: 'Participant type not found' }, { status: 404 });

    const body = await req.json();
    const parsed = createFieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const newField = await prisma.participantTypeFormField.create({
      data: {
        participantTypeId: params.id,
        ...parsed.data,
      },
    });

    return NextResponse.json({ field: newField }, { status: 201 });
  } catch (error) {
    console.error('Create type form field error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
