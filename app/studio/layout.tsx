import type React from "react"

// Isolated layout for Sanity Studio — full-screen, no sidebar, no shared chrome.
// The root app/layout.tsx provides only html/body/fonts; nothing else wraps this.
export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
