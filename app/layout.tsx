import type React from "react"
import type { Metadata } from "next"
import { Inter, Space_Grotesk } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

// ─── Fonts ────────────────────────────────────────────────────────────────────

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
})

// ─── Metadata ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: "GRI 2 ESG - Plataforma de Relatórios ESG",
  description: "Plataforma completa para coleta de dados e geração de relatórios ESG conforme padrões GRI 2021",
  generator: "v0.app",
}

// ─── Root Layout ──────────────────────────────────────────────────────────────
// Responsabilidade única: html/body/fonts/globals.css.
//
// A navegação (SidebarWrapper) é adicionada pelos layouts dos grupos filhos:
//   • app/(public)/layout.tsx  → sem sidebar (marketing, auth, blog)
//   • app/dashboard/layout.tsx → com SidebarWrapper
//   • app/admin/layout.tsx     → com SidebarWrapper + guard de autenticação
//   • app/holding/layout.tsx   → com SidebarWrapper
//   • app/company/layout.tsx   → com SidebarWrapper
//   • app/studio/layout.tsx    → sem sidebar (Sanity Studio em ecrã completo)

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
