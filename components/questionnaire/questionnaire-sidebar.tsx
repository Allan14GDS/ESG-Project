"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CheckCircle2, Circle, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarQuestion {
  id: string
  unique_identifier: string
  metadata?: { disclosure?: string }
}

interface CategoryInfo {
  name: string
  slug: string
  /** Índice global (0-based) da primeira questão desta categoria. */
  firstQuestionIndex: number
  questionIds: string[]
}

interface QuestionnaireSidebarProps {
  allQuestions: SidebarQuestion[]
  existingAnswers: Record<string, { value: string }>
  templateId: string
  companyId?: string | null
  currentPage: number
  itemsPerPage: number
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function extractCategory(question: SidebarQuestion): string {
  if (question.metadata?.disclosure) {
    return question.metadata.disclosure
  }
  const uid = question.unique_identifier?.trim()
  if (!uid) return "Geral"
  const match = uid.match(/^([A-Za-zÀ-ú]+\s*\d+)/i)
  if (match) return match[1].trim()
  return "Geral"
}

export function slugifyCategory(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function buildCategories(allQuestions: SidebarQuestion[]): CategoryInfo[] {
  const categoriesMap = new Map<string, CategoryInfo>()

  allQuestions.forEach((q, index) => {
    const name = extractCategory(q)
    if (!categoriesMap.has(name)) {
      categoriesMap.set(name, {
        name,
        slug: slugifyCategory(name),
        firstQuestionIndex: index,
        questionIds: [],
      })
    }
    categoriesMap.get(name)!.questionIds.push(q.id)
  })

  return Array.from(categoriesMap.values())
}

function getProgressColor(pct: number): string {
  if (pct === 0) return "text-zinc-400 dark:text-zinc-500"
  if (pct < 50) return "text-amber-600 dark:text-amber-400"
  if (pct < 100) return "text-sky-600 dark:text-sky-400"
  return "text-emerald-600 dark:text-emerald-400"
}

function getProgressBarColor(pct: number): string {
  if (pct === 0) return "[&>div]:bg-zinc-400 dark:[&>div]:bg-zinc-600"
  if (pct < 50) return "[&>div]:bg-amber-500"
  if (pct < 100) return "[&>div]:bg-sky-500"
  return "[&>div]:bg-emerald-500"
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QuestionnaireSidebar({
  allQuestions,
  existingAnswers,
  templateId,
  companyId,
  currentPage,
  itemsPerPage,
}: QuestionnaireSidebarProps) {
  usePathname() // mantém reatividade de rota para links ativos

  const [isCollapsed, setIsCollapsed] = useState(false)

  const categories = buildCategories(allQuestions)

  const totalAnswered = allQuestions.filter((q) => {
    const ans = existingAnswers[q.id]
    return ans?.value && ans.value.trim() !== ""
  }).length
  const globalPct =
    allQuestions.length > 0 ? Math.round((totalAnswered / allQuestions.length) * 100) : 0

  const companyParam = companyId ? `&company=${companyId}` : ""

  return (
    <aside
      data-testid="questionnaire-sidebar"
      data-collapsed={isCollapsed}
      className={cn(
        // Só aparece em desktop; overflow-hidden garante que o conteúdo não vaze
        // quando a largura encolhe
        "hidden lg:block shrink-0 overflow-hidden",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-12" : "w-[260px]"
      )}
    >
      <div className="sticky top-24">
        {/* ── Botão de toggle — sempre visível ── */}
        <div
          className={cn(
            "flex mb-3 transition-all duration-200",
            isCollapsed ? "justify-center" : "justify-end"
          )}
        >
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsCollapsed((v) => !v)}
            aria-label={isCollapsed ? "Expandir painel lateral" : "Recolher painel lateral"}
            className="h-8 w-8 shrink-0 border-border/60 bg-card text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* ── Mini-indicador quando recolhido ── */}
        {isCollapsed && (
          <div data-testid="sidebar-mini-indicator" className="flex flex-col items-center gap-1.5 px-1 pt-1">
            <span
              className={cn(
                "text-[11px] font-bold tabular-nums leading-none",
                getProgressColor(globalPct)
              )}
            >
              {globalPct}%
            </span>
            <div className="h-px w-6 bg-border/50 rounded-full" />
            <span className="text-[9px] text-muted-foreground/60 tabular-nums">
              {totalAnswered}/{allQuestions.length}
            </span>
          </div>
        )}

        {/* ── Conteúdo principal — esmaece ao recolher ── */}
        <div
          className={cn(
            "space-y-4 max-h-[calc(100vh-9rem)] overflow-y-auto pr-1 pb-4",
            "transition-all duration-200 ease-in-out",
            isCollapsed
              ? "opacity-0 pointer-events-none"
              : "opacity-100 pointer-events-auto"
          )}
        >
          {/* Progresso global */}
          <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Progresso Total
            </p>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-foreground">{globalPct}%</span>
              <span className="text-xs text-muted-foreground">
                {totalAnswered}/{allQuestions.length}
              </span>
            </div>
            <Progress
              value={globalPct}
              className={cn("h-2 bg-muted", getProgressBarColor(globalPct))}
            />
          </div>

          {/* Lista de categorias */}
          <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Seções
              </p>
            </div>

            <nav className="py-1">
              {categories.map((cat) => {
                const answered = cat.questionIds.filter((qId) => {
                  const ans = existingAnswers[qId]
                  return ans?.value && ans.value.trim() !== ""
                }).length
                const total = cat.questionIds.length
                const pct = total > 0 ? Math.round((answered / total) * 100) : 0
                const isDone = answered === total
                const colorClass = getProgressColor(pct)

                const catPage = Math.floor(cat.firstQuestionIndex / itemsPerPage) + 1
                const isOnCurrentPage = catPage === currentPage

                const href = isOnCurrentPage
                  ? `#category-${cat.slug}`
                  : `/dashboard/questionnaire/${templateId}?page=${catPage}${companyParam}`

                return (
                  <Link
                    key={cat.slug}
                    href={href}
                    scroll={!isOnCurrentPage}
                    className={cn(
                      "group flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                      "hover:bg-accent/50 focus-visible:outline-none focus-visible:bg-accent/50",
                      isOnCurrentPage && "font-medium text-foreground",
                      !isOnCurrentPage && "text-muted-foreground"
                    )}
                  >
                    <span className={cn("shrink-0 mt-0.5", colorClass)}>
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </span>

                    <span className="flex-1 leading-tight line-clamp-2 text-xs">
                      {cat.name}
                    </span>

                    <span className={cn("shrink-0 tabular-nums text-xs font-medium", colorClass)}>
                      {answered}/{total}
                    </span>

                    <ChevronRight
                      className={cn(
                        "h-3 w-3 shrink-0 text-muted-foreground/50 transition-transform",
                        "group-hover:translate-x-0.5"
                      )}
                    />
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Legenda */}
          <div className="rounded-xl border border-border/50 bg-card px-4 py-3 space-y-1.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
              Legenda
            </p>
            {[
              { color: "bg-zinc-400 dark:bg-zinc-600", label: "Não iniciada" },
              { color: "bg-amber-500", label: "Em progresso" },
              { color: "bg-sky-500", label: "Quase concluída" },
              { color: "bg-emerald-500", label: "Completa" },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <span className={cn("h-2 w-2 rounded-full shrink-0", color)} />
                <span className="text-xs text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
