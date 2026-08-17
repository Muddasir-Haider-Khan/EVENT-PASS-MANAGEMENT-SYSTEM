import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { saveFormFieldsSchema } from '@/lib/validation';
import { Prisma } from '@prisma/client';

export async function GET() {
  const session = getSession('event_manager');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const fields = await prisma.formField.findMany({
    where: { eventId: session.eventId },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({ fields });
}

export async function PUT(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = saveFormFieldsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { fields } = parsed.data;

    // Ensure the locked email field is always present
    const hasLockedEmail = fields.some(f => f.isLocked && f.type === 'EMAIL');
    if (!hasLockedEmail) {
      return NextResponse.json({ error: 'The Email field cannot be removed' }, { status: 400 });
    }

    // Transaction: delete existing non-locked fields, upsert all
    await prisma.$transaction(async (tx) => {
      // Get existing fields
      const existing = await tx.formField.findMany({
        where: { eventId: session.eventId! },
      });

      const existingIds = new Set(existing.map(f => f.id));
      const incomingIds = new Set(fields.filter(f => f.id).map(f => f.id!));

      // Delete fields that are no longer present (except locked)
      const toDelete = existing.filter(f => !f.isLocked && !incomingIds.has(f.id));
      if (toDelete.length > 0) {
        await tx.formField.deleteMany({
          where: { id: { in: toDelete.map(f => f.id) } },
        });
      }

      // Upsert each field
      for (const field of fields) {
        if (field.id && existingIds.has(field.id)) {
          // Update existing
          await tx.formField.update({
            where: { id: field.id },
            data: {
              label: field.label,
              type: field.type,
              required: field.required,
              options: field.options ? field.options : Prisma.JsonNull,
              order: field.order,
            },
          });
        } else if (!field.id || !existingIds.has(field.id)) {
          // Create new
          await tx.formField.create({
            data: {
              eventId: session.eventId!,
              label: field.label,
              type: field.type,
              required: field.required,
              options: field.options ? field.options : Prisma.JsonNull,
              order: field.order,
              isLocked: field.isLocked,
            },
          });
        }
      }
    });

    // Return updated fields
    const updated = await prisma.formField.findMany({
      where: { eventId: session.eventId },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json({ fields: updated });
  } catch (error) {
    console.error('Form fields save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
