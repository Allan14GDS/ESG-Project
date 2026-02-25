import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { getAdminClient } from "@/lib/supabase/admin"

async function getProfileWithRetry(userId: string, maxRetries = 3) {
  let lastError: any = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[v0] Admin layout - Attempt ${attempt}/${maxRetries} to fetch profile for user:`, userId)

      const adminClient = getAdminClient()
      const { data: profile, error } = await adminClient
        .from("profiles")
        .select("role, is_active")
        .eq("id", userId)
        .single()

      if (error) {
        console.log(`[v0] Admin layout - Attempt ${attempt} error:`, error)
        lastError = error

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 500))
          continue
        }
      }

      return { profile, error }
    } catch (err) {
      console.log(`[v0] Admin layout - Attempt ${attempt} caught error:`, err)
      lastError = err

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500))
        continue
      }
    }
  }

  return { profile: null, error: lastError }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { profile, error } = await getProfileWithRetry(user.id)

  console.log("[v0] Admin layout - Final profile check:", { userId: user.id, profile, error })

  // Check if user has admin access
  if (!profile || !profile.is_active) {
    console.log("[v0] Admin layout - Redirecting to dashboard: profile not found or inactive")
    redirect("/dashboard/meus-cadernos")
  }

  const hasAdminAccess = profile.role === "admin_main" || profile.role === "holding_admin"

  if (!hasAdminAccess) {
    console.log("[v0] Admin layout - Redirecting to dashboard: no admin access", { role: profile.role })
    redirect("/dashboard/meus-cadernos")
  }

  console.log("[v0] Admin layout - Access granted", { role: profile.role })

  return <>{children}</>
}
