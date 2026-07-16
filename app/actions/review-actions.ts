"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserProfile } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"

interface RequestRevisionParams {
  junctionId: string
  questionId: string
  templateId: string
  comment: string
  anoReferencia: number
}

interface ApproveQuestionParams {
  junctionId: string
  questionId: string
  templateId: string
  anoReferencia: number
}

interface SubmitCorrectionParams {
  questionId: string
  templateId: string
  junctionId: string
  newValue: string
  driveLink?: string
  anoReferencia: number
}

export async function requestRevision({ junctionId, questionId, templateId, comment, anoReferencia }: RequestRevisionParams) {
  try {
    console.log("[v0] requestRevision chamada:", { junctionId, questionId, templateId, comment })
    
    const profile = await getCurrentUserProfile()

    if (!profile) {
      console.log("[v0] requestRevision: Usuário não autenticado")
      return { success: false, error: "Usuário não autenticado" }
    }

    console.log("[v0] requestRevision: Profile:", { id: profile.id, role: profile.role })

    // Verificar se é admin ou gestor
    if (!["admin_main", "holding_admin", "revisor"].includes(profile.role || "")) {
      console.log("[v0] requestRevision: Permissão negada para role:", profile.role)
      return { success: false, error: "Apenas gestores podem solicitar revisões" }
    }

    const adminClient = createAdminClient()

    // Atualizar o comentário na junction
    const { error: updateError } = await adminClient
      .from("book_question_junction")
      .update({ comment })
      .eq("id", junctionId)

    if (updateError) {
      console.error("[v0] Error updating junction comment:", updateError)
      return { success: false, error: "Erro ao salvar comentário" }
    }

    console.log("[v0] requestRevision: Junction atualizada com sucesso")

    // Criar registro no histórico
    const { error: historyError } = await adminClient.from("comment_history").insert({
      book_template_id: templateId,
      question_template_id: questionId,
      user_id: profile.id,
      company_id: profile.organization_id,
      comment: `[REVISÃO SOLICITADA] ${comment}`,
      question_generated_at: new Date().toISOString(),
    })

    if (historyError) {
      console.error("[v0] Error creating history:", historyError)
      // Não falhar se o histórico não for criado
    }

    console.log("[v0] requestRevision: Histórico criado")

    // Atualizar status de TODAS as respostas desta questão para "revisao"
    const { error: statusError, count } = await adminClient
      .from("book_answers")
      .update({ status: "revisao" })
      .eq("template_id", templateId)
      .eq("question_id", questionId)
      .eq("ano_referencia", anoReferencia)

    if (statusError) {
      console.error("[v0] Error updating answer status:", statusError)
      return { success: false, error: "Erro ao atualizar status da resposta" }
    }

    console.log("[v0] requestRevision: Status atualizado para revisao. Respostas afetadas:", count)

    revalidatePath(`/dashboard/questionnaire/${templateId}`)
    revalidatePath(`/admin/templates/${templateId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in requestRevision:", error)
    return { success: false, error: "Erro inesperado ao solicitar revisão" }
  }
}

export async function approveQuestion({ junctionId, questionId, templateId, anoReferencia }: ApproveQuestionParams) {
  try {
    console.log("[v0] approveQuestion chamada:", { junctionId, questionId, templateId })
    
    const profile = await getCurrentUserProfile()

    if (!profile) {
      console.log("[v0] approveQuestion: Usuário não autenticado")
      return { success: false, error: "Usuário não autenticado" }
    }

    console.log("[v0] approveQuestion: Profile:", { id: profile.id, role: profile.role })

    if (!["admin_main", "holding_admin", "revisor"].includes(profile.role || "")) {
      console.log("[v0] approveQuestion: Permissão negada para role:", profile.role)
      return { success: false, error: "Apenas gestores podem aprovar questões" }
    }

    const adminClient = createAdminClient()

    // Limpar comentário na junction
    const { error: updateError } = await adminClient
      .from("book_question_junction")
      .update({ comment: null })
      .eq("id", junctionId)

    if (updateError) {
      console.error("[v0] Error clearing junction comment:", updateError)
      return { success: false, error: "Erro ao limpar comentário" }
    }

    console.log("[v0] approveQuestion: Comentário limpo da junction")

    // Criar registro no histórico
    const { error: historyError } = await adminClient.from("comment_history").insert({
      book_template_id: templateId,
      question_template_id: questionId,
      user_id: profile.id,
      company_id: profile.organization_id,
      comment: "[APROVADO] Questão aprovada",
      question_generated_at: new Date().toISOString(),
    })

    if (historyError) {
      console.error("[v0] Error creating history:", historyError)
      // Não falhar se o histórico não for criado
    }

    console.log("[v0] approveQuestion: Histórico criado")

    // Atualizar status de TODAS as respostas desta questão para "aprovado"
    const { error: statusError, count } = await adminClient
      .from("book_answers")
      .update({ status: "aprovado" })
      .eq("template_id", templateId)
      .eq("question_id", questionId)
      .eq("ano_referencia", anoReferencia)

    if (statusError) {
      console.error("[v0] Error updating answer status:", statusError)
      return { success: false, error: "Erro ao atualizar status da resposta" }
    }

    console.log("[v0] approveQuestion: Status atualizado para aprovado. Respostas afetadas:", count)

    revalidatePath(`/dashboard/questionnaire/${templateId}`)
    revalidatePath(`/admin/templates/${templateId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in approveQuestion:", error)
    return { success: false, error: "Erro inesperado ao aprovar questão" }
  }
}

export async function rejectQuestion({
  junctionId,
  questionId,
  templateId,
  reason,
  anoReferencia,
}: ApproveQuestionParams & { reason: string }) {
  try {
    console.log("[v0] rejectQuestion chamada:", { junctionId, questionId, templateId, reason })
    
    const profile = await getCurrentUserProfile()

    if (!profile) {
      console.log("[v0] rejectQuestion: Usuário não autenticado")
      return { success: false, error: "Usuário não autenticado" }
    }

    console.log("[v0] rejectQuestion: Profile:", { id: profile.id, role: profile.role })

    if (!["admin_main", "holding_admin", "revisor"].includes(profile.role || "")) {
      console.log("[v0] rejectQuestion: Permissão negada para role:", profile.role)
      return { success: false, error: "Apenas gestores podem rejeitar questões" }
    }

    const adminClient = createAdminClient()

    // Atualizar comentário na junction
    const { error: updateError } = await adminClient
      .from("book_question_junction")
      .update({ comment: reason })
      .eq("id", junctionId)

    if (updateError) {
      console.error("[v0] Error updating junction comment:", updateError)
      return { success: false, error: "Erro ao salvar comentário" }
    }

    console.log("[v0] rejectQuestion: Motivo salvo na junction")

    // Criar registro no histórico
    const { error: historyError } = await adminClient.from("comment_history").insert({
      book_template_id: templateId,
      question_template_id: questionId,
      user_id: profile.id,
      company_id: profile.organization_id,
      comment: `[REJEITADO] ${reason}`,
      question_generated_at: new Date().toISOString(),
    })

    if (historyError) {
      console.error("[v0] Error creating history:", historyError)
      // Não falhar se o histórico não for criado
    }

    console.log("[v0] rejectQuestion: Histórico criado")

    // Atualizar status de TODAS as respostas desta questão para "rejeitado"
    const { error: statusError, count } = await adminClient
      .from("book_answers")
      .update({ status: "rejeitado" })
      .eq("template_id", templateId)
      .eq("question_id", questionId)
      .eq("ano_referencia", anoReferencia)

    if (statusError) {
      console.error("[v0] Error updating answer status:", statusError)
      return { success: false, error: "Erro ao atualizar status da resposta" }
    }

    console.log("[v0] rejectQuestion: Status atualizado para rejeitado. Respostas afetadas:", count)

    revalidatePath(`/dashboard/questionnaire/${templateId}`)
    revalidatePath(`/admin/templates/${templateId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in rejectQuestion:", error)
    return { success: false, error: "Erro inesperado ao rejeitar questão" }
  }
}

export async function submitCorrection({
  questionId,
  templateId,
  junctionId,
  newValue,
  driveLink,
  anoReferencia,
}: SubmitCorrectionParams) {
  try {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      return { success: false, error: "Usuário não autenticado" }
    }

    const adminClient = createAdminClient()

    // Atualizar a resposta
    const { error: answerError } = await adminClient
      .from("book_answers")
      .update({
        value: newValue,
        evidence_url: driveLink || null,
        status: "reenviado",
      })
      .eq("template_id", templateId)
      .eq("question_id", questionId)
      .eq("user_id", profile.id)
      .eq("ano_referencia", anoReferencia)

    if (answerError) {
      console.error("[v0] Error updating answer:", answerError)
      return { success: false, error: "Erro ao atualizar resposta" }
    }

    // Criar registro no histórico
    const { error: historyError } = await adminClient.from("comment_history").insert({
      book_template_id: templateId,
      question_template_id: questionId,
      user_id: profile.id,
      company_id: profile.organization_id,
      comment: `[CORREÇÃO ENVIADA] ${newValue.substring(0, 100)}${newValue.length > 100 ? "..." : ""}`,
      question_generated_at: new Date().toISOString(),
    })

    if (historyError) {
      console.error("[v0] Error creating history:", historyError)
      // Não falhar se o histórico não for criado
    }

    revalidatePath(`/dashboard/questionnaire/${templateId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in submitCorrection:", error)
    return { success: false, error: "Erro inesperado ao enviar correção" }
  }
}

export async function clearRevision({ junctionId, questionId, templateId, anoReferencia }: ApproveQuestionParams) {
  try {
    console.log("[v0] clearRevision chamada:", { junctionId, questionId, templateId })
    
    const profile = await getCurrentUserProfile()

    if (!profile) {
      console.log("[v0] clearRevision: Usuário não autenticado")
      return { success: false, error: "Usuário não autenticado" }
    }

    console.log("[v0] clearRevision: Profile:", { id: profile.id, role: profile.role })

    if (!["admin_main", "holding_admin", "revisor"].includes(profile.role || "")) {
      console.log("[v0] clearRevision: Permissão negada para role:", profile.role)
      return { success: false, error: "Apenas gestores podem limpar revisões" }
    }

    const adminClient = createAdminClient()

    // Limpar comentário na junction
    const { error: updateError } = await adminClient
      .from("book_question_junction")
      .update({ comment: null })
      .eq("id", junctionId)

    if (updateError) {
      console.error("[v0] Error clearing junction comment:", updateError)
      return { success: false, error: "Erro ao limpar comentário" }
    }

    console.log("[v0] clearRevision: Comentário limpo da junction")

    // Criar registro no histórico
    const { error: historyError } = await adminClient.from("comment_history").insert({
      book_template_id: templateId,
      question_template_id: questionId,
      user_id: profile.id,
      company_id: profile.organization_id,
      comment: "[REVISÃO CANCELADA] Ajuste solicitado foi removido",
      question_generated_at: new Date().toISOString(),
    })

    if (historyError) {
      console.error("[v0] Error creating history:", historyError)
      // Não falhar se o histórico não for criado
    }

    console.log("[v0] clearRevision: Histórico criado")

    // Atualizar status de TODAS as respostas desta questão para "rascunho"
    const { error: statusError, count } = await adminClient
      .from("book_answers")
      .update({ status: "rascunho" })
      .eq("template_id", templateId)
      .eq("question_id", questionId)
      .eq("ano_referencia", anoReferencia)

    if (statusError) {
      console.error("[v0] Error updating answer status:", statusError)
      return { success: false, error: "Erro ao atualizar status da resposta" }
    }

    console.log("[v0] clearRevision: Status atualizado para rascunho. Respostas afetadas:", count)

    revalidatePath(`/dashboard/questionnaire/${templateId}`)
    revalidatePath(`/admin/templates/${templateId}`)

    return { success: true }
  } catch (error) {
    console.error("[v0] Error in clearRevision:", error)
    return { success: false, error: "Erro inesperado ao limpar revisão" }
  }
}

export async function getCommentHistory(templateId: string, questionId?: string) {
  try {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      return { success: false, error: "Usuário não autenticado", data: [] }
    }

    const adminClient = createAdminClient()

    let query = adminClient
      .from("comment_history")
      .select(`
        *,
        author:profiles!user_id(full_name, email, role)
      `)
      .eq("book_template_id", templateId)
      .order("created_at", { ascending: false })

    if (questionId) {
      query = query.eq("question_template_id", questionId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching history:", error)
      return { success: false, error: "Erro ao buscar histórico", data: [] }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error("[v0] Error in getCommentHistory:", error)
    return { success: false, error: "Erro inesperado", data: [] }
  }
}
