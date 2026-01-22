"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { verifyAdminOrGestor, getUserOrganizationIds } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"

interface AssignUserParams {
  templateId: string
  userId: string
  role: string
  createdBy: string
}

export async function assignUserToTemplate({ templateId, userId, role, createdBy }: AssignUserParams) {
  const authCheck = await verifyAdminOrGestor()
  if (!authCheck.authorized) {
    return {
      success: false,
      error: `Acesso negado: ${authCheck.error}`,
    }
  }

  const adminClient = createAdminClient()

  try {
    if (authCheck.profile?.role === "holding_admin") {
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single()

      if (targetProfile?.organization_id) {
        const callerOrgIds = await getUserOrganizationIds(authCheck.profile.id)
        if (!callerOrgIds.includes(targetProfile.organization_id)) {
          return {
            success: false,
            error: "Você não tem permissão para atribuir cadernos a usuários de outras organizações.",
          }
        }
      }
    }

    // Check if assignment already exists
    const { data: existingAssignment } = await adminClient
      .from("book_assignments")
      .select("id")
      .eq("caderno_id", templateId)
      .eq("user_id", userId)
      .maybeSingle()

    let skippedCount = 0

    if (existingAssignment) {
      skippedCount = 1
      return {
        success: false,
        error: "Este usuário já está atribuído a este caderno.",
      }
    }

    // Create new assignment
    const { data, error } = await adminClient
      .from("book_assignments")
      .insert({
        caderno_id: templateId,
        user_id: userId,
        role: role,
        created_by: createdBy,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating assignment:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath("/dashboard/cadernos-gestao")

    return {
      success: true,
      data,
      skipped: skippedCount,
    }
  } catch (error) {
    console.error("[v0] Error in assignUserToTemplate:", error)
    return {
      success: false,
      error: "Erro interno ao criar atribuição.",
    }
  }
}

export async function removeAssignment(assignmentId: string) {
  const authCheck = await verifyAdminOrGestor()
  if (!authCheck.authorized) {
    return {
      success: false,
      error: `Acesso negado: ${authCheck.error}`,
    }
  }

  const adminClient = createAdminClient()

  try {
    if (authCheck.profile?.role === "holding_admin") {
      const { data: assignment } = await adminClient
        .from("book_assignments")
        .select("organization_id, user_id")
        .eq("id", assignmentId)
        .single()

      if (assignment?.organization_id) {
        const callerOrgIds = await getUserOrganizationIds(authCheck.profile.id)
        if (!callerOrgIds.includes(assignment.organization_id)) {
          return {
            success: false,
            error: "Você não tem permissão para remover atribuições de outras organizações.",
          }
        }
      }
    }

    const { error } = await adminClient.from("book_assignments").delete().eq("id", assignmentId)

    if (error) {
      console.error("[v0] Error removing assignment:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath("/dashboard/cadernos-gestao")

    return {
      success: true,
    }
  } catch (error) {
    console.error("[v0] Error in removeAssignment:", error)
    return {
      success: false,
      error: "Erro interno ao remover atribuição.",
    }
  }
}

export async function getAssignmentsForUser(userId: string) {
  const adminClient = createAdminClient()

  try {
    const { data, error } = await adminClient
      .from("book_assignments")
      .select(`
        id,
        caderno_id,
        role,
        created_at,
        book_templates:caderno_id (
          id,
          name,
          description,
          type
        )
      `)
      .eq("user_id", userId)

    if (error) {
      console.error("[v0] Error fetching assignments for user:", error)
      return {
        success: false,
        error: error.message,
        data: [],
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error("[v0] Error in getAssignmentsForUser:", error)
    return {
      success: false,
      error: "Erro interno ao buscar atribuições.",
      data: [],
    }
  }
}

interface AssignMultipleParams {
  userId: string
  templateIds: string[]
  role: string
  createdBy: string
  organizationId: string | null
  companyId?: string | null
}

export async function assignUserToMultipleTemplates({
  userId,
  templateIds,
  role,
  createdBy,
  organizationId,
  companyId,
}: AssignMultipleParams) {
  const authCheck = await verifyAdminOrGestor()
  if (!authCheck.authorized) {
    return {
      success: false,
      error: `Acesso negado: ${authCheck.error}`,
    }
  }

  const adminClient = createAdminClient()

  try {
    if (authCheck.profile?.role === "holding_admin") {
      const { data: targetProfile } = await adminClient
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single()

      if (targetProfile?.organization_id) {
        const callerOrgIds = await getUserOrganizationIds(authCheck.profile.id)
        if (!callerOrgIds.includes(targetProfile.organization_id)) {
          return {
            success: false,
            error: "Você não tem permissão para atribuir cadernos a usuários de outras organizações.",
          }
        }
      }
    }

    // Check for existing assignments - considering BOTH caderno_id AND company_id
    // Same template can be assigned to different companies
    const { data: existingAssignments } = await adminClient
      .from("book_assignments")
      .select("caderno_id, company_id")
      .eq("user_id", userId)
      .in("caderno_id", templateIds)

    // Filter out templates that are already assigned to THIS SPECIFIC COMPANY
    const existingCombinations = existingAssignments?.map((a) => `${a.caderno_id}-${a.company_id}`) || []
    const newTemplateIds = templateIds.filter((id) => !existingCombinations.includes(`${id}-${companyId}`))

    const skippedCount = templateIds.length - newTemplateIds.length

    if (newTemplateIds.length === 0) {
      return {
        success: false,
        error: "Todos os cadernos selecionados já estão atribuídos a este usuário nesta empresa.",
        duplicates: templateIds.length,
      }
    }

    // Create new assignments
    const assignmentsToInsert = newTemplateIds.map((templateId) => ({
      caderno_id: templateId,
      user_id: userId,
      role: role,
      created_by: createdBy,
      organization_id: organizationId,
      company_id: companyId,
    }))

    const { data, error } = await adminClient.from("book_assignments").insert(assignmentsToInsert).select()

    if (error) {
      console.error("[v0] Error creating assignments:", error)
      return {
        success: false,
        error: error.message,
      }
    }

    revalidatePath("/dashboard/cadernos-gestao")

    return {
      success: true,
      data,
      skipped: skippedCount,
    }
  } catch (error) {
    console.error("[v0] Error in assignUserToMultipleTemplates:", error)
    return {
      success: false,
      error: "Erro interno ao criar atribuições.",
    }
  }
}
