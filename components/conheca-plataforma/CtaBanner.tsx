import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaBanner() {
  return (
    <section className="relative overflow-hidden border-t border-zinc-200/60 dark:border-zinc-800/60 py-20 md:py-28">
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(52,211,153,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Horizontal light line top */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-px w-1/2 -translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500/25 to-transparent"
      />

      <div className="relative mx-auto max-w-2xl px-6 text-center">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
          Dê o próximo passo
        </p>
        <h2 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-white sm:text-4xl">
          Pronto para elevar o nível das suas práticas ESG?
        </h2>
        <p className="mb-8 text-base leading-relaxed text-zinc-600 dark:text-zinc-400">
          Fale com nosso time e veja como a B.KICK se encaixa na sua realidade — sem enrolação.
        </p>

        <Link href="/solicitar-demonstracao">
          <Button
            size="lg"
            className="gap-2 rounded-lg bg-emerald-500 px-8 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-900/20 transition-all hover:bg-emerald-400 hover:shadow-[0_0_32px_rgba(52,211,153,0.35)]"
          >
            Agendar uma Demonstração
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </section>
  )
}
