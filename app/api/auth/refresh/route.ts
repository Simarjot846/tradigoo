import { createClientWithCookieCollector } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { supabase, cookieActions } = await createClientWithCookieCollector();

    // Attempt to read session — if refresh cookie is present, Supabase server client
    // should use it to refresh and return a session.
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Refresh endpoint supabase error:', error);
      return NextResponse.json({ error: 'Failed to refresh session' }, { status: 500 });
    }

    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    const response = NextResponse.json({ session });

    // Apply any Set-Cookie actions recorded by the Supabase client (rotated refresh token)
    if (cookieActions && cookieActions.length) {
      for (const action of cookieActions) {
        try {
          response.cookies.set({
            name: action.name,
            value: action.value,
            ...(action.options || {}),
          });
        } catch (e) {
          console.warn('Failed to apply cookie action in refresh:', action.name, e);
        }
      }
    }

    return response;
  } catch (err) {
    console.error('Unexpected error in refresh route:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
