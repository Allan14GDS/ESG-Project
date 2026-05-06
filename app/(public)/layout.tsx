import type React from "react"

// Layout for public/marketing routes — no sidebar, no authentication required.
// Routes: /, /auth/*, /register/*, /signin, /solicitar-demonstracao,
//          /conheca-a-plataforma, /blog/*
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
