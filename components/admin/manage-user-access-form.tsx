"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, Save, Loader2, Building, CheckCircle2, XCircle, FileText } from "lucide-react"
import { useRouter } from "next/navigation"
import { updateUserAccess } from "@/app/actions/user-access-actions"

interface Props {
  userId: string
  userRole: string
  holdings: any[]
  companies: any[]
  currentMemberships: any[]
  templates: any[]
  currentAssignments: any[]
}

export function ManageUserAccessForm({ userId, userRole, holdings, companies, currentMemberships, templates, currentAssignments }: Props) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const initialHoldingIds = currentMemberships.map((m) => m.organization_id)

  const [selectedHoldings, setSelectedHoldings] = useState<string[]>(initialHoldingIds)
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([])
  
  // Map of company_id -> template_ids[]
  const [companyTemplates, setCompanyTemplates] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {}
    currentAssignments.forEach((assignment: any) => {
      const companyId = assignment.organization_id
      if (!initial[companyId]) {
        initial[companyId] = []
      }
      if (assignment.caderno_id && !initial[companyId].includes(assignment.caderno_id)) {
        initial[companyId].push(assignment.caderno_id)
      }
    })
    return initial
  })

  useEffect(() => {
    const autoSelectedCompanies = companies
      .filter((company) => selectedHoldings.includes(company.holding_id))
      .map((company) => company.id)
    setSelectedCompanies(autoSelectedCompanies)
  }, [selectedHoldings, companies])

  const selectedHoldingsCount = selectedHoldings.length
  const selectedCompaniesCount = selectedCompanies.length

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSaveMessage(null)

    try {
      const result = await updateUserAccess(userId, {
        holdingIds: selectedHoldings,
        companyIds: selectedCompanies,
        companyTemplates: companyTemplates,
      })

      if (result.success) {
        const holdingsText = selectedHoldings.length === 1 ? "1 holding" : `${selectedHoldings.length} holdings`
        const companiesText = selectedCompanies.length === 1 ? "1 empresa" : `${selectedCompanies.length} empresas`
        
        const totalTemplates = Object.values(companyTemplates).flat().length

        if (selectedHoldings.length === 0) {
          setSaveMessage({ type: "success", text: "Todas as permissões foram removidas com sucesso!" })
        } else {
          setSaveMessage({
            type: "success",
            text: `Acesso concedido a ${holdingsText} com ${companiesText} e ${totalTemplates} cadernos atribuídos!`,
          })
        }

        setTimeout(() => {
          router.refresh()
        }, 1500)
      } else {
        setSaveMessage({ type: "error", text: result.error || "Erro ao atualizar acesso. Tente novamente." })
      }
    } catch (error) {
      setSaveMessage({ type: "error", text: "Erro ao salvar alterações. Verifique sua conexão e tente novamente." })
    } finally {
      setIsLoading(false)
    }
  }

  const companiesByHolding = selectedHoldings.map((holdingId) => {
    const holding = holdings.find((h) => h.id === holdingId)
    const holdingCompanies = companies.filter((c) => c.holding_id === holdingId)
    return { holding, companies: holdingCompanies }
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {saveMessage && (
        <Card
          className={`border ${saveMessage.type === "success" ? "border-green-500/50 bg-green-50 dark:bg-green-950/20" : "border-red-500/50 bg-red-50 dark:bg-red-950/20"}`}
        >
          <CardContent className="flex items-center gap-3 py-4">
            {saveMessage.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}
            <p
              className={`text-sm font-medium ${saveMessage.type === "success" ? "text-green-900 dark:text-green-100" : "text-red-900 dark:text-red-100"}`}
            >
              {saveMessage.text}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building2 className="h-5 w-5 text-primary" />
              Holdings Selecionadas
            </CardTitle>
            <CardDescription>Holdings com acesso atribuído</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{selectedHoldingsCount}</p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building className="h-5 w-5 text-primary" />
              Empresas Incluídas
            </CardTitle>
            <CardDescription>Empresas com acesso automático</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{selectedCompaniesCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Building2 className="h-5 w-5 text-primary" />
            Atribuir Holdings
          </CardTitle>
          <CardDescription>
            Selecione as holdings que o usuário pode acessar. As empresas vinculadas serão incluídas automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {holdings.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma holding disponível</p>
          ) : (
            holdings.map((holding) => {
              const companiesCount = companies.filter((c) => c.holding_id === holding.id).length
              return (
                <div key={holding.id} className="flex items-center space-x-3 rounded-lg border border-border/50 p-4">
                  <Checkbox
                    id={`holding-${holding.id}`}
                    checked={selectedHoldings.includes(holding.id)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedHoldings([...selectedHoldings, holding.id])
                      } else {
                        setSelectedHoldings(selectedHoldings.filter((id) => id !== holding.id))
                      }
                    }}
                  />
                  <label
                    htmlFor={`holding-${holding.id}`}
                    className="flex-1 cursor-pointer text-sm font-medium text-foreground"
                  >
                    {holding.name}
                    {holding.cnpj && <span className="ml-2 text-muted-foreground">({holding.cnpj})</span>}
                    {companiesCount > 0 && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        — {companiesCount} {companiesCount === 1 ? "empresa" : "empresas"}
                      </span>
                    )}
                  </label>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>

      {selectedHoldings.length > 0 && (
        <Card className="border-border/50 bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building className="h-5 w-5 text-primary" />
              Empresas e Cadernos
            </CardTitle>
            <CardDescription>Selecione os cadernos que cada empresa terá acesso</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {companiesByHolding.map(({ holding, companies: holdingCompanies }) => (
                <div key={holding?.id} className="space-y-3">
                  <h4 className="font-semibold text-lg text-foreground">{holding?.name}</h4>
                  {holdingCompanies.length === 0 ? (
                    <p className="text-sm text-muted-foreground pl-4">Nenhuma empresa vinculada</p>
                  ) : (
                    <div className="space-y-4 pl-4">
                      {holdingCompanies.map((company) => {
                        const selectedTemplateIds = companyTemplates[company.id] || []
                        return (
                          <Card key={company.id} className="border-border/30 bg-muted/30">
                            <CardHeader className="pb-3">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-foreground">{company.name}</span>
                                {company.cnpj && <span className="text-xs text-muted-foreground">({company.cnpj})</span>}
                              </div>
                              <CardDescription className="text-xs">
                                {selectedTemplateIds.length} {selectedTemplateIds.length === 1 ? "caderno selecionado" : "cadernos selecionados"}
                              </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                              {templates.length === 0 ? (
                                <p className="text-sm text-muted-foreground">Nenhum template disponível</p>
                              ) : (
                                templates.map((template) => (
                                  <div
                                    key={template.id}
                                    className="flex items-center space-x-3 rounded-lg border border-border/30 bg-background/50 p-3"
                                  >
                                    <Checkbox
                                      id={`template-${company.id}-${template.id}`}
                                      checked={selectedTemplateIds.includes(template.id)}
                                      onCheckedChange={(checked) => {
                                        const current = companyTemplates[company.id] || []
                                        if (checked) {
                                          setCompanyTemplates({
                                            ...companyTemplates,
                                            [company.id]: [...current, template.id],
                                          })
                                        } else {
                                          setCompanyTemplates({
                                            ...companyTemplates,
                                            [company.id]: current.filter((id) => id !== template.id),
                                          })
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`template-${company.id}-${template.id}`}
                                      className="flex-1 cursor-pointer"
                                    >
                                      <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-medium text-foreground">{template.name}</span>
                                      </div>
                                      {template.description && (
                                        <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                                      )}
                                    </label>
                                  </div>
                                ))
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={isLoading}
          className="gap-2 rounded-xl bg-primary px-8 text-primary-foreground hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-5 w-5" />
              Salvar Alterações
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
