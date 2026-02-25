"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { createAdminClient } from "@/lib/supabase/admin"

export type UserRole = "admin_main" | "holding_admin" | "company_admin" | "revisor" | "user" | "responder"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  is_active: boolean
  organization_id: string | null
  is_super_admin?: boolean
}

export interface SecurityCheckResult {
  authorized: boolean
  profile: UserProfile | null
  error?: string
}

export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return null
  }

  // Use adminClient to bypass RLS policies
  const adminClient = createAdminClient()
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("[v0] Error fetching profile in auth-utils:", profileError)
  }

  return profile
}

export async function verifyUserRole(allowedRoles: UserRole[]): Promise<SecurityCheckResult> {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return { authorized: false, profile: null, error: "User not authenticated" }
  }

  if (!profile.is_active) {
    return { authorized: false, profile, error: "User account is deactivated" }
  }

  if (!allowedRoles.includes(profile.role)) {
    return { authorized: false, profile, error: `Access denied. Required roles: ${allowedRoles.join(", ")}` }
  }

  return { authorized: true, profile }
}

export async function verifyAdminOrGestor(): Promise<SecurityCheckResult> {
  return verifyUserRole(["admin_main", "holding_admin"])
}

export async function verifyAdminOnly(): Promise<SecurityCheckResult> {
  return verifyUserRole(["admin_main"])
}

export async function verifyOrganizationAccess(organizationId: string): Promise<SecurityCheckResult> {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    return { authorized: false, profile: null, error: "User not authenticated" }
  }

  if (!profile.is_active) {
    return { authorized: false, profile, error: "User account is deactivated" }
  }

  // Admin has access to all organizations
  if (profile.role === "admin_main") {
    return { authorized: true, profile }
  }

  // For holding_admin, check if they have access to this organization
  if (profile.role === "holding_admin") {
    const orgIds = await getUserOrganizationIds(profile.id)

    // Check if the organizationId is in their allowed list
    if (orgIds.includes(organizationId)) {
      return { authorized: true, profile }
    }

    // Also check if organizationId is a company under their holding
    const adminClient = createAdminClient()
    const { data: org } = await adminClient.from("organizations").select("holding_id").eq("id", organizationId).single()

    if (org && orgIds.includes(org.holding_id)) {
      return { authorized: true, profile }
    }
  }

  return { authorized: false, profile, error: "Access denied to this organization" }
}

export async function requireAdmin() {
  const result = await verifyAdminOnly()

  if (!result.authorized) {
    if (!result.profile) {
      redirect("/auth/login")
    }
    redirect("/dashboard")
  }

  return result.profile!
}

export async function requireGestor() {
  const result = await verifyAdminOrGestor()

  if (!result.authorized) {
    if (!result.profile) {
      redirect("/auth/login")
    }
    redirect("/dashboard")
  }

  return result.profile!
}

export async function requireAuth() {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    redirect("/auth/login")
  }

  return profile
}

export async function getUserOrganizationIds(userId: string): Promise<string[]> {
  const adminClient = createAdminClient()

  const { data: memberships } = await adminClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)

  return memberships?.map((m) => m.organization_id) || []
}
