"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Building2, FileText, ChevronRight, AlertTriangle, Search, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export type CadernoStatus = "pending" | "in_progress" | "completed"

export interface CadernoItem {
  id: string
  name: string
  description?: string | null
  company_id?: string | null
  organization_id?: string | null
  questionsCount: number
  answeredCount: number
  needsCorrection: number
  status: CadernoStatus
}

export interface CompanyItem {
  id: string
  name: string
  cnpj?: string | null
  totalCadernos: number
  completedCadernos: number
  inProgressCadernos: number
  pendingCadernos: number
  needsCorrection: number
  cadernos: CadernoItem[]
}

export interface HoldingItem {
  id: string
  name: string
  type: "holding" | "standalone" | string
  totalCadernos: number
  completedCadernos: number
  needsCorrection: number
  companies: CompanyItem[]
  directCadernos?: CadernoItem[]
  hasDirectCadernos?: boolean
}

interface MeusCadernosClientProps {
  allHoldingsAndOrgs: HoldingItem[]
  targetYear: number
}

/** Stable React key for a caderno within a company context. */
export function getCadernoKey(caderno: CadernoItem, fallbackCompanyId: string): string {
  const scopeId = caderno.company_id || caderno.organization_id || fallbackCompanyId
  return `${caderno.id}_${scopeId}`
}

/**
 * Removes duplicate holdings, companies and cadernos before render.
 * Cadernos are uniqued by template_id + company/org scope (same key used in the UI).
 */
export function deduplicateHoldingsTree(holdings: HoldingItem[]): HoldingItem[] {
  const seenHoldingIds = new Set<string>()

  return holdings.reduce<HoldingItem[]>((uniqueHoldings, holding) => {
    if (seenHoldingIds.has(holding.id)) {
      return uniqueHoldings
    }
    seenHoldingIds.add(holding.id)

    const seenCompanyIds = new Set<string>()
    const companies = holding.companies.reduce<CompanyItem[]>((uniqueCompanies, company) => {
      if (seenCompanyIds.has(company.id)) {
        return uniqueCompanies
      }
      seenCompanyIds.add(company.id)

      const seenCadernoKeys = new Set<string>()
      const cadernos = company.cadernos.filter((caderno) => {
        const key = getCadernoKey(caderno, company.id)
        if (seenCadernoKeys.has(key)) {
          return false
        }
        seenCadernoKeys.add(key)
        return true
      })

      uniqueCompanies.push({
        ...company,
        cadernos,
        totalCadernos: cadernos.length,
        completedCadernos: cadernos.filter((c) => c.status === "completed").length,
        inProgressCadernos: cadernos.filter((c) => c.status === "in_progress").length,
        pendingCadernos: cadernos.filter((c) => c.status === "pending").length,
        needsCorrection: cadernos.reduce((sum, c) => sum + c.needsCorrection, 0),
      })
      return uniqueCompanies
    }, [])

    uniqueHoldings.push({
      ...holding,
      companies,
    })
    return uniqueHoldings
  }, [])
}

export function MeusCadernosClient({ allHoldingsAndOrgs, targetYear }: MeusCadernosClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }))
  }

  const uniqueHoldings = useMemo(
    () => deduplicateHoldingsTree(allHoldingsAndOrgs),
    [allHoldingsAndOrgs]
  )

  const filteredHoldings = useMemo(() => {
    if (!searchQuery.trim()) {
      return uniqueHoldings
    }

    const query = searchQuery.toLowerCase()

    return uniqueHoldings
      .map((holding) => {
        const filteredCompanies = holding.companies
          .map((company) => {
            const filteredCadernos = company.cadernos.filter((caderno) =>
              caderno.name.toLowerCase().includes(query)
            )

            return filteredCadernos.length > 0
              ? {
                  ...company,
                  cadernos: filteredCadernos,
                  totalCadernos: filteredCadernos.length,
                }
              : null
          })
          .filter((company): company is CompanyItem => company !== null)

        if (filteredCompanies.length > 0) {
          return {
            ...holding,
            companies: filteredCompanies,
          }
        }

        return null
      })
      .filter((holding): holding is HoldingItem => holding !== null)
  }, [uniqueHoldings, searchQuery])

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar cadernos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-muted-foreground">
            {filteredHoldings.length === 0
              ? "Nenhum caderno encontrado"
              : `${filteredHoldings.length} ${filteredHoldings.length === 1 ? "resultado encontrado" : "resultados encontrados"}`}
          </p>
        )}
      </div>

      {/* Holdings List */}
      <div className="space-y-6">
        {filteredHoldings.length === 0 ? (
          <Card className="border-border/50 bg-card">
            <CardContent className="p-0">
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {searchQuery ? "Nenhum caderno encontrado" : "Nenhum caderno atribuído"}
                </h3>
                <p className="text-muted-foreground max-w-md">
                  {searchQuery
                    ? "Tente buscar com outros termos ou limpe a busca para ver todos os cadernos."
                    : "Você ainda não tem cadernos atribuídos para preenchimento."}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredHoldings.map((holding) => (
            <Card key={holding.id} className="border-border/50 bg-card overflow-hidden">
              {/* Holding Header */}
              <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 border-2 border-primary/30">
                      <Building2 className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{holding.name}</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        {holding.type === "holding"
                          ? `${holding.companies.length} ${holding.companies.length === 1 ? "empresa" : "empresas"}`
                          : "Organização"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-center">
                    <div className="text-center px-4 py-2 rounded-lg bg-background/50">
                      <p className="text-2xl font-bold text-foreground">{holding.totalCadernos}</p>
                      <p className="text-xs text-muted-foreground">Cadernos</p>
                    </div>
                    <div className="text-center px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {holding.completedCadernos}
                      </p>
                      <p className="text-xs text-muted-foreground">Concluídos</p>
                    </div>
                    {holding.needsCorrection > 0 && (
                      <div className="text-center px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {holding.needsCorrection}
                        </p>
                        <p className="text-xs text-muted-foreground">Correções</p>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSection(`holding-${holding.id}`)}
                      className="h-10 w-10 p-0"
                    >
                      {expandedSections[`holding-${holding.id}`] === false ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronUp className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Companies within Holding */}
              {expandedSections[`holding-${holding.id}`] !== false && (
                <CardContent className="p-6 space-y-4">
                  {holding.companies.map((company) => (
                    <Card key={`${holding.id}_${company.id}`} className="border-border/50 bg-muted/30">
                      {/* Company Header */}
                      <div className="border-b border-border/50 px-6 py-4 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border/50">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">{company.name}</h3>
                              {company.cnpj && <p className="text-xs text-muted-foreground">CNPJ: {company.cnpj}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="font-medium">
                              {company.totalCadernos} {company.totalCadernos === 1 ? "caderno" : "cadernos"}
                            </Badge>
                            {company.completedCadernos > 0 && (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                {company.completedCadernos}{" "}
                                {company.completedCadernos === 1 ? "concluído" : "concluídos"}
                              </Badge>
                            )}
                            {company.needsCorrection > 0 && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {company.needsCorrection}
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSection(`company-${holding.id}-${company.id}`)}
                              className="h-8 w-8 p-0"
                            >
                              {expandedSections[`company-${holding.id}-${company.id}`] === false ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronUp className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Cadernos for this Company */}
                      {expandedSections[`company-${holding.id}-${company.id}`] !== false && (
                        <CardContent className="p-0">
                          {!company.cadernos || company.cadernos.length === 0 ? (
                            <div className="py-8 text-center">
                              <p className="text-sm text-muted-foreground">Nenhum caderno atribuído</p>
                            </div>
                          ) : (
                            <div className="divide-y divide-border/50">
                              {company.cadernos.map((caderno) => {
                                const cadernoKey = getCadernoKey(caderno, company.id)
                                return (
                                  <Link
                                    key={cadernoKey}
                                    href={`/dashboard/questionnaire/${caderno.id}?company=${caderno.company_id || company.id}&year=${targetYear}`}
                                    className="flex items-center justify-between p-4 hover:bg-background/50 transition-colors group"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                        <FileText className="h-5 w-5 text-primary" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                          {caderno.name}
                                        </h4>
                                        {caderno.description && (
                                          <p className="text-xs text-muted-foreground mt-0.5">{caderno.description}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5">
                                          {caderno.needsCorrection > 0 && (
                                            <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                              <AlertTriangle className="h-3 w-3 mr-1" />
                                              {caderno.needsCorrection}{" "}
                                              {caderno.needsCorrection === 1 ? "correção" : "correções"}
                                            </Badge>
                                          )}
                                          <Badge
                                            variant={
                                              caderno.status === "completed"
                                                ? "default"
                                                : caderno.status === "in_progress"
                                                  ? "secondary"
                                                  : "outline"
                                            }
                                            className={
                                              caderno.status === "completed"
                                                ? "text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                : caderno.status === "in_progress"
                                                  ? "text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                                  : "text-xs"
                                            }
                                          >
                                            {caderno.status === "completed"
                                              ? "Concluído"
                                              : caderno.status === "in_progress"
                                                ? "Em Progresso"
                                                : "Pendente"}
                                          </Badge>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <p className="text-sm font-semibold text-foreground">
                                          {caderno.answeredCount}/{caderno.questionsCount}
                                        </p>
                                        <p className="text-xs text-muted-foreground">questões</p>
                                      </div>
                                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  )
}
