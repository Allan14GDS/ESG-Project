"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function updateHolding(holdingId: string, name: string, cnpj: string) {
  try {
    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from("organizations")
      .update({
        name,
        cnpj: cnpj || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", holdingId)

    if (error) {
      console.error("Error updating holding:", error)
      return { success: false, error: error.message }
    }

    revalidatePath("/admin/holdings")
    return { success: true }
  } catch (error) {
    console.error("Error updating holding:", error)
    return { success: false, error: "Erro ao atualizar holding" }
  }
}
