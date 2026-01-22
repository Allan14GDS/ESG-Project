import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .eq("is_active", true)
      .order("full_name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching profiles:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(profiles || [])
  } catch (error: any) {
    console.error("[v0] Error in GET /api/profiles:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
