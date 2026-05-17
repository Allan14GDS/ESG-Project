"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const CLIENT_LOGOS = [
  "RodOil", "Syngenta Brasil", "V.tal", "Rift", "Cargo Petro", "HRZ", "Lots Group",
]

export function HeroProduct() {
  return (
    <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 65% 10%, rgba(52,211,153,0.07) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">

          {/* ── Left column ──────────────────────────────────────────── */}
          <div className="lg:pt-4">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Conheça a Plataforma
            </p>

            <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
              Sua Central de Comando ESG,{" "}
              <span className="text-emerald-400">Simplificada.</span>
            </h1>

            <p className="mb-10 max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
              Centralize dados, gerencie sua cadeia de valor e gere relatórios GRI com a
              plataforma mais intuitiva do mercado.
            </p>

            {/* Stats */}
            <div className="mb-10 flex items-center gap-10 border-b border-zinc-200 dark:border-zinc-800 pb-8">
              {[
                { value: "16+",    label: "Empresas"      },
                { value: "60+",    label: "Cadernos GRI"  },
                { value: "5.900+", label: "Respostas"     },
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
                  <p className="mt-0.5 text-[11px] uppercase tracking-wide text-zinc-500">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <blockquote className="mb-10 border-l-2 border-emerald-500 pl-5">
              <p className="mb-4 text-base leading-relaxed text-zinc-800 dark:text-white/90 italic">
                "O B.KICK reduziu o tempo de coleta dos nossos dados de
                sustentabilidade em 70%. Hoje, o nosso relatório GRI sai em
                dias, não em meses."
              </p>
              <footer className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">Líder de Sustentabilidade</p>
                  <p className="text-xs text-zinc-500">
                    Multinacional do Setor Industrial (Cliente B.KICK)
                  </p>
                </div>
              </footer>
            </blockquote>

            <div className="mb-8 border-t border-zinc-200 dark:border-zinc-800" />

            {/* Client logos */}
            <p className="mb-5 text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
              Empresas que confiam no B.KICK
            </p>
            <div className="mb-10 flex flex-wrap items-center gap-x-6 gap-y-3">
              {CLIENT_LOGOS.map(name => (
                <span
                  key={name}
                  className="cursor-default text-sm font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-600 transition-colors duration-200 hover:text-zinc-800 dark:hover:text-zinc-300"
                >
                  {name}
                </span>
              ))}
            </div>

            {/* CTA */}
            <Link href="/solicitar-demonstracao">
              <Button
                size="lg"
                className="gap-2 rounded-lg bg-emerald-500 px-7 text-sm font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:shadow-[0_0_28px_rgba(52,211,153,0.35)]"
              >
                Solicitar Demonstração
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* ── Right column — Dashboard card ─────────────────────────── */}
          <div className="relative">
            {/* Emerald halo */}
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-6 rounded-3xl"
              style={{
                background:
                  "radial-gradient(ellipse 85% 65% at 50% 50%, rgba(52,211,153,0.11) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />

            {/* Floating card */}
            <div className="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 p-3 shadow-2xl shadow-black/20 dark:shadow-black/70 ring-1 ring-black/[0.04] dark:ring-white/[0.04]">
              {/* Window chrome */}
              <div className="mb-3 flex items-center gap-1.5 px-1">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-700" />
                <div className="ml-2 flex h-5 flex-1 items-center rounded-md bg-zinc-200 dark:bg-zinc-800/80 px-3">
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-600">
                    app.bkick.com.br/dashboard
                  </span>
                </div>
              </div>

              <Image
                src="/assets/screenshots/dashboard.png"
                alt="Dashboard principal da plataforma B.KICK"
                width={1400}
                height={875}
                className="h-auto w-full rounded-lg"
                quality={95}
                priority
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
