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
      include: {
        formFields: true,
        participantTypes: {
          include: { formFields: true },
        },
      },
    });

    if (!event || event.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const body = await req.json();
    const parsed = publicSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const { responses, email, photoUrl, phone, participantTypeId } = parsed.data;
    const normalizedEmail = email.trim().toLowerCase();

    // Extract groupMembers if present in responses
    const groupMembers = Array.isArray((responses as Record<string, unknown>)?.groupMembers)
      ? ((responses as Record<string, unknown>).groupMembers as Array<{ email?: string; name?: string }>)
      : [];

    const emailsToCheck = new Set<string>();
    emailsToCheck.add(normalizedEmail);

    for (const member of groupMembers) {
      if (member.email && typeof member.email === 'string') {
        const mEmail = member.email.trim().toLowerCase();
        if (emailsToCheck.has(mEmail) && mEmail !== normalizedEmail) {
          return NextResponse.json(
            { error: `Duplicate email (${mEmail}) found within the delegation list.` },
            { status: 400 }
          );
        }
        emailsToCheck.add(mEmail);
      }
    }

    const emailList = Array.from(emailsToCheck);

    // Check if an application with any of these emails already exists for this event
    const existingSub = await prisma.submission.findFirst({
      where: {
        eventId: event.id,
        email: { in: emailList, mode: 'insensitive' },
      },
    });

    if (existingSub) {
      return NextResponse.json(
        { error: `An application with email (${existingSub.email}) has already been submitted for this event.` },
        { status: 400 }
      );
    }

    // Check if a pass has already been issued for any of these emails
    const existingPart = await prisma.participant.findFirst({
      where: {
        eventId: event.id,
        email: { in: emailList, mode: 'insensitive' },
      },
    });

    if (existingPart) {
      return NextResponse.json(
        { error: `A pass has already been issued for email (${existingPart.email}) for this event.` },
        { status: 400 }
      );
    }

    // Determine target form fields (category-specific or event general)
    const selectedCategory = event.participantTypes?.find((t) => t.id === participantTypeId);
    const targetFields = selectedCategory
      ? (selectedCategory.formFields || [])
      : (event.formFields || []);

    // Enrich responses object with top-level fields (email, phone, etc.) for any corresponding form fields
    const finalResponses: Record<string, unknown> = { ...responses };
    for (const field of targetFields) {
      const labelLower = (field.label || '').toLowerCase().trim();
      if (field.type === 'EMAIL' || labelLower === 'email' || labelLower === 'email address') {
        finalResponses[field.id] = normalizedEmail;
      }
      if ((field.type === 'SHORT_TEXT' || field.type === 'NUMBER') && (labelLower.includes('phone') || labelLower.includes('whatsapp')) && phone) {
        finalResponses[field.id] = phone;
      }
    }

    // Validate required fields against finalResponses
    for (const field of targetFields) {
      const val = finalResponses[field.id];
      if (field.required && (val === undefined || val === null || val === '')) {
        return NextResponse.json(
          { error: `${field.label} is required` },
          { status: 400 }
        );
      }
    }

    const submission = await prisma.submission.create({
      data: {
        eventId: event.id,
        responses: finalResponses as object,
        email: normalizedEmail,
        photoUrl: photoUrl || null,
        phone: phone || null,
        participantTypeId: participantTypeId || null,
        status: 'PENDING',
      },
    });

    return NextResponse.json({ success: true, submissionId: submission.id }, { status: 201 });
  } catch (error) {
    console.error('Submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
