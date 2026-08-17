import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '27mediaagency.com';
  const url = req.nextUrl.clone();

  // 1. Localhost development routing
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    const subdomain = url.searchParams.get('subdomain');
    if (subdomain === 'gate') {
      url.pathname = `/gate${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
    if (subdomain && subdomain !== 'epms') {
      url.pathname = `/event/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 2. Vercel deployment preview / default domain routing (*.vercel.app)
  if (host.includes('.vercel.app')) {
    const parts = host.split('.');
    // Standard app domain: e.g. event-pass-management-system.vercel.app (3 parts)
    if (parts.length <= 3) {
      return NextResponse.next();
    }
    // Subdomain on Vercel: e.g. gala.event-pass-management-system.vercel.app (4+ parts)
    const sub = parts[0];
    if (sub === 'epms') return NextResponse.next();
    if (sub === 'gate' || sub === 'gates') {
      url.pathname = `/gate${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
    url.pathname = `/event/${sub}${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // 3. Custom root domain routing (e.g. 27mediaagency.com)
  const hostname = host.split(':')[0]; // remove port if present

  // Bare domain -> redirect to epms subdomain
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return NextResponse.redirect(new URL(`https://epms.${rootDomain}${url.pathname}`));
  }

  // Extract custom subdomain
  const subdomain = hostname.replace(`.${rootDomain}`, '');

  if (subdomain === 'epms') {
    return NextResponse.next();
  }

  if (subdomain === 'gate' || subdomain === 'gates') {
    url.pathname = `/gate${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Treat as event slug
  url.pathname = `/event/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled directly)
     * - _next (Next.js internals)
     * - static files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
