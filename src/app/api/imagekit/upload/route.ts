import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { uploadFile, validateImageFile } from '@/lib/imagekit';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    // 1. Session verification (Super Admin or Event Manager required)
    const saSession = getSessionFromRequest(req, 'super_admin');
    const emSession = getSessionFromRequest(req, 'event_manager');

    if (!saSession && !emSession) {
      return NextResponse.json({ error: 'Unauthorized — active session required' }, { status: 401 });
    }

    // 2. Rate limiting by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const limitResult = rateLimit(`ik_upload:${ip}`, { maxRequests: 10, windowMs: 60_000 });
    if (!limitResult.success) {
      return NextResponse.json(
        { error: 'Too many upload requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. Server-side folder derivation
    let folder = '/epms/uploads';
    if (saSession) {
      const requestedFolder = formData.get('folder') as string | null;
      if (requestedFolder && !requestedFolder.includes('..') && requestedFolder.startsWith('/epms/')) {
        folder = requestedFolder;
      } else {
        folder = '/epms/events/logos';
      }
    } else if (emSession && emSession.eventId) {
      folder = `/epms/events/${emSession.eventId}/branding`;
    }

    // 4. File validation (type & max 6MB, SVG rejected)
    const validation = validateImageFile(file.type, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize file name
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

    const result = await uploadFile(buffer, sanitizedFileName, folder);

    return NextResponse.json({
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      thumbnailUrl: result.thumbnailUrl,
    });
  } catch (error: unknown) {
    console.error('ImageKit Upload Error:', error);
    const message = error instanceof Error ? error.message : 'Failed to upload image to ImageKit';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
