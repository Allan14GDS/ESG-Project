"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BookOpen, FileText, CheckCircle2, Clock, AlertCircle, Building2, ChevronRight } from "lucide-react"

export function DemoDashboard({ userName }: { userName: string }) {
  // Demo data
  const demoHoldings = [
    {
      id: "demo-holding-1",
      name: "Grupo Sustentável S.A.",
      type: "holding",
      cnpj: "12.345.678/0001-90",
      companies: [
        {
          id: "demo-company-1",
          name: "Empresa Verde Ltda.",
          cnpj: "98.765.432/0001-11",
          cadernos: [
            {
              id: "demo-caderno-1",
              name: "Caderno ESG 2024",
              description: "Avaliação ESG completa",
              questionsCount: 45,
              answeredCount: 30,
              needsCorrection: 2,
              status: "in_progress" as const,
            },
            {
              id: "demo-caderno-2",
              name: "Governança Corporativa",
              description: "Práticas de governança",
              questionsCount: 25,
              answeredCount: 25,
              needsCorrection: 0,
              status: "completed" as const,
            },
          ],
          totalCadernos: 2,
          completedCadernos: 1,
          inProgressCadernos: 1,
          pendingCadernos: 0,
          needsCorrection: 2,
        },
        {
          id: "demo-company-2",
          name: "Eco Soluções Brasil",
          cnpj: "11.222.333/0001-44",
          cadernos: [
            {
              id: "demo-caderno-3",
              name: "Caderno ESG 2024",
              description: "Avaliação ESG completa",
              questionsCount: 45,
              answeredCount: 0,
              needsCorrection: 0,
              status: "pending" as const,
            },
          ],
          totalCadernos: 1,
          completedCadernos: 0,
          inProgressCadernos: 0,
          pendingCadernos: 1,
          needsCorrection: 0,
        },
      ],
      totalCadernos: 3,
      completedCadernos: 1,
      inProgressCadernos: 1,
      pendingCadernos: 1,
      needsCorrection: 2,
    },
  ]

  const totalCadernos = 3
  const completedCadernos = 1
  const inProgressCadernos = 1
  const pendingCadernos = 1
  const totalNeedsCorrection = 2

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        {/* Demo Mode Banner */}
        <Alert className="mb-8 border-blue-500 bg-blue-50 dark:bg-blue-950/30">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900 dark:text-blue-200">Modo Demonstração</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-300">
            Você está visualizando dados de demonstração. Para usar a versão completa, abra em uma nova aba e configure o Supabase.
          </AlertDescription>
        </Alert>

        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Meus Cadernos</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Olá, {userName}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Aqui estão os cadernos atribuídos a você para preenchimento
          </p>
        </div>

        {/* Correction Alert */}
        {totalNeedsCorrection > 0 && (
          <Alert className="mb-8 border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100 dark:border-amber-600 dark:from-amber-950/50 dark:to-amber-900/50 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 dark:bg-amber-600">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-2">
                  Atenção: Você tem {totalNeedsCorrection} {totalNeedsCorrection === 1 ? "questão" : "questões"} para corrigir
                </AlertTitle>
                <AlertDescription className="text-base text-amber-800 dark:text-amber-300">
                  Clique nos cadernos marcados com o ícone amarelo abaixo para revisar e corrigir as respostas.
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="border-border/50 bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Cadernos</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{totalCadernos}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{completedCadernos}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Progresso</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{inProgressCadernos}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="mt-2 text-3xl font-bold text-gray-600 dark:text-gray-400">{pendingCadernos}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-900/30">
                  <AlertCircle className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings and Companies */}
        <div className="space-y-6">
          {demoHoldings.map((holding) => (
            <Card key={holding.id} className="border-border/50 bg-card">
              <CardContent className="p-6">
                {/* Holding Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{holding.name}</h2>
                      <p className="mt-1 text-sm text-muted-foreground">CNPJ: {holding.cnpj}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {holding.totalCadernos} cadernos
                        </Badge>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {holding.completedCadernos} concluídos
                        </Badge>
                        {holding.needsCorrection > 0 && (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                            {holding.needsCorrection} para corrigir
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Companies */}
                <div className="space-y-4">
                  {holding.companies.map((company) => (
                    <div key={company.id} className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">{company.name}</h3>
                          <p className="text-sm text-muted-foreground">CNPJ: {company.cnpj}</p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant="outline" className="text-xs">
                            {company.completedCadernos}/{company.totalCadernos} completos
                          </Badge>
                        </div>
                      </div>

                      {/* Cadernos */}
                      <div className="space-y-2">
                        {company.cadernos.map((caderno) => (
                          <div
                            key={caderno.id}
                            className="flex items-center justify-between rounded-md border border-border bg-card p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{caderno.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  {caderno.answeredCount} de {caderno.questionsCount} questões respondidas
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {caderno.status === "completed" && (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                  Completo
                                </Badge>
                              )}
                              {caderno.status === "in_progress" && (
                                <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                  Em Progresso
                                </Badge>
                              )}
                              {caderno.status === "pending" && (
                                <Badge variant="secondary">Pendente</Badge>
                              )}
                              {caderno.needsCorrection > 0 && (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                  {caderno.needsCorrection} para corrigir
                                </Badge>
                              )}
                              <ChevronRight className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {demoHoldings.length === 0 && (
          <Card className="border-border/50 bg-card">
            <CardContent className="flex flex-col items-center justify-center p-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-foreground">Nenhum caderno atribuído</h3>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Você ainda não tem cadernos atribuídos. Entre em contato com seu gestor.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
