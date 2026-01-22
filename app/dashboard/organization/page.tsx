"use client"

import { useState, useEffect } from "react"
import { OrganizationForm } from "@/components/onboarding/organization-form"
import { organizationService, type Organization } from "@/lib/organization"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, CheckCircle2 } from "lucide-react"

export default function OrganizationPage() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const org = organizationService.getOrganization()
    setOrganization(org)
    setIsLoading(false)
  }, [])

  const handleSubmit = async (org: Organization) => {
    await organizationService.saveOrganization(org)
    setOrganization(org)

    // Disparar evento para atualizar progresso na sidebar
    window.dispatchEvent(new Event("esg-data-updated"))

    // Redirecionar para dashboard
    setTimeout(() => {
      window.location.href = "/dashboard"
    }, 500)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados da organização...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Building2 className="h-8 w-8 text-primary" />
                Dados da Organização
              </h1>
              <p className="text-muted-foreground mt-2">
                GRI 2-1 a 2-6: Informações básicas e detalhes organizacionais
              </p>
            </div>
            {organization && (
              <Badge variant="default" className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Dados Salvos
              </Badge>
            )}
          </div>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">O que você precisará</CardTitle>
              <CardDescription>Informações necessárias para completar esta seção</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">📋 Informações Básicas</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Razão social completa</li>
                    <li>• Forma jurídica (Ltda, S.A., etc.)</li>
                    <li>• CNPJ da matriz</li>
                    <li>• Endereço completo da sede</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">🏢 Filiais e Unidades</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Nome de cada filial</li>
                    <li>• CNPJ de cada unidade</li>
                    <li>• Endereço de cada localização</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form */}
        <OrganizationForm
          initialData={organization || undefined}
          onSubmit={handleSubmit}
          onBack={() => (window.location.href = "/dashboard")}
        />
      </div>
    </div>
  )
}
