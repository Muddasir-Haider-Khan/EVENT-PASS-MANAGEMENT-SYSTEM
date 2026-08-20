import { NextRequest, NextResponse } from 'next/server';

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(), geolocation=(), payment=()'
  );
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  return response;
}

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') || '';
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '27mediaagency.com';
  const url = req.nextUrl.clone();
  const hostname = host.split(':')[0].toLowerCase();
  const path = url.pathname;

  // Handle /gates path rewrite on any host -> /gate
  if (path === '/gates') {
    url.pathname = '/gate';
    return addSecurityHeaders(NextResponse.rewrite(url));
  }
  if (path.startsWith('/gates/')) {
    url.pathname = path.replace(/^\/gates/, '/gate');
    return addSecurityHeaders(NextResponse.rewrite(url));
  }

  // --------------------------------------------------
  // Centralized Route Protection (Session Checks)
  // --------------------------------------------------
  const saCookie = req.cookies.get('epms_sa_session')?.value;
  const emCookie = req.cookies.get('epms_em_session')?.value;
  const gateCookie = req.cookies.get('epms_gate_session')?.value;

  // Protect /admin routes (except /admin/login or public assets)
  if (path.startsWith('/admin') && !path.startsWith('/admin/login')) {
    if (!saCookie) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', path);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // Protect /manager routes (except /manager/login)
  if (path.startsWith('/manager') && !path.startsWith('/manager/login')) {
    if (!emCookie) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', path);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // Protect /gate scanner active routes (except /gate/login or /gate root landing)
  if (path.startsWith('/gate/scan') || path.startsWith('/gate/dashboard')) {
    if (!gateCookie) {
      const loginUrl = new URL('/gate', req.url);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // --------------------------------------------------
  // Hostname & Subdomain Rewrites
  // --------------------------------------------------

  // 1. Localhost development routing
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    const subdomain = url.searchParams.get('subdomain');
    if (subdomain === 'gate' || subdomain === 'gates') {
      url.pathname = `/gate${path === '/' ? '' : path}`;
      return addSecurityHeaders(NextResponse.rewrite(url));
    }
    if (subdomain && subdomain !== 'epms') {
      url.pathname = `/event/${subdomain}${path === '/registration' || path === '/' ? '' : path}`;
      return addSecurityHeaders(NextResponse.rewrite(url));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // 2. Vercel deployment preview / default domain routing (*.vercel.app)
  if (hostname.includes('.vercel.app')) {
    const parts = hostname.split('.');
    if (parts.length <= 3) {
      if (path.match(/^\/event\/[^\/]+\/registration\/?$/)) {
        const slug = path.split('/')[2];
        url.pathname = `/event/${slug}`;
        return addSecurityHeaders(NextResponse.rewrite(url));
      }
      return addSecurityHeaders(NextResponse.next());
    }
    const sub = parts[0];
    if (sub === 'epms') return addSecurityHeaders(NextResponse.next());
    if (sub === 'gate' || sub === 'gates') {
      url.pathname = `/gate${path === '/' ? '' : path}`;
      return addSecurityHeaders(NextResponse.rewrite(url));
    }
    url.pathname = `/event/${sub}${path === '/registration' || path === '/' ? '' : path}`;
    return addSecurityHeaders(NextResponse.rewrite(url));
  }

  // 3. Bare domain (27mediaagency.com or www.27mediaagency.com) -> redirect to epms subdomain login
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) {
    return addSecurityHeaders(NextResponse.redirect(new URL(`https://epms.${rootDomain}/login`)));
  }

  // 4. Extract subdomain on custom domain
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
      return addSecurityHeaders(NextResponse.rewrite(url));
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // Scanner portal subdomains (gate.27mediaagency.com / gates.27mediaagency.com)
  if (subdomain === 'gate' || subdomain === 'gates') {
    url.pathname = `/gate${path === '/' ? '' : path}`;
    return addSecurityHeaders(NextResponse.rewrite(url));
  }

  // Event specific subdomain (e.g. {eventname}.epms.27mediaagency.com or {eventname}.27mediaagency.com)
  if (path === '/' || path === '/registration' || path.startsWith('/registration/')) {
    url.pathname = `/event/${subdomain}`;
    return addSecurityHeaders(NextResponse.rewrite(url));
  }

  url.pathname = `/event/${subdomain}${path}`;
  return addSecurityHeaders(NextResponse.rewrite(url));
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
