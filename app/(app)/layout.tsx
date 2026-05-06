import type React from "react"
import { SidebarWrapper } from "@/components/sidebar-wrapper"

// Layout for miscellaneous authenticated app routes that are not covered by
// more specific group layouts (dashboard, admin, holding, company).
export default function AppGroupLayout({ children }: { children: React.ReactNode }) {
  return <SidebarWrapper>{children}</SidebarWrapper>
}
