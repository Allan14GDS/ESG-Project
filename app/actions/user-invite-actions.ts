"use server"

import { adminClient } from "@/lib/supabase/admin"
import { verifyAdminOrGestor, getUserOrganizationIds } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"

export async function inviteUser(email: string, role: string, fullName?: string, targetOrganizationId?: string) {
  // Security: Verify caller is admin or gestor
  const authCheck = await verifyAdminOrGestor()
  if (!authCheck.authorized) {
    return {
      success: false,
      error: `Acesso negado: ${authCheck.error}`,
    }
  }

  const callerRole = authCheck.profile!.role

  // Admin can create any role except another admin_main
  if (callerRole === "admin_main" && role === "admin_main") {
    return {
      success: false,
      error: "Não é possível criar outro administrador principal",
    }
  }

  // Gestor (holding_admin) can only create: holding_admin, user, revisor
  if (callerRole === "holding_admin") {
    const allowedRoles = ["holding_admin", "user", "revisor"]
    if (!allowedRoles.includes(role)) {
      return {
        success: false,
        error: `Gestores só podem criar usuários com os perfis: ${allowedRoles.join(", ")}`,
      }
    }
  }

  console.log("[v0] Starting user invite for:", email, "with role:", role, "by:", callerRole)

  try {
    // Generate a temporary password (user will need to reset it)
    const tempPassword = Math.random().toString(36).slice(-12) + "Aa1!"

    // Step 1: Create user in auth.users using admin client with auto-confirmed email
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName || email.split("@")[0],
      },
    })

    if (authError) {
      console.error("[v0] Auth user creation error:", authError)
      return {
        success: false,
        error: `Erro ao criar usuário: ${authError.message}`,
      }
    }

    if (!authData.user) {
      console.error("[v0] No user returned from createUser")
      return {
        success: false,
        error: "Falha ao criar usuário no sistema de autenticação",
      }
    }

    console.log("[v0] User created in auth.users:", authData.user.id)

    // Step 2: Insert profile in public.profiles
    const { error: profileError } = await adminClient.from("profiles").insert({
      id: authData.user.id,
      email: email,
      full_name: fullName || email.split("@")[0],
      role: role,
      is_active: true,
      organization_id: targetOrganizationId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })

    if (profileError) {
      console.error("[v0] Profile creation error:", profileError)

      // Rollback: delete the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      console.log("[v0] Rolled back auth user creation")

      return {
        success: false,
        error: `Erro ao criar perfil: ${profileError.message}`,
      }
    }

    if (callerRole === "holding_admin" && authCheck.profile) {
      const gestorOrgIds = await getUserOrganizationIds(authCheck.profile.id)

      if (gestorOrgIds.length > 0) {
        // Add user to the same organizations as the gestor
        for (const orgId of gestorOrgIds) {
          await adminClient.from("organization_members").insert({
            user_id: authData.user.id,
            organization_id: orgId,
            role_in_org: role === "holding_admin" ? "manager" : "member",
          })
        }
      }
    }

    console.log("[v0] Profile created successfully for user:", authData.user.id)

    // Revalidate the users list page
    revalidatePath("/admin/users")

    return {
      success: true,
      message: `Usuário ${email} criado com sucesso! Uma senha temporária foi gerada.`,
      tempPassword,
    }
  } catch (error) {
    console.error("[v0] Unexpected error in inviteUser:", error)
    return {
      success: false,
      error: "Erro inesperado ao criar usuário",
    }
  }
}
