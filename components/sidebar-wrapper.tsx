"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [userEmail, setUserEmail] = useState<string>("")
  const [userName, setUserName] = useState<string>("")
  const [userRole, setUserRole] = useState<"user" | "holding_admin" | "admin_main">("user")
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)

  const shouldHideSidebar =
    pathname.startsWith("/auth") ||
    pathname.startsWith("/signin") ||
    pathname.startsWith("/register") ||
    pathname === "/" // Hide sidebar on homepage

  useEffect(() => {
    setIsMounted(true)
    const abortController = new AbortController()

    async function fetchUserData() {
      try {
        const response = await fetch("/api/profile", {
          signal: abortController.signal,
        })

        if (abortController.signal.aborted) return

        if (!response.ok) {
          setIsLoading(false)
          return
        }

        const data = await response.json()

        if (abortController.signal.aborted) return

        setUserEmail(data.email || "")
        setUserName(data.full_name || data.email?.split("@")[0] || "Usuário")
        setUserRole(data.role || "user")
      } catch (error: any) {
        if (!abortController.signal.aborted) {
          console.error("[v0] Error fetching user data:", error?.message || error)
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
  }, [])

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
      <AppSidebar userEmail={userEmail} userName={userName} userRole={userRole} />
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
