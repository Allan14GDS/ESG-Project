"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { verifyAdminOrGestor, verifyOrganizationAccess } from "@/lib/auth-utils"
import { revalidatePath } from "next/cache"

export async function resetUserPassword(userId: string, newPassword: string) {
  try {
    // Security: Verify caller is admin or gestor
    const authCheck = await verifyAdminOrGestor()
    if (!authCheck.authorized) {
      return {
        success: false,
        message: `Acesso negado: ${authCheck.error}`,
      }
    }

    const adminClient = createAdminClient()

    const { data: profile } = await adminClient
      .from("profiles")
      .select("email, full_name, organization_id")
      .eq("id", userId)
      .single()

    if (!profile) {
      return {
        success: false,
        message: "Usuário não encontrado",
      }
    }

    if (authCheck.profile?.role === "holding_admin" && profile.organization_id) {
      const orgAccess = await verifyOrganizationAccess(profile.organization_id)
      if (!orgAccess.authorized) {
        return {
          success: false,
          message: "Você não tem permissão para gerenciar usuários desta organização",
        }
      }
    }

    // Try to update the password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
      password: newPassword,
    })

    // If user doesn't exist in auth, create them
    if (updateError && updateError.message.includes("User not found")) {
      const { data: authUser, error: createError } = await adminClient.auth.admin.createUser({
        email: profile.email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: profile.full_name || profile.email,
        },
      })

      if (createError) {
        return {
          success: false,
          message: `Erro ao criar conta de autenticação: ${createError.message}`,
        }
      }

      revalidatePath("/admin/users")

      return {
        success: true,
        message: "Conta criada e senha definida com sucesso",
      }
    }

    if (updateError) {
      return {
        success: false,
        message: `Erro ao atualizar senha: ${updateError.message}`,
      }
    }

    revalidatePath("/admin/users")

    return {
      success: true,
      message: "Senha atualizada com sucesso",
    }
  } catch (error) {
    console.error("[v0] Password update exception:", error)
    return {
      success: false,
      message: "Erro ao processar atualização de senha",
    }
  }
}

export async function deleteUser(userId: string) {
  try {
    // Security: Verify caller is admin or gestor
    const authCheck = await verifyAdminOrGestor()
    if (!authCheck.authorized) {
      return {
        success: false,
        message: `Acesso negado: ${authCheck.error}`,
      }
    }

    const adminClient = createAdminClient()

    // Get user profile info
    const { data: profile } = await adminClient
      .from("profiles")
      .select("email, full_name, organization_id, role")
      .eq("id", userId)
      .single()

    if (!profile) {
      return {
        success: false,
        message: "Usuário não encontrado",
      }
    }

    if (profile.role === "admin_main") {
      return {
        success: false,
        message: "Não é possível remover o administrador principal",
      }
    }

    if (authCheck.profile?.role === "holding_admin" && profile.organization_id) {
      const orgAccess = await verifyOrganizationAccess(profile.organization_id)
      if (!orgAccess.authorized) {
        return {
          success: false,
          message: "Você não tem permissão para remover usuários desta organização",
        }
      }
    }

    if (authCheck.profile?.role === "holding_admin") {
      if (profile.role === "holding_admin" || profile.role === "admin_main") {
        return {
          success: false,
          message: "Gestores não podem remover outros gestores ou administradores",
        }
      }
    }

    // Delete from Supabase Auth first
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (authDeleteError) {
      console.error("[v0] Error deleting auth user:", authDeleteError)
      // Continue even if auth deletion fails (user might not exist in auth)
    }

    // Delete from profiles table
    const { error: profileDeleteError } = await adminClient.from("profiles").delete().eq("id", userId)

    if (profileDeleteError) {
      return {
        success: false,
        message: `Erro ao remover usuário: ${profileDeleteError.message}`,
      }
    }

    revalidatePath("/admin/users")

    return {
      success: true,
      message: "Usuário removido com sucesso",
    }
  } catch (error) {
    console.error("[v0] Delete user exception:", error)
    return {
      success: false,
      message: "Erro ao processar remoção de usuário",
    }
  }
}
