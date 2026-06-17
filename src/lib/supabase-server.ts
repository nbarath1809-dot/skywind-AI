import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Client for Server Components, Server Actions, and API Route handlers
export const createClientServer = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (error) {
            // Safe to ignore if session refreshing is handled in middleware
          }
        },
      },
    }
  );
};
