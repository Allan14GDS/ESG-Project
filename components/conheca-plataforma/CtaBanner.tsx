import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaBanner() {
  return (
    <section className="relative border-t border-white/[0.07] py-16 md:py-24 overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, oklch(0.73 0.19 161 / 0.10) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-xl px-4 sm:px-6 lg:px-8 text-center">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-emerald-400">
          Dê o próximo passo
        </p>
        <h2 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
          Pronto para elevar o nível das suas práticas ESG?
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-white/55">
          Fale com nosso time e veja como a B.KICK se encaixa na sua realidade — sem enrolação.
        </p>
        <div className="mt-7">
          <Link href="/solicitar-demonstracao">
            <Button
              size="lg"
              className="bg-emerald-500 hover:bg-emerald-400 text-[#161d3c] font-bold gap-2 rounded-full px-8 text-sm shadow-lg shadow-emerald-900/30 transition-all"
            >
              Agendar uma Demonstração
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
