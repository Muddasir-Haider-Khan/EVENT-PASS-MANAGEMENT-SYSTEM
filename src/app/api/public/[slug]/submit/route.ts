import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { publicSubmissionSchema } from '@/lib/validation';
import { rateLimit, RATE_LIMITS, getRateLimitHeaders } from '@/lib/rate-limit';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown';
  const rl = rateLimit(`submit:${ip}`, RATE_LIMITS.formSubmission);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rl) }
    );
  }

  try {
    const event = await prisma.event.findUnique({
      where: { slug: params.slug },
      include: { formFields: true },
    });

    if (!event || event.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = publicSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { responses, email } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Check if an application/submission with this email already exists for this event
    const existingSubmission = await prisma.submission.findFirst({
      where: {
        eventId: event.id,
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: 'An application with this email address has already been submitted for this event.' },
        { status: 400 }
      );
    }

    // Check if a pass has already been issued for this email address
    const existingParticipant = await prisma.participant.findFirst({
      where: {
        eventId: event.id,
        email: {
          equals: normalizedEmail,
          mode: 'insensitive',
        },
      },
    });

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'A pass has already been issued for this email address for this event.' },
        { status: 400 }
      );
    }

    // Validate required fields
    for (const field of event.formFields) {
      if (field.required && !responses[field.id]) {
        return NextResponse.json(
          { error: `${field.label} is required` },
          { status: 400 }
        );
      }
    }

    const submission = await prisma.submission.create({
      data: {
        eventId: event.id,
        responses,
        email: normalizedEmail,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, submissionId: submission.id }, { status: 201 });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
