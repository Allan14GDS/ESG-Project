"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
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
  CalendarDays,
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

interface AdminDashboardClientProps {
  holdings: Holding[]
  companies: Company[]
  answerCountsEntries: [string, number][]
  questionCountEntries: [string, number][]
  companyTemplatesEntries: [string, string[]][]
  dailyCountsData: { date: string; company_id: string | null; count: number }[]
  last30Days: string[]
  totalTemplates: number
  totalQuestions: number
  totalUsers: number
  totalAnswers: number
  initialYear: number
}

export function AdminDashboardClient({
  holdings,
  companies,
  answerCountsEntries,
  questionCountEntries,
  companyTemplatesEntries,
  dailyCountsData,
  last30Days,
  totalTemplates,
  totalQuestions,
  totalUsers,
  totalAnswers,
  initialYear,
}: AdminDashboardClientProps) {
  const router = useRouter()
  const [selectedHoldingId, setSelectedHoldingId] = useState<string>("all")
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("all")
  const [selectedYear, setSelectedYear] = useState<string>(String(initialYear))

  const handleYearChange = (value: string) => {
    setSelectedYear(value)
    router.push(`?year=${value}`)
  }

  // Rebuild maps from serialized entries
  const answerCountsMap = useMemo(
    () => new Map(answerCountsEntries),
    [answerCountsEntries]
  )
  const questionCountMap = useMemo(
    () => new Map(questionCountEntries),
    [questionCountEntries]
  )
  const companyTemplatesMap = useMemo(
    () => new Map(companyTemplatesEntries),
    [companyTemplatesEntries]
  )

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

  // Filtered stats
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

    // Count unique questions across visible templates
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

  // Company progress bars (filtered)
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

  // Answers by day (filtered) - uses server-generated date list and pre-aggregated counts
  const answersByDay = useMemo(() => {
    const dayMap = new Map<string, number>()
    // Use server-generated dates to avoid timezone mismatches
    for (const day of last30Days) {
      dayMap.set(day, 0)
    }

    for (const entry of dailyCountsData) {
      if (entry.company_id && !visibleCompanyIds.has(entry.company_id)) continue
      const day = entry.date
      if (day && dayMap.has(day)) {
        dayMap.set(day, (dayMap.get(day) || 0) + entry.count)
      }
    }

    return Array.from(dayMap.entries()).map(([date, count]) => ({ date, count }))
  }, [dailyCountsData, last30Days, visibleCompanyIds])

  const answersLast7Days = answersByDay.slice(-7).reduce((sum, d) => sum + d.count, 0)

  // Is filtered?
  const isFiltered = selectedHoldingId !== "all" || selectedCompanyId !== "all"

  // Handle holding change
  const handleHoldingChange = (value: string) => {
    setSelectedHoldingId(value)
    setSelectedCompanyId("all")
  }

  // Determine which holding count to show
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

              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedYear} onValueChange={handleYearChange}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Ano de Referência" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026">2026 (Atual)</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  {isFiltered ? filteredStats.filteredTemplateCount : totalTemplates}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isFiltered ? filteredStats.filteredQuestionTotal : totalQuestions} questões
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
                <p className="text-sm font-medium text-muted-foreground">Usuários</p>
                <p className="mt-2 text-3xl font-bold">{totalUsers}</p>
                <p className="text-xs text-muted-foreground mt-1">cadastrados no sistema</p>
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
                  {answersLast7Days} nos últimos 7 dias
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
                  <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
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
    </div>
  )
}
