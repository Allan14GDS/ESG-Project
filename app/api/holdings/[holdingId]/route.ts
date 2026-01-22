import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ holdingId: string }> }) {
  try {
    const { holdingId } = await params
    const adminClient = createAdminClient()

    console.log("[v0] Starting cascade delete for holding:", holdingId)

    // First, get all companies in this holding
    const { data: companies, error: companiesError } = await adminClient
      .from("companies")
      .select("id")
      .eq("holding_id", holdingId)

    if (companiesError) {
      console.error("[v0] Error fetching companies:", companiesError)
      return NextResponse.json({ error: "Failed to fetch companies" }, { status: 500 })
    }

    const companyIds = companies?.map((c) => c.id) || []
    console.log("[v0] Found companies to delete:", companyIds.length)

    if (companyIds.length > 0) {
      // Delete all company_templates assignments for these companies
      const { error: templatesError } = await adminClient
        .from("company_templates")
        .delete()
        .in("company_id", companyIds)

      if (templatesError) {
        console.error("[v0] Error deleting company templates:", templatesError)
      }

      // Delete all memberships for these companies
      const { error: membershipsError } = await adminClient.from("memberships").delete().in("company_id", companyIds)

      if (membershipsError) {
        console.error("[v0] Error deleting memberships:", membershipsError)
      }

      // Delete all book answers for these companies
      const { error: answersError } = await adminClient.from("book_answers").delete().in("company_id", companyIds)

      if (answersError) {
        console.error("[v0] Error deleting book answers:", answersError)
      }

      // Finally, delete all companies
      const { error: deleteCompaniesError } = await adminClient.from("companies").delete().eq("holding_id", holdingId)

      if (deleteCompaniesError) {
        console.error("[v0] Error deleting companies:", deleteCompaniesError)
        return NextResponse.json({ error: "Failed to delete companies" }, { status: 500 })
      }

      console.log("[v0] Successfully deleted all companies and their data")
    }

    // Finally, delete the holding itself
    const { error: deleteHoldingError } = await adminClient.from("holdings").delete().eq("id", holdingId)

    if (deleteHoldingError) {
      console.error("[v0] Error deleting holding:", deleteHoldingError)
      return NextResponse.json({ error: "Failed to delete holding" }, { status: 500 })
    }

    console.log("[v0] Successfully deleted holding")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/holdings/[holdingId]:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
