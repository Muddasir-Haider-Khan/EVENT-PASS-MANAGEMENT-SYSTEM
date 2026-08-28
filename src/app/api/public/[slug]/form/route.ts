import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { redisCache } from '@/lib/redis';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const cacheKey = `event:form:${params.slug}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cached = await redisCache.get<any>(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  const event = await prisma.event.findUnique({
    where: { slug: params.slug },
    include: {
      formFields: { orderBy: { order: 'asc' } },
      participantTypes: {
        orderBy: { createdAt: 'asc' },
        include: {
          formFields: { orderBy: { order: 'asc' } },
        },
      },
      eventManager: { select: { accountNumber: true, paymentPhone: true } },
    },
  });

  if (!event || event.status !== 'ACTIVE') {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 });
  }

  const responseData = {
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
      fontFamily: event.fontFamily || 'Inter',
      fontUrl: event.fontUrl,
      eventType: event.eventType,
    },
    fields: event.formFields,
    participantTypes: event.participantTypes || [],
    payment: {
      accountNumber: event.eventManager?.accountNumber,
      paymentPhone: event.eventManager?.paymentPhone,
    },
  };

  // Cache response for 5 minutes
  await redisCache.set(cacheKey, responseData, 300);

  return NextResponse.json(responseData);
}
