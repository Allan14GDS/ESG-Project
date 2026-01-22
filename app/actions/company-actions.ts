"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function assignTemplateToCompany(companyId: string, templateId: string) {
  const adminClient = createAdminClient()

  const { data: existing, error: checkError } = await adminClient
    .from("company_templates")
    .select("id, active")
    .eq("company_id", companyId)
    .eq("template_id", templateId)
    .maybeSingle()

  if (checkError) {
    console.error("[v0] Error checking existing template:", checkError)
    throw new Error(`Failed to check template: ${checkError.message}`)
  }

  // If already assigned and active, skip
  if (existing && existing.active) {
    console.log("[v0] Template already assigned and active, skipping")
    return { success: true, alreadyAssigned: true }
  }

  // If assigned but inactive, reactivate it
  if (existing && !existing.active) {
    console.log("[v0] Reactivating inactive template")
    const { error: updateError } = await adminClient
      .from("company_templates")
      .update({ active: true, assigned_at: new Date().toISOString() })
      .eq("id", existing.id)

    if (updateError) {
      console.error("[v0] Error reactivating template:", updateError)
      throw new Error(`Failed to reactivate template: ${updateError.message}`)
    }

    return { success: true, reactivated: true }
  }

  // Otherwise, insert new assignment
  const { error } = await adminClient.from("company_templates").insert({
    company_id: companyId,
    template_id: templateId,
    active: true,
    assigned_at: new Date().toISOString(),
  })

  if (error) {
    console.error("[v0] Error assigning template:", error)
    throw new Error(`Failed to assign template: ${error.message}`)
  }

  return { success: true }
}
