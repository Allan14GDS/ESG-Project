"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FileUpload } from "@/components/ui/file-upload"
import { FileText } from "lucide-react"
import type { GovernancePolicies } from "@/lib/governance-data"
import type { FileMetadata } from "@/lib/file-service"

interface PoliciesFormProps {
  initialData?: GovernancePolicies
  onSubmit: (data: GovernancePolicies) => void
  onBack: () => void
}

export function PoliciesForm({ initialData, onSubmit, onBack }: PoliciesFormProps) {
  const [policies, setPolicies] = useState<GovernancePolicies>(
    initialData || {
      hasEthicsCode: false,
      hasConflictPolicy: false,
      hasWhistleblowerPolicy: false,
      hasAntiCorruptionPolicy: false,
      hasDiversityPolicy: false,
    },
  )
  const [error, setError] = useState("")

  const updatePolicy = (key: keyof GovernancePolicies, value: boolean | string) => {
    setPolicies((prev) => ({ ...prev, [key]: value }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    // Check required descriptions for enabled policies
    if (policies.hasEthicsCode && !policies.ethicsCodeDescription?.trim()) {
      errors.push("Por favor, forneça uma descrição para o Código de Ética")
    }
    if (policies.hasConflictPolicy && !policies.conflictPolicyDescription?.trim()) {
      errors.push("Por favor, forneça uma descrição para a Política de Conflito de Interesses")
    }
    if (policies.hasWhistleblowerPolicy && !policies.whistleblowerPolicyDescription?.trim()) {
      errors.push("Por favor, forneça uma descrição para a Política de Denúncias")
    }
    if (policies.hasAntiCorruptionPolicy && !policies.antiCorruptionPolicyDescription?.trim()) {
      errors.push("Por favor, forneça uma descrição para a Política Anticorrupção")
    }
    if (policies.hasDiversityPolicy && !policies.diversityPolicyDescription?.trim()) {
      errors.push("Por favor, forneça uma descrição para a Política de Diversidade")
    }

    return errors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    setError(errors.join(". "))

    if (errors.length === 0) {
      onSubmit(policies)
    }
  }

  const handlePolicyFileUploaded = (file: FileMetadata) => {
    // Handle policy document uploads
    console.log("Policy document uploaded:", file)
  }

  const PolicyCard = ({
    title,
    description,
    hasKey,
    descriptionKey,
  }: {
    title: string
    description: string
    hasKey: keyof GovernancePolicies
    descriptionKey: keyof GovernancePolicies
  }) => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-medium">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Switch
          checked={policies[hasKey] as boolean}
          onCheckedChange={(checked) => {
            updatePolicy(hasKey, checked)
          }}
        />
      </div>

      {policies[hasKey] && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Descrição e Implementação da Política *</Label>
            <Textarea
              value={(policies[descriptionKey] as string) || ""}
              onChange={(e) => {
                e.stopPropagation()
                updatePolicy(descriptionKey, e.target.value)
              }}
              placeholder={`Descreva sua ${title.toLowerCase()}, seu escopo, implementação e principais disposições...`}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Documentos de Apoio (opcional)</Label>
            <FileUpload category="policy" onFileUploaded={handlePolicyFileUploaded} maxFiles={3} />
          </div>
        </div>
      )}
    </Card>
  )

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Políticas e Ética de Governança</CardTitle>
            <CardDescription>
              Políticas corporativas, estruturas éticas e medidas de conformidade (GRI 2-12 a 2-16)
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

          <div className="space-y-6">
            <PolicyCard
              title="Código de Ética"
              description="Sua organização possui um código de ética formal?"
              hasKey="hasEthicsCode"
              descriptionKey="ethicsCodeDescription"
            />

            <PolicyCard
              title="Política de Conflito de Interesses"
              description="Vocês têm políticas para gerenciar conflitos de interesse?"
              hasKey="hasConflictPolicy"
              descriptionKey="conflictPolicyDescription"
            />

            <PolicyCard
              title="Política de Denúncias"
              description="Existe um mecanismo para relatar preocupações ou violações?"
              hasKey="hasWhistleblowerPolicy"
              descriptionKey="whistleblowerPolicyDescription"
            />

            <PolicyCard
              title="Política Anticorrupção"
              description="Vocês têm políticas anticorrupção e antissuborno?"
              hasKey="hasAntiCorruptionPolicy"
              descriptionKey="antiCorruptionPolicyDescription"
            />

            <PolicyCard
              title="Política de Diversidade e Inclusão"
              description="Existem políticas formais de diversidade e inclusão?"
              hasKey="hasDiversityPolicy"
              descriptionKey="diversityPolicyDescription"
            />
          </div>

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
