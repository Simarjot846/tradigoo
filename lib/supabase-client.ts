import { createBrowserClient } from '@supabase/ssr';
import { SupabaseClient } from '@supabase/supabase-js';

let browserClient: SupabaseClient | undefined;

// Client-side Supabase client
// Client-side Supabase client
export function createClient(): SupabaseClient {
  // Hardcoded fallbacks to ensure app works even if env vars are missing in production
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://skcbzqbtjdctpxtgglbv.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrY2J6cWJ0amRjdHB4dGdnbGJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwNzMzNjEsImV4cCI6MjA4MzY0OTM2MX0.qP9uYxXRD8pYYG1pLK49HHZ3BD9wEPny2v4gQAClC7Q';

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

