"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { FileUpload } from "@/components/ui/file-upload"
import { Calendar } from "lucide-react"
import type { ReportingPeriod } from "@/lib/organization"
import type { FileMetadata } from "@/lib/file-service"

interface ReportingPeriodFormProps {
  initialData?: ReportingPeriod
  onSubmit: (data: ReportingPeriod) => void
  onBack: () => void
}

export function ReportingPeriodForm({ initialData, onSubmit, onBack }: ReportingPeriodFormProps) {
  const [startDate, setStartDate] = useState(initialData?.startDate || "")
  const [endDate, setEndDate] = useState(initialData?.endDate || "")
  const [entitiesIncluded, setEntitiesIncluded] = useState(initialData?.entitiesIncluded || "")
  const [hasRestatement, setHasRestatement] = useState(initialData?.restatement.hasRestatement || false)
  const [restatementDescription, setRestatementDescription] = useState(initialData?.restatement.description || "")
  const [hasAssurance, setHasAssurance] = useState(initialData?.externalAssurance.hasAssurance || false)
  const [assuranceFiles, setAssuranceFiles] = useState<FileMetadata[]>([])
  const [error, setError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!startDate || !endDate || !entitiesIncluded) {
      setError("Por favor, preencha todos os campos obrigatórios")
      return
    }

    if (hasRestatement && !restatementDescription) {
      setError("Por favor, forneça uma descrição para a reapresentação")
      return
    }

    if (hasAssurance && assuranceFiles.length === 0) {
      setError("Por favor, faça upload do documento de verificação externa")
      return
    }

    const reportingPeriodData: ReportingPeriod = {
      startDate,
      endDate,
      entitiesIncluded,
      restatement: {
        hasRestatement,
        description: hasRestatement ? restatementDescription : undefined,
      },
      externalAssurance: {
        hasAssurance,
        documentId: hasAssurance && assuranceFiles.length > 0 ? assuranceFiles[0].id : undefined,
      },
    }

    onSubmit(reportingPeriodData)
  }

  const handleAssuranceFileUploaded = (file: FileMetadata) => {
    setAssuranceFiles([file]) // Only allow one assurance file
  }

  const handleAssuranceFileDeleted = () => {
    setAssuranceFiles([])
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-accent" />
          </div>
          <div>
            <CardTitle>Período e Escopo do Relatório</CardTitle>
            <CardDescription>Defina o período de relatório e entidades cobertas no seu relatório ESG</CardDescription>
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

          {/* Reporting Period */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Início do Período de Relatório *</Label>
              <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fim do Período de Relatório *</Label>
              <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          {/* Entities Included */}
          <div className="space-y-2">
            <Label htmlFor="entitiesIncluded">Entidades Incluídas no Relatório *</Label>
            <Textarea
              id="entitiesIncluded"
              value={entitiesIncluded}
              onChange={(e) => setEntitiesIncluded(e.target.value)}
              placeholder="Liste todas as entidades, subsidiárias e joint ventures incluídas neste relatório ESG..."
              rows={4}
            />
          </div>

          {/* Restatement */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Reapresentação de Informações</h3>
                <p className="text-sm text-muted-foreground">
                  Você está reapresentando informações de relatórios anteriores?
                </p>
              </div>
              <Switch checked={hasRestatement} onCheckedChange={setHasRestatement} />
            </div>

            {hasRestatement && (
              <div className="space-y-2">
                <Label htmlFor="restatementDescription">Descrição e Motivo da Reapresentação *</Label>
                <Textarea
                  id="restatementDescription"
                  value={restatementDescription}
                  onChange={(e) => setRestatementDescription(e.target.value)}
                  placeholder="Descreva quais informações estão sendo reapresentadas e por quê..."
                  rows={3}
                />
              </div>
            )}
          </Card>

          {/* External Assurance */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Verificação Externa</h3>
                <p className="text-sm text-muted-foreground">Este relatório foi verificado externamente?</p>
              </div>
              <Switch checked={hasAssurance} onCheckedChange={setHasAssurance} />
            </div>

            {hasAssurance && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Por favor, faça upload da sua declaração ou certificado de verificação externa.
                </p>
                <FileUpload
                  category="assurance"
                  onFileUploaded={handleAssuranceFileUploaded}
                  onFileDeleted={handleAssuranceFileDeleted}
                  maxFiles={1}
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
