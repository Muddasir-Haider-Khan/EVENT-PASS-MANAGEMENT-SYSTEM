import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, hashPassword, generatePassword, generateLoginId } from '@/lib/auth';
import { createEventSchema } from '@/lib/validation';
import { sendManagerCredentials } from '@/lib/resend';

export async function GET() {
  const session = getSession('super_admin');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const events = await prisma.event.findMany({
    include: {
      eventManager: { select: { loginId: true, contactEmail: true } },
      _count: { select: { participants: true, submissions: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const session = getSession('super_admin');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = createEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0].message }, { status: 400 });
    }

    const {
      name, venue, eventDate, description,
      logoUrl, logoFileId,
      primaryColor, secondaryColor, accentColor,
      managerEmail,
    } = parsed.data;

    // Generate manager credentials
    const loginId = generateLoginId(name);
    const password = generatePassword();
    const passwordHash = await hashPassword(password);

    // Create event + manager in a transaction
    const event = await prisma.event.create({
      data: {
        name,
        venue,
        eventDate: eventDate ? new Date(eventDate) : null,
        description,
        logoUrl,
        logoFileId,
        primaryColor,
        secondaryColor,
        accentColor,
        eventManager: {
          create: {
            loginId,
            passwordHash,
            contactEmail: managerEmail,
            mustChangePassword: true,
          },
        },
        // Create default locked email field
        formFields: {
          create: {
            label: 'Email',
            type: 'EMAIL',
            required: true,
            isLocked: true,
            order: 0,
          },
        },
      },
      include: {
        eventManager: true,
      },
    });

    // Send credentials email
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '27mediaagency.com';
    const loginUrl = `https://epms.${rootDomain}/login`;

    try {
      await sendManagerCredentials({
        to: managerEmail,
        eventName: name,
        loginId,
        password,
        loginUrl,
      });
    } catch (emailError) {
      console.error('Failed to send manager credentials email:', emailError);
      // Don't fail the event creation if email fails
    }

    return NextResponse.json({
      event,
      managerCredentials: { loginId, password, email: managerEmail },
    }, { status: 201 });
  } catch (error) {
    console.error('Create event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
