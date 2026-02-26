"use client"

import { useState, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Upload, FileSpreadsheet, Columns, Eye, Rocket, Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import { MigrationPreviewTable } from "./migration-preview-table"
import { getTargetFields } from "@/lib/migration/column-detector"
import type { MigrationPreviewResult, MigrationPreviewItem, ColumnMapping } from "@/lib/migration/types"

interface MigrationWizardProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: { id: string; name: string; type: string }
  onComplete: () => void
}

type WizardStep = "upload" | "columns" | "preview" | "execute"

const STEPS: { key: WizardStep; label: string; icon: React.ReactNode }[] = [
  { key: "upload", label: "Upload", icon: <Upload className="h-4 w-4" /> },
  { key: "columns", label: "Colunas", icon: <Columns className="h-4 w-4" /> },
  { key: "preview", label: "Preview", icon: <Eye className="h-4 w-4" /> },
  { key: "execute", label: "Executar", icon: <Rocket className="h-4 w-4" /> },
]

export function MigrationWizard({ open, onOpenChange, template, onComplete }: MigrationWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [previewResult, setPreviewResult] = useState<MigrationPreviewResult | null>(null)
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [executionResult, setExecutionResult] = useState<any>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  const targetFields = getTargetFields()

  const reset = useCallback(() => {
    setStep("upload")
    setFile(null)
    setIsLoading(false)
    setPreviewResult(null)
    setColumnMapping(null)
    setHeaders([])
    setExecutionResult(null)
    setIsExecuting(false)
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const dropped = e.dataTransfer.files[0]
    if (dropped && (dropped.name.endsWith(".xlsx") || dropped.name.endsWith(".xls"))) {
      setFile(dropped)
    } else {
      toast.error("Por favor, selecione um arquivo .xlsx ou .xls")
    }
  }

  const handleUploadAndDetect = async () => {
    if (!file) return
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("templateId", template.id)

      const res = await fetch("/api/admin/migration/preview", { method: "POST", body: formData })
      const json = await res.json()

      if (!res.ok) {
        // If we got column mapping back, show it for manual override
        if (json.columnMapping) {
          setColumnMapping(json.columnMapping)
          setHeaders(json.headers || [])
          setStep("columns")
          toast.error(json.error || "Erro na deteccao de colunas")
        } else {
          toast.error(json.error || "Erro ao processar arquivo")
        }
        return
      }

      setPreviewResult(json.data)
      setColumnMapping(json.data.columnMapping)
      setStep("preview")
    } catch (err: any) {
      toast.error(err.message || "Erro ao enviar arquivo")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetryWithMapping = async () => {
    if (!file || !columnMapping) return
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("templateId", template.id)
      formData.append("columnMapping", JSON.stringify(columnMapping))

      const res = await fetch("/api/admin/migration/preview", { method: "POST", body: formData })
      const json = await res.json()

      if (!res.ok) {
        toast.error(json.error || "Erro ao processar")
        return
      }

      setPreviewResult(json.data)
      setColumnMapping(json.data.columnMapping)
      setStep("preview")
    } catch (err: any) {
      toast.error(err.message || "Erro")
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleItem = (index: number) => {
    if (!previewResult) return
    const updated = [...previewResult.matched]
    updated[index] = { ...updated[index], included: !updated[index].included }
    setPreviewResult({ ...previewResult, matched: updated })
  }

  const handleExecute = async () => {
    if (!previewResult) return
    setShowConfirmDialog(false)
    setIsExecuting(true)
    setStep("execute")

    try {
      const includedItems = previewResult.matched
        .filter((item) => item.included && item.changes.length > 0)

      if (includedItems.length === 0) {
        toast.info("Nenhuma questao com alteracoes para aplicar")
        setIsExecuting(false)
        return
      }

      // Re-build metadata for each item by re-calling preview with execute items
      // Actually we need the full metadata objects - let's re-upload to get them
      const formData = new FormData()
      formData.append("file", file!)
      formData.append("templateId", template.id)
      if (columnMapping) {
        formData.append("columnMapping", JSON.stringify(columnMapping))
      }

      // Get fresh preview to have the metadata objects
      const previewRes = await fetch("/api/admin/migration/preview", { method: "POST", body: formData })
      const previewJson = await previewRes.json()
      if (!previewRes.ok) throw new Error(previewJson.error)

      // Now send the included items to execute
      // We need to build the execute payload from the preview data
      // The execute endpoint expects { questionId, metadata, metadata_v2 }
      // We'll send the questionIds and let the server re-compute with the Excel
      const executeRes = await fetch("/api/admin/migration/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: template.id,
          templateName: template.name,
          totalExcelRows: previewResult.totalExcelRows,
          totalUnmatched: previewResult.unmatched.length,
          columnMapping: previewResult.columnMapping,
          items: includedItems.map((item) => ({
            questionId: item.questionId,
            // The execute endpoint will fetch current metadata and apply updates
            metadata: previewJson.data.matched.find((m: any) => m.questionId === item.questionId)?.metadata || {},
            metadata_v2: previewJson.data.matched.find((m: any) => m.questionId === item.questionId)?.metadata_v2 || {},
          })),
        }),
      })

      const executeJson = await executeRes.json()

      if (!executeRes.ok) {
        throw new Error(executeJson.error || "Erro na execucao")
      }

      setExecutionResult(executeJson.data)
      toast.success(`Migracao concluida: ${executeJson.data.success} questoes atualizadas`)
    } catch (err: any) {
      toast.error(err.message || "Erro na execucao da migracao")
      setExecutionResult({ success: 0, errors: [{ questionId: "?", error: err.message }], skipped: 0 })
    } finally {
      setIsExecuting(false)
    }
  }

  const handleClose = () => {
    if (executionResult && executionResult.success > 0) {
      onComplete()
    }
    reset()
    onOpenChange(false)
  }

  const currentStepIndex = STEPS.findIndex((s) => s.key === step)
  const includedCount = previewResult?.matched.filter((m) => m.included && m.changes.length > 0).length || 0

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
              Migracao: {template.name}
            </DialogTitle>
            <DialogDescription>Enriquecer metadados das questoes com dados do Excel</DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="flex items-center gap-2 py-3 border-b">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1">
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    i === currentStepIndex
                      ? "bg-primary text-primary-foreground"
                      : i < currentStepIndex
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {s.icon}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className="w-4 h-px bg-border" />}
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="py-4 min-h-[300px]">
            {/* STEP 1: Upload */}
            {step === "upload" && (
              <div className="space-y-6">
                <div
                  className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("migration-file-input")?.click()}
                >
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm font-medium">Arraste um arquivo Excel ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground mt-1">Formatos aceitos: .xlsx, .xls</p>
                  <input
                    id="migration-file-input"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {file && (
                  <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardContent className="p-4 flex items-center gap-3">
                      <FileSpreadsheet className="h-8 w-8 text-emerald-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button onClick={handleUploadAndDetect} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Analisando...
                          </>
                        ) : (
                          "Analisar"
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* STEP 2: Column Mapping */}
            {step === "columns" && columnMapping && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-amber-600 mb-4">
                  <AlertTriangle className="h-4 w-4" />
                  <p className="text-sm font-medium">Ajuste o mapeamento de colunas se necessario</p>
                </div>

                <div className="grid gap-3">
                  {targetFields.map((tf) => (
                    <div key={tf.field} className="grid grid-cols-2 gap-3 items-center">
                      <Label className="text-sm">{tf.label}</Label>
                      <Select
                        value={(columnMapping as any)[tf.field] || "__none__"}
                        onValueChange={(val) => {
                          const updated = { ...columnMapping }
                          if (val === "__none__") {
                            delete (updated as any)[tf.field]
                          } else {
                            ;(updated as any)[tf.field] = val
                          }
                          setColumnMapping(updated)
                        }}
                      >
                        <SelectTrigger className="text-sm h-9">
                          <SelectValue placeholder="Nenhuma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">-- Nenhuma --</SelectItem>
                          {headers.map((h) => (
                            <SelectItem key={h} value={h}>
                              {h}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setStep("upload")}>
                    Voltar
                  </Button>
                  <Button onClick={handleRetryWithMapping} disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      "Aplicar e Analisar"
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: Preview */}
            {step === "preview" && previewResult && (
              <div className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Card className="border-emerald-200 bg-emerald-50/50">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-700">{previewResult.matched.length}</p>
                      <p className="text-xs text-emerald-600">Encontradas</p>
                    </CardContent>
                  </Card>
                  <Card className="border-red-200 bg-red-50/50">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-red-700">{previewResult.unmatched.length}</p>
                      <p className="text-xs text-red-600">Nao encontradas</p>
                    </CardContent>
                  </Card>
                  <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">{previewResult.alreadyEnriched}</p>
                      <p className="text-xs text-blue-600">Ja enriquecidas</p>
                    </CardContent>
                  </Card>
                  <Card className="border-amber-200 bg-amber-50/50">
                    <CardContent className="p-3 text-center">
                      <p className="text-2xl font-bold text-amber-700">{includedCount}</p>
                      <p className="text-xs text-amber-600">A atualizar</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Column Mapping Summary */}
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(previewResult.columnMapping)
                    .filter(([key, val]) => key !== "unmapped" && val)
                    .map(([key, val]) => (
                      <Badge key={key} variant="outline" className="text-xs">
                        {key}: {String(val)}
                      </Badge>
                    ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setHeaders(Object.keys(previewResult.columnMapping).length > 0
                        ? [...Object.values(previewResult.columnMapping).filter(Boolean) as string[], ...previewResult.columnMapping.unmapped]
                        : [])
                      setStep("columns")
                    }}
                  >
                    Editar colunas
                  </Button>
                </div>

                {/* Preview Table */}
                <MigrationPreviewTable
                  matched={previewResult.matched}
                  unmatched={previewResult.unmatched}
                  onToggleItem={handleToggleItem}
                />

                <div className="flex justify-between pt-4 border-t">
                  <Button variant="outline" onClick={() => setStep("upload")}>
                    Voltar
                  </Button>
                  <Button
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={includedCount === 0}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Rocket className="mr-2 h-4 w-4" />
                    Executar Migracao ({includedCount} questoes)
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 4: Execute */}
            {step === "execute" && (
              <div className="flex flex-col items-center justify-center py-8 space-y-6">
                {isExecuting ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
                    <div className="text-center">
                      <p className="text-lg font-semibold">Executando migracao...</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Atualizando metadados de {includedCount} questoes
                      </p>
                    </div>
                  </>
                ) : executionResult ? (
                  <>
                    {executionResult.errors.length === 0 ? (
                      <CheckCircle2 className="h-16 w-16 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="h-16 w-16 text-amber-500" />
                    )}
                    <div className="text-center space-y-2">
                      <p className="text-lg font-semibold">
                        {executionResult.errors.length === 0
                          ? "Migracao concluida com sucesso!"
                          : "Migracao concluida com alertas"}
                      </p>
                      <div className="flex items-center gap-4 justify-center">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          <span className="text-sm">{executionResult.success} atualizadas</span>
                        </div>
                        {executionResult.errors.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm">{executionResult.errors.length} erros</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {executionResult.errors.length > 0 && (
                      <Card className="w-full max-w-md border-red-200">
                        <CardContent className="p-3">
                          <p className="text-xs font-medium text-red-600 mb-2">Erros:</p>
                          {executionResult.errors.map((err: any, i: number) => (
                            <p key={i} className="text-xs text-red-500">
                              {err.questionId}: {err.error}
                            </p>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    <Button onClick={handleClose} className="mt-4">
                      Fechar
                    </Button>
                  </>
                ) : null}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Migracao</AlertDialogTitle>
            <AlertDialogDescription>
              Voce esta prestes a atualizar os metadados de <strong>{includedCount} questoes</strong> no caderno{" "}
              <strong>{template.name}</strong>.
              <br /><br />
              Esta acao ira:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Atualizar campos de framework, disclosure e evidencias</li>
                <li>Criar backup automatico dos dados anteriores</li>
                <li>NAO alterar respostas dos usuarios</li>
                <li>NAO alterar vinculos de questoes</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExecute} className="bg-emerald-600 hover:bg-emerald-700">
              Confirmar e Executar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
