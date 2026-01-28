"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserProfile } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"

interface SaveResponseParams {
  templateId: string
  questionId: string
  userId: string
  companyId: string | null
  holdingId: string | null
  responseValue: string
  driveLink?: string
  justification?: string
  statusOverride?: string
}

export async function saveQuestionnaireResponse({
  templateId,
  questionId,
  userId,
  companyId,
  holdingId,
  responseValue,
  driveLink,
  justification,
  statusOverride,
}: SaveResponseParams) {
  try {
    console.log("[v0] saveQuestionnaireResponse called with:", {
      templateId,
      questionId,
      userId,
      companyId,
      holdingId,
      responseValueLength: responseValue?.length,
    })

    const profile = await getCurrentUserProfile()

    if (!profile) {
      return {
        success: false,
        error: "Usuário não autenticado",
      }
    }

    if (profile.id !== userId) {
      return {
        success: false,
        error: "Você não tem permissão para salvar respostas de outros usuários",
      }
    }

    const adminClient = createAdminClient()

    // Converter string vazia para null para evitar erro de UUID
    let resolvedCompanyId = companyId && companyId.trim() !== "" ? companyId : null
    let sanitizedHoldingId = holdingId && holdingId.trim() !== "" ? holdingId : null

    if (resolvedCompanyId) {
      // First check if this ID exists in companies table
      const { data: companyCheck } = await adminClient.from("companies").select("id").eq("id", companyId).maybeSingle()

      if (!companyCheck) {
        // It might be an organization_id, try to find the linked company
        console.log("[v0] company_id not found in companies table, checking if it's an organization_id")

        const { data: orgData } = await adminClient
          .from("organizations")
          .select("id, cnpj, holding_id")
          .eq("id", companyId)
          .maybeSingle()

        if (orgData) {
          console.log("[v0] Found organization, looking for matching company by CNPJ:", orgData.cnpj)

          // Try to find a company with the same CNPJ
          if (orgData.cnpj) {
            const { data: matchingCompany } = await adminClient
              .from("companies")
              .select("id")
              .eq("cnpj", orgData.cnpj)
              .maybeSingle()

            if (matchingCompany) {
              console.log("[v0] Found matching company by CNPJ:", matchingCompany.id)
              resolvedCompanyId = matchingCompany.id
              sanitizedHoldingId = sanitizedHoldingId || orgData.holding_id
            } else {
              console.log("[v0] No matching company found, company_id will be null")
              resolvedCompanyId = null
            }
          } else {
            console.log("[v0] Organization has no CNPJ, cannot match to company")
            resolvedCompanyId = null
          }
        } else {
          console.log("[v0] ID is neither in companies nor organizations table")
          resolvedCompanyId = null
        }
      }
    }

    console.log("[v0] Resolved company_id:", resolvedCompanyId)

    let valueJsonb: any = {
      type: "text",
      value: responseValue,
    }

    const numericValue = Number.parseFloat(responseValue)
    if (!isNaN(numericValue) && responseValue.trim() !== "") {
      valueJsonb = {
        type: "number",
        value: numericValue,
      }
    }

    if (justification || driveLink) {
      valueJsonb = {
        ...valueJsonb,
        justification: justification || null,
        evidence_url: driveLink || null,
      }
    }

    const dataToSave = {
      template_id: templateId,
      question_id: questionId,
      user_id: userId,
      company_id: resolvedCompanyId,
      holding_id: sanitizedHoldingId,
      value: responseValue,
      value_jsonb: valueJsonb,
      evidence_url: driveLink || null,
      status: statusOverride || "rascunho",
      updated_at: new Date().toISOString(),
    }

    console.log("[v0] Saving book_answers with data:", dataToSave)

    let query = adminClient
      .from("book_answers")
      .select("id")
      .eq("template_id", templateId)
      .eq("question_id", questionId)
      .eq("user_id", userId)

    if (resolvedCompanyId) {
      query = query.eq("company_id", resolvedCompanyId)
    } else {
      query = query.is("company_id", null)
    }

    const { data: existingRecord, error: checkError } = await query.maybeSingle()

    if (checkError) {
      console.error("[v0] Error checking existing record:", checkError)
      throw checkError
    }

    let data
    let bookAnswerError

    if (existingRecord) {
      console.log("[v0] Updating existing record:", existingRecord.id)
      const result = await adminClient.from("book_answers").update(dataToSave).eq("id", existingRecord.id).select()

      data = result.data
      bookAnswerError = result.error
    } else {
      console.log("[v0] Inserting new record")
      const result = await adminClient.from("book_answers").insert(dataToSave).select()

      data = result.data
      bookAnswerError = result.error
    }

    if (bookAnswerError) {
      console.error("[v0] Error saving to book_answers:", bookAnswerError)

      if (bookAnswerError.code === "23503") {
        if (bookAnswerError.message.includes("company_id")) {
          return {
            success: false,
            error: `Erro: A empresa (${resolvedCompanyId}) não está cadastrada corretamente no sistema. Entre em contato com o administrador para criar o registro da empresa na tabela 'companies'.`,
          }
        }
        if (bookAnswerError.message.includes("holding_id")) {
          return {
            success: false,
            error: `Erro: A holding (${sanitizedHoldingId}) não existe no sistema. Entre em contato com o administrador.`,
          }
        }
        return {
          success: false,
          error: `Erro de configuração: ${bookAnswerError.details || "Verifique se sua empresa está corretamente cadastrada."}`,
        }
      }

      if (bookAnswerError.code === "23505") {
        return {
          success: false,
          error: "Esta resposta já foi registrada. Tente atualizar a página.",
        }
      }

      throw bookAnswerError
    }

  console.log("[v0] Successfully saved answer:", data)
  
  // Revalidate both questionnaire and meus-cadernos pages to update counts
  revalidatePath(`/dashboard/questionnaire/${templateId}`)
  revalidatePath("/dashboard/meus-cadernos")
  
  return { success: true, data }
  } catch (error) {
    console.error("[v0] Unexpected error saving response:", error)
    return { success: false, error: "Erro ao salvar resposta. Tente novamente." }
  }
}

interface DeleteAnswerParams {
  answerId: string
  templateId: string
  questionId: string
  deletedByUserId: string
  reason?: string
}

export async function deleteUserAnswer({
  answerId,
  templateId,
  questionId,
  deletedByUserId,
  reason,
}: DeleteAnswerParams) {
  try {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      return {
        success: false,
        error: "Usuário não autenticado",
      }
    }

    // Verificar se o usuário é gestor
    if (profile.role !== "gestor") {
      return {
        success: false,
        error: "Apenas gestores podem deletar respostas",
      }
    }

    const adminClient = createAdminClient()

    // Buscar a resposta antes de deletar para salvar no histórico
    const { data: answerData, error: fetchError } = await adminClient
      .from("book_answers")
      .select("*, profiles!inner(full_name, email)")
      .eq("id", answerId)
      .single()

    if (fetchError || !answerData) {
      return {
        success: false,
        error: "Resposta não encontrada",
      }
    }

    // Salvar no histórico de deletados
    const { error: historyError } = await adminClient.from("deleted_answers_history").insert({
      answer_id: answerId,
      template_id: templateId,
      question_id: questionId,
      user_id: answerData.user_id,
      company_id: answerData.company_id,
      holding_id: answerData.holding_id,
      value: answerData.value,
      value_jsonb: answerData.value_jsonb,
      evidence_url: answerData.evidence_url,
      status: answerData.status,
      deleted_by: deletedByUserId,
      deleted_at: new Date().toISOString(),
      deletion_reason: reason || null,
      original_created_at: answerData.created_at,
      original_updated_at: answerData.updated_at,
    })

    if (historyError) {
      console.error("[v0] Error saving to history:", historyError)
      return {
        success: false,
        error: "Erro ao salvar no histórico de deletados",
      }
    }

    // Deletar a resposta
    const { error: deleteError } = await adminClient.from("book_answers").delete().eq("id", answerId)

    if (deleteError) {
      console.error("[v0] Error deleting answer:", deleteError)
      return {
        success: false,
        error: "Erro ao deletar resposta",
      }
    }

    // Revalidar páginas
    revalidatePath(`/dashboard/questionnaire/${templateId}`)
    revalidatePath("/dashboard/meus-cadernos")
    revalidatePath("/dashboard/historico")

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting answer:", error)
    return { success: false, error: "Erro ao deletar resposta. Tente novamente." }
  }
}

export async function getDeletedAnswersHistory(templateId?: string) {
  try {
    const profile = await getCurrentUserProfile()

    if (!profile) {
      return {
        success: false,
        error: "Usuário não autenticado",
      }
    }

    // Verificar se o usuário é gestor
    if (profile.role !== "gestor") {
      return {
        success: false,
        error: "Apenas gestores podem visualizar o histórico",
      }
    }

    const adminClient = createAdminClient()

    let query = adminClient
      .from("deleted_answers_history")
      .select(
        `
        *,
        deleted_by_profile:profiles!deleted_answers_history_deleted_by_fkey(full_name, email),
        user_profile:profiles!deleted_answers_history_user_id_fkey(full_name, email),
        question:questions(label, unique_identifier),
        template:book_templates(name)
      `
      )
      .order("deleted_at", { ascending: false })

    if (templateId) {
      query = query.eq("template_id", templateId)
    }

    const { data, error } = await query

    if (error) {
      console.error("[v0] Error fetching deleted history:", error)
      return {
        success: false,
        error: "Erro ao buscar histórico",
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error("[v0] Unexpected error fetching history:", error)
    return { success: false, error: "Erro ao buscar histórico. Tente novamente." }
  }
}
