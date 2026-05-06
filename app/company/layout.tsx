import type React from "react"
import { SidebarWrapper } from "@/components/sidebar-wrapper"

export default function CompanyLayout({ children }: { children: React.ReactNode }) {
  return <SidebarWrapper>{children}</SidebarWrapper>
}
