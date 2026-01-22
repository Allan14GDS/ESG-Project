"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function deleteHolding(holdingId: string) {
  try {
    const adminClient = createAdminClient()

    // Delete the organization (holding) from the database
    const { error } = await adminClient.from("organizations").delete().eq("id", holdingId)

    if (error) {
      console.error("[v0] Error deleting holding:", error)
      return { success: false, error: error.message }
    }

    // Revalidate the holdings page to reflect the changes
    revalidatePath("/admin/holdings")

    return { success: true }
  } catch (error) {
    console.error("[v0] Unexpected error deleting holding:", error)
    return { success: false, error: "Erro inesperado ao excluir holding" }
  }
}
