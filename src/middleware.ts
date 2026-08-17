import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '27mediaagency.com';
  const url = req.nextUrl.clone();

  // For local development, allow localhost routing
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    // Use query param ?subdomain=epms|gate|{slug} for local dev
    const subdomain = url.searchParams.get('subdomain');
    if (subdomain === 'gate') {
      url.pathname = `/gate${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
    if (subdomain && subdomain !== 'epms') {
      // Treat as event slug
      url.pathname = `/event/${subdomain}${url.pathname === '/' ? '' : url.pathname}`;
      return NextResponse.rewrite(url);
    }
    // Default to EPMS
    return NextResponse.next();
  }

  // Production subdomain routing
  const hostname = host.split(':')[0]; // remove port if present
  
  // Bare domain → redirect to epms subdomain
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return NextResponse.redirect(new URL(`https://epms.${rootDomain}${url.pathname}`));
  }

  // Extract subdomain
  const subdomain = hostname.replace(`.${rootDomain}`, '');

  if (subdomain === 'epms') {
    // EPMS portal — super admin + event manager
    // No rewrite needed, serve from default (epms) route group
    return NextResponse.next();
  }

  if (subdomain === 'gate' || subdomain === 'gates') {
    // Gate portal
    url.pathname = `/gate${url.pathname === '/' ? '' : url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Any other subdomain → treat as event slug
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
