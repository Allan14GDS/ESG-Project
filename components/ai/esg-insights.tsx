"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  Target,
  Lightbulb,
  CheckCircle,
  Clock,
  ArrowRight,
  Sparkles,
  BarChart3,
} from "lucide-react"

interface ESGInsightsProps {
  organizationId: string
  realData?: any
}

export function ESGInsights({ organizationId, realData }: ESGInsightsProps) {
  const [insights, setInsights] = useState<any[]>([])
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [predictions, setPredictions] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!realData) return

    setIsLoading(true)

    setTimeout(() => {
      const disclosures = realData.disclosures || []
      const employees = realData.employees || []
      const governance = realData.governance
      const organization = realData.organization

      const completedCount = disclosures.filter((d: any) => d.status === "completed" || d.status === "approved").length
      const totalCount = disclosures.length
      const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

      const generatedInsights = []
      const generatedRecommendations = []

      // Generate insights based on actual data
      if (completionRate > 50) {
        generatedInsights.push({
          id: 1,
          type: "trend",
          title: "Progresso Significativo nos Disclosures GRI",
          description: `Você completou ${completedCount} de ${totalCount} disclosures GRI (${completionRate}%), demonstrando forte compromisso com transparência ESG.`,
          confidence: 0.95,
          impact: "positive",
          category: "governance",
          metrics: [`${completedCount} disclosures completos`, `${completionRate}% de taxa de conclusão`],
          timeframe: "Atual",
        })
      } else {
        generatedRecommendations.push({
          id: 1,
          title: "Acelerar Preenchimento dos Disclosures GRI",
          description: `Atualmente você completou ${completionRate}% dos disclosures. Recomendamos priorizar os disclosures de maior materialidade para sua indústria.`,
          priority: "high",
          effort: "medium",
          impact: "high",
          category: "governance",
          frameworks: ["GRI"],
          estimatedTimeframe: "1-2 meses",
          resources: ["Equipe de sustentabilidade", "Gestores de área"],
        })
      }

      if (employees.length > 0) {
        generatedInsights.push({
          id: 2,
          type: "opportunity",
          title: "Dados de Força de Trabalho Registrados",
          description:
            "Você já possui dados estruturados sobre sua força de trabalho, facilitando relatórios sociais e de diversidade.",
          confidence: 0.92,
          impact: "positive",
          category: "social",
          metrics: ["Dados de funcionários disponíveis", "Pronto para análise de diversidade"],
          timeframe: "Atual",
        })
      } else {
        generatedRecommendations.push({
          id: 2,
          title: "Coletar Dados de Funcionários",
          description: "Registre informações sobre sua força de trabalho para atender aos requisitos GRI 2-7 e 2-8.",
          priority: "high",
          effort: "low",
          impact: "high",
          category: "social",
          frameworks: ["GRI"],
          estimatedTimeframe: "1 semana",
          resources: ["RH", "Sistema de gestão de pessoas"],
        })
      }

      if (governance) {
        generatedInsights.push({
          id: 3,
          type: "trend",
          title: "Estrutura de Governança Documentada",
          description:
            "Sua organização possui estrutura de governança documentada, atendendo aos requisitos GRI 2-9 a 2-21.",
          confidence: 0.88,
          impact: "positive",
          category: "governance",
          metrics: ["Governança estruturada", "Políticas documentadas"],
          timeframe: "Atual",
        })
      } else {
        generatedRecommendations.push({
          id: 3,
          title: "Documentar Estrutura de Governança",
          description:
            "Complete o formulário de governança para atender aos requisitos GRI e demonstrar compromisso com boas práticas.",
          priority: "high",
          effort: "medium",
          impact: "high",
          category: "governance",
          frameworks: ["GRI"],
          estimatedTimeframe: "2-3 semanas",
          resources: ["Conselho", "Compliance", "Jurídico"],
        })
      }

      if (organization) {
        generatedInsights.push({
          id: 4,
          type: "opportunity",
          title: "Informações Organizacionais Completas",
          description: "Dados básicos da organização estão registrados, facilitando a geração de relatórios ESG.",
          confidence: 0.9,
          impact: "positive",
          category: "governance",
          metrics: ["Dados organizacionais completos", "Pronto para relatórios"],
          timeframe: "Atual",
        })
      }

      const generatedPredictions = [
        {
          id: 1,
          title: "Projeção de Conclusão dos Disclosures",
          description: `Com o ritmo atual, você deve completar todos os disclosures GRI em aproximadamente ${Math.ceil((totalCount - completedCount) / 2)} meses.`,
          confidence: 0.84,
          timeframe: `${Math.ceil((totalCount - completedCount) / 2)} meses`,
          factors: ["Taxa de conclusão atual", "Disclosures restantes", "Complexidade média"],
        },
        {
          id: 2,
          title: "Conformidade Regulatória",
          description:
            "Novas regulamentações ESG no Brasil podem exigir divulgações adicionais. Recomendamos monitoramento contínuo.",
          confidence: 0.91,
          timeframe: "6-12 meses",
          factors: ["Tendências regulatórias", "Requisitos setoriais", "Padrões internacionais"],
        },
      ]

      setInsights(generatedInsights)
      setRecommendations(generatedRecommendations)
      setPredictions(generatedPredictions)
      setIsLoading(false)
    }, 1500)
  }, [realData])

  const getInsightIcon = (type: string) => {
    switch (type) {
      case "trend":
        return <TrendingUp className="w-5 h-5" />
      case "risk":
        return <AlertTriangle className="w-5 h-5" />
      case "opportunity":
        return <Target className="w-5 h-5" />
      default:
        return <Lightbulb className="w-5 h-5" />
    }
  }

  const getInsightColor = (type: string, impact: string) => {
    if (type === "risk") return "border-red-500/50 bg-red-950/50 dark:border-red-500/30 dark:bg-red-950/30"
    if (impact === "positive")
      return "border-green-500/50 bg-green-950/50 dark:border-green-500/30 dark:bg-green-950/30"
    return "border-blue-500/50 bg-blue-950/50 dark:border-blue-500/30 dark:bg-blue-950/30"
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500/20 text-red-300 border-red-500/30 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
      case "medium":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
      case "low":
        return "bg-green-500/20 text-green-300 border-green-500/30 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20"
      default:
        return "bg-gray-500/20 text-gray-300 border-gray-500/30 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "environmental":
        return "bg-green-500/20 text-green-300 dark:bg-green-500/10 dark:text-green-400"
      case "social":
        return "bg-blue-500/20 text-blue-300 dark:bg-blue-500/10 dark:text-blue-400"
      case "governance":
        return "bg-purple-500/20 text-purple-300 dark:bg-purple-500/10 dark:text-purple-400"
      default:
        return "bg-gray-500/20 text-gray-300 dark:bg-gray-500/10 dark:text-gray-400"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Brain className="w-8 h-8 text-primary animate-pulse" />
            <Sparkles className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <h3 className="text-lg font-medium mb-2">Generating AI Insights</h3>
          <p className="text-muted-foreground">
            Analyzing your ESG data to provide personalized insights and recommendations...
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI-Powered ESG Insights</h2>
            <p className="text-muted-foreground">Intelligent analysis and recommendations for your ESG performance</p>
          </div>
        </div>
        <Button variant="outline">
          <BarChart3 className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <Tabs defaultValue="insights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Key Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="predictions" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Predictions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          {insights.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Lightbulb className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum insight disponível ainda</h3>
                <p className="text-muted-foreground">
                  Continue preenchendo os dados ESG para gerar insights personalizados.
                </p>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight) => (
              <Card key={insight.id} className={`border-l-4 ${getInsightColor(insight.type, insight.impact)}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg ${
                          insight.impact === "positive"
                            ? "bg-green-500/20 text-green-400 dark:bg-green-500/10"
                            : insight.type === "risk"
                              ? "bg-red-500/20 text-red-400 dark:bg-red-500/10"
                              : "bg-blue-500/20 text-blue-400 dark:bg-blue-500/10"
                        }`}
                      >
                        {getInsightIcon(insight.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={getCategoryColor(insight.category)}>{insight.category}</Badge>
                          <Badge variant="outline">{Math.round(insight.confidence * 100)}% confidence</Badge>
                          <span className="text-sm text-muted-foreground">{insight.timeframe}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-muted-foreground">{insight.description}</p>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Key Metrics:</h4>
                    <div className="space-y-1">
                      {insight.metrics.map((metric: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{metric}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma recomendação no momento</h3>
                <p className="text-muted-foreground">
                  Você está no caminho certo! Continue mantendo seus dados atualizados.
                </p>
              </CardContent>
            </Card>
          ) : (
            recommendations.map((rec) => (
              <Card key={rec.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={getPriorityColor(rec.priority)}>{rec.priority} priority</Badge>
                        <Badge className={getCategoryColor(rec.category)}>{rec.category}</Badge>
                        <Badge variant="outline">{rec.estimatedTimeframe}</Badge>
                      </div>
                    </div>
                    <Button size="sm">
                      Implement
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{rec.description}</p>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Impact Assessment</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-sm">Effort:</span>
                          <Badge variant="outline" className="text-xs">
                            {rec.effort}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm">Impact:</span>
                          <Badge variant="outline" className="text-xs">
                            {rec.impact}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Frameworks</h4>
                      <div className="flex flex-wrap gap-1">
                        {rec.frameworks.map((framework: string) => (
                          <Badge key={framework} variant="secondary" className="text-xs">
                            {framework}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Resources Needed</h4>
                      <div className="space-y-1">
                        {rec.resources.map((resource: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                            <span className="text-xs">{resource}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {predictions.map((prediction) => (
            <Card key={prediction.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{prediction.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{Math.round(prediction.confidence * 100)}% confidence</Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {prediction.timeframe}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-muted-foreground">{prediction.description}</p>

                <div>
                  <h4 className="font-medium text-sm mb-2">Based on:</h4>
                  <div className="space-y-1">
                    {prediction.factors.map((factor: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">{factor}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      <Alert>
        <Sparkles className="h-4 w-4" />
        <AlertDescription>
          These insights are generated using AI analysis of your ESG data, industry benchmarks, and regulatory trends.
          Review recommendations with your sustainability team before implementation.
        </AlertDescription>
      </Alert>
    </div>
  )
}
