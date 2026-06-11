"use client"

import { cn } from "@/lib/utils"
import { ShieldCheck, ClipboardList, Target, CalendarDays, User, CheckCircle2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

export interface GapIsoState {
  conformidade: "C" | "PC" | "NC" | "NA" | null
  gap_identificado: string
  acao_necessaria: string
  prioridade: "A" | "M" | "B" | null
  responsavel: string
  prazo: string
}

export const GAP_ISO_EMPTY: GapIsoState = {
  conformidade: null,
  gap_identificado: "",
  acao_necessaria: "",
  prioridade: null,
  responsavel: "",
  prazo: "",
}

const CONFORMIDADE_OPTIONS = [
  {
    id: "C" as const,
    abbr: "C",
    label: "Conforme",
    description: "Requisito totalmente atendido",
    textColor: "text-emerald-400",
    activeBorder: "border-emerald-500/60",
    activeBg: "bg-emerald-500/10",
    glow: "shadow-[0_0_18px_rgba(16,185,129,0.22)]",
    dot: "bg-emerald-400",
    ring: "ring-emerald-500/40",
  },
  {
    id: "PC" as const,
    abbr: "PC",
    label: "Parcialmente",
    description: "Requisito parcialmente atendido",
    textColor: "text-amber-400",
    activeBorder: "border-amber-500/60",
    activeBg: "bg-amber-500/10",
    glow: "shadow-[0_0_18px_rgba(245,158,11,0.22)]",
    dot: "bg-amber-400",
    ring: "ring-amber-500/40",
  },
  {
    id: "NC" as const,
    abbr: "NC",
    label: "Não Conforme",
    description: "Requisito não atendido",
    textColor: "text-red-400",
    activeBorder: "border-red-500/60",
    activeBg: "bg-red-500/10",
    glow: "shadow-[0_0_18px_rgba(239,68,68,0.22)]",
    dot: "bg-red-400",
    ring: "ring-red-500/40",
  },
  {
    id: "NA" as const,
    abbr: "NA",
    label: "Não Aplicável",
    description: "Requisito não se aplica",
    textColor: "text-zinc-400",
    activeBorder: "border-zinc-500/40",
    activeBg: "bg-zinc-500/10",
    glow: "shadow-[0_0_12px_rgba(113,113,122,0.18)]",
    dot: "bg-zinc-500",
    ring: "ring-zinc-500/30",
  },
] as const

const PRIORIDADE_OPTIONS = [
  {
    id: "A" as const,
    label: "Alta",
    textColor: "text-red-400",
    activeBorder: "border-red-500/60",
    activeBg: "bg-red-500/10",
    glow: "shadow-[0_0_14px_rgba(239,68,68,0.22)]",
    ring: "ring-red-500/40",
  },
  {
    id: "M" as const,
    label: "Média",
    textColor: "text-amber-400",
    activeBorder: "border-amber-500/60",
    activeBg: "bg-amber-500/10",
    glow: "shadow-[0_0_14px_rgba(245,158,11,0.22)]",
    ring: "ring-amber-500/40",
  },
  {
    id: "B" as const,
    label: "Baixa",
    textColor: "text-sky-400",
    activeBorder: "border-sky-500/60",
    activeBg: "bg-sky-500/10",
    glow: "shadow-[0_0_14px_rgba(14,165,233,0.22)]",
    ring: "ring-sky-500/40",
  },
] as const

function GapSkeleton() {
  return (
    <div className="space-y-6 rounded-2xl border border-white/[0.06] bg-zinc-950/60 p-6 animate-pulse">
      <div className="flex items-center gap-2 pb-3 border-b border-white/[0.06]">
        <div className="h-4 w-4 rounded bg-zinc-800" />
        <div className="h-3 w-32 rounded bg-zinc-800" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-40 rounded bg-zinc-800/80" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-zinc-800/50 border border-zinc-700/30" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-36 rounded bg-zinc-800/80" />
        <div className="h-20 rounded-xl bg-zinc-800/50 border border-zinc-700/30" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-36 rounded bg-zinc-800/80" />
        <div className="h-20 rounded-xl bg-zinc-800/50 border border-zinc-700/30" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-44 rounded bg-zinc-800/80" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 flex-1 rounded-xl bg-zinc-800/50 border border-zinc-700/30" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-zinc-800/80" />
          <div className="h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/30" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-zinc-800/80" />
          <div className="h-10 rounded-xl bg-zinc-800/50 border border-zinc-700/30" />
        </div>
      </div>
    </div>
  )
}

interface GapAnalysisInputProps {
  questionId: string
  value: GapIsoState
  onChange: (questionId: string, update: Partial<GapIsoState>) => void
  disabled?: boolean
  isLoading?: boolean
}

export function GapAnalysisInput({
  questionId,
  value,
  onChange,
  disabled = false,
  isLoading = false,
}: GapAnalysisInputProps) {
  const set = (field: keyof GapIsoState, v: string | null) =>
    onChange(questionId, { [field]: v })

  if (isLoading) return <GapSkeleton />

  return (
    <div className="space-y-6 rounded-2xl border border-white/[0.06] bg-zinc-950/60 p-6 backdrop-blur-sm">
      {/* Section header */}
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
        <ShieldCheck className="h-4 w-4 text-zinc-500" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
          Gap Analysis ISO
        </span>
      </div>

      {/* ── 1. CONFORMIDADE ─────────────────────────────── */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-zinc-400 tabular-nums">
            1
          </span>
          Nível de Conformidade
          <span className="text-red-400 text-xs">obrigatório</span>
        </Label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CONFORMIDADE_OPTIONS.map((opt) => {
            const isSelected = value.conformidade === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => set("conformidade", isSelected ? null : opt.id)}
                className={cn(
                  "relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3.5 text-center",
                  "transition-all duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                  disabled && "cursor-not-allowed opacity-50",
                  isSelected
                    ? cn(
                        opt.activeBg,
                        opt.activeBorder,
                        opt.glow,
                        opt.textColor,
                        opt.ring,
                        "ring-1 font-semibold scale-[1.02]",
                      )
                    : "border-white/[0.08] bg-zinc-900/40 text-zinc-500 hover:border-white/[0.16] hover:bg-zinc-900/70 hover:text-zinc-300 hover:scale-[1.01]",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    isSelected ? opt.dot : "bg-zinc-700",
                  )}
                />
                <span className="text-sm font-bold leading-none">{opt.abbr}</span>
                <span className="text-[10px] leading-tight opacity-75">{opt.label}</span>
              </button>
            )
          })}
        </div>

        {value.conformidade && (
          <p className="animate-in fade-in-0 slide-in-from-top-1 pl-1 text-xs text-zinc-500 transition-all">
            {CONFORMIDADE_OPTIONS.find((o) => o.id === value.conformidade)?.description}
          </p>
        )}
      </div>

      {/* ── 2. GAP IDENTIFICADO ──────────────────────────── */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <ClipboardList className="h-4 w-4 text-zinc-500" />
          Gap Identificado
        </Label>
        <Textarea
          value={value.gap_identificado}
          onChange={(e) => set("gap_identificado", e.target.value)}
          placeholder="Descreva a lacuna identificada em relação ao requisito da norma..."
          rows={3}
          disabled={disabled}
          className={cn(
            "resize-none rounded-xl border-white/[0.08] bg-zinc-900/50 text-zinc-200",
            "placeholder:text-zinc-600 transition-colors duration-150",
            "focus:border-white/[0.2] focus:ring-0 focus-visible:ring-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
      </div>

      {/* ── 3. AÇÃO NECESSÁRIA ───────────────────────────── */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <Target className="h-4 w-4 text-zinc-500" />
          Ação Necessária
        </Label>
        <Textarea
          value={value.acao_necessaria}
          onChange={(e) => set("acao_necessaria", e.target.value)}
          placeholder="Descreva as ações corretivas ou preventivas para fechar o gap..."
          rows={3}
          disabled={disabled}
          className={cn(
            "resize-none rounded-xl border-white/[0.08] bg-zinc-900/50 text-zinc-200",
            "placeholder:text-zinc-600 transition-colors duration-150",
            "focus:border-white/[0.2] focus:ring-0 focus-visible:ring-0",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
      </div>

      {/* ── 4. PRIORIDADE ───────────────────────────────── */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-zinc-800 text-[10px] font-bold text-zinc-400 tabular-nums">
            2
          </span>
          Prioridade de Tratamento
        </Label>
        <div className="flex gap-2">
          {PRIORIDADE_OPTIONS.map((opt) => {
            const isSelected = value.prioridade === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => set("prioridade", isSelected ? null : opt.id)}
                className={cn(
                  "flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold",
                  "transition-all duration-200 ease-out",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0",
                  disabled && "cursor-not-allowed opacity-50",
                  isSelected
                    ? cn(
                        opt.activeBg,
                        opt.activeBorder,
                        opt.glow,
                        opt.textColor,
                        opt.ring,
                        "ring-1 scale-[1.02]",
                      )
                    : "border-white/[0.08] bg-zinc-900/40 text-zinc-500 hover:border-white/[0.16] hover:bg-zinc-900/70 hover:text-zinc-300",
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── 5. RESPONSÁVEL + PRAZO ───────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <User className="h-4 w-4 text-zinc-500" />
            Responsável
          </Label>
          <Input
            value={value.responsavel}
            onChange={(e) => set("responsavel", e.target.value)}
            placeholder="Nome ou área responsável..."
            disabled={disabled}
            className={cn(
              "rounded-xl border-white/[0.08] bg-zinc-900/50 text-zinc-200",
              "placeholder:text-zinc-600 transition-colors duration-150",
              "focus:border-white/[0.2] focus-visible:ring-0",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <CalendarDays className="h-4 w-4 text-zinc-500" />
            Prazo
          </Label>
          <Input
            type="date"
            value={value.prazo}
            onChange={(e) => set("prazo", e.target.value)}
            disabled={disabled}
            className={cn(
              "rounded-xl border-white/[0.08] bg-zinc-900/50 text-zinc-200",
              "transition-colors duration-150",
              "focus:border-white/[0.2] focus-visible:ring-0",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Read-only view (gestor) ──────────────────────────────── */

const CONFORMIDADE_BADGE: Record<string, { label: string; classes: string }> = {
  C: { label: "Conforme", classes: "bg-emerald-500/15 text-emerald-400 border-emerald-500/40" },
  PC: { label: "Parcialmente Conforme", classes: "bg-amber-500/15 text-amber-400 border-amber-500/40" },
  NC: { label: "Não Conforme", classes: "bg-red-500/15 text-red-400 border-red-500/40" },
  NA: { label: "Não Aplicável", classes: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30" },
}

const PRIORIDADE_BADGE: Record<string, { label: string; classes: string }> = {
  A: { label: "Alta", classes: "bg-red-500/15 text-red-400 border-red-500/40" },
  M: { label: "Média", classes: "bg-amber-500/15 text-amber-400 border-amber-500/40" },
  B: { label: "Baixa", classes: "bg-sky-500/15 text-sky-400 border-sky-500/40" },
}

interface GapAnalysisReadOnlyProps {
  value: Record<string, any>
}

export function GapAnalysisReadOnly({ value }: GapAnalysisReadOnlyProps) {
  const conformidade = value?.conformidade as string | null
  const prioridade = value?.prioridade as string | null
  const conformidadeBadge = conformidade ? CONFORMIDADE_BADGE[conformidade] : null
  const prioridadeBadge = prioridade ? PRIORIDADE_BADGE[prioridade] : null

  return (
    <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-zinc-950/40 p-5">
      <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06]">
        <ShieldCheck className="h-3.5 w-3.5 text-zinc-500" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
          Gap Analysis ISO — Resposta do Usuário
        </span>
      </div>

      {/* Conformidade */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-500 w-28 shrink-0">Conformidade</span>
        {conformidadeBadge ? (
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold",
              conformidadeBadge.classes,
            )}
          >
            <CheckCircle2 className="h-3 w-3" />
            {conformidadeBadge.label}
          </span>
        ) : (
          <span className="text-xs text-zinc-600 italic">Não informado</span>
        )}
      </div>

      {/* Gap Identificado */}
      {value?.gap_identificado && (
        <div className="space-y-1.5">
          <span className="text-xs text-zinc-500 flex items-center gap-1.5">
            <ClipboardList className="h-3 w-3" /> Gap Identificado
          </span>
          <p className="text-sm text-zinc-300 rounded-lg bg-zinc-900/50 border border-white/[0.06] px-3 py-2.5 whitespace-pre-wrap leading-relaxed">
            {value.gap_identificado}
          </p>
        </div>
      )}

      {/* Ação Necessária */}
      {value?.acao_necessaria && (
        <div className="space-y-1.5">
          <span className="text-xs text-zinc-500 flex items-center gap-1.5">
            <Target className="h-3 w-3" /> Ação Necessária
          </span>
          <p className="text-sm text-zinc-300 rounded-lg bg-zinc-900/50 border border-white/[0.06] px-3 py-2.5 whitespace-pre-wrap leading-relaxed">
            {value.acao_necessaria}
          </p>
        </div>
      )}

      {/* Prioridade / Responsável / Prazo */}
      <div className="flex flex-wrap gap-4 pt-1">
        {prioridadeBadge && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500">Prioridade</span>
            <span
              className={cn(
                "inline-flex rounded-md border px-2 py-0.5 text-xs font-semibold",
                prioridadeBadge.classes,
              )}
            >
              {prioridadeBadge.label}
            </span>
          </div>
        )}
        {value?.responsavel && (
          <div className="flex items-center gap-2">
            <User className="h-3 w-3 text-zinc-500" />
            <span className="text-xs text-zinc-300">{value.responsavel}</span>
          </div>
        )}
        {value?.prazo && (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3 w-3 text-zinc-500" />
            <span className="text-xs text-zinc-300">
              {new Date(value.prazo + "T00:00:00").toLocaleDateString("pt-BR")}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
