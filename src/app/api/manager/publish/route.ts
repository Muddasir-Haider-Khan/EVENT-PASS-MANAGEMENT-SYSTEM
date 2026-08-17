import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { publishSlugSchema } from '@/lib/validation';

export async function POST(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = publishSlugSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { slug } = parsed.data;

    // Reserved subdomains
    const reserved = ['epms', 'gate', 'www', 'api', 'admin', 'mail', 'ftp', 'ns1', 'ns2'];
    if (reserved.includes(slug)) {
      return NextResponse.json({ error: 'This slug is reserved' }, { status: 400 });
    }

    // Check uniqueness
    const existing = await prisma.event.findUnique({ where: { slug } });
    if (existing && existing.id !== session.eventId) {
      return NextResponse.json({ error: 'This slug is already taken' }, { status: 400 });
    }

    // Ensure form has fields
    const fieldCount = await prisma.formField.count({ where: { eventId: session.eventId } });
    if (fieldCount === 0) {
      return NextResponse.json({ error: 'Add at least one form field before publishing' }, { status: 400 });
    }

    const event = await prisma.event.update({
      where: { id: session.eventId },
      data: { slug },
    });

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '27mediaagency.com';
    return NextResponse.json({
      success: true,
      slug: event.slug,
      url: `https://${slug}.${rootDomain}`,
    });
  } catch (error) {
    console.error('Publish error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.event.update({
      where: { id: session.eventId },
      data: { slug: null },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unpublish error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
