import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  
  // Clear all session cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
    path: '/',
  };

  response.cookies.set('epms_sa_session', '', cookieOptions);
  response.cookies.set('epms_em_session', '', cookieOptions);
  response.cookies.set('epms_gate_session', '', cookieOptions);

  return response;
}
