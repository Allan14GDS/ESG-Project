"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { FileText, Download, CheckCircle, AlertTriangle, FileSpreadsheet } from "lucide-react"
import { ExportService, type ExportData, type ExportProgress } from "@/lib/export-service"

interface ExportDialogProps {
  data: ExportData
  disabled?: boolean
  children: React.ReactNode
}

export function ExportDialog({ data, disabled, children }: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const handleExport = async (format: "xlsx" | "pdf") => {
    // Validate data first
    const validation = ExportService.validateExportData(data)
    if (!validation.isValid) {
      setValidationErrors(validation.errors)
      return
    }

    setValidationErrors([])
    setIsExporting(true)
    setExportProgress(null)

    try {
      const onProgress = (progress: ExportProgress) => {
        setExportProgress(progress)
      }

      let blob: Blob
      let filename: string

      if (format === "xlsx") {
        blob = await ExportService.generateXLSX(data, onProgress)
        filename = `relatorio-esg-${data.organization?.legalName?.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.xlsx`
      } else {
        blob = await ExportService.generatePDF(data, onProgress)
        filename = `relatorio-esg-${data.organization?.legalName?.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.pdf`
      }

      ExportService.downloadFile(blob, filename)

      // Close dialog after successful export
      setTimeout(() => {
        setIsOpen(false)
        setIsExporting(false)
        setExportProgress(null)
      }, 1500)
    } catch (error) {
      console.error("Export failed:", error)
      setValidationErrors(["Erro ao gerar relatório. Tente novamente."])
      setIsExporting(false)
      setExportProgress(null)
    }
  }

  const getCompletionStats = () => {
    let completed = 0
    const total = 6 // Total sections

    if (data.organization?.legalName) completed++
    if (data.reportingPeriod?.startDate) completed++
    if (data.employeeMatrices?.length) completed++
    if (data.nonEmployeeWorkers) completed++
    if (data.governanceData) completed++
    if (data.policies) completed++

    return { completed, total, percentage: Math.round((completed / total) * 100) }
  }

  const stats = getCompletionStats()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Exportar Relatório ESG
          </DialogTitle>
          <DialogDescription>Gere seu relatório GRI 2021 em formato XLSX ou PDF</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Completion Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status de Conclusão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso Geral</span>
                <span className="text-sm text-muted-foreground">
                  {stats.completed}/{stats.total} seções
                </span>
              </div>
              <Progress value={stats.percentage} className="h-2 mb-3" />
              <div className="flex items-center gap-2">
                {stats.percentage === 100 ? (
                  <Badge variant="secondary" className="bg-accent text-accent-foreground">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Completo
                  </Badge>
                ) : (
                  <Badge variant="outline">
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    {stats.percentage}% Completo
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p className="font-medium">Corrija os seguintes problemas:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Export Progress */}
          {isExporting && exportProgress && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Gerando Relatório</span>
                    <span className="text-sm text-muted-foreground">{exportProgress.progress}%</span>
                  </div>
                  <Progress value={exportProgress.progress} className="h-2" />
                  <p className="text-sm text-muted-foreground">{exportProgress.message}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Export Options */}
          {!isExporting && (
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                      <FileSpreadsheet className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-medium">Planilha XLSX</h3>
                      <p className="text-sm text-muted-foreground">Formato editável para análise</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExport("xlsx")}
                    className="w-full"
                    disabled={validationErrors.length > 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar XLSX
                  </Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Relatório PDF</h3>
                      <p className="text-sm text-muted-foreground">Formato final para apresentação</p>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleExport("pdf")}
                    variant="outline"
                    className="w-full"
                    disabled={validationErrors.length > 0}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar PDF
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Export Info */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• Os relatórios são gerados conforme padrões GRI 2021</p>
            <p>• Dados são validados automaticamente antes da exportação</p>
            <p>• Arquivos incluem timestamp e informações da organização</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
