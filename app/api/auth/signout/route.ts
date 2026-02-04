import { createClientWithCookieCollector } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const { supabase, cookieActions } = createClientWithCookieCollector();

    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('Supabase signOut error (server):', error);
      // continue to clear cookies anyway
    }

    const response = NextResponse.json({ ok: true });

    if (cookieActions && cookieActions.length) {
      for (const action of cookieActions) {
        try {
          response.cookies.set({ name: action.name, value: action.value, ...(action.options || {}) });
        } catch (e) {
          console.warn('Failed to apply signout cookie action', action.name, e);
        }
      }
    } else {
      // Ensure auth cookies are removed in case supabase didn't emit cookie actions
      response.cookies.set({ name: 'supabase-auth-token', value: '', maxAge: 0, path: '/' });
      response.cookies.set({ name: 'supabase-session', value: '', maxAge: 0, path: '/' });
    }

    return response;
  } catch (err) {
    console.error('Signout route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
