import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ role: null, authenticated: false }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    return NextResponse.json({
      role: profile?.role || null,
      authenticated: true,
    })
  } catch (error) {
    console.error("[v0] Error checking role:", error)
    return NextResponse.json({ role: null, authenticated: false }, { status: 500 })
  }
}
