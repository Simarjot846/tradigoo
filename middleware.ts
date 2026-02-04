import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

function normalizeCookieOptions(options?: CookieOptions) {
  const defaultSameSite = process.env.COOKIE_SAME_SITE || 'None';
  const secureEnv = process.env.COOKIE_SECURE;
  const secure = secureEnv ? secureEnv === 'true' : true;
  const domain = process.env.COOKIE_DOMAIN || undefined;

  return {
    httpOnly: true,
    secure,
    sameSite: defaultSameSite as 'lax' | 'none' | 'strict' | undefined,
    domain,
    path: '/',
    ...(options || {}),
  } as CookieOptions;
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          const opts = normalizeCookieOptions(options);
          // Set cookie on the outgoing response only once — do not reassign response.
          try {
            response.cookies.set({ name, value, ...opts });
          } catch (e) {
            // If cookie can't be set in middleware runtime, ignore but log.
            console.warn('Failed to set cookie in middleware:', name, e);
          }
        },
        remove(name: string, options: CookieOptions) {
          const opts = normalizeCookieOptions(options);
          try {
            response.cookies.set({ name, value: '', maxAge: 0, ...opts });
          } catch (e) {
            console.warn('Failed to remove cookie in middleware:', name, e);
          }
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    // Unified Dashboard: No role-based redirection needed.
    // All users go to /dashboard and the page handles the view.
  }

  // Protected routes
  const protectedRoutes = ['/dashboard', '/marketplace', '/product', '/order'];
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    const redirectUrl = new URL('/auth/login', request.url);
    redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Redirect to dashboard if accessing auth pages while logged in
  const authRoutes = ['/auth/login', '/auth/signup'];
  const isAuthRoute = authRoutes.some(route =>
    request.nextUrl.pathname.startsWith(route)
  );

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(self)'
  );

  // Content Security Policy
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https:;
    media-src 'self' blob: data:;
    font-src 'self' data: https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src https://api.razorpay.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.razorpay.com;
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
