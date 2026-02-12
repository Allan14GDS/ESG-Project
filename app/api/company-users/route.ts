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
      .select(`
        user_id,
        profiles!book_assignments_user_id_fkey (
          id,
          full_name,
          email
        )
      `)
      .eq("company_id", companyId)

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Extract unique users
    const uniqueUsersMap = new Map()
    assignments?.forEach((assignment: any) => {
      const profile = assignment.profiles
      if (profile && !uniqueUsersMap.has(profile.id)) {
        uniqueUsersMap.set(profile.id, {
          id: profile.id,
          full_name: profile.full_name,
          email: profile.email,
        })
      }
    })

    const users = Array.from(uniqueUsersMap.values())

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Error in company-users API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
