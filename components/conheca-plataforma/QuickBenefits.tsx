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
    <section className="border-t border-zinc-200/60 dark:border-zinc-800/60 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
            Por que a B.KICK
          </p>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-3xl">
            Tudo que sua equipe ESG precisa, em um só lugar
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Card 1 — Featured (spans 2 cols) */}
          <div className="group relative overflow-hidden rounded-xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 p-7 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/30 md:col-span-2">
            {/* Subtle corner glow on hover */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/5 blur-2xl transition-opacity duration-500 group-hover:opacity-100 opacity-0"
            />

            <div className="relative mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
              <Building2 className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-white">
              {benefits[0].title}
            </h3>
            <p className="max-w-sm text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {benefits[0].description}
            </p>

            {/* Decorative metric pill */}
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Visão consolidada por grupo</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 p-7 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/20">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/5 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            />

            <div className="relative mb-5 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
              <BookOpen className="h-5 w-5 text-emerald-400" />
            </div>
            <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-white">
              {benefits[1].title}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {benefits[1].description}
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800/80 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">+2.000 questões mapeadas</span>
            </div>
          </div>

          {/* Card 3 — Full width horizontal */}
          <div className="group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-7 transition-all duration-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-900 hover:shadow-xl hover:shadow-black/10 dark:hover:shadow-black/20 md:col-span-3">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-px w-1/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent"
            />

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-5">
                <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="mb-2 text-base font-semibold text-zinc-900 dark:text-white">
                    {benefits[2].title}
                  </h3>
                  <p className="max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {benefits[2].description}
                  </p>
                </div>
              </div>

              {/* Progress indicator decoration */}
              <div className="shrink-0 flex flex-col gap-2 sm:min-w-[160px]">
                {[
                  { label: "Concluídas", pct: 72 },
                  { label: "Em Andamento", pct: 18 },
                  { label: "Pendentes", pct: 10 },
                ].map(({ label, pct }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-500/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-24 text-right text-[11px] text-zinc-500">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
