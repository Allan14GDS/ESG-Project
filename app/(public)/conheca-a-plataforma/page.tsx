import Link from "next/link"
import { Shield, FileCheck, Lock, Leaf, BarChart3 } from "lucide-react"
import Header from "@/components/Header"
import { HeroProduct } from "@/components/conheca-plataforma/HeroProduct"
import { QuickBenefits } from "@/components/conheca-plataforma/QuickBenefits"
import { FeatureBlock } from "@/components/conheca-plataforma/FeatureBlock"
import { CtaBanner } from "@/components/conheca-plataforma/CtaBanner"

export const metadata = {
  title: "Conheça a Plataforma | B.KICK ESG",
  description:
    "Descubra como a B.KICK simplifica a gestão ESG, o controle de cadernos GRI e a geração de relatórios para holdings e empresas.",
}

const TRUST_SEALS = [
  { Icon: Shield,    label: "Adequado à LGPD",    sub: "Certificado"      },
  { Icon: FileCheck, label: "Relatórios GRI/SASB", sub: "Preparado"       },
  { Icon: Lock,      label: "Criptografia E2E",    sub: "Habilitada"      },
  { Icon: BarChart3, label: "ISO 27001",            sub: "Em conformidade" },
  { Icon: Leaf,      label: "ESG-Ready",            sub: "Plataforma"      },
]

const FOOTER_LINKS: Record<string, string[]> = {
  Produto:  ["Cadernos ESG", "Dashboards", "Fluxos", "Relatórios GRI", "Integrações"],
  Soluções: ["Para Corporações", "Para Investidores", "Para Consultorias", "API & Dados"],
  Empresa:  ["Sobre nós", "Carreiras", "Blog", "Imprensa", "Contato"],
  Legal:    ["Privacidade", "Termos de Uso", "LGPD", "Segurança", "DPA"],
}

export default function ConhecaAPlataformaPage() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">

      <Header />

      <main id="funcionalidades">
        <HeroProduct />

        <QuickBenefits />

        <FeatureBlock
          badge="Controle Operacional"
          title="Visão Kanban para Status Operacional"
          description="Acompanhe o andamento de cada rodada de relatórios em um quadro visual e intuitivo. Saiba exatamente onde cada caderno está — do início à validação final."
          bullets={[
            "Colunas de status: Não Iniciado, Rascunho, Submetido, Devolvido e Validado",
            "Filtros por categoria, responsável e busca por título do caderno",
            "Taxa de conclusão geral com indicador de progresso visual",
            "Acesso rápido ao caderno GRI diretamente pelo card",
          ]}
          imageSrc="/assets/screenshots/kanban-status.png"
          imageAlt="Painel de Status Operacional com progresso da rodada 2025"
          secondImageSrc="/assets/screenshots/kanban-board.png"
          secondImageAlt="Quadro Kanban de Disclosures GRI com colunas de status"
        />

        <FeatureBlock
          badge="Geração de Relatórios"
          title="Exportação Descomplicada"
          description="Gere relatórios PDF completos com as seções GRI que você precisa. Selecione, revise o status de cada seção e exporte com um clique."
          bullets={[
            "Seleção granular: Sumário Executivo, Disclosures GRI, Dados de Funcionários e mais",
            "Resumo do status de preenchimento antes de exportar",
            "Formatos disponíveis: PDF Completo, Excel e outros",
            "Compatível com o padrão GRI 2021",
          ]}
          imageSrc="/assets/screenshots/export.png"
          imageAlt="Tela de exportação de relatório ESG com seções GRI selecionáveis na plataforma B.KICK"
          reversed
        />

        <CtaBanner />
      </main>

      {/* ── Trust Bar ─────────────────────────────────────────────────────── */}
      <div className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-4">
          <span className="text-xs font-medium text-zinc-500">Protegemos seus dados.</span>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {TRUST_SEALS.map(({ Icon, label, sub }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
                <span className="text-xs text-zinc-500 dark:text-zinc-600">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-6">

            {/* Brand column */}
            <div className="col-span-2">
              <Link href="/" className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500">
                  <Leaf className="h-4 w-4 text-zinc-950" />
                </div>
                <span className="font-bold tracking-tight text-zinc-900 dark:text-white">B.KICK</span>
              </Link>
              <p className="mb-6 max-w-xs text-sm leading-relaxed text-zinc-500">
                A plataforma de gestão ESG para empresas que levam sustentabilidade a sério.
              </p>
              <div className="flex items-center gap-2">
                {["X", "in", "gh", "yt"].map(s => (
                  <a
                    key={s}
                    href="#"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-900 dark:hover:text-white"
                  >
                    {s}
                  </a>
                ))}
              </div>
            </div>

            {/* Link columns */}
            {Object.entries(FOOTER_LINKS).map(([col, links]) => (
              <div key={col}>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-900 dark:text-white">
                  {col}
                </h3>
                <ul className="space-y-2.5">
                  {links.map(link => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-white"
                      >
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Footer bottom bar */}
        <div className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-4 sm:flex-row">
            <p className="text-xs text-zinc-500 dark:text-zinc-600">© 2026 B.KICK. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              {["Termos", "Privacidade", "Segurança"].map(l => (
                <a
                  key={l}
                  href="#"
                  className="text-xs text-zinc-500 dark:text-zinc-600 transition-colors hover:text-zinc-700 dark:hover:text-zinc-400"
                >
                  {l}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
