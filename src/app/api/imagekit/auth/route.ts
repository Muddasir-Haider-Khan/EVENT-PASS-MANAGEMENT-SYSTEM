import { NextResponse } from 'next/server';
import { getUploadAuthParams } from '@/lib/imagekit';

export async function GET() {
  try {
    const authParams = getUploadAuthParams();
    return NextResponse.json(authParams);
  } catch (error) {
    console.error('ImageKit auth error:', error);
    return NextResponse.json({ error: 'ImageKit not configured' }, { status: 500 });
  }
}
