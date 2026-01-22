"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, HelpCircle, Building2, ChevronDown, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

interface Company {
  id: string
  name: string
  cnpj: string
  holding_id: string
  templates: any[]
}

interface QuestionsPageClientProps {
  companiesWithTemplates: Company[]
  questionCountByTemplate: Record<string, number>
  totalCompanies: number
  totalTemplates: number
  totalQuestions: number
}

export function QuestionsPageClient({
  companiesWithTemplates,
  questionCountByTemplate,
  totalCompanies,
  totalTemplates,
  totalQuestions,
}: QuestionsPageClientProps) {
  // State for expanded companies
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(
    new Set(companiesWithTemplates.map((c) => c.id)),
  )

  const [error, setError] = useState<string | null>(null)

  const toggleCompany = (companyId: string) => {
    setExpandedCompanies((prev) => {
      const next = new Set(prev)
      if (next.has(companyId)) {
        next.delete(companyId)
      } else {
        next.add(companyId)
      }
      return next
    })
  }

  const expandAll = () => {
    setExpandedCompanies(new Set(companiesWithTemplates.map((c) => c.id)))
  }

  const collapseAll = () => {
    setExpandedCompanies(new Set())
  }

  const allExpanded = expandedCompanies.size === companiesWithTemplates.length
  const allCollapsed = expandedCompanies.size === 0

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2 text-red-600">Erro</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => setError(null)} variant="outline">
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <button className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar ao Dashboard
            </button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Meus Cadernos</h1>
          <p className="text-muted-foreground">Cadernos atribuídos às empresas das suas holdings</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Empresas</p>
                  <p className="text-3xl font-bold">{totalCompanies}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Cadernos</p>
                  <p className="text-3xl font-bold">{totalTemplates}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Questões</p>
                  <p className="text-3xl font-bold">{totalQuestions}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Expand/Collapse Controls */}
        <div className="flex items-center justify-end gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={expandAll} disabled={allExpanded}>
            Expandir Todos
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} disabled={allCollapsed}>
            Recolher Todos
          </Button>
        </div>

        {/* Companies and Templates List */}
        <div className="space-y-6">
          {companiesWithTemplates.map((company) => {
            const isExpanded = expandedCompanies.has(company.id)

            return (
              <Card key={company.id} className="border-border/50">
                <CardHeader
                  className="border-b border-border/50 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleCompany(company.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button className="p-1 hover:bg-muted rounded transition-colors">
                        {isExpanded ? (
                          <ChevronDown className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        )}
                      </button>
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{company.cnpj}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{company.templates.length} caderno(s)</Badge>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-6">
                    {company.templates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum caderno atribuído a esta empresa
                      </p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {company.templates.map((template: any) => {
                          const questionCount = questionCountByTemplate[template.id] || 0
                          return (
                            <Link
                              key={template.id}
                              href={`/dashboard/questionnaire/${template.id}?company=${company.id}`}
                              className="group block"
                            >
                              <Card className="border-border/50 hover:border-primary/50 transition-all hover:shadow-md">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <BookOpen className="h-4 w-4 text-primary shrink-0" />
                                        <h4 className="font-semibold text-sm group-hover:text-primary transition-colors truncate">
                                          {template.name}
                                        </h4>
                                      </div>
                                      {template.description && (
                                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                                          {template.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2">
                                        {template.type && (
                                          <Badge variant="outline" className="text-xs">
                                            {template.type}
                                          </Badge>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                          {questionCount} questão(ões)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
