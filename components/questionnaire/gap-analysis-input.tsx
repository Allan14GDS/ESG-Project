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
    textColor: "text-emerald-600 dark:text-emerald-400",
    activeBorder: "border-emerald-500/60",
    activeBg: "bg-emerald-500/10",
    glow: "shadow-[0_0_18px_rgba(16,185,129,0.18)]",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    ring: "ring-emerald-500/40",
  },
  {
    id: "PC" as const,
    abbr: "PC",
    label: "Parcialmente",
    description: "Requisito parcialmente atendido",
    textColor: "text-amber-600 dark:text-amber-400",
    activeBorder: "border-amber-500/60",
    activeBg: "bg-amber-500/10",
    glow: "shadow-[0_0_18px_rgba(245,158,11,0.18)]",
    dot: "bg-amber-500 dark:bg-amber-400",
    ring: "ring-amber-500/40",
  },
  {
    id: "NC" as const,
    abbr: "NC",
    label: "Não Conforme",
    description: "Requisito não atendido",
    textColor: "text-red-600 dark:text-red-400",
    activeBorder: "border-red-500/60",
    activeBg: "bg-red-500/10",
    glow: "shadow-[0_0_18px_rgba(239,68,68,0.18)]",
    dot: "bg-red-500 dark:bg-red-400",
    ring: "ring-red-500/40",
  },
  {
    id: "NA" as const,
    abbr: "NA",
    label: "Não Aplicável",
    description: "Requisito não se aplica",
    textColor: "text-muted-foreground",
    activeBorder: "border-border",
    activeBg: "bg-muted/60",
    glow: "",
    dot: "bg-muted-foreground/60",
    ring: "ring-border",
  },
] as const

const PRIORIDADE_OPTIONS = [
  {
    id: "A" as const,
    label: "Alta",
    textColor: "text-red-600 dark:text-red-400",
    activeBorder: "border-red-500/60",
    activeBg: "bg-red-500/10",
    glow: "shadow-[0_0_14px_rgba(239,68,68,0.18)]",
    ring: "ring-red-500/40",
  },
  {
    id: "M" as const,
    label: "Média",
    textColor: "text-amber-600 dark:text-amber-400",
    activeBorder: "border-amber-500/60",
    activeBg: "bg-amber-500/10",
    glow: "shadow-[0_0_14px_rgba(245,158,11,0.18)]",
    ring: "ring-amber-500/40",
  },
  {
    id: "B" as const,
    label: "Baixa",
    textColor: "text-sky-600 dark:text-sky-400",
    activeBorder: "border-sky-500/60",
    activeBg: "bg-sky-500/10",
    glow: "shadow-[0_0_14px_rgba(14,165,233,0.18)]",
    ring: "ring-sky-500/40",
  },
] as const

function GapSkeleton() {
  return (
    <div className="space-y-6 rounded-2xl border border-border/50 bg-muted/30 p-6 animate-pulse">
      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
        <div className="h-4 w-4 rounded bg-muted" />
        <div className="h-3 w-32 rounded bg-muted" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-40 rounded bg-muted/80" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-36 rounded bg-muted/80" />
        <div className="h-20 rounded-xl bg-muted/50 border border-border/30" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-36 rounded bg-muted/80" />
        <div className="h-20 rounded-xl bg-muted/50 border border-border/30" />
      </div>
      <div className="space-y-3">
        <div className="h-4 w-44 rounded bg-muted/80" />
        <div className="flex gap-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 flex-1 rounded-xl bg-muted/50 border border-border/30" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="h-4 w-24 rounded bg-muted/80" />
          <div className="h-10 rounded-xl bg-muted/50 border border-border/30" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-muted/80" />
          <div className="h-10 rounded-xl bg-muted/50 border border-border/30" />
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

  // ── Paleta slate em 3 camadas ──────────────────────────────────────────────
  // Camada 1 (card pai): herda bg-card do card pai
  // Camada 2 (container): bg-slate-50        / dark:bg-slate-900/40
  // Camada 3 (inputs)  : bg-white            / dark:bg-slate-950
  //                      border-slate-300    / dark:border-slate-700
  const inputCls = cn(
    "bg-white dark:bg-slate-950",
    "border border-slate-300 dark:border-slate-700",
    "shadow-sm",
    "text-slate-900 dark:text-slate-100",
    "placeholder:text-slate-500 dark:placeholder:text-slate-500",
    "rounded-xl px-4 py-3",
    "focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:border-emerald-500",
    "transition-colors",
    "disabled:opacity-50 disabled:cursor-not-allowed",
  )

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/40 p-6">
      {/* Section header */}
      <div className="flex items-center gap-2 pb-1 border-b border-slate-200 dark:border-slate-800">
        <ShieldCheck className="h-4 w-4 text-slate-400 dark:text-slate-500" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
          Gap Analysis ISO
        </span>
      </div>

      {/* ── 1. CONFORMIDADE ─────────────────────────────── */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
            1
          </span>
          Nível de Conformidade
          <span className="text-destructive text-xs">obrigatório</span>
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
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-0",
                  disabled && "cursor-not-allowed opacity-50",
                  isSelected
                    ? cn(opt.activeBg, opt.activeBorder, opt.glow, opt.textColor, opt.ring, "ring-1 font-semibold scale-[1.02]")
                    : "border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm text-slate-700 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200 hover:scale-[1.01]",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    isSelected ? opt.dot : "bg-slate-300 dark:bg-slate-600",
                  )}
                />
                <span className="text-sm font-bold leading-none">{opt.abbr}</span>
                <span className="text-[10px] leading-tight opacity-75">{opt.label}</span>
              </button>
            )
          })}
        </div>

        {value.conformidade && (
          <p className="animate-in fade-in-0 slide-in-from-top-1 pl-1 text-xs text-slate-500 dark:text-slate-400 transition-all">
            {CONFORMIDADE_OPTIONS.find((o) => o.id === value.conformidade)?.description}
          </p>
        )}
      </div>

      {/* ── 2. GAP IDENTIFICADO ──────────────────────────── */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <ClipboardList className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          Gap Identificado
        </Label>
        <Textarea
          value={value.gap_identificado}
          onChange={(e) => set("gap_identificado", e.target.value)}
          placeholder="Descreva a lacuna identificada em relação ao requisito da norma..."
          rows={3}
          disabled={disabled}
          className={cn("resize-none", inputCls)}
        />
      </div>

      {/* ── 3. AÇÃO NECESSÁRIA ───────────────────────────── */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <Target className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          Ação Necessária
        </Label>
        <Textarea
          value={value.acao_necessaria}
          onChange={(e) => set("acao_necessaria", e.target.value)}
          placeholder="Descreva as ações corretivas ou preventivas para fechar o gap..."
          rows={3}
          disabled={disabled}
          className={cn("resize-none", inputCls)}
        />
      </div>

      {/* ── 4. PRIORIDADE ───────────────────────────────── */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 tabular-nums">
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
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 focus-visible:ring-offset-0",
                  disabled && "cursor-not-allowed opacity-50",
                  isSelected
                    ? cn(opt.activeBg, opt.activeBorder, opt.glow, opt.textColor, opt.ring, "ring-1 scale-[1.02]")
                    : "border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-sm text-slate-700 dark:text-slate-400 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-200",
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
          <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <User className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            Responsável
          </Label>
          <Input
            value={value.responsavel}
            onChange={(e) => set("responsavel", e.target.value)}
            placeholder="Nome ou área responsável..."
            disabled={disabled}
            className={inputCls}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
            <CalendarDays className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            Prazo
          </Label>
          <Input
            type="date"
            value={value.prazo}
            onChange={(e) => set("prazo", e.target.value)}
            disabled={disabled}
            className={inputCls}
          />
        </div>
      </div>
    </div>
  )
}

/* ── Read-only view (gestor) ──────────────────────────────── */

const CONFORMIDADE_BADGE: Record<string, { label: string; classes: string }> = {
  C: { label: "Conforme", classes: "bg-emerald-500/15 text-emerald-700 border-emerald-500/40 dark:text-emerald-400" },
  PC: { label: "Parcialmente Conforme", classes: "bg-amber-500/15 text-amber-700 border-amber-500/40 dark:text-amber-400" },
  NC: { label: "Não Conforme", classes: "bg-red-500/15 text-red-700 border-red-500/40 dark:text-red-400" },
  NA: { label: "Não Aplicável", classes: "bg-muted text-muted-foreground border-border/50" },
}

const PRIORIDADE_BADGE: Record<string, { label: string; classes: string }> = {
  A: { label: "Alta", classes: "bg-red-500/15 text-red-700 border-red-500/40 dark:text-red-400" },
  M: { label: "Média", classes: "bg-amber-500/15 text-amber-700 border-amber-500/40 dark:text-amber-400" },
  B: { label: "Baixa", classes: "bg-sky-500/15 text-sky-700 border-sky-500/40 dark:text-sky-400" },
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
    <div className="space-y-4 rounded-2xl border border-border/50 bg-muted/20 p-5">
      <div className="flex items-center gap-2 pb-1 border-b border-border/50">
        <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Gap Analysis ISO — Resposta do Usuário
        </span>
      </div>

      {/* Conformidade */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-28 shrink-0">Conformidade</span>
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
          <span className="text-xs text-muted-foreground italic">Não informado</span>
        )}
      </div>

      {/* Gap Identificado */}
      {value?.gap_identificado && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ClipboardList className="h-3 w-3" /> Gap Identificado
          </span>
          <p className="text-sm text-foreground rounded-lg bg-muted/40 border border-border/50 px-3 py-2.5 whitespace-pre-wrap leading-relaxed">
            {value.gap_identificado}
          </p>
        </div>
      )}

      {/* Ação Necessária */}
      {value?.acao_necessaria && (
        <div className="space-y-1.5">
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Target className="h-3 w-3" /> Ação Necessária
          </span>
          <p className="text-sm text-foreground rounded-lg bg-muted/40 border border-border/50 px-3 py-2.5 whitespace-pre-wrap leading-relaxed">
            {value.acao_necessaria}
          </p>
        </div>
      )}

      {/* Prioridade / Responsável / Prazo */}
      <div className="flex flex-wrap gap-4 pt-1">
        {prioridadeBadge && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Prioridade</span>
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
            <User className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-foreground">{value.responsavel}</span>
          </div>
        )}
        {value?.prazo && (
          <div className="flex items-center gap-2">
            <CalendarDays className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-foreground">
              {new Date(value.prazo + "T00:00:00").toLocaleDateString("pt-BR")}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
