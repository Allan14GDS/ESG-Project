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
import { DollarSign } from "lucide-react"
import type { FileMetadata } from "@/lib/file-service"

interface CompensationData {
  hasCompensationPolicy: boolean
  compensationPolicyDescription?: string
  hasPerformanceBasedPay: boolean
  performanceBasedPayDescription?: string
  hasEquityCompensation: boolean
  equityCompensationDescription?: string
  executiveCompensationRatio: string
  compensationCommitteeExists: boolean
  compensationCommitteeDescription?: string
  hasClawbackPolicy: boolean
  clawbackPolicyDescription?: string
  compensationDisclosureLevel: string
}

interface CompensationFormProps {
  initialData?: CompensationData
  onSubmit: (data: CompensationData) => void
  onBack: () => void
}

export function CompensationForm({ initialData, onSubmit, onBack }: CompensationFormProps) {
  const [compensation, setCompensation] = useState<CompensationData>(
    initialData || {
      hasCompensationPolicy: false,
      hasPerformanceBasedPay: false,
      hasEquityCompensation: false,
      executiveCompensationRatio: "",
      compensationCommitteeExists: false,
      hasClawbackPolicy: false,
      compensationDisclosureLevel: "",
    },
  )
  const [error, setError] = useState("")

  const updateCompensation = (key: keyof CompensationData, value: boolean | string) => {
    setCompensation((prev) => ({ ...prev, [key]: value }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (compensation.hasCompensationPolicy && !compensation.compensationPolicyDescription?.trim()) {
      errors.push("Por favor, descreva a política de remuneração")
    }
    if (compensation.hasPerformanceBasedPay && !compensation.performanceBasedPayDescription?.trim()) {
      errors.push("Por favor, descreva a remuneração baseada em desempenho")
    }
    if (compensation.hasEquityCompensation && !compensation.equityCompensationDescription?.trim()) {
      errors.push("Por favor, descreva a remuneração em ações")
    }
    if (compensation.compensationCommitteeExists && !compensation.compensationCommitteeDescription?.trim()) {
      errors.push("Por favor, descreva o comitê de remuneração")
    }
    if (compensation.hasClawbackPolicy && !compensation.clawbackPolicyDescription?.trim()) {
      errors.push("Por favor, descreva a política de clawback")
    }
    if (!compensation.compensationDisclosureLevel.trim()) {
      errors.push("Por favor, informe o nível de divulgação da remuneração")
    }

    return errors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    setError(errors.join(". "))

    if (errors.length === 0) {
      onSubmit(compensation)
    }
  }

  const handleFileUploaded = (file: FileMetadata) => {
    console.log("Compensation document uploaded:", file)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <CardTitle>Remuneração Executiva</CardTitle>
            <CardDescription>
              Políticas de remuneração, estruturas de incentivos e divulgações (GRI 2-19 a 2-21)
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

          {/* Compensation Policy */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Política de Remuneração</h3>
                <p className="text-sm text-muted-foreground">
                  A organização possui uma política formal de remuneração executiva?
                </p>
              </div>
              <Switch
                checked={compensation.hasCompensationPolicy}
                onCheckedChange={(checked) => updateCompensation("hasCompensationPolicy", checked)}
              />
            </div>

            {compensation.hasCompensationPolicy && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Descrição da Política de Remuneração *</Label>
                  <Textarea
                    value={compensation.compensationPolicyDescription || ""}
                    onChange={(e) => updateCompensation("compensationPolicyDescription", e.target.value)}
                    placeholder="Descreva os princípios, estrutura e processo de determinação da remuneração..."
                    rows={3}
                  />
                </div>
                <FileUpload category="governance" onFileUploaded={handleFileUploaded} maxFiles={2} />
              </div>
            )}
          </Card>

          {/* Performance-Based Pay */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Remuneração Baseada em Desempenho</h3>
                <p className="text-sm text-muted-foreground">
                  Existe remuneração variável baseada em metas de desempenho?
                </p>
              </div>
              <Switch
                checked={compensation.hasPerformanceBasedPay}
                onCheckedChange={(checked) => updateCompensation("hasPerformanceBasedPay", checked)}
              />
            </div>

            {compensation.hasPerformanceBasedPay && (
              <div className="space-y-2">
                <Label>Descrição da Remuneração Variável *</Label>
                <Textarea
                  value={compensation.performanceBasedPayDescription || ""}
                  onChange={(e) => updateCompensation("performanceBasedPayDescription", e.target.value)}
                  placeholder="Descreva as métricas de desempenho, metas e estrutura de incentivos..."
                  rows={3}
                />
              </div>
            )}
          </Card>

          {/* Equity Compensation */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Remuneração em Ações</h3>
                <p className="text-sm text-muted-foreground">
                  A organização oferece remuneração baseada em ações ou opções?
                </p>
              </div>
              <Switch
                checked={compensation.hasEquityCompensation}
                onCheckedChange={(checked) => updateCompensation("hasEquityCompensation", checked)}
              />
            </div>

            {compensation.hasEquityCompensation && (
              <div className="space-y-2">
                <Label>Descrição da Remuneração em Ações *</Label>
                <Textarea
                  value={compensation.equityCompensationDescription || ""}
                  onChange={(e) => updateCompensation("equityCompensationDescription", e.target.value)}
                  placeholder="Descreva os planos de ações, opções e períodos de carência..."
                  rows={3}
                />
              </div>
            )}
          </Card>

          {/* Compensation Metrics */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Métricas de Remuneração</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compensationRatio">Razão de Remuneração Executiva</Label>
                <Input
                  id="compensationRatio"
                  value={compensation.executiveCompensationRatio}
                  onChange={(e) => updateCompensation("executiveCompensationRatio", e.target.value)}
                  placeholder="ex: 15:1, 25:1"
                />
                <p className="text-xs text-muted-foreground">
                  Razão entre a remuneração do CEO e a remuneração mediana dos funcionários
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="disclosureLevel">Nível de Divulgação *</Label>
                <Input
                  id="disclosureLevel"
                  value={compensation.compensationDisclosureLevel}
                  onChange={(e) => updateCompensation("compensationDisclosureLevel", e.target.value)}
                  placeholder="ex: Completa, Parcial, Mínima"
                />
              </div>
            </div>
          </Card>

          {/* Compensation Committee */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Comitê de Remuneração</h3>
                <p className="text-sm text-muted-foreground">Existe um comitê independente para definir remuneração?</p>
              </div>
              <Switch
                checked={compensation.compensationCommitteeExists}
                onCheckedChange={(checked) => updateCompensation("compensationCommitteeExists", checked)}
              />
            </div>

            {compensation.compensationCommitteeExists && (
              <div className="space-y-2">
                <Label>Descrição do Comitê de Remuneração *</Label>
                <Textarea
                  value={compensation.compensationCommitteeDescription || ""}
                  onChange={(e) => updateCompensation("compensationCommitteeDescription", e.target.value)}
                  placeholder="Descreva a composição, independência e responsabilidades do comitê..."
                  rows={3}
                />
              </div>
            )}
          </Card>

          {/* Clawback Policy */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Política de Clawback</h3>
                <p className="text-sm text-muted-foreground">
                  Existe política para recuperar remuneração em casos de má conduta?
                </p>
              </div>
              <Switch
                checked={compensation.hasClawbackPolicy}
                onCheckedChange={(checked) => updateCompensation("hasClawbackPolicy", checked)}
              />
            </div>

            {compensation.hasClawbackPolicy && (
              <div className="space-y-2">
                <Label>Descrição da Política de Clawback *</Label>
                <Textarea
                  value={compensation.clawbackPolicyDescription || ""}
                  onChange={(e) => updateCompensation("clawbackPolicyDescription", e.target.value)}
                  placeholder="Descreva as circunstâncias e processo para recuperação de remuneração..."
                  rows={3}
                />
              </div>
            )}
          </Card>

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onBack}>
              Voltar
            </Button>
            <Button type="submit">Finalizar Governança</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
