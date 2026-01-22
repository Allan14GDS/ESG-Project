import type React from "react"
import type { Metadata } from "next"
import { Suspense } from "react"
import "./globals.css"
import { SidebarWrapper } from "@/components/sidebar-wrapper"

export const metadata: Metadata = {
  title: "GRI 2 ESG - Plataforma de Relatórios ESG",
  description: "Plataforma completa para coleta de dados e geração de relatórios ESG conforme padrões GRI 2021",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="font-sans">
        <SidebarWrapper>
          <Suspense fallback={<div>Carregando...</div>}>{children}</Suspense>
        </SidebarWrapper>
      </body>
    </html>
  )
}
