import type React from "react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Authentication is handled by middleware
  // No need to duplicate auth checks here
  return <>{children}</>
}
