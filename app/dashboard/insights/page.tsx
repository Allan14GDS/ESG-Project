"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Eye,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Target,
  Zap,
  BarChart3,
  FileText,
  Lightbulb,
  Shield,
  Leaf,
  Heart,
} from "lucide-react"

export default function InsightsPage() {
  const aiInsights = [
    {
      category: "Risk Analysis",
      icon: Shield,
      color: "text-red-500",
      insights: [
        {
          title: "Alto Risco de Compliance",
          description:
            "Identificados gaps significativos nos dados de diversidade (GRI 405-1). Recomenda-se priorizar coleta.",
          severity: "high",
          confidence: 92,
          action: "Revisar dados de diversidade",
        },
        {
          title: "Risco Regulatório Emergente",
          description: "Nova regulamentação CSRD pode impactar disclosures atuais. Análise de gap necessária.",
          severity: "medium",
          confidence: 78,
          action: "Avaliar impacto CSRD",
        },
      ],
    },
    {
      category: "Performance Trends",
      icon: TrendingUp,
      color: "text-blue-500",
      insights: [
        {
          title: "Melhoria Consistente em ESG",
          description:
            "Score ESG aumentou 23% nos últimos 12 meses, principalmente em governança e práticas ambientais.",
          severity: "positive",
          confidence: 95,
          action: "Manter estratégia atual",
        },
        {
          title: "Benchmark Setorial",
          description:
            "Performance ESG está 15% acima da média do setor tecnológico, especialmente em inovação sustentável.",
          severity: "positive",
          confidence: 88,
          action: "Comunicar diferencial competitivo",
        },
      ],
    },
    {
      category: "Data Quality",
      icon: BarChart3,
      color: "text-yellow-500",
      insights: [
        {
          title: "Inconsistências nos Dados",
          description: "Detectadas discrepâncias entre dados de emissões reportados por diferentes unidades.",
          severity: "medium",
          confidence: 85,
          action: "Validar metodologia de cálculo",
        },
        {
          title: "Lacunas de Informação",
          description: "32% dos disclosures GRI ainda não possuem dados suficientes para análise completa.",
          severity: "medium",
          confidence: 100,
          action: "Acelerar coleta de dados",
        },
      ],
    },
  ]

  const materialityInsights = [
    {
      theme: "Mudanças Climáticas",
      category: "Environmental",
      icon: Leaf,
      impactScore: 9.2,
      likelihoodScore: 8.7,
      trend: "increasing",
      recommendation: "Tema de alta materialidade. Desenvolver roadmap detalhado de descarbonização.",
    },
    {
      theme: "Diversidade e Inclusão",
      category: "Social",
      icon: Heart,
      impactScore: 8.1,
      likelihoodScore: 7.9,
      trend: "stable",
      recommendation: "Manter foco atual. Considerar expansão de métricas de inclusão.",
    },
    {
      theme: "Governança Corporativa",
      category: "Governance",
      icon: Shield,
      impactScore: 8.8,
      likelihoodScore: 9.1,
      trend: "increasing",
      recommendation: "Prioridade máxima. Fortalecer estruturas de supervisão ESG.",
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200"
      case "positive":
        return "text-green-600 bg-green-50 border-green-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "high":
        return AlertTriangle
      case "medium":
        return Eye
      case "positive":
        return CheckCircle
      default:
        return Eye
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Insights Automáticos</h1>
          <p className="text-muted-foreground">
            Análises inteligentes e recomendações baseadas em IA para otimizar sua estratégia ESG
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            IA Ativa
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Zap className="h-3 w-3" />
            25% Completo
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Insights Gerados</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">47</div>
            <p className="text-xs text-muted-foreground">+12 esta semana</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Riscos Identificados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">8</div>
            <p className="text-xs text-muted-foreground">3 alta prioridade</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oportunidades</CardTitle>
            <Target className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">15</div>
            <p className="text-xs text-muted-foreground">6 implementáveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confiança Média</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">Baseado em dados</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="ai-insights" className="space-y-4">
        <TabsList>
          <TabsTrigger value="ai-insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Insights de IA
          </TabsTrigger>
          <TabsTrigger value="materiality" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Análise de Materialidade
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recomendações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ai-insights" className="space-y-4">
          {aiInsights.map((category) => (
            <Card key={category.category}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <category.icon className={`h-5 w-5 ${category.color}`} />
                  {category.category}
                </CardTitle>
                <CardDescription>Análises automáticas baseadas em padrões identificados nos dados ESG</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {category.insights.map((insight, index) => {
                    const SeverityIcon = getSeverityIcon(insight.severity)
                    return (
                      <div key={index} className={`p-4 rounded-lg border ${getSeverityColor(insight.severity)}`}>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <SeverityIcon className="h-4 w-4" />
                            <h4 className="font-medium">{insight.title}</h4>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs">Confiança:</span>
                            <Badge variant="outline" className="text-xs">
                              {insight.confidence}%
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm mb-3">{insight.description}</p>
                        <div className="flex items-center justify-between">
                          <Button variant="outline" size="sm">
                            {insight.action}
                          </Button>
                          <div className="flex items-center gap-1">
                            <Progress value={insight.confidence} className="w-16 h-2" />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="materiality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Análise Inteligente de Materialidade
              </CardTitle>
              <CardDescription>
                IA analisa impacto e probabilidade dos temas ESG baseado em dados históricos e tendências setoriais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {materialityInsights.map((theme, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <theme.icon className="h-4 w-4" />
                        <h4 className="font-medium">{theme.theme}</h4>
                        <Badge variant="outline" className="text-xs">
                          {theme.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {theme.trend === "increasing" && <TrendingUp className="h-4 w-4 text-green-500" />}
                        <span className="text-sm font-medium">
                          Score: {((theme.impactScore + theme.likelihoodScore) / 2).toFixed(1)}
                        </span>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 mb-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Impacto</span>
                          <span>{theme.impactScore}/10</span>
                        </div>
                        <Progress value={theme.impactScore * 10} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Probabilidade</span>
                          <span>{theme.likelihoodScore}/10</span>
                        </div>
                        <Progress value={theme.likelihoodScore * 10} className="h-2" />
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{theme.recommendation}</p>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <FileText className="h-3 w-3 mr-1" />
                        Ver Detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        <Target className="h-3 w-3 mr-1" />
                        Ajustar Matriz
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recomendações Estratégicas
              </CardTitle>
              <CardDescription>
                Sugestões personalizadas para otimizar sua estratégia ESG baseadas em análise de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Prioridade Alta</h4>
                  </div>
                  <p className="text-sm text-blue-800 mb-3">
                    Implementar sistema de monitoramento contínuo de emissões GEE para melhorar precisão dos dados e
                    identificar oportunidades de redução em tempo real.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      Implementar
                    </Button>
                    <Button variant="outline" size="sm">
                      Mais Detalhes
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-green-50 border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <h4 className="font-medium text-green-900">Oportunidade Identificada</h4>
                  </div>
                  <p className="text-sm text-green-800 mb-3">
                    Seus dados de diversidade estão acima da média setorial. Considere criar um programa de mentoria
                    para maximizar este diferencial competitivo.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Explorar
                    </Button>
                    <Button variant="outline" size="sm">
                      Ver Benchmark
                    </Button>
                  </div>
                </div>

                <div className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-medium text-yellow-900">Atenção Necessária</h4>
                  </div>
                  <p className="text-sm text-yellow-800 mb-3">
                    Lacunas nos dados de cadeia de suprimentos podem impactar compliance futuro. Recomenda-se
                    engajamento proativo com fornecedores.
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" className="bg-yellow-600 hover:bg-yellow-700">
                      Planejar Ação
                    </Button>
                    <Button variant="outline" size="sm">
                      Ver Riscos
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
