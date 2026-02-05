import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // Handle cookie setting errors in Server Components
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch {
            // Handle cookie removal errors in Server Components
          }
        },
      },
    }
  );
}

// New helper: create a Supabase server client that collects cookie actions so
// the calling API route can apply them to the outgoing NextResponse.
export async function createClientWithCookieCollector() {
  const cookieStore = await cookies();
  const cookieActions: Array<{ name: string; value: string; options?: CookieOptions }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieActions.push({ name, value, options });
        },
        remove(name: string, options: CookieOptions) {
          cookieActions.push({ name, value: '', options });
        },
      },
    }
  );

  return { supabase, cookieActions } as const;
}

// Service role client for admin operations (use carefully!)
export function createServiceClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'example-key',
    {
      cookies: {
        get() { return undefined; },
        set() { },
        remove() { },
      },
    }
  );
}
