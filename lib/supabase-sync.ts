import { createClient } from "@/lib/supabase/client"

export interface GRIDisclosureDB {
  id: string
  title: string
  category: string
  status: string
  progress: number
  assigned_to: string | null
  reviewer: string | null
  deadline: string | null
  created_at: string
  updated_at: string
}

export interface GRIResponseDB {
  id: string
  disclosure_id: string
  question_id: string
  question_text: string
  response_value: string | null
  response_type: string
  evidence_urls: string[]
  version: number
  created_at: string
  updated_at: string
}

export interface GRIResponseHistoryDB {
  id: string
  response_id: string
  disclosure_id: string
  question_id: string
  old_value: string | null
  new_value: string | null
  changed_by: string | null
  change_type: "created" | "updated" | "deleted"
  created_at: string
}

export class SupabaseSyncService {
  private supabase = createClient()

  async syncDisclosure(disclosure: {
    id: string
    title: string
    category: string
    status: string
    progress: number
    assignedTo?: string
    reviewer?: string
    deadline?: Date
  }) {
    const { data, error } = await this.supabase
      .from("gri_disclosures")
      .upsert({
        id: disclosure.id,
        title: disclosure.title,
        category: disclosure.category,
        status: disclosure.status,
        progress: disclosure.progress,
        assigned_to: disclosure.assignedTo || null,
        reviewer: disclosure.reviewer || null,
        deadline: disclosure.deadline?.toISOString() || null,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error syncing disclosure:", error)
      throw error
    }

    return data
  }

  async saveResponse(
    disclosureId: string,
    questionId: string,
    questionText: string,
    responseValue: string,
    responseType: string,
    evidenceUrls: string[] = [],
  ) {
    // Buscar resposta existente
    const { data: existing } = await this.supabase
      .from("gri_responses")
      .select("*")
      .eq("disclosure_id", disclosureId)
      .eq("question_id", questionId)
      .order("version", { ascending: false })
      .limit(1)
      .single()

    const newVersion = existing ? existing.version + 1 : 1

    // Inserir nova versão da resposta
    const { data: newResponse, error: responseError } = await this.supabase
      .from("gri_responses")
      .insert({
        disclosure_id: disclosureId,
        question_id: questionId,
        question_text: questionText,
        response_value: responseValue,
        response_type: responseType,
        evidence_urls: evidenceUrls,
        version: newVersion,
      })
      .select()
      .single()

    if (responseError) {
      console.error("[v0] Error saving response:", responseError)
      throw responseError
    }

    // Criar registro de histórico
    if (existing) {
      await this.supabase.from("gri_response_history").insert({
        response_id: newResponse.id,
        disclosure_id: disclosureId,
        question_id: questionId,
        old_value: existing.response_value,
        new_value: responseValue,
        changed_by: "admin", // TODO: usar usuário real quando implementar auth
        change_type: "updated",
      })
    } else {
      await this.supabase.from("gri_response_history").insert({
        response_id: newResponse.id,
        disclosure_id: disclosureId,
        question_id: questionId,
        old_value: null,
        new_value: responseValue,
        changed_by: "admin",
        change_type: "created",
      })
    }

    return newResponse
  }

  async getResponses(disclosureId: string) {
    const { data, error } = await this.supabase
      .from("gri_responses")
      .select("*")
      .eq("disclosure_id", disclosureId)
      .order("question_id")

    if (error) {
      console.error("[v0] Error fetching responses:", error)
      throw error
    }

    // Agrupar por question_id e pegar a versão mais recente
    const latestResponses = data.reduce(
      (acc, response) => {
        const existing = acc[response.question_id]
        if (!existing || response.version > existing.version) {
          acc[response.question_id] = response
        }
        return acc
      },
      {} as Record<string, GRIResponseDB>,
    )

    return Object.values(latestResponses)
  }

  async getResponseHistory(disclosureId: string, questionId: string) {
    const { data, error } = await this.supabase
      .from("gri_response_history")
      .select("*")
      .eq("disclosure_id", disclosureId)
      .eq("question_id", questionId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error fetching history:", error)
      throw error
    }

    return data
  }

  async getAllDisclosures() {
    const { data, error } = await this.supabase.from("gri_disclosures").select("*").order("id")

    if (error) {
      console.error("[v0] Error fetching disclosures:", error)
      throw error
    }

    return data
  }

  async updateDisclosureStatus(disclosureId: string, status: string, progress: number) {
    const { data, error } = await this.supabase
      .from("gri_disclosures")
      .update({ status, progress })
      .eq("id", disclosureId)
      .select()
      .single()

    if (error) {
      console.error("[v0] Error updating disclosure status:", error)
      throw error
    }

    return data
  }
}

export const supabaseSyncService = new SupabaseSyncService()
