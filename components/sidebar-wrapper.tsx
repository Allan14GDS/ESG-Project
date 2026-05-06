"use client"

import type React from "react"
import { Suspense, useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { isDemoMode, DEMO_USER } from "@/lib/demo-mode"

// ─── Inner component (needs Suspense boundary for useSearchParams) ─────────────

function SidebarWrapperInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams()
  const selectedYear = Number(searchParams.get("year")) || new Date().getFullYear()

  const [userEmail, setUserEmail] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [userRole, setUserRole] = useState<"user" | "holding_admin" | "admin_main">("user")
  const [overallProgress, setOverallProgress] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const abortController = new AbortController()

    async function fetchUserData() {
      if (isDemoMode()) {
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
          const data: { email?: string; full_name?: string; role?: "user" | "holding_admin" | "admin_main" } =
            await profileResponse.json()
          if (!abortController.signal.aborted) {
            setUserEmail(data.email ?? "")
            setUserName(data.full_name ?? data.email?.split("@")[0] ?? "Usuário")
            setUserRole(data.role ?? "user")
          }
        }

        if (progressResponse.ok) {
          const progressData: { percentage?: number } = await progressResponse.json()
          if (!abortController.signal.aborted) {
            setOverallProgress(progressData.percentage ?? 0)
          }
        }
      } catch (error: unknown) {
        if (!abortController.signal.aborted) {
          const message = error instanceof Error ? error.message : String(error)
          console.error("[v0] Error fetching sidebar data:", message)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    fetchUserData()
    return () => abortController.abort()
  }, [selectedYear])

  if (!isMounted || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div>Carregando...</div>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar
        userEmail={userEmail}
        userName={userName}
        userRole={userRole}
        overallProgress={overallProgress}
      />
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

// ─── Public export ────────────────────────────────────────────────────────────
// Used exclusively by authenticated route layouts (dashboard, admin, holding,
// company). Public routes live in app/(public)/ and never import this.

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
