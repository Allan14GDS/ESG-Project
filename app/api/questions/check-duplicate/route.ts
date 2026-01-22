import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { unique_identifier } = await request.json()

    if (!unique_identifier) {
      return NextResponse.json({ error: "Unique identifier é obrigatório" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data: existingQuestion } = await adminClient
      .from("book_questions")
      .select("id, label")
      .eq("unique_identifier", unique_identifier)
      .maybeSingle()

    if (!existingQuestion) {
      return NextResponse.json({ isDuplicate: false })
    }

    // Get templates this question is linked to
    const { data: junctions } = await adminClient
      .from("book_question_junction")
      .select("book_template_id, book_templates(name)")
      .eq("question_template_id", existingQuestion.id)

    const existingTemplates = junctions?.map((j: any) => j.book_templates?.name).filter(Boolean) || []

    return NextResponse.json({
      isDuplicate: true,
      questionId: existingQuestion.id,
      existingTemplates,
    })
  } catch (error) {
    console.error("Error checking duplicate:", error)
    return NextResponse.json({ error: "Erro ao verificar duplicata" }, { status: 500 })
  }
}
