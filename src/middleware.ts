import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '27mediaagency.com';
  const url = req.nextUrl.clone();
  const hostname = host.split(':')[0].toLowerCase();
  const path = url.pathname;

  // Handle /gates path rewrite on any host -> /gate
  if (path === '/gates') {
    url.pathname = '/gate';
    return NextResponse.rewrite(url);
  }
  if (path.startsWith('/gates/')) {
    url.pathname = path.replace(/^\/gates/, '/gate');
    return NextResponse.rewrite(url);
  }

  // 1. Localhost development routing
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const subdomain = url.searchParams.get('subdomain');
    if (subdomain === 'gate' || subdomain === 'gates') {
      url.pathname = `/gate${path === '/' ? '' : path}`;
      return NextResponse.rewrite(url);
    }
    if (subdomain && subdomain !== 'epms') {
      url.pathname = `/event/${subdomain}${path === '/registration' || path === '/' ? '' : path}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // 2. Vercel deployment preview / default domain routing (*.vercel.app)
  if (hostname.includes('.vercel.app')) {
    const parts = hostname.split('.');
    // Standard app domain: e.g. event-pass-management-system.vercel.app
    if (parts.length <= 3) {
      if (path.match(/^\/event\/[^\/]+\/registration\/?$/)) {
        const slug = path.split('/')[2];
        url.pathname = `/event/${slug}`;
        return NextResponse.rewrite(url);
      }
      return NextResponse.next();
    }
    // Subdomain on Vercel: e.g. gala.event-pass-management-system.vercel.app
    const sub = parts[0];
    if (sub === 'epms') return NextResponse.next();
    if (sub === 'gate' || sub === 'gates') {
      url.pathname = `/gate${path === '/' ? '' : path}`;
      return NextResponse.rewrite(url);
    }
    url.pathname = `/event/${sub}${path === '/registration' || path === '/' ? '' : path}`;
    return NextResponse.rewrite(url);
  }

  // 3. Bare domain (27mediaagency.com or www.27mediaagency.com) -> redirect to epms subdomain login
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return NextResponse.redirect(new URL(`https://epms.${rootDomain}/login`));
  }

  // 4. Extract subdomain on custom domain
  // Handles both {event}.epms.27mediaagency.com AND {event}.27mediaagency.com AND epms.27mediaagency.com
  let subdomain = '';
  if (hostname.endsWith(`.epms.${rootDomain}`)) {
    subdomain = hostname.replace(`.epms.${rootDomain}`, '');
  } else if (hostname.endsWith(`.${rootDomain}`)) {
    subdomain = hostname.replace(`.${rootDomain}`, '');
  }

  // Main EPMS administrative portal (epms.27mediaagency.com)
  if (subdomain === 'epms' || !subdomain) {
    if (path.match(/^\/event\/[^\/]+\/registration\/?$/)) {
      const slug = path.split('/')[2];
      url.pathname = `/event/${slug}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Scanner portal subdomains (gate.27mediaagency.com / gates.27mediaagency.com)
  if (subdomain === 'gate' || subdomain === 'gates') {
    url.pathname = `/gate${path === '/' ? '' : path}`;
    return NextResponse.rewrite(url);
  }

  // Event specific subdomain (e.g. {eventname}.epms.27mediaagency.com or {eventname}.27mediaagency.com)
  if (path === '/' || path === '/registration' || path.startsWith('/registration/')) {
    url.pathname = `/event/${subdomain}`;
    return NextResponse.rewrite(url);
  }

  url.pathname = `/event/${subdomain}${path}`;
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
