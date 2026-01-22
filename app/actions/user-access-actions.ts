"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function updateUserAccess(
  userId: string,
  access: {
    holdingIds: string[]
    companyIds: string[]
  },
) {
  try {
    const adminClient = createAdminClient()

    // Delete existing organization memberships
    const { error: deleteError } = await adminClient.from("organization_members").delete().eq("user_id", userId)

    if (deleteError) {
      throw new Error(`Failed to delete organization memberships: ${deleteError.message}`)
    }

    // Insert new organization memberships
    if (access.holdingIds.length > 0) {
      const newMemberships = access.holdingIds.map((holdingId) => ({
        user_id: userId,
        organization_id: holdingId,
      }))

      const { error: insertError } = await adminClient.from("organization_members").insert(newMemberships)

      if (insertError) {
        throw new Error(`Failed to insert organization memberships: ${insertError.message}`)
      }
    }

    // AUTO-CREATE BOOK_ASSIGNMENTS for all holdings
    // This ensures gestores can see cadernos immediately after being assigned to a holding
    if (access.holdingIds.length > 0) {
      console.log("[v0] Auto-creating book_assignments for holdings:", access.holdingIds)

      // Get all templates (cadernos)
      const { data: allTemplates } = await adminClient
        .from("book_templates")
        .select("id")

      if (allTemplates && allTemplates.length > 0) {
        // Delete existing book_assignments for this user
        await adminClient
          .from("book_assignments")
          .delete()
          .eq("user_id", userId)

        // Create book_assignments for each holding
        const assignmentsToCreate = []
        
        for (const holdingId of access.holdingIds) {
          // For each template, create an assignment for this holding
          for (const template of allTemplates) {
            assignmentsToCreate.push({
              user_id: userId,
              caderno_id: template.id,
              organization_id: holdingId,
              role: "contributor",
            })
          }
        }

        if (assignmentsToCreate.length > 0) {
          const { error: assignError } = await adminClient
            .from("book_assignments")
            .insert(assignmentsToCreate)

          if (assignError) {
            console.error("[v0] Error creating book_assignments:", assignError)
            // Don't throw - continue with success since org memberships were created
          } else {
            console.log(`[v0] Created ${assignmentsToCreate.length} book_assignments`)
          }
        }
      }
    }

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${userId}/access`)
    revalidatePath("/dashboard/meus-cadernos")

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in updateUserAccess:", error)
    return { success: false, error: error.message }
  }
}
