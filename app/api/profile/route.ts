import { createServerClient } from "@supabase/ssr"
import { adminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    // Check for demo mode
    const hasSupabaseConfig = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    if (!hasSupabaseConfig) {
      console.log("[v0] Demo mode - returning demo user data")
      return NextResponse.json({
        email: "demo@empresa.com",
        role: "user",
        full_name: "Usuário Demo",
        is_active: true,
      })
    }

    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.log("[v0] No authenticated user in API route")
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    console.log("[v0] API route - Fetching profile for user:", user.id)

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("role, full_name, is_active")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      console.error("[v0] Error fetching profile:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log("[v0] API route - Profile found:", { role: profile?.role, is_active: profile?.is_active })

    return NextResponse.json({
      email: user.email,
      role: profile?.role || "user",
      full_name: profile?.full_name || user.email?.split("@")[0],
      is_active: profile?.is_active ?? true,
    })
  } catch (error: any) {
    console.error("[v0] API route error:", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
