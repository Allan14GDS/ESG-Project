import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { questionId, templateIds } = await request.json()

    if (!questionId || !Array.isArray(templateIds)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Delete all existing assignments for this question
    const { error: deleteError } = await adminClient
      .from("book_question_junction")
      .delete()
      .eq("question_template_id", questionId)

    if (deleteError) {
      console.error("[v0] Error deleting existing assignments:", deleteError)
      return NextResponse.json({ error: "Failed to update assignments" }, { status: 500 })
    }

    // Insert new assignments
    if (templateIds.length > 0) {
      const assignments = templateIds.map((templateId, index) => ({
        question_template_id: questionId,
        book_template_id: templateId,
        sort_order: index,
      }))

      const { error: insertError } = await adminClient.from("book_question_junction").insert(assignments)

      if (insertError) {
        console.error("[v0] Error inserting assignments:", insertError)
        return NextResponse.json({ error: "Failed to create assignments" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in assign-templates API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
