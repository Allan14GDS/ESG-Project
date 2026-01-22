import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminClient = createAdminClient()

    const { error } = await adminClient.from("company_templates").update({ active: false }).eq("id", params.id)

    if (error) {
      console.error("[v0] Error removing template:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
