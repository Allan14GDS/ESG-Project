import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get("companyId")

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Get all users assigned to this company via book_assignments
    const { data: assignments, error: assignmentsError } = await adminClient
      .from("book_assignments")
      .select("user_id")
      .eq("company_id", companyId)

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    if (!assignments || assignments.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Get unique user IDs
    const userIds = [...new Set(assignments.map((a: any) => a.user_id).filter(Boolean))]

    if (userIds.length === 0) {
      return NextResponse.json({ users: [] })
    }

    // Fetch user profiles
    const { data: profiles, error: profilesError } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", userIds)

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError)
      return NextResponse.json({ error: "Failed to fetch user profiles" }, { status: 500 })
    }

    const users = profiles || []

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error in company-users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
