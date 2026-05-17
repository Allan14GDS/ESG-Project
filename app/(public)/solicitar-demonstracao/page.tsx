"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Loader2,
  Shield,
  FileCheck,
  Lock,
  Leaf,
  BarChart3,
  CheckCircle2,
  Building2,
} from "lucide-react"
import Header from "@/components/Header"

// ── Constants ──────────────────────────────────────────────────────────────

const PERSONAL_DOMAINS = [
  "gmail.com","hotmail.com","yahoo.com","outlook.com","icloud.com",
  "live.com","bol.com.br","uol.com.br","terra.com.br","ig.com.br","msn.com",
]

const TRUST_SEALS = [
  { Icon: Shield,    label: "Adequado à LGPD",    sub: "Certificado"       },
  { Icon: FileCheck, label: "Relatórios GRI/SASB", sub: "Preparado"        },
  { Icon: Lock,      label: "Criptografia E2E",    sub: "Habilitada"       },
  { Icon: BarChart3, label: "ISO 27001",            sub: "Em conformidade"  },
  { Icon: Leaf,      label: "ESG-Ready",            sub: "Plataforma"       },
]

const CLIENT_LOGOS = [
  "RodOil", "Syngenta Brasil", "V.tal", "Rift Distribuidora",
  "Cargo Petro", "HRZ Transmissoras", "Lots Group", "Newexpo", "Ravato",
]

const FOOTER_LINKS: Record<string, string[]> = {
  Produto:  ["Cadernos ESG", "Dashboards", "Fluxos", "Relatórios GRI", "Integrações"],
  Soluções: ["Para Corporações", "Para Investidores", "Para Consultorias", "API & Dados"],
  Empresa:  ["Sobre nós", "Carreiras", "Blog", "Imprensa", "Contato"],
  Legal:    ["Privacidade", "Termos de Uso", "LGPD", "Segurança", "DPA"],
}

// ── Helpers ────────────────────────────────────────────────────────────────

function isPersonalEmail(email: string) {
  const domain = email.split("@")[1]?.toLowerCase()
  return !!domain && PERSONAL_DOMAINS.includes(domain)
}

function inputCls(focused: boolean, error = false) {
  const base =
    "w-full px-3 py-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none transition-all duration-200"
  if (error)
    return `${base} border-red-500/70 ring-2 ring-red-500/20`
  if (focused)
    return `${base} border-emerald-500/70 ring-2 ring-emerald-500/20`
  return `${base} border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600`
}

function FormField({
  label, id, children, error,
}: {
  label: string; id: string; children: React.ReactNode; error?: string
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function SolicitarDemonstracaoPage() {
  const [form, setForm] = useState({
    nome: "", email: "", empresa: "", cargo: "", objetivo: "",
  })
  const [emailError, setEmailError] = useState("")
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (name === "email") {
      setEmailError(value && isPersonalEmail(value)
        ? "Por favor, insira seu e-mail corporativo."
        : "")
    }
  }

  function handleFocus(name: string) { setFocusedField(name) }
  function handleBlur()              { setFocusedField(null)  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (emailError || isPersonalEmail(form.email)) return
    setIsSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    setIsSubmitting(false)
    setSubmitted(true)
  }

  const anyFocus = focusedField !== null

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white">

      <Header />

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main>
        <div
          className={`mx-auto max-w-7xl px-6 py-16 transition-all duration-300 lg:py-24 ${
            anyFocus ? "brightness-[0.97]" : ""
          }`}
        >
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-20">

            {/* ── Left column ──────────────────────────────────────────── */}
            <div className="lg:pt-4">
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Solicitar Demonstração
              </p>

              <h1 className="mb-6 text-4xl font-bold leading-[1.1] tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
                Agende uma conversa<br className="hidden sm:block" />
                {" "}com nosso time
              </h1>

              <p className="mb-10 max-w-md text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Preencha o formulário ao lado e nossa equipe entrará em contato
                para entender o contexto da sua empresa e mostrar como o B.KICK
                pode apoiar sua jornada ESG.
              </p>

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

              {/* What happens in the demo */}
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                O que acontece na demo?
              </p>
              <ul className="mb-10 space-y-3">
                {[
                  "Entendemos rapidamente o contexto e a maturidade ESG da sua empresa.",
                  "Mostramos cadernos, fluxos e dashboards adaptados ao seu dia a dia.",
                  "Tiramos dúvidas sobre integrações, times envolvidos e próximos passos.",
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    <span className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mb-8 border-t border-zinc-200 dark:border-zinc-800" />

              {/* Client logos */}
              <p className="mb-5 text-xs uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
                Empresas que confiam no B.KICK
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                {CLIENT_LOGOS.map(name => (
                  <span
                    key={name}
                    className="cursor-default font-black text-sm uppercase tracking-wider text-zinc-500 dark:text-zinc-600 transition-colors duration-200 hover:text-zinc-800 dark:hover:text-zinc-300"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>

            {/* ── Right column — Form card ──────────────────────────────── */}
            <div
              className={`relative rounded-xl border bg-white dark:bg-zinc-900 p-8 shadow-2xl transition-all duration-300 ${
                anyFocus
                  ? "border-zinc-300 dark:border-zinc-700 shadow-emerald-100/60 dark:shadow-emerald-950/40"
                  : "border-zinc-200 dark:border-zinc-800"
              }`}
            >
              {submitted ? (
                /* Success state */
                <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
                  <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                    <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
                    Recebemos sua solicitação!
                  </h2>
                  <p className="max-w-xs text-sm text-zinc-600 dark:text-zinc-400">
                    Nossa equipe entrará em contato em até{" "}
                    <strong className="text-white">1 dia útil</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setSubmitted(false)
                      setForm({ nome: "", email: "", empresa: "", cargo: "", objetivo: "" })
                    }}
                    className="mt-2 text-xs text-zinc-500 underline underline-offset-2 transition-colors hover:text-white"
                  >
                    Enviar outra solicitação
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                      Fale com nosso time
                    </h2>
                    <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                      Resposta garantida em até 1 dia útil.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Nome completo" id="nome">
                      <input
                        id="nome" name="nome" type="text"
                        placeholder="Como prefere ser chamado(a)"
                        value={form.nome}
                        onChange={handleChange}
                        onFocus={() => handleFocus("nome")}
                        onBlur={handleBlur}
                        required
                        className={inputCls(focusedField === "nome")}
                      />
                    </FormField>

                    <FormField label="E-mail corporativo" id="email" error={emailError}>
                      <input
                        id="email" name="email" type="email"
                        placeholder="voce@empresa.com"
                        value={form.email}
                        onChange={handleChange}
                        onFocus={() => handleFocus("email")}
                        onBlur={handleBlur}
                        required
                        className={inputCls(focusedField === "email", !!emailError)}
                      />
                    </FormField>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Empresa" id="empresa">
                      <input
                        id="empresa" name="empresa" type="text"
                        placeholder="Nome da empresa"
                        value={form.empresa}
                        onChange={handleChange}
                        onFocus={() => handleFocus("empresa")}
                        onBlur={handleBlur}
                        required
                        className={inputCls(focusedField === "empresa")}
                      />
                    </FormField>

                    <FormField label="Cargo / função" id="cargo">
                      <input
                        id="cargo" name="cargo" type="text"
                        placeholder="Ex.: Coord. de Sustentabilidade"
                        value={form.cargo}
                        onChange={handleChange}
                        onFocus={() => handleFocus("cargo")}
                        onBlur={handleBlur}
                        className={inputCls(focusedField === "cargo")}
                      />
                    </FormField>
                  </div>

                  <FormField
                    label="Qual o principal objetivo com a solução?"
                    id="objetivo"
                  >
                    <textarea
                      id="objetivo" name="objetivo"
                      placeholder="Conte rapidamente qual dor você quer resolver (ex.: organizar dados para GRI, demandas de investidores, etc.)"
                      value={form.objetivo}
                      onChange={handleChange}
                      onFocus={() => handleFocus("objetivo")}
                      onBlur={handleBlur}
                      rows={4}
                      className={`${inputCls(focusedField === "objetivo")} resize-none`}
                    />
                  </FormField>

                  {/* CTA button with alien glow */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !!emailError}
                    className="group relative w-full overflow-hidden rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-zinc-950 transition-all duration-200 hover:bg-emerald-400 hover:shadow-[0_0_28px_rgba(52,211,153,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          Solicitar demonstração
                          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </span>
                  </button>

                  <p className="text-center text-xs text-zinc-500 dark:text-zinc-600">
                    Ao enviar, você concorda com nossa{" "}
                    <Link
                      href="#"
                      className="text-zinc-600 dark:text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-900 dark:hover:text-white"
                    >
                      Política de Privacidade
                    </Link>
                    .
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Trust Bar ───────────────────────────────────────────────── */}
        <div className="border-y border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/50">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6 py-4">
            <span className="text-xs font-medium text-zinc-500">
              Protegemos seus dados.
            </span>
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
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
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
                A plataforma de gestão ESG para empresas que levam
                sustentabilidade a sério.
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
            <p className="text-xs text-zinc-500 dark:text-zinc-600">
              © 2026 B.KICK. Todos os direitos reservados.
            </p>
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
