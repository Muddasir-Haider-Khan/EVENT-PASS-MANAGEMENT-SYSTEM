import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const event = await (prisma.event as any).findUnique({
    where: { slug: params.slug },
    include: {
      formFields: { orderBy: { order: 'asc' } },
      participantTypes: {
        orderBy: { order: 'asc' },
        include: {
          customFields: { orderBy: { order: 'asc' } },
        },
      },
      participantGroups: {
        select: {
          id: true,
          name: true,
          institution: true,
        },
      },
      eventManager: { select: { accountNumber: true, paymentPhone: true } },
    },
  });

  if (!event || event.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const evt = event as any;

  return NextResponse.json({
    event: {
      id: evt.id,
      name: evt.name,
      slug: evt.slug,
      venue: evt.venue,
      eventDate: evt.eventDate,
      description: evt.description,
      logoUrl: evt.logoUrl,
      primaryColor: evt.primaryColor,
      secondaryColor: evt.secondaryColor,
      accentColor: evt.accentColor,
      fontFamily: evt.fontFamily || 'Inter',
      customFontFileUrl: evt.customFontFileUrl,
      customFontUrl: evt.customFontUrl,
      eventType: evt.eventType,
    },
    fields: evt.formFields,
    participantTypes: evt.participantTypes,
    participantGroups: evt.participantGroups,
    payment: {
      accountNumber: evt.eventManager?.accountNumber,
      paymentPhone: evt.eventManager?.paymentPhone,
    },
  });
}

