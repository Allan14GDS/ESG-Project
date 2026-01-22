"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { FileText, User, ArrowRight, ChevronDown, ChevronRight } from "lucide-react"
import { CADERNOS_HIERARCHY, calculateCadernoProgress, getSubCadernos, type Caderno } from "@/lib/cadernos-data"

interface CadernoDisplay extends Caderno {
  progress: number
  answeredQuestions: number
  isExpanded?: boolean
  subCadernos?: CadernoDisplay[]
}

export default function DisclosuresPage() {
  const [cadernos, setCadernos] = useState<CadernoDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadCadernos = () => {
      try {
        const cadernosData: CadernoDisplay[] = CADERNOS_HIERARCHY.filter((c) => !c.parentId) // Apenas cadernos principais
          .map((caderno) => {
            const progress = calculateCadernoProgress(caderno.id)
            const totalQuestions = caderno.questions.length
            const answeredQuestions = Math.round((progress / 100) * totalQuestions)

            // Carregar sub-cadernos
            const subCadernos = getSubCadernos(caderno.id).map((sub) => {
              const subProgress = calculateCadernoProgress(sub.id)
              const subTotal = sub.questions.length
              const subAnswered = Math.round((subProgress / 100) * subTotal)

              return {
                ...sub,
                progress: subProgress,
                answeredQuestions: subAnswered,
              }
            })

            return {
              ...caderno,
              progress,
              answeredQuestions,
              subCadernos,
            }
          })

        setCadernos(cadernosData)
        setLoading(false)
      } catch (error) {
        console.error("[v0] Error loading cadernos:", error)
        setLoading(false)
      }
    }

    loadCadernos()

    const handleStorageChange = () => loadCadernos()
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("esg-data-updated", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("esg-data-updated", handleStorageChange)
    }
  }, [])

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const totalQuestions = cadernos.reduce((sum, c) => {
    const mainTotal = c.questions.length
    const subTotal = c.subCadernos?.reduce((subSum, sub) => subSum + sub.questions.length, 0) || 0
    return sum + mainTotal + subTotal
  }, 0)

  const totalAnswered = cadernos.reduce((sum, c) => {
    const mainAnswered = c.answeredQuestions
    const subAnswered = c.subCadernos?.reduce((subSum, sub) => subSum + sub.answeredQuestions, 0) || 0
    return sum + mainAnswered + subAnswered
  }, 0)

  const overallProgress = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      governance: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      organizational: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      social: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      environmental: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
      operational: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    }

    const labels: Record<string, string> = {
      governance: "Governança",
      organizational: "Organizacional",
      social: "Social",
      environmental: "Ambiental",
      operational: "Operacional",
    }

    return (
      <Badge className={colors[category] || "bg-gray-100 text-gray-800"} variant="secondary">
        {labels[category] || category}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando cadernos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Todos os Cadernos</h1>
          <p className="text-muted-foreground">Sistema completo de coleta GRI 2 + ANEEL + IFRS</p>
        </div>

        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Cadernos</p>
                  <p className="text-3xl font-bold">{CADERNOS_HIERARCHY.length}</p>
                </div>
                <FileText className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Progresso Geral</p>
                  <p className="text-3xl font-bold">{overallProgress}%</p>
                </div>
                <div className="w-12 h-12 flex items-center justify-center">
                  <Progress value={overallProgress} className="w-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Questões Respondidas</p>
                  <p className="text-3xl font-bold">{totalAnswered}</p>
                  <p className="text-xs text-muted-foreground">de {totalQuestions} total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Questões Faltantes</p>
                  <p className="text-3xl font-bold">{totalQuestions - totalAnswered}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cadernos List */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Cadernos</CardTitle>
            <CardDescription>
              Clique em um caderno para preencher as questões. Cadernos com sub-cadernos podem ser expandidos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {cadernos.map((caderno) => (
                <div key={caderno.id}>
                  {/* Caderno Principal */}
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Expand button + Title */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          {caderno.subCadernos && caderno.subCadernos.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => toggleExpand(caderno.id)}
                            >
                              {expandedIds.has(caderno.id) ? (
                                <ChevronDown className="h-4 w-4" />
                              ) : (
                                <ChevronRight className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              {getCategoryBadge(caderno.category)}
                              <h3 className="font-semibold">{caderno.title}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{caderno.description}</p>
                          </div>
                        </div>

                        {/* Middle: Progress */}
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-muted-foreground">Progresso</span>
                              <span className="text-xs font-medium">{caderno.progress}%</span>
                            </div>
                            <Progress value={caderno.progress} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-1">
                              {caderno.answeredQuestions} de {caderno.questions.length} questões
                            </p>
                          </div>
                        </div>

                        {/* Right: Responsible and Action */}
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2 min-w-[150px]">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{caderno.responsible}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => (window.location.href = `/dashboard/cadernos/${caderno.id}`)}
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sub-cadernos */}
                  {expandedIds.has(caderno.id) && caderno.subCadernos && caderno.subCadernos.length > 0 && (
                    <div className="ml-12 mt-2 space-y-2">
                      {caderno.subCadernos.map((subCaderno) => (
                        <Card
                          key={subCaderno.id}
                          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary/30"
                          onClick={() => (window.location.href = `/dashboard/cadernos/${subCaderno.id}`)}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between gap-4">
                              {/* Left: Title */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    Sub-caderno
                                  </Badge>
                                  <h4 className="font-medium text-sm">{subCaderno.title}</h4>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-1">{subCaderno.description}</p>
                              </div>

                              {/* Middle: Progress */}
                              <div className="flex items-center gap-3 min-w-[180px]">
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">Progresso</span>
                                    <span className="text-xs font-medium">{subCaderno.progress}%</span>
                                  </div>
                                  <Progress value={subCaderno.progress} className="h-1.5" />
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {subCaderno.answeredQuestions} de {subCaderno.questions.length} questões
                                  </p>
                                </div>
                              </div>

                              {/* Right: Responsible */}
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 min-w-[130px]">
                                  <User className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-xs">{subCaderno.responsible}</span>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                  <ArrowRight className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
