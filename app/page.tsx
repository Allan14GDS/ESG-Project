"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { isDemoMode } from "@/lib/demo-mode"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      // In demo mode, redirect to dashboard directly
      if (isDemoMode()) {
        console.log("[v0] Demo mode active - redirecting to dashboard")
        router.push("/dashboard/meus-cadernos")
        return
      }

      try {
        const supabase = createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (session) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", session.user.id)
            .single()

          const userRole = profile?.role

          // Redirect admin_main to admin panel, everyone else (including holding_admin) to meus-cadernos
          if (userRole === "admin_main") {
            router.push("/admin")
          } else {
            router.push("/dashboard/meus-cadernos")
          }
        } else {
          // If not authenticated, redirect to login
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("[v0] Root page auth check error:", error)
        router.push("/auth/login")
      }
    }

    checkAuthAndRedirect()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-muted-foreground">Carregando...</div>
    </div>
  )
}
