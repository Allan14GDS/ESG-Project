"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileText, FileSpreadsheet, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReportExportProps {
  organizationId: string
  organizationName: string
}

export function ReportExport({ organizationId, organizationName }: ReportExportProps) {
  const [format, setFormat] = useState<"pdf" | "excel">("pdf")
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const [sections, setSections] = useState({
    executiveSummary: true,
    organizationProfile: true,
    materialityAssessment: true,
    disclosures: true,
    employeeData: true,
    governanceStructure: true,
    performanceMetrics: true,
    riskManagement: true,
  })

  const handleExport = async () => {
    setIsExporting(true)

    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Relatório exportado",
        description: `Seu relatório ${format.toUpperCase()} foi gerado com sucesso.`,
      })

      // In a real implementation, this would trigger a download
      console.log("[v0] Exporting report:", { format, sections, organizationId })
    } catch (error) {
      console.error("[v0] Error exporting report:", error)
      toast({
        title: "Erro ao exportar",
        description: "Não foi possível gerar o relatório. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const toggleSection = (section: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const selectedCount = Object.values(sections).filter(Boolean).length

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exportar Relatório ESG</CardTitle>
        <CardDescription>Gere um relatório completo com os dados coletados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Format Selection */}
        <div className="space-y-2">
          <Label>Formato do Relatório</Label>
          <Select value={format} onValueChange={(value: any) => setFormat(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  PDF - Relatório Completo
                </div>
              </SelectItem>
              <SelectItem value="excel">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel - Dados Tabulados
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Section Selection */}
        <div className="space-y-3">
          <Label>Seções do Relatório ({selectedCount} selecionadas)</Label>
          <div className="space-y-3 border rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="executiveSummary"
                checked={sections.executiveSummary}
                onCheckedChange={() => toggleSection("executiveSummary")}
              />
              <label
                htmlFor="executiveSummary"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Sumário Executivo
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="organizationProfile"
                checked={sections.organizationProfile}
                onCheckedChange={() => toggleSection("organizationProfile")}
              />
              <label
                htmlFor="organizationProfile"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Perfil Organizacional (GRI 2-1 a 2-6)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="materialityAssessment"
                checked={sections.materialityAssessment}
                onCheckedChange={() => toggleSection("materialityAssessment")}
              />
              <label
                htmlFor="materialityAssessment"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Avaliação de Materialidade
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="disclosures"
                checked={sections.disclosures}
                onCheckedChange={() => toggleSection("disclosures")}
              />
              <label
                htmlFor="disclosures"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Disclosures GRI Completos
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="employeeData"
                checked={sections.employeeData}
                onCheckedChange={() => toggleSection("employeeData")}
              />
              <label
                htmlFor="employeeData"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Dados de Funcionários (GRI 2-7, 2-8)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="governanceStructure"
                checked={sections.governanceStructure}
                onCheckedChange={() => toggleSection("governanceStructure")}
              />
              <label
                htmlFor="governanceStructure"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Estrutura de Governança (GRI 2-9 a 2-21)
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="performanceMetrics"
                checked={sections.performanceMetrics}
                onCheckedChange={() => toggleSection("performanceMetrics")}
              />
              <label
                htmlFor="performanceMetrics"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Métricas de Performance ESG
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="riskManagement"
                checked={sections.riskManagement}
                onCheckedChange={() => toggleSection("riskManagement")}
              />
              <label
                htmlFor="riskManagement"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Gestão de Riscos ESG
              </label>
            </div>
          </div>
        </div>

        {/* Export Button */}
        <Button onClick={handleExport} disabled={isExporting || selectedCount === 0} className="w-full">
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Gerando relatório...
            </>
          ) : (
            <>
              <Download className="w-4 h-4 mr-2" />
              Exportar Relatório {format.toUpperCase()}
            </>
          )}
        </Button>

        {selectedCount === 0 && (
          <p className="text-sm text-muted-foreground text-center">Selecione pelo menos uma seção para exportar</p>
        )}
      </CardContent>
    </Card>
  )
}
