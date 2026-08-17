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
      venue: event.venue,
      eventDate: event.eventDate,
      description: event.description,
      logoUrl: event.logoUrl,
      primaryColor: event.primaryColor,
      secondaryColor: event.secondaryColor,
      accentColor: event.accentColor,
    },
    fields: event.formFields,
    payment: {
      accountNumber: event.eventManager?.accountNumber,
      paymentPhone: event.eventManager?.paymentPhone,
    },
  });
}
