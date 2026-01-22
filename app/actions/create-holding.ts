"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

interface CreateHoldingParams {
  name: string
  cnpj?: string
}

export async function createHolding({ name, cnpj }: CreateHoldingParams): Promise<{ data?: any; error?: string }> {
  console.log("[v0] Creating holding:", name)

  try {
    const supabaseAdmin = createAdminClient()

    const cleanCnpj = cnpj?.replace(/\D/g, "")

    if (cleanCnpj && cleanCnpj.length !== 14) {
      return { error: "CNPJ deve ter exatamente 14 dígitos" }
    }

    const { data: existingHolding } = await supabaseAdmin
      .from("organizations")
      .select("id, name, cnpj")
      .eq("cnpj", cleanCnpj)
      .maybeSingle()

    if (existingHolding) {
      return { error: `Já existe uma holding cadastrada com este CNPJ: ${existingHolding.name}` }
    }

    console.log("[v0] Creating holding entry...")
    const { data: organizationData, error: organizationError } = await supabaseAdmin
      .from("organizations")
      .insert({
        name: name.trim(),
        cnpj: cleanCnpj || null,
        holding_id: null, // This is a holding itself, so no parent
      })
      .select()
      .single()

    if (organizationError) {
      console.error("[v0] Error creating holding:", organizationError)
      return { error: organizationError.message }
    }

    console.log("[v0] Holding created successfully:", organizationData.id)

    revalidatePath("/admin/holdings")

    return { data: organizationData }
  } catch (error: any) {
    console.error("[v0] Unexpected error in createHolding:", error)
    return { error: error.message || "Erro inesperado ao criar holding" }
  }
}
