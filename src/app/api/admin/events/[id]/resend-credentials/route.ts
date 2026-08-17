import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession, hashPassword, generatePassword } from '@/lib/auth';
import { sendManagerCredentials } from '@/lib/resend';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = getSession('super_admin');
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const eventId = params.id;
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { eventManager: true },
    });

    if (!event || !event.eventManager) {
      return NextResponse.json({ error: 'Event or Manager not found' }, { status: 404 });
    }

    const managerEmail = event.eventManager.contactEmail;
    const loginId = event.eventManager.loginId;

    // Generate a fresh new password to ensure access
    const newPassword = generatePassword();
    const passwordHash = await hashPassword(newPassword);

    await prisma.eventManager.update({
      where: { id: event.eventManager.id },
      data: {
        passwordHash,
        mustChangePassword: false,
      },
    });

    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '27mediaagency.com';
    const loginUrl = `https://epms.${rootDomain}/login`;

    let emailSent = false;
    let emailErrorStr: string | null = null;

    try {
      await sendManagerCredentials({
        to: managerEmail,
        eventName: event.name,
        loginId,
        password: newPassword,
        loginUrl,
      });
      emailSent = true;
    } catch (emailError: unknown) {
      const errMessage = emailError instanceof Error ? emailError.message : String(emailError);
      console.error('Failed to send manager credentials email:', errMessage);
      emailErrorStr = errMessage;
    }

    return NextResponse.json({
      success: true,
      emailSent,
      emailError: emailErrorStr,
      managerCredentials: {
        loginId,
        password: newPassword,
        email: managerEmail,
      },
    });
  } catch (error) {
    console.error('Resend credentials error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
