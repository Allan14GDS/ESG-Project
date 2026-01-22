import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // ignore — happens in server components
        }
      },
    },
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
      autoRefreshToken: false, // Disable auto-refresh on server to prevent race conditions
    },
    global: {
      headers: {
        "x-client-info": "supabase-js-server",
      },
    },
  })
}

// Keep the old export for backward compatibility
export const createServerSupabase = createClient
