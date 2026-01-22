"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { verifyAdminOrGestor } from "@/lib/auth-utils"

// =====================================================
// BOOK TEMPLATES (CADERNOS) ACTIONS
// =====================================================

export async function createTemplate({ name, description }: { name: string; description: string }) {
  try {
    const authCheck = await verifyAdminOrGestor()
    if (!authCheck.authorized) {
      return { error: `Acesso negado: ${authCheck.error}` }
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      throw new Error("User not authenticated")
    }

    const adminClient = createAdminClient()

    const { data: template, error: templateError } = await adminClient
      .from("book_templates")
      .insert({ name, description, created_by: user.id })
      .select()
      .single()

    if (templateError) {
      throw new Error(`Failed to create template: ${templateError.message}`)
    }

    return { data: template }
  } catch (error: any) {
    return { error: error.message || "Unknown error occurred" }
  }
}

export async function createBookTemplate({
  name,
  description,
  type,
}: {
  name: string
  description?: string
  type: string
}) {
  try {
    const authCheck = await verifyAdminOrGestor()
    if (!authCheck.authorized) {
      return { success: false, error: `Acesso negado: ${authCheck.error}` }
    }

    const adminClient = createAdminClient()

    const { data: template, error: templateError } = await adminClient
      .from("book_templates")
      .insert({ name, description, type, created_by: authCheck.profile?.id })
      .select()
      .single()

    if (templateError) {
      return { success: false, error: `Failed to create template: ${templateError.message}` }
    }

    return { success: true, data: template }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function updateBookTemplate(
  templateId: string,
  {
    name,
    description,
    type,
  }: {
    name: string
    description?: string
    type: string
  },
) {
  try {
    const authCheck = await verifyAdminOrGestor()
    if (!authCheck.authorized) {
      return { success: false, error: `Acesso negado: ${authCheck.error}` }
    }

    const adminClient = createAdminClient()

    const { data: template, error: templateError } = await adminClient
      .from("book_templates")
      .update({ name, description, type })
      .eq("id", templateId)
      .select()
      .single()

    if (templateError) {
      return { success: false, error: `Failed to update template: ${templateError.message}` }
    }

    return { success: true, data: template }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function deleteBookTemplate(templateId: string) {
  try {
    const authCheck = await verifyAdminOrGestor()
    if (!authCheck.authorized) {
      return { success: false, error: `Acesso negado: ${authCheck.error}` }
    }

    const adminClient = createAdminClient()

    // Delete junction records first (questions linked to this template)
    const { error: junctionError } = await adminClient
      .from("book_question_junction")
      .delete()
      .eq("book_template_id", templateId)

    if (junctionError) {
      console.error("[v0] Error deleting junction records:", junctionError)
    }

    // Then delete the template
    const { error: templateError } = await adminClient.from("book_templates").delete().eq("id", templateId)

    if (templateError) {
      return { success: false, error: `Failed to delete template: ${templateError.message}` }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getTemplateWithQuestions(templateId: string) {
  try {
    const adminClient = createAdminClient()

    const { data: template, error: templateError } = await adminClient
      .from("book_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (templateError) {
      return { success: false, error: `Failed to fetch template: ${templateError.message}` }
    }

    const { data: questionLinks, error: linksError } = await adminClient
      .from("book_question_junction")
      .select("question_template_id")
      .eq("book_template_id", templateId)

    if (linksError) {
      return { success: false, error: `Failed to fetch question links: ${linksError.message}` }
    }

    let questions: any[] = []
    if (questionLinks && questionLinks.length > 0) {
      const questionIds = questionLinks.map((l) => l.question_template_id)
      const { data: bookQuestions } = await adminClient.from("book_questions").select("*").in("id", questionIds)

      if (bookQuestions) {
        questions = bookQuestions
      }
    }

    return { success: true, data: { ...template, questions } }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// MASTER QUESTIONS (BANCO MASTER) ACTIONS
// =====================================================

export async function createQuestionInMasterBank({
  frameworks,
  disclosure,
  linha_coleta,
  tipo_resposta,
  evidencias,
  obs_nao_aplicavel,
}: {
  frameworks: object[]
  disclosure: string
  linha_coleta: string
  tipo_resposta: string
  evidencias?: string
  obs_nao_aplicavel?: string
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const adminClient = createAdminClient()

    const { data: question, error: questionError } = await adminClient
      .from("master_questions")
      .insert({
        frameworks,
        disclosure,
        linha_coleta,
        tipo_resposta,
        evidencias,
        obs_nao_aplicavel,
        created_by: user?.id,
      })
      .select()
      .single()

    if (questionError) {
      return { success: false, error: `Failed to create question: ${questionError.message}` }
    }

    return { success: true, data: question }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getAllMasterQuestions() {
  try {
    const adminClient = createAdminClient()

    const { data: questions, error } = await adminClient
      .from("master_questions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: questions }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

// =====================================================
// BOOK_QUESTIONS LINKING ACTIONS (using junction table)
// =====================================================

export async function linkQuestionToBook({
  bookTemplateId,
  questionId,
  sortOrder,
}: {
  bookTemplateId: string
  questionId: string
  sortOrder?: number
}) {
  try {
    const adminClient = createAdminClient()

    // Check if already linked via junction table
    const { data: existing } = await adminClient
      .from("book_question_junction")
      .select("id")
      .eq("book_template_id", bookTemplateId)
      .eq("question_template_id", questionId)
      .single()

    if (existing) {
      return { success: false, error: "Question already linked to this book" }
    }

    let order = sortOrder
    if (order === undefined) {
      const { data: lastQuestion } = await adminClient
        .from("book_question_junction")
        .select("sort_order")
        .eq("book_template_id", bookTemplateId)
        .order("sort_order", { ascending: false })
        .limit(1)
        .single()

      order = lastQuestion ? lastQuestion.sort_order + 1 : 1
    }

    const { data: link, error: linkError } = await adminClient
      .from("book_question_junction")
      .insert({
        book_template_id: bookTemplateId,
        question_template_id: questionId,
        sort_order: order,
      })
      .select()
      .single()

    if (linkError) {
      return { success: false, error: `Failed to link question: ${linkError.message}` }
    }

    return { success: true, data: link }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function unlinkQuestionFromBook({
  bookTemplateId,
  questionId,
}: {
  bookTemplateId: string
  questionId: string
}) {
  try {
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("book_question_junction")
      .delete()
      .eq("book_template_id", bookTemplateId)
      .eq("question_template_id", questionId)

    if (error) {
      return { success: false, error: `Failed to unlink question: ${error.message}` }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function createAndLinkQuestion({
  bookTemplateId,
  frameworks,
  disclosure,
  linha_coleta,
  tipo_resposta,
  evidencias,
  obs_nao_aplicavel,
}: {
  bookTemplateId: string
  frameworks: object[]
  disclosure: string
  linha_coleta: string
  tipo_resposta: string
  evidencias?: string
  obs_nao_aplicavel?: string
}) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const adminClient = createAdminClient()

    const { data: question, error: questionError } = await adminClient
      .from("master_questions")
      .insert({
        frameworks,
        disclosure,
        linha_coleta,
        tipo_resposta,
        evidencias,
        obs_nao_aplicavel,
        created_by: user?.id,
      })
      .select()
      .single()

    if (questionError) {
      return { success: false, error: `Failed to create question: ${questionError.message}` }
    }

    const { data: lastQuestion } = await adminClient
      .from("book_question_junction")
      .select("sort_order")
      .eq("book_template_id", bookTemplateId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .single()

    const sortOrder = lastQuestion ? lastQuestion.sort_order + 1 : 1

    const { error: linkError } = await adminClient.from("book_question_junction").insert({
      book_template_id: bookTemplateId,
      question_template_id: question.id,
      sort_order: sortOrder,
    })

    if (linkError) {
      await adminClient.from("master_questions").delete().eq("id", question.id)
      return { success: false, error: `Failed to link question: ${linkError.message}` }
    }

    return { success: true, data: question }
  } catch (error: any) {
    return { success: false, error: error.message || "Unknown error occurred" }
  }
}

export async function getBookQuestions(bookTemplateId: string) {
  try {
    const adminClient = createAdminClient()

    const { data: links, error: linksError } = await adminClient
      .from("book_question_junction")
      .select("question_template_id, sort_order")
      .eq("book_template_id", bookTemplateId)
      .order("sort_order", { ascending: true })

    if (linksError) {
      return { success: false, error: linksError.message }
    }

    if (!links || links.length === 0) {
      return { success: true, data: [] }
    }

    const questionIds = links.map((l) => l.question_template_id)

    const { data: questions, error: questionsError } = await adminClient
      .from("book_questions")
      .select("*")
      .in("id", questionIds)

    if (questionsError) {
      return { success: false, error: questionsError.message }
    }

    const orderedQuestions = links
      .map((link) => {
        const question = questions?.find((q) => q.id === link.question_template_id)
        return question ? { ...question, sort_order: link.sort_order } : null
      })
      .filter(Boolean)

    return { success: true, data: orderedQuestions }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function updateQuestionOrder({
  bookTemplateId,
  questionOrders,
}: {
  bookTemplateId: string
  questionOrders: Array<{ questionId: string; sortOrder: number }>
}) {
  try {
    const adminClient = createAdminClient()

    for (const order of questionOrders) {
      const { error } = await adminClient
        .from("book_question_junction")
        .update({ sort_order: order.sortOrder })
        .eq("book_template_id", bookTemplateId)
        .eq("question_template_id", order.questionId)

      if (error) {
        throw error
      }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update question order" }
  }
}

// =====================================================
// LEGACY FUNCTIONS (for backwards compatibility)
// =====================================================

export async function addQuestionToTemplate({
  templateId,
  questionText,
  questionType,
  sortOrder,
}: {
  templateId: string
  questionText: string
  questionType: string
  sortOrder: number
}) {
  return createAndLinkQuestion({
    bookTemplateId: templateId,
    frameworks: [],
    disclosure: "",
    linha_coleta: questionText,
    tipo_resposta: questionType,
  })
}

export async function createTemplateQuestion(params: any) {
  return createAndLinkQuestion({
    bookTemplateId: params.template_id,
    frameworks: [],
    disclosure: params.disclosure || "",
    linha_coleta: params.linha_coleta || params.question_text || "",
    tipo_resposta: params.tipo_resposta || params.question_type || "Texto",
    evidencias: params.evidencias,
    obs_nao_aplicavel: params.obs_nao_aplicavel,
  })
}

export async function deleteTemplateQuestion(questionId: string) {
  try {
    const adminClient = createAdminClient()

    // Remove from all junction tables first
    await adminClient.from("book_question_junction").delete().eq("question_template_id", questionId)

    // Then delete the question itself
    const { error } = await adminClient.from("book_questions").delete().eq("id", questionId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export const linkQuestionToBook2 = linkQuestionToBook
export const unlinkQuestionFromBook2 = unlinkQuestionFromBook
