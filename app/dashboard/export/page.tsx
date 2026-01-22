"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ExportDialog } from "@/components/export/export-dialog"
import { ReportExport } from "@/components/analytics/report-export"
import { organizationService } from "@/lib/organization"
import { employeeDataService } from "@/lib/employee-data"
import { Building2, Users, Shield, FileText, BarChart3, Leaf, ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { ExportData } from "@/lib/export-service"
import { createClient } from "@/lib/supabase/client"

export default function ExportPage() {
  const router = useRouter()
  const [exportData, setExportData] = useState<ExportData | null>(null)
  const [disclosureStats, setDisclosureStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
  })

  useEffect(() => {
    loadExportData()
    loadDisclosureStats()

    // Listen for data updates
    const handleDataUpdate = () => {
      loadExportData()
      loadDisclosureStats()
    }
    window.addEventListener("esg-data-updated", handleDataUpdate)
    window.addEventListener("storage", handleDataUpdate)

    return () => {
      window.removeEventListener("esg-data-updated", handleDataUpdate)
      window.removeEventListener("storage", handleDataUpdate)
    }
  }, [])

  const loadDisclosureStats = async () => {
    try {
      const supabase = createClient()
      const { data: disclosures, error } = await supabase.from("gri_disclosures").select("*")

      if (error) {
        console.error("[v0] Error fetching disclosures:", error)
        return
      }

      if (disclosures) {
        const total = disclosures.length
        const completed = disclosures.filter((d) => d.status === "completed" || d.progress === 100).length
        const inProgress = disclosures.filter(
          (d) => d.status === "in_progress" || (d.progress > 0 && d.progress < 100),
        ).length

        setDisclosureStats({ total, completed, inProgress })
      }
    } catch (error) {
      console.error("[v0] Error loading disclosure stats:", error)
    }
  }

  const loadExportData = () => {
    // Load organization data
    const organization = organizationService.getOrganization()
    const reportingPeriod = organizationService.getReportingPeriod()

    // Load real employee data from localStorage
    const employeeMatrices = employeeDataService.getEmployeeMatrices()
    const nonEmployeeWorkers = employeeDataService.getNonEmployeeWorkers()

    // Load governance data from localStorage
    const governanceDataStr = typeof window !== "undefined" ? localStorage.getItem("esg-governance-data") : null
    const governanceData = governanceDataStr ? JSON.parse(governanceDataStr) : null

    // Load policies data from localStorage
    const policiesDataStr = typeof window !== "undefined" ? localStorage.getItem("esg-policies-data") : null
    const policies = policiesDataStr ? JSON.parse(policiesDataStr) : null

    const realExportData: ExportData = {
      organization,
      reportingPeriod,
      employeeMatrices,
      nonEmployeeWorkers,
      governanceData,
      policies,
    }

    setExportData(realExportData)
  }

  if (!exportData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados...</p>
        </div>
      </div>
    )
  }

  const getSectionStatus = (hasData: boolean, dataQuality?: "complete" | "partial" | "empty") => {
    if (!hasData) {
      return <Badge variant="outline">Pendente</Badge>
    }

    if (dataQuality === "complete") {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          Completo
        </Badge>
      )
    }

    if (dataQuality === "partial") {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">
          Parcial
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="bg-accent text-accent-foreground">
        Completo
      </Badge>
    )
  }

  const getEmployeeDataQuality = () => {
    if (!exportData.employeeMatrices?.length) return "empty"

    const hasEmployeeData = exportData.employeeMatrices.some((matrix) => matrix.data.some((cell) => cell.count > 0))
    const hasNonEmployeeData =
      exportData.nonEmployeeWorkers &&
      (exportData.nonEmployeeWorkers.contractors > 0 ||
        exportData.nonEmployeeWorkers.freelancers > 0 ||
        exportData.nonEmployeeWorkers.temporaryWorkers > 0)

    if (hasEmployeeData && hasNonEmployeeData) return "complete"
    if (hasEmployeeData || hasNonEmployeeData) return "partial"
    return "empty"
  }

  const getGovernanceDataQuality = () => {
    if (!exportData.governanceData) return "empty"

    const data = exportData.governanceData
    const hasBoard = data.boardComposition && data.boardComposition.totalMembers > 0
    const hasCompensation = data.executiveCompensation && data.executiveCompensation.hasESGMetrics
    const hasRisk = data.riskManagement && data.riskManagement.hasESGRiskFramework

    const completedSections = [hasBoard, hasCompensation, hasRisk].filter(Boolean).length

    if (completedSections === 3) return "complete"
    if (completedSections > 0) return "partial"
    return "empty"
  }

  const getPoliciesDataQuality = () => {
    if (!exportData.policies) return "empty"

    const policies = Object.values(exportData.policies)
    const existingPolicies = policies.filter((policy: any) => policy.exists).length

    if (existingPolicies >= 5) return "complete"
    if (existingPolicies > 0) return "partial"
    return "empty"
  }

  const getDisclosureDataQuality = () => {
    if (disclosureStats.total === 0) return "empty"
    const completionRate = (disclosureStats.completed / disclosureStats.total) * 100
    if (completionRate >= 75) return "complete"
    if (completionRate > 0) return "partial"
    return "empty"
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Exportar Relatório ESG</h1>
                <p className="text-sm text-muted-foreground">
                  {exportData.organization?.legalName || "Sua Organização"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Demo Platform</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="outline" className="mb-6 bg-transparent" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Painel
          </Link>
        </Button>

        {/* Export Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Resumo do Relatório</CardTitle>
            <CardDescription>Revise o status de cada seção antes de exportar seu relatório GRI 2021</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Organização</span>
                  </div>
                  {getSectionStatus(
                    !!exportData.organization?.legalName,
                    exportData.organization?.legalName && exportData.organization?.cnpj ? "complete" : "partial",
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Período de Relatório</span>
                  </div>
                  {getSectionStatus(
                    !!exportData.reportingPeriod?.startDate,
                    exportData.reportingPeriod?.startDate && exportData.reportingPeriod?.endDate
                      ? "complete"
                      : "partial",
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium">Dados de Funcionários</span>
                  </div>
                  {getSectionStatus(!!exportData.employeeMatrices?.length, getEmployeeDataQuality())}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Disclosures GRI</span>
                  </div>
                  {getSectionStatus(disclosureStats.total > 0, getDisclosureDataQuality())}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium">Governança</span>
                  </div>
                  {getSectionStatus(!!exportData.governanceData, getGovernanceDataQuality())}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-accent" />
                    <span className="text-sm font-medium">Políticas e Ética</span>
                  </div>
                  {getSectionStatus(!!exportData.policies, getPoliciesDataQuality())}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-secondary" />
                    <span className="text-sm font-medium">Trabalhadores Não Empregados</span>
                  </div>
                  {getSectionStatus(
                    !!exportData.nonEmployeeWorkers,
                    exportData.nonEmployeeWorkers?.total > 0 ? "complete" : "empty",
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-3">Resumo dos Dados</h4>
              <div className="grid md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Funcionários Total</p>
                  <p className="font-medium">
                    {exportData.employeeMatrices?.reduce((total, matrix) => total + matrix.totals.total, 0) || 0}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Unidades</p>
                  <p className="font-medium">{exportData.employeeMatrices?.length || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trabalhadores Não-Empregados</p>
                  <p className="font-medium">{exportData.nonEmployeeWorkers?.total || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Disclosures Completos</p>
                  <p className="font-medium">
                    {disclosureStats.completed}/{disclosureStats.total}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8">
          <ReportExport
            organizationId={exportData.organization?.id || "default"}
            organizationName={exportData.organization?.legalName || "Sua Organização"}
          />
        </div>

        {/* Export Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Exportação Rápida</CardTitle>
            <CardDescription>Ou use a exportação rápida para gerar relatórios com configurações padrão</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ExportDialog data={exportData}>
                <Button size="lg" className="bg-primary hover:bg-primary/90">
                  <FileText className="w-5 h-5 mr-2" />
                  Exportar Relatório Rápido
                </Button>
              </ExportDialog>
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Sobre a Exportação</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Relatórios são gerados conforme padrões GRI 2021</li>
                <li>• Formato XLSX permite edição e análise posterior</li>
                <li>• Formato PDF é ideal para apresentações e arquivamento</li>
                <li>• Todos os dados são validados antes da exportação</li>
                <li>• Dados são calculados em tempo real baseados nas informações preenchidas</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
