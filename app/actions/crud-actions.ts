"use server"

import { adminClient } from "@/lib/supabase/admin"
import { TABLES } from "@/lib/database-schema"
import { revalidatePath } from "next/cache"

// ============================================
// BOOK CRUD OPERATIONS (Cadernos)
// ============================================

/**
 * Criar um novo caderno
 */
export async function createBook(data: {
  name: string
  description?: string
  type?: string
  responsable_name?: string
  responsable_id?: string
}) {
  try {
    const { data: book, error } = await adminClient
      .from(TABLES.BOOKS)
      .insert({
        name: data.name,
        description: data.description || null,
        type: data.type || null,
        responsable_name: data.responsable_name || null,
        responsable_id: data.responsable_id || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Falha ao criar caderno: ${error.message}`)

    revalidatePath("/admin/templates")
    return { success: true, book }
  } catch (error) {
    console.error("[v0] Erro ao criar caderno:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Atualizar um caderno existente
 */
export async function updateBook(
  id: string,
  data: {
    name?: string
    description?: string
    type?: string
    responsable_name?: string
    responsable_id?: string
  },
) {
  try {
    const { data: book, error } = await adminClient.from(TABLES.BOOKS).update(data).eq("id", id).select().single()

    if (error) throw new Error(`Falha ao atualizar caderno: ${error.message}`)

    revalidatePath("/admin/templates")
    revalidatePath(`/admin/templates/${id}`)
    return { success: true, book }
  } catch (error) {
    console.error("[v0] Erro ao atualizar caderno:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Deletar um caderno e todos os vínculos com questões
 */
export async function deleteBook(id: string) {
  try {
    // Primeiro deletar todos os vínculos com questões
    await adminClient.from(TABLES.BOOK_QUESTIONS).delete().eq("template_id", id)

    // Depois deletar o caderno
    const { error } = await adminClient.from(TABLES.BOOKS).delete().eq("id", id)

    if (error) throw new Error(`Falha ao deletar caderno: ${error.message}`)

    revalidatePath("/admin/templates")
    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao deletar caderno:", error)
    return { success: false, error: String(error) }
  }
}

// ============================================
// QUESTION CRUD OPERATIONS (Questões Master)
// ============================================

/**
 * Criar uma nova questão no banco master
 */
export async function createQuestion(data: {
  frameworks?: {
    aneel?: string
    sub_aneel?: string
    ifrs?: string
    sub_ifrs?: string
    gri?: string
    sub_gri_1?: string
    sub_gri_2?: string
    sub_gri_3?: string
  }
  disclosure?: string
  linha_coleta?: string
  tipo_resposta?: string
  evidencias?: string
  obs_nao_aplicavel?: string
}) {
  try {
    const { data: question, error } = await adminClient
      .from(TABLES.QUESTIONS)
      .insert({
        frameworks: data.frameworks || null,
        disclosure: data.disclosure || null,
        linha_coleta: data.linha_coleta || null,
        tipo_resposta: data.tipo_resposta || null,
        evidencias: data.evidencias || null,
        obs_nao_aplicavel: data.obs_nao_aplicavel || null,
      })
      .select()
      .single()

    if (error) throw new Error(`Falha ao criar questão: ${error.message}`)

    return { success: true, question }
  } catch (error) {
    console.error("[v0] Erro ao criar questão:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Atualizar uma questão existente
 */
export async function updateQuestion(
  id: string,
  data: {
    frameworks?: object
    disclosure?: string
    linha_coleta?: string
    tipo_resposta?: string
    evidencias?: string
    obs_nao_aplicavel?: string
  },
) {
  try {
    const { data: question, error } = await adminClient
      .from(TABLES.QUESTIONS)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) throw new Error(`Falha ao atualizar questão: ${error.message}`)

    return { success: true, question }
  } catch (error) {
    console.error("[v0] Erro ao atualizar questão:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Deletar uma questão do banco master
 * Também remove todos os vínculos com cadernos
 */
export async function deleteQuestion(id: string) {
  try {
    // Primeiro deletar todos os vínculos com cadernos
    await adminClient.from(TABLES.BOOK_QUESTIONS).delete().eq("question_id", id)

    // Depois deletar a questão
    const { error } = await adminClient.from(TABLES.QUESTIONS).delete().eq("id", id)

    if (error) throw new Error(`Falha ao deletar questão: ${error.message}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao deletar questão:", error)
    return { success: false, error: String(error) }
  }
}

// ============================================
// BOOK-QUESTION LINK OPERATIONS (Vínculos)
// ============================================

/**
 * Vincular uma questão a um caderno
 */
export async function linkQuestionToBook(bookId: string, questionId: string, sortOrder?: number) {
  try {
    // Verificar se o vínculo já existe
    const { data: existing } = await adminClient
      .from(TABLES.BOOK_QUESTIONS)
      .select("id")
      .eq("template_id", bookId)
      .eq("question_id", questionId)
      .single()

    if (existing) {
      return { success: true, message: "Questão já vinculada ao caderno" }
    }

    // Obter o maior sort_order para este caderno
    const { data: maxOrder } = await adminClient
      .from(TABLES.BOOK_QUESTIONS)
      .select("sort_order")
      .eq("template_id", bookId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()

    const newSortOrder = sortOrder ?? (maxOrder?.sort_order || 0) + 1

    const { error } = await adminClient.from(TABLES.BOOK_QUESTIONS).insert({
      template_id: bookId,
      question_id: questionId,
      sort_order: newSortOrder,
    })

    if (error) throw new Error(`Falha ao vincular questão: ${error.message}`)

    revalidatePath(`/admin/templates/${bookId}/questions`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao vincular questão:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Desvincular uma questão de um caderno (NÃO deleta a questão)
 */
export async function unlinkQuestionFromBook(bookId: string, questionId: string) {
  try {
    const { error } = await adminClient
      .from(TABLES.BOOK_QUESTIONS)
      .delete()
      .eq("template_id", bookId)
      .eq("question_id", questionId)

    if (error) throw new Error(`Falha ao desvincular questão: ${error.message}`)

    revalidatePath(`/admin/templates/${bookId}/questions`)
    return { success: true }
  } catch (error) {
    console.error("[v0] Erro ao desvincular questão:", error)
    return { success: false, error: String(error) }
  }
}

/**
 * Criar uma nova questão E vincular a um caderno
 */
export async function createAndLinkQuestion(
  bookId: string,
  questionData: {
    frameworks?: object
    disclosure?: string
    linha_coleta?: string
    tipo_resposta?: string
    evidencias?: string
    obs_nao_aplicavel?: string
  },
) {
  try {
    // Criar a questão
    const result = await createQuestion(questionData)
    if (!result.success || !result.question) {
      throw new Error(result.error || "Falha ao criar questão")
    }

    // Vincular ao caderno
    const linkResult = await linkQuestionToBook(bookId, result.question.id)
    if (!linkResult.success) {
      throw new Error(linkResult.error || "Falha ao vincular questão")
    }

    revalidatePath(`/admin/templates/${bookId}/questions`)
    return { success: true, question: result.question }
  } catch (error) {
    console.error("[v0] Erro ao criar e vincular questão:", error)
    return { success: false, error: String(error) }
  }
}

// ============================================
// FETCH OPERATIONS (Busca)
// ============================================

/**
 * Buscar todos os cadernos com contagem de questões
 */
export async function getAllBooks() {
  try {
    const { data: books, error } = await adminClient
      .from(TABLES.BOOKS)
      .select(`
        *,
        book_questions(id),
        company_templates(company_id)
      `)
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Falha ao buscar cadernos: ${error.message}`)

    return {
      success: true,
      books:
        books?.map((book) => ({
          ...book,
          questionCount: book.book_questions?.length || 0,
          companyCount: book.company_templates?.length || 0,
        })) || [],
    }
  } catch (error) {
    console.error("[v0] Erro ao buscar cadernos:", error)
    return { success: false, error: String(error), books: [] }
  }
}

/**
 * Buscar todas as questões do banco master
 */
export async function getAllQuestions() {
  try {
    const { data: questions, error } = await adminClient
      .from(TABLES.QUESTIONS)
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw new Error(`Falha ao buscar questões: ${error.message}`)

    return { success: true, questions: questions || [] }
  } catch (error) {
    console.error("[v0] Erro ao buscar questões:", error)
    return { success: false, error: String(error), questions: [] }
  }
}

/**
 * Buscar questões de um caderno específico
 */
export async function getBookQuestions(bookId: string) {
  try {
    const { data: links, error } = await adminClient
      .from(TABLES.BOOK_QUESTIONS)
      .select(`
        id,
        sort_order,
        question:master_questions(*)
      `)
      .eq("template_id", bookId)
      .order("sort_order", { ascending: true })

    if (error) throw new Error(`Falha ao buscar questões do caderno: ${error.message}`)

    return {
      success: true,
      questions:
        links?.map((link) => ({
          linkId: link.id,
          sortOrder: link.sort_order,
          ...link.question,
        })) || [],
    }
  } catch (error) {
    console.error("[v0] Erro ao buscar questões do caderno:", error)
    return { success: false, error: String(error), questions: [] }
  }
}
