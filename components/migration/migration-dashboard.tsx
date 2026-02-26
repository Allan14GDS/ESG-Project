"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EnrichmentStatusCard } from "./enrichment-status-card"
import { MigrationWizard } from "./migration-wizard"
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Search,
  Upload,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  EyeOff,
  Pencil,
  Check,
  X,
  Save,
} from "lucide-react"
import type { TemplateEnrichmentStatus, MigrationLogEntry } from "@/lib/migration/types"

interface MigrationDashboardProps {
  initialStatuses: TemplateEnrichmentStatus[]
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    gri: "bg-emerald-100 text-emerald-700",
    aneel: "bg-amber-100 text-amber-700",
    ifrs: "bg-cyan-100 text-cyan-700",
    governance: "bg-purple-100 text-purple-700",
    governanca: "bg-purple-100 text-purple-700",
    organizational: "bg-blue-100 text-blue-700",
    organizacional: "bg-blue-100 text-blue-700",
    environmental: "bg-teal-100 text-teal-700",
    ambiental: "bg-teal-100 text-teal-700",
    social: "bg-pink-100 text-pink-700",
  }
  const color = colors[type?.toLowerCase()] || "bg-gray-100 text-gray-700"
  return <Badge className={`${color} text-xs border-0`}>{type || "N/A"}</Badge>
}

export function MigrationDashboard({ initialStatuses }: MigrationDashboardProps) {
  const [statuses, setStatuses] = useState<TemplateEnrichmentStatus[]>(initialStatuses)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [wizardOpen, setWizardOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<{ id: string; name: string; type: string } | null>(null)
  const [showLogs, setShowLogs] = useState(true)
  const [logs, setLogs] = useState<MigrationLogEntry[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)

  // Expandable pending questions
  const [expandedTemplateId, setExpandedTemplateId] = useState<string | null>(null)
  const [pendingQuestions, setPendingQuestions] = useState<any[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(false)

  // Inline editing
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<Record<string, string>>({})
  const [savingQuestion, setSavingQuestion] = useState(false)

  const refreshStatuses = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const res = await fetch("/api/admin/migration/status")
      const json = await res.json()
      if (json.data) {
        setStatuses(json.data)
      }
    } catch {
      // silently fail
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const loadLogs = useCallback(async () => {
    setLoadingLogs(true)
    try {
      const res = await fetch("/api/admin/migration/logs?limit=20")
      const json = await res.json()
      if (json.data) {
        setLogs(json.data)
      }
    } catch {
      // silently fail
    } finally {
      setLoadingLogs(false)
    }
  }, [])

  const togglePendingQuestions = useCallback(async (templateId: string) => {
    if (expandedTemplateId === templateId) {
      setExpandedTemplateId(null)
      setPendingQuestions([])
      return
    }

    setExpandedTemplateId(templateId)
    setLoadingQuestions(true)
    try {
      const res = await fetch(`/api/admin/migration/questions?templateId=${templateId}&filter=unenriched`)
      const json = await res.json()
      setPendingQuestions(json.data || [])
    } catch {
      setPendingQuestions([])
    } finally {
      setLoadingQuestions(false)
    }
  }, [expandedTemplateId])

  const startEditing = useCallback((q: any) => {
    setEditingQuestionId(q.id)
    setEditFields({
      disclosure: q.metadata?.disclosure || "",
      framework_gri: q.metadata?.framework_gri || "",
      sub_framework_gri: q.metadata?.sub_framework_gri || "",
      framework_aneel: q.metadata?.framework_aneel || "",
      sub_framework_aneel: q.metadata?.sub_framework_aneel || "",
      framework_ifrs: q.metadata?.framework_ifrs || "",
      sub_framework_ifrs: q.metadata?.sub_framework_ifrs || "",
    })
  }, [])

  const cancelEditing = useCallback(() => {
    setEditingQuestionId(null)
    setEditFields({})
  }, [])

  const saveQuestion = useCallback(async () => {
    if (!editingQuestionId) return
    setSavingQuestion(true)
    try {
      const res = await fetch("/api/admin/migration/questions/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: editingQuestionId, fields: editFields }),
      })
      const json = await res.json()
      if (json.success) {
        // Update the local state to reflect changes
        setPendingQuestions((prev) =>
          prev.map((q) => {
            if (q.id === editingQuestionId) {
              return {
                ...q,
                metadata: { ...q.metadata, ...editFields },
                // If any enrichment field was filled, mark as enriched
                enriched: !!(
                  editFields.disclosure ||
                  editFields.framework_gri ||
                  editFields.framework_aneel ||
                  editFields.framework_ifrs
                ),
              }
            }
            return q
          })
        )
        setEditingQuestionId(null)
        setEditFields({})
        // Refresh parent stats
        refreshStatuses()
      }
    } catch {
      // silently fail
    } finally {
      setSavingQuestion(false)
    }
  }, [editingQuestionId, editFields, refreshStatuses])

  useEffect(() => {
    if (showLogs && logs.length === 0) {
      loadLogs()
    }
  }, [showLogs, logs.length, loadLogs])

  // Aggregated stats
  const totalQuestions = statuses.reduce((sum, s) => sum + s.totalQuestions, 0)
  const totalEnriched = statuses.reduce((sum, s) => sum + s.enrichedCount, 0)
  const totalPending = statuses.reduce((sum, s) => sum + s.unenrichedCount, 0)
  const overallPercent = totalQuestions > 0 ? Math.round((totalEnriched / totalQuestions) * 100) : 0

  // Filter
  const filtered = statuses.filter((s) => {
    const matchesSearch =
      !search ||
      s.templateName.toLowerCase().includes(search.toLowerCase()) ||
      s.templateType?.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === "all" || s.templateType?.toLowerCase() === typeFilter.toLowerCase()
    return matchesSearch && matchesType
  })

  // Unique types
  const uniqueTypes = [...new Set(statuses.map((s) => s.templateType).filter(Boolean))]

  const handleOpenWizard = (template: TemplateEnrichmentStatus) => {
    setSelectedTemplate({ id: template.templateId, name: template.templateName, type: template.templateType })
    setWizardOpen(true)
  }

  const handleWizardComplete = () => {
    refreshStatuses()
    loadLogs()
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <EnrichmentStatusCard
          label="Total Questoes"
          value={totalQuestions.toLocaleString()}
          description={`${statuses.length} cadernos`}
          icon={<Database className="h-5 w-5" />}
          color="text-blue-600"
        />
        <EnrichmentStatusCard
          label="Enriquecidas"
          value={totalEnriched.toLocaleString()}
          description={`${overallPercent}% do total`}
          icon={<CheckCircle2 className="h-5 w-5" />}
          color="text-emerald-600"
        />
        <EnrichmentStatusCard
          label="Pendentes"
          value={totalPending.toLocaleString()}
          description={`${100 - overallPercent}% restante`}
          icon={<AlertTriangle className="h-5 w-5" />}
          color="text-amber-600"
        />
        <EnrichmentStatusCard
          label="Progresso"
          value={`${overallPercent}%`}
          description="Taxa de enriquecimento"
          icon={<BarChart3 className="h-5 w-5" />}
          color="text-purple-600"
        />
      </div>

      {/* Templates Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Cadernos</CardTitle>
              <CardDescription>Status de enriquecimento por caderno</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStatuses}
              disabled={isRefreshing}
              className="gap-1"
            >
              {isRefreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart3 className="h-3 w-3" />}
              Atualizar
            </Button>
          </div>

          <div className="flex gap-2 mt-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar caderno..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[140px] h-9 text-sm">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {uniqueTypes.map((t) => (
                  <SelectItem key={t} value={t.toLowerCase()}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b bg-muted/30">
                  <th className="p-3 text-left font-medium text-muted-foreground">Nome</th>
                  <th className="p-3 text-left font-medium text-muted-foreground">Tipo</th>
                  <th className="p-3 text-center font-medium text-muted-foreground">Total</th>
                  <th className="p-3 text-center font-medium text-muted-foreground">Enriq.</th>
                  <th className="p-3 text-center font-medium text-muted-foreground">Pend.</th>
                  <th className="p-3 text-center font-medium text-muted-foreground">%</th>
                  <th className="p-3 text-center font-medium text-muted-foreground">Acao</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground">
                      Nenhum caderno encontrado
                    </td>
                  </tr>
                ) : (
                  filtered.map((status) => {
                    const isExpanded = expandedTemplateId === status.templateId
                    return (
                      <React.Fragment key={status.templateId}>
                        <tr className={`border-b hover:bg-muted/20 transition-colors ${isExpanded ? "bg-muted/10" : ""}`}>
                          <td className="p-3">
                            <p className="font-medium text-sm line-clamp-1" title={status.templateName}>
                              {status.templateName}
                            </p>
                            {status.lastMigration && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Clock className="h-3 w-3" />
                                {new Date(status.lastMigration).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </td>
                          <td className="p-3">
                            <TypeBadge type={status.templateType} />
                          </td>
                          <td className="p-3 text-center font-medium">{status.totalQuestions}</td>
                          <td className="p-3 text-center">
                            <span className="text-emerald-600 font-medium">{status.enrichedCount}</span>
                          </td>
                          <td className="p-3 text-center">
                            {status.unenrichedCount > 0 ? (
                              <button
                                onClick={() => togglePendingQuestions(status.templateId)}
                                className="inline-flex items-center gap-1 text-amber-600 font-medium hover:text-amber-700 hover:underline cursor-pointer transition-colors"
                                title="Clique para ver questoes pendentes"
                              >
                                {isExpanded ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                                {status.unenrichedCount}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">{status.unenrichedCount}</span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    status.enrichmentPercent === 100
                                      ? "bg-emerald-500"
                                      : status.enrichmentPercent > 0
                                        ? "bg-blue-500"
                                        : "bg-gray-300"
                                  }`}
                                  style={{ width: `${status.enrichmentPercent}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium w-8">{status.enrichmentPercent}%</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {status.enrichmentPercent === 100 ? (
                              <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">Completo</Badge>
                            ) : status.totalQuestions === 0 ? (
                              <Badge variant="outline" className="text-xs text-muted-foreground">Vazio</Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handleOpenWizard(status)}
                              >
                                <Upload className="h-3 w-3" />
                                Migrar
                              </Button>
                            )}
                          </td>
                        </tr>
                        {/* Expanded sub-row showing pending questions */}
                        {isExpanded && (
                          <tr className="border-b bg-amber-50/50 dark:bg-amber-950/10">
                            <td colSpan={7} className="p-0">
                              <div className="px-4 py-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                  <span className="text-xs font-semibold text-amber-700">
                                    Questoes pendentes de enriquecimento ({status.unenrichedCount})
                                  </span>
                                </div>
                                {loadingQuestions ? (
                                  <div className="flex items-center gap-2 py-3 justify-center">
                                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">Carregando questoes...</span>
                                  </div>
                                ) : pendingQuestions.length === 0 ? (
                                  <p className="text-xs text-muted-foreground py-2 text-center">
                                    Nenhuma questao pendente encontrada
                                  </p>
                                ) : (
                                  <div className="max-h-80 overflow-auto rounded border bg-background">
                                    <table className="text-xs" style={{ minWidth: "900px" }}>
                                      <thead className="sticky top-0 bg-muted/80 z-10">
                                        <tr>
                                          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground w-8">#</th>
                                          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground" style={{ minWidth: "200px" }}>Questao</th>
                                          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground" style={{ minWidth: "90px" }}>Disclosure</th>
                                          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground" style={{ minWidth: "70px" }}>GRI</th>
                                          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground" style={{ minWidth: "70px" }}>Sub GRI</th>
                                          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground" style={{ minWidth: "70px" }}>ANEEL</th>
                                          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground" style={{ minWidth: "80px" }}>Sub ANEEL</th>
                                          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground" style={{ minWidth: "70px" }}>IFRS</th>
                                          <th className="px-2 py-1.5 text-left font-medium text-muted-foreground" style={{ minWidth: "70px" }}>Sub IFRS</th>
                                          <th className="px-2 py-1.5 text-center font-medium text-muted-foreground w-16">Editar</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {pendingQuestions.map((q: any, idx: number) => {
                                          const isEditing = editingQuestionId === q.id
                                          return (
                                            <tr key={q.id} className={`border-t ${isEditing ? "bg-blue-50/50 dark:bg-blue-950/10" : "hover:bg-muted/20"}`}>
                                              <td className="px-2 py-1.5 text-muted-foreground">{idx + 1}</td>
                                              <td className="px-2 py-1.5">
                                                <span className="line-clamp-2" title={q.label}>{q.label}</span>
                                              </td>
                                              {isEditing ? (
                                                <>
                                                  <td className="px-1 py-1">
                                                    <input
                                                      className="w-full px-1.5 py-0.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                      value={editFields.disclosure}
                                                      onChange={(e) => setEditFields((f) => ({ ...f, disclosure: e.target.value }))}
                                                      placeholder="Disclosure"
                                                    />
                                                  </td>
                                                  <td className="px-1 py-1">
                                                    <input
                                                      className="w-full px-1.5 py-0.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                      value={editFields.framework_gri}
                                                      onChange={(e) => setEditFields((f) => ({ ...f, framework_gri: e.target.value }))}
                                                      placeholder="GRI"
                                                    />
                                                  </td>
                                                  <td className="px-1 py-1">
                                                    <input
                                                      className="w-full px-1.5 py-0.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                      value={editFields.sub_framework_gri}
                                                      onChange={(e) => setEditFields((f) => ({ ...f, sub_framework_gri: e.target.value }))}
                                                      placeholder="Sub GRI"
                                                    />
                                                  </td>
                                                  <td className="px-1 py-1">
                                                    <input
                                                      className="w-full px-1.5 py-0.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                      value={editFields.framework_aneel}
                                                      onChange={(e) => setEditFields((f) => ({ ...f, framework_aneel: e.target.value }))}
                                                      placeholder="ANEEL"
                                                    />
                                                  </td>
                                                  <td className="px-1 py-1">
                                                    <input
                                                      className="w-full px-1.5 py-0.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                      value={editFields.sub_framework_aneel}
                                                      onChange={(e) => setEditFields((f) => ({ ...f, sub_framework_aneel: e.target.value }))}
                                                      placeholder="Sub ANEEL"
                                                    />
                                                  </td>
                                                  <td className="px-1 py-1">
                                                    <input
                                                      className="w-full px-1.5 py-0.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                      value={editFields.framework_ifrs}
                                                      onChange={(e) => setEditFields((f) => ({ ...f, framework_ifrs: e.target.value }))}
                                                      placeholder="IFRS"
                                                    />
                                                  </td>
                                                  <td className="px-1 py-1">
                                                    <input
                                                      className="w-full px-1.5 py-0.5 text-xs border rounded bg-background focus:outline-none focus:ring-1 focus:ring-blue-400"
                                                      value={editFields.sub_framework_ifrs}
                                                      onChange={(e) => setEditFields((f) => ({ ...f, sub_framework_ifrs: e.target.value }))}
                                                      placeholder="Sub IFRS"
                                                    />
                                                  </td>
                                                  <td className="px-2 py-1.5 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                      <button
                                                        onClick={saveQuestion}
                                                        disabled={savingQuestion}
                                                        className="p-0.5 rounded hover:bg-emerald-100 text-emerald-600 transition-colors disabled:opacity-50"
                                                        title="Salvar"
                                                      >
                                                        {savingQuestion ? (
                                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                        ) : (
                                                          <Check className="h-3.5 w-3.5" />
                                                        )}
                                                      </button>
                                                      <button
                                                        onClick={cancelEditing}
                                                        className="p-0.5 rounded hover:bg-red-100 text-red-500 transition-colors"
                                                        title="Cancelar"
                                                      >
                                                        <X className="h-3.5 w-3.5" />
                                                      </button>
                                                    </div>
                                                  </td>
                                                </>
                                              ) : (
                                                <>
                                                  <td className="px-2 py-1.5 text-muted-foreground">{q.metadata?.disclosure || "-"}</td>
                                                  <td className="px-2 py-1.5 text-muted-foreground">{q.metadata?.framework_gri || "-"}</td>
                                                  <td className="px-2 py-1.5 text-muted-foreground">{q.metadata?.sub_framework_gri || "-"}</td>
                                                  <td className="px-2 py-1.5 text-muted-foreground">{q.metadata?.framework_aneel || "-"}</td>
                                                  <td className="px-2 py-1.5 text-muted-foreground">{q.metadata?.sub_framework_aneel || "-"}</td>
                                                  <td className="px-2 py-1.5 text-muted-foreground">{q.metadata?.framework_ifrs || "-"}</td>
                                                  <td className="px-2 py-1.5 text-muted-foreground">{q.metadata?.sub_framework_ifrs || "-"}</td>
                                                  <td className="px-2 py-1.5 text-center">
                                                    <button
                                                      onClick={() => startEditing(q)}
                                                      className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                      title="Editar metadados"
                                                    >
                                                      <Pencil className="h-3 w-3" />
                                                    </button>
                                                  </td>
                                                </>
                                              )}
                                            </tr>
                                          )
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="p-3 border-t text-xs text-muted-foreground">
            Mostrando {filtered.length} de {statuses.length} cadernos
          </div>
        </CardContent>
      </Card>

      {/* Migration Logs */}
      <Card>
        <CardHeader
          className="cursor-pointer pb-3"
          onClick={() => setShowLogs(!showLogs)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Historico de Migracoes</CardTitle>
            </div>
            {showLogs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </CardHeader>
        {showLogs && (
          <CardContent className="pt-0">
            {loadingLogs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhuma migracao executada ainda
              </p>
            ) : (
              <div className="space-y-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/20 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-2 w-2 rounded-full ${log.total_errors > 0 ? "bg-amber-500" : "bg-emerald-500"}`} />
                      <div>
                        <p className="font-medium">{log.template_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.executed_at).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-emerald-600">{log.total_updated} atualizadas</span>
                      {log.total_errors > 0 && (
                        <span className="text-red-500">{log.total_errors} erros</span>
                      )}
                      <span className="text-muted-foreground">{log.total_unmatched} nao encontradas</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Migration Wizard Dialog */}
      {selectedTemplate && (
        <MigrationWizard
          open={wizardOpen}
          onOpenChange={setWizardOpen}
          template={selectedTemplate}
          onComplete={handleWizardComplete}
        />
      )}
    </div>
  )
}
