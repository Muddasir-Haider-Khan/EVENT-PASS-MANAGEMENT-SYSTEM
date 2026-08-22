import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const event = await prisma.event.findUnique({
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

  return NextResponse.json({
    event: {
      id: event.id,
      name: event.name,
      slug: event.slug,
      venue: event.venue,
      eventDate: event.eventDate,
      description: event.description,
      logoUrl: event.logoUrl,
      primaryColor: event.primaryColor,
      secondaryColor: event.secondaryColor,
      accentColor: event.accentColor,
      fontFamily: event.fontFamily || 'Inter',
      customFontFileUrl: event.customFontFileUrl,
      customFontUrl: event.customFontUrl,
      eventType: event.eventType,
    },
    fields: event.formFields,
    participantTypes: event.participantTypes,
    participantGroups: event.participantGroups,
    payment: {
      accountNumber: event.eventManager?.accountNumber,
      paymentPhone: event.eventManager?.paymentPhone,
    },
  });
}

