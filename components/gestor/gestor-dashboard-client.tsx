"use client"

import { useMemo, useState, Fragment } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  BookOpen,
  Building2,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  Filter,
  ChevronDown,
  ChevronRight,
  BookMarked,
} from "lucide-react"
import { AdminDashboardCharts } from "@/components/admin/admin-dashboard-charts"

interface Holding {
  id: string
  name: string
}

interface Company {
  id: string
  name: string
  holding_id: string | null
}

interface UserProgressEntry {
  userId: string
  userName: string
  userEmail: string
  companyId: string
  companyName: string
  answered: number
  total: number
}

interface UserCadernoDetailEntry {
  userId: string
  companyId: string
  cadernoId: string
  cadernoName: string
  answered: number
  total: number
}

interface GestorDashboardClientProps {
  holdings: Holding[]
  companies: Company[]
  answerCountsEntries: [string, number][]
  questionCountEntries: [string, number][]
  companyTemplatesEntries: [string, string[]][]
  recentAnswersWithCompany: { date: string; company_id: string | null }[]
  userProgressEntries: UserProgressEntry[]
  userCadernoDetailEntries?: UserCadernoDetailEntry[]
  totalUsers: number
  totalAnswers: number
}

export function GestorDashboardClient({
  holdings,
  companies,
  answerCountsEntries,
  questionCountEntries,
  companyTemplatesEntries,
  recentAnswersWithCompany,
  userProgressEntries,
  userCadernoDetailEntries = [],
  totalUsers,
  totalAnswers,
}: GestorDashboardClientProps) {
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>("all")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set())
  const [userStatusFilter, setUserStatusFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all")

  // Rebuild maps from serialized entries
  const answerCountsMap = useMemo(() => new Map(answerCountsEntries), [answerCountsEntries])
  const questionCountMap = useMemo(() => new Map(questionCountEntries), [questionCountEntries])
  const companyTemplatesMap = useMemo(() => new Map(companyTemplatesEntries), [companyTemplatesEntries])

  // Filter companies by selected holding
  const filteredCompanies = useMemo(() => {
    if (selectedHoldingId === "all") return companies
    return companies.filter((c) => c.holding_id === selectedHoldingId)
  }, [companies, selectedHoldingId])

  // Visible company IDs based on filters
  const visibleCompanyIds = useMemo(() => {
    if (selectedCompanyId !== "all") return new Set([selectedCompanyId])
    return new Set(filteredCompanies.map((c) => c.id))
  }, [filteredCompanies, selectedCompanyId])

  // Filtered caderno status stats
  const filteredStats = useMemo(() => {
    let completed = 0
    let inProgress = 0
    let pending = 0
    let filteredAnswerTotal = 0
    let filteredTemplateIds = new Set<string>()
    let filteredQuestionTotal = 0

    for (const [compId, templateIds] of companyTemplatesMap) {
      if (!visibleCompanyIds.has(compId)) continue

      for (const templateId of templateIds) {
        const totalQ = questionCountMap.get(templateId) || 0
        const key = `${templateId}_${compId}`
        const answeredQ = answerCountsMap.get(key) || 0

        filteredAnswerTotal += answeredQ
        filteredTemplateIds.add(templateId)

        if (totalQ === 0) {
          pending++
        } else if (answeredQ >= totalQ) {
          completed++
        } else if (answeredQ > 0) {
          inProgress++
        } else {
          pending++
        }
      }
    }

    for (const tid of filteredTemplateIds) {
      filteredQuestionTotal += questionCountMap.get(tid) || 0
    }

    return {
      completed,
      inProgress,
      pending,
      totalCadernoPairs: completed + inProgress + pending,
      filteredAnswerTotal,
      filteredTemplateCount: filteredTemplateIds.size,
      filteredQuestionTotal,
      filteredCompanyCount: visibleCompanyIds.size,
    }
  }, [companyTemplatesMap, visibleCompanyIds, questionCountMap, answerCountsMap])

  // Company progress bars
  const companyProgress = useMemo(() => {
    const progress: { name: string; answered: number; total: number; percentage: number }[] = []

    for (const company of filteredCompanies) {
      if (selectedCompanyId !== "all" && company.id !== selectedCompanyId) continue

      const templateIds = companyTemplatesMap.get(company.id)
      if (!templateIds || templateIds.length === 0) continue

      let totalQ = 0
      let answeredQ = 0

      for (const templateId of templateIds) {
        totalQ += questionCountMap.get(templateId) || 0
        answeredQ += answerCountsMap.get(`${templateId}_${company.id}`) || 0
      }

      if (totalQ > 0) {
        progress.push({
          name: company.name,
          answered: Math.min(answeredQ, totalQ),
          total: totalQ,
          percentage: Math.round((Math.min(answeredQ, totalQ) / totalQ) * 100),
        })
      }
    }

    return progress.sort((a, b) => b.percentage - a.percentage)
  }, [filteredCompanies, selectedCompanyId, companyTemplatesMap, questionCountMap, answerCountsMap])

  // Answers by day (filtered)
  const answersByDay = useMemo(() => {
    const dayMap = new Map<string, number>()
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      dayMap.set(d.toISOString().split("T")[0], 0)
    }

    for (const entry of recentAnswersWithCompany) {
      if (entry.company_id && !visibleCompanyIds.has(entry.company_id)) continue
      const day = entry.date
      if (day && dayMap.has(day)) {
        dayMap.set(day, (dayMap.get(day) || 0) + 1)
      }
    }

    return Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }))
  }, [recentAnswersWithCompany, visibleCompanyIds])

  const answersLast7Days = answersByDay.slice(-7).reduce((sum, d) => sum + d.count, 0)

  // Filtered user progress (with status filter based on per-caderno status)
  const filteredUserProgress = useMemo(() => {
    const allEntries = userProgressEntries
      .filter((u) => visibleCompanyIds.has(u.companyId))
      .map((u) => ({
        ...u,
        percentage: u.total > 0 ? Math.round((u.answered / u.total) * 100) : 0,
      }))

    if (userStatusFilter === "all") {
      return allEntries.sort((a, b) => b.percentage - a.percentage)
    }

    // Filter based on per-caderno status (matching cadernos-gestao behavior)
    return allEntries.filter((u) => {
      const cadernos = userCadernoDetailEntries.filter(
        (d) => d.userId === u.userId && d.companyId === u.companyId
      )
      if (cadernos.length === 0) return userStatusFilter === "pending"

      return cadernos.some((d) => {
        const pct = d.total > 0 ? Math.round((d.answered / d.total) * 100) : 0
        if (userStatusFilter === "completed") return pct === 100
        if (userStatusFilter === "in_progress") return pct > 0 && pct < 100
        if (userStatusFilter === "pending") return pct === 0
        return false
      })
    }).sort((a, b) => b.percentage - a.percentage)
  }, [userProgressEntries, visibleCompanyIds, userStatusFilter, userCadernoDetailEntries])

  // Unique users in filtered view
  const filteredUniqueUsers = useMemo(() => {
    return new Set(filteredUserProgress.map((u) => u.userId)).size
  }, [filteredUserProgress])

  // Group caderno detail entries by "userId_companyId"
  const filteredCadernoDetails = useMemo(() => {
    return userCadernoDetailEntries.filter((d) => visibleCompanyIds.has(d.companyId))
  }, [userCadernoDetailEntries, visibleCompanyIds])

  const getCadernoDetailsForUserCompany = (userId: string, companyId: string) => {
    return filteredCadernoDetails.filter((d) => d.userId === userId && d.companyId === companyId)
  }

  const toggleUserExpand = (rowKey: string) => {
    setExpandedUsers((prev) => {
      const next = new Set(prev)
      if (next.has(rowKey)) {
        next.delete(rowKey)
      } else {
        next.add(rowKey)
      }
      return next
    })
  }

  const isFiltered = selectedHoldingId !== "all" || selectedCompanyId !== "all"

  const handleHoldingChange = (value: string) => {
    setSelectedHoldingId(value)
    setSelectedCompanyId("all")
  }

  const holdingCount = useMemo(() => {
    if (selectedHoldingId !== "all") return 1
    return holdings.length
  }, [selectedHoldingId, holdings])

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="h-4 w-4" />
              <span className="font-medium">Filtrar por:</span>
            </div>
            <div className="flex gap-3 flex-wrap flex-1">
              <Select value={selectedHoldingId} onValueChange={handleHoldingChange}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todas as Holdings" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Holdings</SelectItem>
                  {holdings.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      {h.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todas as Empresas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Empresas</SelectItem>
                  {filteredCompanies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {isFiltered && (
                <button
                  onClick={() => {
                    setSelectedHoldingId("all")
                    setSelectedCompanyId("all")
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Empresas</p>
                <p className="mt-2 text-3xl font-bold">
                  {isFiltered ? filteredStats.filteredCompanyCount : companies.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {holdingCount} {holdingCount === 1 ? "holding" : "holdings"}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cadernos</p>
                <p className="mt-2 text-3xl font-bold">
                  {filteredStats.filteredTemplateCount}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredStats.filteredQuestionTotal} questoes
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Usuarios</p>
                <p className="mt-2 text-3xl font-bold">
                  {isFiltered ? filteredUniqueUsers : totalUsers}
                </p>
                <p className="text-xs text-muted-foreground mt-1">atribuidos aos cadernos</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Respostas</p>
                <p className="mt-2 text-3xl font-bold">
                  {isFiltered ? filteredStats.filteredAnswerTotal : totalAnswers}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {answersLast7Days} nos ultimos 7 dias
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Caderno Status Cards */}
      {filteredStats.totalCadernoPairs > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concluidos</p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {filteredStats.completed}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Progresso</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredStats.inProgress}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {filteredStats.pending}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <AdminDashboardCharts
        answersByDay={answersByDay}
        companyProgress={companyProgress}
      />

      {/* User Progress Table */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Progresso por Usuario
              </h3>
              <p className="text-xs text-muted-foreground">
                Respostas individuais por empresa
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
              <Select value={userStatusFilter} onValueChange={(v) => setUserStatusFilter(v as typeof userStatusFilter)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                  <SelectItem value="in_progress">Em Progresso</SelectItem>
                  <SelectItem value="completed">Concluidos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredUserProgress.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-fixed">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="w-[36px] pb-3 pr-2"></th>
                    <th className="w-[15%] pb-3 pr-4 font-medium">Nome</th>
                    <th className="w-[22%] pb-3 pr-4 font-medium">Email</th>
                    <th className="w-[23%] pb-3 pr-4 font-medium">Empresa</th>
                    <th className="w-[12%] pb-3 pr-4 font-medium text-right">Respondidas</th>
                    <th className="w-[8%] pb-3 pr-4 font-medium text-right">%</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUserProgress.map((u, idx) => {
                    const rowKey = `${u.userId}_${u.companyId}`
                    const isExpanded = expandedUsers.has(rowKey)
                    const allCadernoDetails = getCadernoDetailsForUserCompany(u.userId, u.companyId)
                    // Filter cadernos in dropdown to match the active status filter
                    const cadernoDetails = userStatusFilter === "all"
                      ? allCadernoDetails
                      : allCadernoDetails.filter((d) => {
                          const pct = d.total > 0 ? Math.round((d.answered / d.total) * 100) : 0
                          if (userStatusFilter === "completed") return pct === 100
                          if (userStatusFilter === "in_progress") return pct > 0 && pct < 100
                          if (userStatusFilter === "pending") return pct === 0
                          return true
                        })
                    const incompleteCadernos = cadernoDetails.filter((d) => d.answered < d.total)
                    const hasDetails = cadernoDetails.length > 0

                    return (
                      <Fragment key={`${rowKey}_${idx}`}>
                        <tr
                          className={`border-b last:border-0 ${hasDetails ? "cursor-pointer hover:bg-muted/50 transition-colors" : ""}`}
                          onClick={() => hasDetails && toggleUserExpand(rowKey)}
                        >
                          <td className="py-3 pr-2">
                            {hasDetails && (
                              <button
                                className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-foreground transition-colors"
                                aria-label={isExpanded ? "Recolher" : "Expandir"}
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </button>
                            )}
                          </td>
                          <td className="py-3 pr-4 font-medium break-words whitespace-normal align-top">{u.userName}</td>
                          <td className="py-3 pr-4 text-muted-foreground break-words whitespace-normal align-top">{u.userEmail}</td>
                          <td className="py-3 pr-4 break-words whitespace-normal align-top">{u.companyName}</td>
                          <td className="py-3 pr-4 text-right tabular-nums align-top">
                            {u.answered}/{u.total}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums align-top">{u.percentage}%</td>
                          <td className="py-3 align-top">
                            {u.percentage === 100 ? (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100">
                                Concluido
                              </Badge>
                            ) : u.percentage > 0 ? (
                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 hover:bg-blue-100">
                                Em Progresso
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Pendente
                              </Badge>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b last:border-0">
                            <td colSpan={7} className="p-0">
                              <div className="bg-muted/30 px-6 py-3 ml-8 border-l-2 border-primary/20">
                                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                  {userStatusFilter === "all" ? (
                                    <>
                                      Cadernos ({cadernoDetails.length})
                                      {incompleteCadernos.length > 0 && (
                                        <span className="ml-2 text-amber-600 dark:text-amber-400 font-normal">
                                          {incompleteCadernos.length} pendente(s)
                                        </span>
                                      )}
                                    </>
                                  ) : userStatusFilter === "completed" ? (
                                    <>Cadernos concluidos ({cadernoDetails.length} de {allCadernoDetails.length})</>
                                  ) : userStatusFilter === "in_progress" ? (
                                    <>Cadernos em progresso ({cadernoDetails.length} de {allCadernoDetails.length})</>
                                  ) : (
                                    <>Cadernos pendentes ({cadernoDetails.length} de {allCadernoDetails.length})</>
                                  )}
                                </p>
                                <div className="space-y-1.5">
                                  {cadernoDetails.map((d) => {
                                    const pct = d.total > 0 ? Math.round((d.answered / d.total) * 100) : 0
                                    return (
                                      <div
                                        key={`${d.cadernoId}_${d.companyId}`}
                                        className="flex items-center gap-3 text-sm py-1"
                                      >
                                        <BookMarked className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                        <span className="font-medium flex-1 truncate" title={d.cadernoName}>
                                          {d.cadernoName}
                                        </span>
                                        <span className="tabular-nums text-muted-foreground text-xs shrink-0">
                                          {d.answered}/{d.total}
                                        </span>
                                        <div className="w-20 shrink-0">
                                          <div className="h-1.5 w-full rounded-full bg-muted">
                                            <div
                                              className={`h-full rounded-full transition-all ${
                                                pct === 100
                                                  ? "bg-emerald-500"
                                                  : pct > 0
                                                    ? "bg-blue-500"
                                                    : "bg-muted-foreground/30"
                                              }`}
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                        </div>
                                        <span className="tabular-nums text-xs text-muted-foreground w-8 text-right shrink-0">
                                          {pct}%
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
              {userStatusFilter !== "all"
                ? "Nenhum usuario encontrado com esse status"
                : "Nenhum usuario atribuido aos cadernos"}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
