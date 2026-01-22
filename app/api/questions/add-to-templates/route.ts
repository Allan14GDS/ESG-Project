import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { questionId, templateIds, subFrameworks, position, positionsByTemplate } = await request.json()

    console.log("[v0] API add-to-templates received:", {
      questionId,
      templateIds,
      subFrameworks,
      position,
      positionsByTemplate,
    })

    if (!questionId || !templateIds || templateIds.length === 0) {
      console.error("[v0] Missing required fields:", { questionId, templateIds })
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: existingJunctions } = await adminClient
      .from("book_question_junction")
      .select("book_template_id, question_template_id")
      .eq("question_template_id", questionId)
      .in("book_template_id", templateIds)

    console.log("[v0] Existing junctions:", existingJunctions)

    const existingTemplateIds = new Set(existingJunctions?.map((j) => j.book_template_id) || [])

    const junctionsToUpsert = await Promise.all(
      templateIds.map(async (templateId: string) => {
        let finalPosition = positionsByTemplate?.[templateId] || position

        // If no position provided, calculate next available position
        if (!finalPosition) {
          const { data: maxPositionData } = await adminClient
            .from("book_question_junction")
            .select("position")
            .eq("book_template_id", templateId)
            .order("position", { ascending: false })
            .limit(1)
            .maybeSingle()

          finalPosition = (maxPositionData?.position || 0) + 1
        }
        // </CHANGE>

        return {
          book_template_id: templateId,
          question_template_id: questionId,
          position: finalPosition,
        }
      }),
    )

    console.log("[v0] Junctions to upsert:", junctionsToUpsert.length, "of", templateIds.length)

    const { error } = await adminClient.from("book_question_junction").upsert(junctionsToUpsert, {
      onConflict: "book_template_id,question_template_id",
    })

    if (error) {
      console.error("[v0] Database error:", error)
      return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
    }

    const newLinkedCount = templateIds.filter((id: string) => !existingTemplateIds.has(id)).length

    console.log("[v0] Successfully linked question to", newLinkedCount, "new templates")
    return NextResponse.json({
      success: true,
      linked: newLinkedCount,
      updated: existingTemplateIds.size,
    })
  } catch (error) {
    console.error("[v0] Unexpected error in add-to-templates:", error)
    return NextResponse.json({ error: "Erro ao vincular questão aos cadernos: " + String(error) }, { status: 500 })
  }
}
