"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

import { type Organization, type ReportingPeriod, organizationService } from "@/lib/organization"
import { testDataGenerator } from "@/lib/test-data-generator"
import { initializeGRIDisclosures } from "@/lib/gri-disclosures-data"
import { employeeDataService } from "@/lib/employee-data"

import {
  Users,
  Shield,
  FileText,
  Hourglass,
  TestTube,
  Trash2,
  Kanban,
  UsersIcon,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  RefreshCw,
} from "lucide-react"
import Link from "next/link"

const steps = [
  { title: "Organização", description: "Informações básicas e filiais" },
  { title: "Período de Relatório", description: "Escopo e cronograma" },
  { title: "Dados de Funcionários", description: "Matriz da força de trabalho" },
  { title: "Governança", description: "Conselho e liderança" },
  { title: "Revisão", description: "Validação final" },
]

export default function DashboardPage() {
  const router = useRouter()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [reportingPeriod, setReportingPeriod] = useState<ReportingPeriod | null>(null)
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false)
  const [isLoadingStats, setIsLoadingStats] = useState(true)

  const [stats, setStats] = useState({
    totalDisclosures: 40,
    completedDisclosures: 0,
    inProgressDisclosures: 0,
    pendingDisclosures: 40,
    totalEmployees: 0,
    governanceScore: 0,
  })

  // 📊 FUNÇÃO QUE CARREGA ESTATÍSTICAS DO LOCALSTORAGE
  const fetchDisclosureStats = () => {
    try {
      setIsLoadingStats(true)

      const allResponses = JSON.parse(localStorage.getItem("gri-responses") || "{}")
      const completed = Object.keys(allResponses).filter(
        (key) => allResponses[key] && allResponses[key].trim() !== "",
      ).length

      const total = 40

      setStats((prev) => ({
        ...prev,
        totalDisclosures: total,
        completedDisclosures: completed,
        inProgressDisclosures: 0,
        pendingDisclosures: total - completed,
      }))
    } catch (error) {
      console.error("[v0] Error in fetchDisclosureStats:", error)
    } finally {
      setIsLoadingStats(false)
    }
  }

  // 🚀 CARREGA DADOS INICIAIS DO DASHBOARD
  useEffect(() => {
    initializeGRIDisclosures()

    const existingOrg = organizationService.getOrganization()
    const existingPeriod = organizationService.getReportingPeriod()

    setOrganization(existingOrg)
    setReportingPeriod(existingPeriod)

    const employeeMatrices = employeeDataService.getEmployeeMatrices()
    const totalEmployees = employeeMatrices.reduce(
      (sum, matrix) => sum + matrix.data.reduce((s, cell) => s + cell.count, 0),
      0,
    )

    setStats((prev) => ({
      ...prev,
      totalEmployees,
    }))

    fetchDisclosureStats()
  }, [])

  const handleGenerateTestData = async () => {
    setIsGeneratingTestData(true)
    try {
      await testDataGenerator.generateCompleteTestData()
      window.location.reload()
    } catch (error) {
      console.error("Erro ao gerar dados de teste:", error)
    } finally {
      setIsGeneratingTestData(false)
    }
  }

  const handleClearTestData = async () => {
    try {
      await testDataGenerator.clearAllTestData()
      window.location.reload()
    } catch (error) {
      console.error("Erro ao limpar dados de teste:", error)
    }
  }

  const completionRate =
    stats.totalDisclosures > 0 ? Math.round((stats.completedDisclosures / stats.totalDisclosures) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                <Hourglass className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Dashboard Estratégico</h1>
                <p className="text-sm text-muted-foreground">{organization?.legalName || "Sua Organização"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={fetchDisclosureStats} disabled={isLoadingStats}>
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingStats ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
              <Button variant="outline" size="sm" onClick={handleGenerateTestData} disabled={isGeneratingTestData}>
                <TestTube className="w-4 h-4 mr-2" />
                {isGeneratingTestData ? "Gerando..." : "Dados de Teste"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleClearTestData}>
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Dados
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* KPIs */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* CARD 1 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Conclusão</CardTitle>
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="text-3xl font-bold text-muted-foreground animate-pulse">--</div>
              ) : (
                <div className="text-3xl font-bold text-primary">{completionRate}%</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {stats.completedDisclosures} de {stats.totalDisclosures} disclosures
              </p>
              <Progress value={completionRate} className="mt-3 h-2" />
            </CardContent>
          </Card>

          {/* CARD 2 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Em Progresso</CardTitle>
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="text-3xl font-bold text-muted-foreground animate-pulse">--</div>
              ) : (
                <div className="text-3xl font-bold">{stats.inProgressDisclosures}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Cadernos sendo preenchidos</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-blue-600">
                <TrendingUp className="w-3 h-3" />
                <span>Ativo</span>
              </div>
            </CardContent>
          </Card>

          {/* CARD 3 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pendentes</CardTitle>
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingStats ? (
                <div className="text-3xl font-bold text-muted-foreground animate-pulse">--</div>
              ) : (
                <div className="text-3xl font-bold">{stats.pendingDisclosures}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">Aguardando preenchimento</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-yellow-600">
                <Clock className="w-3 h-3" />
                <span>Atenção necessária</span>
              </div>
            </CardContent>
          </Card>

          {/* CARD 4 */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Funcionários</CardTitle>
                <UsersIcon className="w-5 h-5 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalEmployees}</div>
              <p className="text-xs text-muted-foreground mt-1">Registrados no sistema</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-purple-600">
                <TrendingUp className="w-3 h-3" />
                <span>Dados coletados</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 🔗 ACESSO RÁPIDO */}
        <Card>
          <CardHeader>
            <CardTitle>Acesso Rápido às Seções</CardTitle>
            <CardDescription>Navegue diretamente para as áreas principais do sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent" asChild>
                <Link href="/dashboard/status">
                  <Kanban className="w-6 h-6" />
                  <span className="font-medium">Kanban Tático</span>
                  <span className="text-xs text-muted-foreground">Acompanhar progresso</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent" asChild>
                <Link href="/dashboard/employees">
                  <Users className="w-6 h-6" />
                  <span className="font-medium">Dados de Funcionários</span>
                  <span className="text-xs text-muted-foreground">GRI 2-7 e 2-8</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent" asChild>
                <Link href="/dashboard/governance">
                  <Shield className="w-6 h-6" />
                  <span className="font-medium">Governança</span>
                  <span className="text-xs text-muted-foreground">GRI 2-9 a 2-21</span>
                </Link>
              </Button>

              <Button variant="outline" className="h-auto py-4 flex-col gap-2 bg-transparent" asChild>
                <Link href="/dashboard/export">
                  <FileText className="w-6 h-6" />
                  <span className="font-medium">Exportar Relatório</span>
                  <span className="text-xs text-muted-foreground">Gerar PDF/XLSX</span>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
