import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

export function createClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'example-key';

  if (typeof window === 'undefined') {
    return createBrowserClient(
      supabaseUrl,
      supabaseKey
    );
  }

  if (!browserClient) {
    browserClient = createBrowserClient(
      supabaseUrl,
      supabaseKey
    );
  }

  return browserClient!;
}

