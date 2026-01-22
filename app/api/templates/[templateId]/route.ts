import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { templateId: string } }) {
  try {
    const adminClient = createAdminClient()
    const { templateId } = params

    // Delete book_question_junction entries
    const { error: junctionError } = await adminClient
      .from("book_question_junction")
      .delete()
      .eq("book_template_id", templateId)

    if (junctionError) {
      console.error("[v0] Error deleting junction entries:", junctionError)
      throw junctionError
    }

    // Delete company_templates entries
    const { error: companyTemplatesError } = await adminClient
      .from("company_templates")
      .delete()
      .eq("template_id", templateId)

    if (companyTemplatesError) {
      console.error("[v0] Error deleting company template assignments:", companyTemplatesError)
      throw companyTemplatesError
    }

    // Finally delete the template itself
    const { error: templateError } = await adminClient.from("book_templates").delete().eq("id", templateId)

    if (templateError) {
      console.error("[v0] Error deleting template:", templateError)
      throw templateError
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/templates/[templateId]:", error)
    return NextResponse.json({ error: "Failed to delete template" }, { status: 500 })
  }
}
