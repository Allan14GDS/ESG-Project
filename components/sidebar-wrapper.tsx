"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { isDemoMode, DEMO_USER } from "@/lib/demo-mode"

function SidebarWrapperInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const selectedYear = Number(searchParams.get("year")) || new Date().getFullYear()
  const [userEmail, setUserEmail] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [userRole, setUserRole] = useState<"user" | "holding_admin" | "admin_main">("user")
  const [overallProgress, setOverallProgress] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  const shouldHideSidebar =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/register") ||
    pathname === "/" ||
    pathname.startsWith("/solicitar-demonstracao") ||
    pathname.startsWith("/conheca-a-plataforma")

  useEffect(() => {
    setIsMounted(true)
    const abortController = new AbortController()

    async function fetchUserData() {
      // In demo mode, use demo user data
      if (isDemoMode()) {
        console.log("[v0] Demo mode active - using demo user")
        setUserEmail(DEMO_USER.email)
        setUserName(DEMO_USER.full_name)
        setUserRole(DEMO_USER.role)
        setOverallProgress(0)
        setIsLoading(false)
        return
      }

      try {
        const [profileResponse, progressResponse] = await Promise.all([
          fetch("/api/profile", { signal: abortController.signal }),
          fetch(`/api/progress?year=${selectedYear}`, { signal: abortController.signal }),
        ])

        if (abortController.signal.aborted) return

        if (profileResponse.ok) {
          const data = await profileResponse.json()
          if (!abortController.signal.aborted) {
            setUserEmail(data.email || "")
            setUserName(data.full_name || data.email?.split("@")[0] || "Usuário")
            setUserRole(data.role || "user")
          }
        }

        if (progressResponse.ok) {
          const progressData = await progressResponse.json()
          if (!abortController.signal.aborted) {
            setOverallProgress(progressData.percentage ?? 0)
          }
        }
      } catch (error: any) {
        if (!abortController.signal.aborted) {
          console.error("[v0] Error fetching sidebar data:", error?.message || error)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchUserData()

    return () => {
      abortController.abort()
    }
  }, [pathname, selectedYear])

  // Show children immediately for pages that should hide sidebar to avoid hydration issues
  if (shouldHideSidebar) {
    return <>{children}</>
  }

  // Prevent hydration mismatch by showing consistent content during SSR
  if (!isMounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Carregando...</div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar userEmail={userEmail} userName={userName} userRole={userRole} overallProgress={overallProgress} />
      <SidebarInset>
        <div className="flex items-center justify-between border-b p-4 md:hidden">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <h1 className="text-lg font-semibold">B.kick</h1>
          </div>
        </div>
        <main className="flex-1 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div>Carregando...</div>
        </div>
      }
    >
      <SidebarWrapperInner>{children}</SidebarWrapperInner>
    </Suspense>
  )
}
