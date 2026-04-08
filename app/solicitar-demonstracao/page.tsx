"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const demoHighlights = [
  "Entendemos rapidamente o contexto da sua empresa e maturidade em ESG.",
  "Mostramos como os cadernos, fluxos e dashboards se encaixam no seu dia a dia.",
  "Tiramos dúvidas sobre integrações, times envolvidos e próximos passos.",
]

export default function SolicitarDemonstracaoPage() {
  const { toast } = useToast()

  const [form, setForm] = useState({
    nome: "",
    email: "",
    empresa: "",
    cargo: "",
    objetivo: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)

    // Placeholder — connect to a Server Action or API route here
    await new Promise((r) => setTimeout(r, 800))

    toast({
      title: "Interesse enviado!",
      description: "Nossa equipe entrará em contato em até 1 dia útil.",
    })

    setForm({ nome: "", email: "", empresa: "", cargo: "", objetivo: "" })
    setIsSubmitting(false)
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(135deg, hsl(220, 30%, 12%) 0%, hsl(220, 28%, 16%) 40%, hsl(180, 20%, 14%) 70%, hsl(153, 25%, 14%) 100%)",
      }}
    >
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-10"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para a página inicial
        </Link>

        {/* Header */}
        <div className="mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
            Solicitar Demonstração
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white leading-tight">
            Agende uma conversa com nosso time
          </h1>
          <p className="mt-3 text-base text-white/50 leading-relaxed">
            Preencha os dados abaixo e entraremos em contato para entender o contexto da sua
            empresa e mostrar como a B.Kick pode apoiar sua jornada ESG.
          </p>
        </div>

        {/* Form card */}
        <div
          className="rounded-2xl border border-white/10 p-6 sm:p-8 mb-6"
          style={{ background: "hsl(220, 28%, 16%)" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <CalendarDays className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Dados de contato</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="nome" className="text-xs text-white/60">
                  Nome completo
                </Label>
                <Input
                  id="nome"
                  name="nome"
                  placeholder="Como gostaria de ser chamado(a)"
                  value={form.nome}
                  onChange={handleChange}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs text-white/60">
                  E-mail corporativo
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="voce@empresa.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="empresa" className="text-xs text-white/60">
                  Empresa
                </Label>
                <Input
                  id="empresa"
                  name="empresa"
                  placeholder="Nome da empresa"
                  value={form.empresa}
                  onChange={handleChange}
                  required
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cargo" className="text-xs text-white/60">
                  Cargo / função
                </Label>
                <Input
                  id="cargo"
                  name="cargo"
                  placeholder="Ex.: Coord. de Sustentabilidade"
                  value={form.cargo}
                  onChange={handleChange}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="objetivo" className="text-xs text-white/60">
                Qual o principal objetivo com a solução?
              </Label>
              <Textarea
                id="objetivo"
                name="objetivo"
                placeholder="Conte rapidamente qual dor você quer resolver (ex.: organizar dados para GRI, demandas de investidores, etc.)"
                value={form.objetivo}
                onChange={handleChange}
                rows={4}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500/50 resize-none"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1">
              <p className="text-xs text-white/40">
                Ao enviar, nossa equipe entra em contato em até{" "}
                <span className="text-white/60 font-medium">1 dia útil</span>.
              </p>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold gap-2 shrink-0 disabled:opacity-60"
              >
                {isSubmitting ? "Enviando..." : "Enviar interesse"}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </Button>
            </div>
          </form>
        </div>

        {/* What happens in the demo card */}
        <div
          className="rounded-2xl border border-white/10 p-6 sm:p-8"
          style={{ background: "hsl(220, 28%, 16%)" }}
        >
          <h2 className="text-base font-semibold text-white mb-5">O que acontece na demo?</h2>

          <ul className="space-y-3 mb-6">
            {demoHighlights.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
                <span className="text-sm text-white/70 leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 flex items-start gap-3">
            <Clock className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-0.5">
                Tempo médio de reunião
              </p>
              <p className="text-sm text-white/70">30–45 minutos, totalmente remoto.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
