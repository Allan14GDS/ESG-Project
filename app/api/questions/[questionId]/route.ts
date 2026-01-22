import { createAdminClient } from "@/lib/supabase/admin"
import { type NextRequest, NextResponse } from "next/server"

// PATCH - Update question
export async function PATCH(request: NextRequest, { params }: { params: { questionId: string } }) {
  try {
    const { questionId } = params
    const body = await request.json()

    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from("book_questions")
      .update({
        label: body.linha_coleta,
        type: body.tipo_resposta,
        metadata: {
          disclosure: body.disclosure,
          evidencias: body.evidencias,
          obs: body.obs_nao_aplicavel,
          sub_frameworks: body.sub_frameworks || [],
        },
        updated_at: new Date().toISOString(),
      })
      .eq("id", questionId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating question:", error)
      return NextResponse.json({ error: "Erro ao atualizar questão" }, { status: 500 })
    }

    if (body.templateIds !== undefined) {
      // Delete existing assignments
      const { error: deleteError } = await adminClient
        .from("book_question_junction")
        .delete()
        .eq("question_template_id", questionId)

      if (deleteError) {
        console.error("[v0] Error deleting old assignments:", deleteError)
      }

      // Insert new assignments
      if (body.templateIds.length > 0) {
        const junctionData = body.templateIds.map((templateId: string) => ({
          question_template_id: questionId,
          book_template_id: templateId,
        }))

        const { error: insertError } = await adminClient.from("book_question_junction").insert(junctionData)

        if (insertError) {
          console.error("[v0] Error inserting new assignments:", insertError)
          return NextResponse.json({ error: "Erro ao atualizar atribuições" }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error("[v0] Error in PATCH /api/questions/[questionId]:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// DELETE - Remove question and all its assignments
export async function DELETE(request: NextRequest, { params }: { params: { questionId: string } }) {
  try {
    const { questionId } = params
    const adminClient = createAdminClient()

    const { error: junctionError } = await adminClient
      .from("book_question_junction")
      .delete()
      .eq("question_template_id", questionId)

    if (junctionError) {
      console.error("[v0] Error deleting question assignments:", junctionError)
      return NextResponse.json({ error: "Erro ao remover atribuições da questão" }, { status: 500 })
    }

    const { error: questionError } = await adminClient.from("book_questions").delete().eq("id", questionId)

    if (questionError) {
      console.error("[v0] Error deleting question:", questionError)
      return NextResponse.json({ error: "Erro ao deletar questão" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/questions/[questionId]:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
