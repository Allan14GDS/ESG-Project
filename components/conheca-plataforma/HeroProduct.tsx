"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroProduct() {
  return (
    <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-20">
      {/* Radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 5%, oklch(0.73 0.19 161 / 0.09) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Text block */}
        <div className="mx-auto max-w-xl text-center mb-12">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-emerald-400">
            <Sparkles className="w-3 h-3" />
            Plataforma GRI ESG
          </span>

          <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Sua Central de Comando ESG,{" "}
            <span className="text-emerald-400">Simplificada.</span>
          </h1>

          <p className="mt-4 text-base leading-relaxed text-white/55">
            Centralize dados, gerencie sua cadeia de valor e gere relatórios GRI com a
            plataforma mais intuitiva do mercado.
          </p>

          <div className="mt-7 flex justify-center">
            <Link href="/solicitar-demonstracao">
              <Button
                size="lg"
                className="bg-emerald-500 hover:bg-emerald-400 text-[#161d3c] font-semibold gap-2 rounded-full px-7 text-sm"
              >
                Solicitar Demonstração
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex items-center justify-center gap-10 border-t border-white/10 pt-6">
            {[
              { value: "16+", label: "Empresas" },
              { value: "60+", label: "Cadernos GRI" },
              { value: "5.900+", label: "Respostas" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-xl font-bold text-white">{stat.value}</p>
                <p className="text-[11px] text-white/45 mt-0.5 uppercase tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Screenshot */}
        <div className="relative mx-auto max-w-4xl">
          <div className="absolute -inset-3 rounded-2xl bg-gradient-to-b from-emerald-500/8 to-transparent blur-2xl pointer-events-none" />
          <Image
            src="/assets/screenshots/dashboard.png"
            alt="Dashboard principal da plataforma B.KICK"
            width={1400}
            height={875}
            className="relative w-full h-auto rounded-xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
            quality={95}
            priority
          />
        </div>
      </div>
    </section>
  )
}
