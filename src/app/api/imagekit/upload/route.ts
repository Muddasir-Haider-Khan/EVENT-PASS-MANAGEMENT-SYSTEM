import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, validateImageFile } from '@/lib/imagekit';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || '/epms/uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

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
