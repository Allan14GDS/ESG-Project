"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

interface CreateCompanyParams {
  holdingId: string
  companyName: string
  companyCnpj: string
}

export async function createCompany({ holdingId, companyName, companyCnpj }: CreateCompanyParams) {
  console.log("[v0] Creating company for holding:", holdingId)

  try {
    const adminClient = createAdminClient()

    console.log("[v0] Creating company in database...")
    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .insert({
        holding_id: holdingId,
        name: companyName,
        cnpj: companyCnpj,
      })
      .select()
      .single()

    if (companyError) {
      console.error("[v0] Company creation error:", companyError)
      throw new Error(`Failed to create company: ${companyError.message}`)
    }

    console.log("[v0] ✓ Company created:", company.id)

    revalidatePath(`/admin/holdings/${holdingId}`)

    return { data: company }
  } catch (error: any) {
    console.error("[v0] Error in createCompany:", error)
    return { error: error.message || "Unknown error occurred" }
  }
}
