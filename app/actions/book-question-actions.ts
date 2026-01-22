"use server"

import { adminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import type { Question } from "@/lib/database-types"

// =============================================================================
// AÇÕES DE CADERNOS (books)
// =============================================================================

export async function createBook(data: {
  name: string
  description?: string
  category?: string
  responsible_ids?: string[]
}) {
  try {
    const { data: book, error } = await adminClient
      .from("books")
      .insert({
        name: data.name,
        description: data.description || null,
        category: data.category || null,
        responsible_ids: data.responsible_ids || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar caderno: ${error.message}`)

    revalidatePath("/admin/templates")
    return { success: true, book }
  } catch (error) {
    console.error("[v0] Error creating book:", error)
    return { success: false, error: String(error) }
  }
}

export async function updateBook(
  id: string,
  data: {
    name?: string
    description?: string
    category?: string
    responsible_ids?: string[]
  },
) {
  try {
    const { data: book, error } = await adminClient
      .from("books")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar caderno: ${error.message}`)

    revalidatePath("/admin/templates")
    revalidatePath(`/admin/templates/${id}/questions`)
    return { success: true, book }
  } catch (error) {
    console.error("[v0] Error updating book:", error)
    return { success: false, error: String(error) }
  }
}

export async function deleteBook(id: string) {
  try {
    const { error } = await adminClient.from("books").delete().eq("id", id)

    if (error) throw new Error(`Erro ao deletar caderno: ${error.message}`)

    revalidatePath("/admin/templates")
    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting book:", error)
    return { success: false, error: String(error) }
  }
}

// =============================================================================
// AÇÕES DE QUESTÕES (questions)
// =============================================================================

export async function createQuestion(data: {
  linha_coleta: string
  tipo_resposta?: string
  disclosure?: string
  framework_aneel?: string
  subframework_aneel?: string
  framework_ifrs?: string
  subframework_ifrs?: string
  framework_gri?: string
  subframework_gri_1?: string
  subframework_gri_2?: string
  subframework_gri_3?: string
  evidencias?: string
  obs_nao_aplicavel?: string
  justificativa?: string
}) {
  try {
    const { data: question, error } = await adminClient
      .from("questions")
      .insert({
        linha_coleta: data.linha_coleta,
        tipo_resposta: data.tipo_resposta || "texto",
        disclosure: data.disclosure || null,
        framework_aneel: data.framework_aneel || null,
        subframework_aneel: data.subframework_aneel || null,
        framework_ifrs: data.framework_ifrs || null,
        subframework_ifrs: data.subframework_ifrs || null,
        framework_gri: data.framework_gri || null,
        subframework_gri_1: data.subframework_gri_1 || null,
        subframework_gri_2: data.subframework_gri_2 || null,
        subframework_gri_3: data.subframework_gri_3 || null,
        evidencias: data.evidencias || null,
        obs_nao_aplicavel: data.obs_nao_aplicavel || null,
        justificativa: data.justificativa || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Erro ao criar questão: ${error.message}`)

    return { success: true, question }
  } catch (error) {
    console.error("[v0] Error creating question:", error)
    return { success: false, error: String(error) }
  }
}

export async function updateQuestion(id: string, data: Partial<Question>) {
  try {
    const { data: question, error } = await adminClient
      .from("questions")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Erro ao atualizar questão: ${error.message}`)

    return { success: true, question }
  } catch (error) {
    console.error("[v0] Error updating question:", error)
    return { success: false, error: String(error) }
  }
}

export async function deleteQuestion(id: string) {
  try {
    // Primeiro remove todos os vínculos
    await adminClient.from("book_questions").delete().eq("question_id", id)

    // Depois deleta a questão
    const { error } = await adminClient.from("questions").delete().eq("id", id)

    if (error) throw new Error(`Erro ao deletar questão: ${error.message}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting question:", error)
    return { success: false, error: String(error) }
  }
}

// =============================================================================
// AÇÕES DE JUNÇÃO (book_questions)
// =============================================================================

// Criar questão E vincular ao caderno em uma operação
export async function createQuestionInBook(bookId: string, questionData: Parameters<typeof createQuestion>[0]) {
  try {
    // 1. Criar a questão
    const result = await createQuestion(questionData)
    if (!result.success || !result.question) {
      throw new Error(result.error || "Erro ao criar questão")
    }

    // 2. Vincular ao caderno
    const linkResult = await linkQuestionToBook(bookId, result.question.id)
    if (!linkResult.success) {
      // Se falhar, remove a questão criada
      await deleteQuestion(result.question.id)
      throw new Error(linkResult.error || "Erro ao vincular questão")
    }

    revalidatePath(`/admin/templates/${bookId}/questions`)
    return { success: true, question: result.question }
  } catch (error) {
    console.error("[v0] Error creating question in book:", error)
    return { success: false, error: String(error) }
  }
}

// Vincular questão existente ao caderno
export async function linkQuestionToBook(bookId: string, questionId: string, sortOrder?: number) {
  try {
    // Busca o maior sort_order atual se não foi especificado
    if (sortOrder === undefined) {
      const { data: maxOrder } = await adminClient
        .from("book_questions")
        .select("sort_order")
        .eq("book_id", bookId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single()

      sortOrder = (maxOrder?.sort_order || 0) + 1
    }

    const { data, error } = await adminClient
      .from("book_questions")
      .insert({
        book_id: bookId,
        question_id: questionId,
        sort_order: sortOrder,
      })
      .select()
      .single()

    if (error) {
      if (error.code === "23505") {
        throw new Error("Esta questão já está vinculada a este caderno")
      }
      throw new Error(`Erro ao vincular questão: ${error.message}`)
    }

    revalidatePath(`/admin/templates/${bookId}/questions`)
    return { success: true, data }
  } catch (error) {
    console.error("[v0] Error linking question to book:", error)
    return { success: false, error: String(error) }
  }
}

// Desvincular questão do caderno (não deleta a questão)
export async function unlinkQuestionFromBook(bookId: string, questionId: string) {
  try {
    const { error } = await adminClient
      .from("book_questions")
      .delete()
      .eq("book_id", bookId)
      .eq("question_id", questionId)

    if (error) throw new Error(`Erro ao desvincular questão: ${error.message}`)

    revalidatePath(`/admin/templates/${bookId}/questions`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error unlinking question from book:", error)
    return { success: false, error: String(error) }
  }
}

// Reordenar questões no caderno
export async function reorderQuestionsInBook(bookId: string, questionIds: string[]) {
  try {
    // Atualiza cada questão com sua nova ordem
    for (let i = 0; i < questionIds.length; i++) {
      await adminClient
        .from("book_questions")
        .update({ sort_order: i + 1 })
        .eq("book_id", bookId)
        .eq("question_id", questionIds[i])
    }

    revalidatePath(`/admin/templates/${bookId}/questions`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Error reordering questions:", error)
    return { success: false, error: String(error) }
  }
}

// =============================================================================
// QUERIES
// =============================================================================

export async function getBookWithQuestions(bookId: string) {
  try {
    // Buscar caderno
    const { data: book, error: bookError } = await adminClient.from("books").select("*").eq("id", bookId).single()

    if (bookError) throw new Error(`Erro ao buscar caderno: ${bookError.message}`)

    // Buscar questões vinculadas
    const { data: bookQuestions, error: questionsError } = await adminClient
      .from("book_questions")
      .select("*, questions(*)")
      .eq("book_id", bookId)
      .order("sort_order", { ascending: true })

    if (questionsError) throw new Error(`Erro ao buscar questões: ${questionsError.message}`)

    return {
      success: true,
      book,
      questions:
        bookQuestions?.map((bq) => ({
          ...bq.questions,
          sort_order: bq.sort_order,
          book_question_id: bq.id,
        })) || [],
    }
  } catch (error) {
    console.error("[v0] Error getting book with questions:", error)
    return { success: false, error: String(error) }
  }
}

export async function getAllQuestions() {
  try {
    const { data, error } = await adminClient.from("questions").select("*").order("created_at", { ascending: false })

    if (error) throw new Error(`Erro ao buscar questões: ${error.message}`)

    return { success: true, questions: data || [] }
  } catch (error) {
    console.error("[v0] Error getting all questions:", error)
    return { success: false, error: String(error) }
  }
}

export async function getQuestionsNotInBook(bookId: string) {
  try {
    // Buscar IDs das questões já vinculadas
    const { data: linked } = await adminClient.from("book_questions").select("question_id").eq("book_id", bookId)

    const linkedIds = linked?.map((l) => l.question_id) || []

    // Buscar questões não vinculadas
    let query = adminClient.from("questions").select("*").order("created_at", { ascending: false })

    if (linkedIds.length > 0) {
      query = query.not("id", "in", `(${linkedIds.join(",")})`)
    }

    const { data, error } = await query

    if (error) throw new Error(`Erro ao buscar questões: ${error.message}`)

    return { success: true, questions: data || [] }
  } catch (error) {
    console.error("[v0] Error getting questions not in book:", error)
    return { success: false, error: String(error) }
  }
}
