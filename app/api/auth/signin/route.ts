import { createClientWithCookieCollector } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const { supabase, cookieActions } = await createClientWithCookieCollector();

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return NextResponse.json({ error: error.message || 'Sign in failed' }, { status: 400 });
    }

    const response = NextResponse.json({ user: data.user || null });

    if (cookieActions && cookieActions.length) {
      for (const action of cookieActions) {
        try {
          response.cookies.set({ name: action.name, value: action.value, ...(action.options || {}) });
        } catch (e) {
          console.warn('Failed to apply sign-in cookie action', action.name, e);
        }
      }
    }

    return response;
  } catch (err) {
    console.error('Signin route error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
