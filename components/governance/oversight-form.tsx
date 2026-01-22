"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUpload } from "@/components/ui/file-upload"
import { Eye } from "lucide-react"
import type { FileMetadata } from "@/lib/file-service"

interface OversightData {
  hasRiskManagement: boolean
  riskManagementDescription?: string
  hasInternalAudit: boolean
  internalAuditDescription?: string
  hasComplianceProgram: boolean
  complianceProgramDescription?: string
  boardMeetingFrequency: string
  boardMeetingAttendance: string
  hasPerformanceEvaluation: boolean
  performanceEvaluationDescription?: string
  hasSuccessionPlanning: boolean
  successionPlanningDescription?: string
}

interface OversightFormProps {
  initialData?: OversightData
  onSubmit: (data: OversightData) => void
  onBack: () => void
}

export function OversightForm({ initialData, onSubmit, onBack }: OversightFormProps) {
  const [oversight, setOversight] = useState<OversightData>(
    initialData || {
      hasRiskManagement: false,
      hasInternalAudit: false,
      hasComplianceProgram: false,
      boardMeetingFrequency: "",
      boardMeetingAttendance: "",
      hasPerformanceEvaluation: false,
      hasSuccessionPlanning: false,
    },
  )
  const [error, setError] = useState("")

  const updateOversight = (key: keyof OversightData, value: boolean | string) => {
    setOversight((prev) => ({ ...prev, [key]: value }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (!oversight.boardMeetingFrequency.trim()) {
      errors.push("Por favor, informe a frequência das reuniões do conselho")
    }

    return errors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    setError(errors.join(". "))

    if (errors.length === 0) {
      onSubmit(oversight)
    }
  }

  const handleFileUploaded = (file: FileMetadata) => {
    console.log("Oversight document uploaded:", file)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Eye className="w-5 h-5 text-accent" />
          </div>
          <div>
            <CardTitle>Supervisão e Processos de Governança</CardTitle>
            <CardDescription>
              Estruturas de supervisão, gestão de riscos e processos de governança (GRI 2-12 a 2-18)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Risk Management */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Gestão de Riscos</h3>
                <p className="text-sm text-muted-foreground">
                  A organização possui um programa formal de gestão de riscos?
                </p>
              </div>
              <Switch
                checked={oversight.hasRiskManagement}
                onCheckedChange={(checked) => updateOversight("hasRiskManagement", checked)}
              />
            </div>

            {oversight.hasRiskManagement && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Descrição do Programa de Gestão de Riscos *</Label>
                  <Textarea
                    value={oversight.riskManagementDescription || ""}
                    onChange={(e) => updateOversight("riskManagementDescription", e.target.value)}
                    placeholder="Descreva como a organização identifica, avalia e gerencia riscos..."
                    rows={3}
                  />
                </div>
                <FileUpload category="governance" onFileUploaded={handleFileUploaded} maxFiles={2} />
              </div>
            )}
          </Card>

          {/* Internal Audit */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Auditoria Interna</h3>
                <p className="text-sm text-muted-foreground">Existe uma função de auditoria interna independente?</p>
              </div>
              <Switch
                checked={oversight.hasInternalAudit}
                onCheckedChange={(checked) => updateOversight("hasInternalAudit", checked)}
              />
            </div>

            {oversight.hasInternalAudit && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Descrição da Auditoria Interna *</Label>
                  <Textarea
                    value={oversight.internalAuditDescription || ""}
                    onChange={(e) => updateOversight("internalAuditDescription", e.target.value)}
                    placeholder="Descreva a estrutura, escopo e independência da auditoria interna..."
                    rows={3}
                  />
                </div>
                <FileUpload category="governance" onFileUploaded={handleFileUploaded} maxFiles={2} />
              </div>
            )}
          </Card>

          {/* Compliance Program */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Programa de Compliance</h3>
                <p className="text-sm text-muted-foreground">A organização possui um programa formal de compliance?</p>
              </div>
              <Switch
                checked={oversight.hasComplianceProgram}
                onCheckedChange={(checked) => updateOversight("hasComplianceProgram", checked)}
              />
            </div>

            {oversight.hasComplianceProgram && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Descrição do Programa de Compliance *</Label>
                  <Textarea
                    value={oversight.complianceProgramDescription || ""}
                    onChange={(e) => updateOversight("complianceProgramDescription", e.target.value)}
                    placeholder="Descreva o programa de compliance, monitoramento e treinamentos..."
                    rows={3}
                  />
                </div>
                <FileUpload category="governance" onFileUploaded={handleFileUploaded} maxFiles={2} />
              </div>
            )}
          </Card>

          {/* Board Meetings */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Reuniões do Conselho</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="meetingFrequency">Frequência das Reuniões *</Label>
                <Input
                  id="meetingFrequency"
                  value={oversight.boardMeetingFrequency}
                  onChange={(e) => updateOversight("boardMeetingFrequency", e.target.value)}
                  placeholder="ex: Mensalmente, Trimestralmente"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meetingAttendance">Taxa de Participação Média</Label>
                <Input
                  id="meetingAttendance"
                  value={oversight.boardMeetingAttendance}
                  onChange={(e) => updateOversight("boardMeetingAttendance", e.target.value)}
                  placeholder="ex: 95%, 8 de 10 membros"
                />
              </div>
            </div>
          </Card>

          {/* Performance Evaluation */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Avaliação de Desempenho</h3>
                <p className="text-sm text-muted-foreground">O conselho realiza avaliações periódicas de desempenho?</p>
              </div>
              <Switch
                checked={oversight.hasPerformanceEvaluation}
                onCheckedChange={(checked) => updateOversight("hasPerformanceEvaluation", checked)}
              />
            </div>

            {oversight.hasPerformanceEvaluation && (
              <div className="space-y-2">
                <Label>Descrição do Processo de Avaliação *</Label>
                <Textarea
                  value={oversight.performanceEvaluationDescription || ""}
                  onChange={(e) => updateOversight("performanceEvaluationDescription", e.target.value)}
                  placeholder="Descreva como e com que frequência são realizadas as avaliações..."
                  rows={3}
                />
              </div>
            )}
          </Card>

          {/* Succession Planning */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Planejamento de Sucessão</h3>
                <p className="text-sm text-muted-foreground">Existe um plano de sucessão para posições-chave?</p>
              </div>
              <Switch
                checked={oversight.hasSuccessionPlanning}
                onCheckedChange={(checked) => updateOversight("hasSuccessionPlanning", checked)}
              />
            </div>

            {oversight.hasSuccessionPlanning && (
              <div className="space-y-2">
                <Label>Descrição do Planejamento de Sucessão *</Label>
                <Textarea
                  value={oversight.successionPlanningDescription || ""}
                  onChange={(e) => updateOversight("successionPlanningDescription", e.target.value)}
                  placeholder="Descreva o processo de planejamento de sucessão para liderança..."
                  rows={3}
                />
              </div>
            )}
          </Card>

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onBack}>
              Voltar
            </Button>
            <Button type="submit">Continuar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
