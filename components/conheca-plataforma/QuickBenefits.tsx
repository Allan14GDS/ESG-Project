import { Building2, BookOpen, TrendingUp } from "lucide-react"

const benefits = [
  {
    icon: Building2,
    title: "Gestão Multi-Holdings",
    description:
      "Administre múltiplas holdings e empresas em um único painel centralizado, com visão consolidada de progresso por grupo.",
  },
  {
    icon: BookOpen,
    title: "Cadernos e Questões GRI",
    description:
      "Organize seus cadernos de divulgação GRI por empresa, responsável e prazo — com mais de 2.000 questões mapeadas.",
  },
  {
    icon: TrendingUp,
    title: "Acompanhamento em Tempo Real",
    description:
      "Monitore taxa de conclusão, respostas pendentes e o progresso geral da rodada ESG sem abrir planilhas.",
  },
]

export function QuickBenefits() {
  return (
    <section
      className="py-14 md:py-16"
      style={{ background: "hsl(220, 28%, 16%)" }}
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
            Por que a B.KICK
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            Tudo que sua equipe ESG precisa, em um só lugar
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {benefits.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl bg-white/5 border border-white/10 p-6 hover:bg-white/[0.07] transition-colors"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Icon className="h-5 w-5 text-emerald-400" />
              </div>
              <h3 className="mb-1.5 text-sm font-semibold text-white">{title}</h3>
              <p className="text-sm leading-relaxed text-white/55">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
