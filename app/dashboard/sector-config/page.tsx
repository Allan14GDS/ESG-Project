"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Building2, CheckCircle, Settings, Target, Users, Leaf, Heart, Shield } from "lucide-react"
import { useState } from "react"

export default function SectorConfigPage() {
  const [selectedSector, setSelectedSector] = useState("")
  const [selectedThemes, setSelectedThemes] = useState<string[]>([])

  const sectors = [
    { value: "financial", label: "Serviços Financeiros" },
    { value: "technology", label: "Tecnologia" },
    { value: "manufacturing", label: "Manufatura" },
    { value: "retail", label: "Varejo" },
    { value: "energy", label: "Energia" },
    { value: "healthcare", label: "Saúde" },
    { value: "real-estate", label: "Imobiliário" },
    { value: "agriculture", label: "Agronegócio" },
  ]

  const materialThemes = [
    {
      category: "Environmental",
      icon: Leaf,
      themes: [
        { id: "climate-change", label: "Mudanças Climáticas", description: "Emissões GEE, metas net-zero" },
        { id: "water-management", label: "Gestão da Água", description: "Consumo, qualidade, escassez" },
        { id: "waste-management", label: "Gestão de Resíduos", description: "Economia circular, reciclagem" },
        { id: "biodiversity", label: "Biodiversidade", description: "Impactos nos ecossistemas" },
        { id: "energy-efficiency", label: "Eficiência Energética", description: "Consumo, fontes renováveis" },
      ],
    },
    {
      category: "Social",
      icon: Heart,
      themes: [
        { id: "employee-wellbeing", label: "Bem-estar dos Funcionários", description: "Saúde, segurança, satisfação" },
        { id: "diversity-inclusion", label: "Diversidade e Inclusão", description: "Equidade, representatividade" },
        {
          id: "community-impact",
          label: "Impacto na Comunidade",
          description: "Desenvolvimento local, investimento social",
        },
        { id: "human-rights", label: "Direitos Humanos", description: "Cadeia de valor, trabalho digno" },
        {
          id: "customer-satisfaction",
          label: "Satisfação do Cliente",
          description: "Qualidade, segurança dos produtos",
        },
      ],
    },
    {
      category: "Governance",
      icon: Shield,
      themes: [
        { id: "board-composition", label: "Composição do Conselho", description: "Diversidade, independência" },
        { id: "ethics-compliance", label: "Ética e Compliance", description: "Anticorrupção, transparência" },
        { id: "risk-management", label: "Gestão de Riscos", description: "ESG, operacionais, estratégicos" },
        { id: "stakeholder-engagement", label: "Engajamento de Stakeholders", description: "Diálogo, materialidade" },
        { id: "data-privacy", label: "Privacidade de Dados", description: "LGPD, segurança da informação" },
      ],
    },
  ]

  const handleThemeToggle = (themeId: string) => {
    setSelectedThemes((prev) => (prev.includes(themeId) ? prev.filter((id) => id !== themeId) : [...prev, themeId]))
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configuração de Setor</h1>
          <p className="text-muted-foreground">
            Defina o setor da organização e selecione os temas materiais relevantes
          </p>
        </div>
        <Badge variant="default" className="flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          100% Completo
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Informações da Organização
              </CardTitle>
              <CardDescription>Dados básicos para contextualização setorial</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="company-name">Nome da Organização</Label>
                <Input id="company-name" defaultValue="TechCorp Brasil Ltda." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sector">Setor de Atuação</Label>
                <Select value={selectedSector} onValueChange={setSelectedSector}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectors.map((sector) => (
                      <SelectItem key={sector.value} value={sector.value}>
                        {sector.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição das Atividades</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva as principais atividades da organização..."
                  defaultValue="Desenvolvimento de soluções tecnológicas para transformação digital empresarial, incluindo software, consultoria e serviços de implementação."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employees">Número de Funcionários</Label>
                <Input id="employees" type="number" defaultValue="8245" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Resumo da Seleção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Temas selecionados:</span>
                  <span className="font-medium">{selectedThemes.length}/15</span>
                </div>

                <div className="space-y-2">
                  {materialThemes.map((category) => {
                    const categoryThemes = category.themes.filter((theme) => selectedThemes.includes(theme.id))
                    if (categoryThemes.length === 0) return null

                    return (
                      <div key={category.category} className="text-xs">
                        <div className="flex items-center gap-1 font-medium text-muted-foreground">
                          <category.icon className="h-3 w-3" />
                          {category.category}: {categoryThemes.length}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Button className="w-full mt-4">
                  <Settings className="h-4 w-4 mr-2" />
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Seleção de Temas Materiais</CardTitle>
              <CardDescription>
                Escolha os temas ESG mais relevantes para sua organização. Esta seleção determinará quais disclosures
                GRI serão aplicáveis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {materialThemes.map((category) => (
                  <div key={category.category} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <category.icon className="h-5 w-5" />
                      <h3 className="font-semibold">{category.category}</h3>
                      <Badge variant="outline" className="ml-auto">
                        {category.themes.filter((theme) => selectedThemes.includes(theme.id)).length}/
                        {category.themes.length}
                      </Badge>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {category.themes.map((theme) => (
                        <div
                          key={theme.id}
                          className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50"
                        >
                          <Checkbox
                            id={theme.id}
                            checked={selectedThemes.includes(theme.id)}
                            onCheckedChange={() => handleThemeToggle(theme.id)}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label
                              htmlFor={theme.id}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                            >
                              {theme.label}
                            </label>
                            <p className="text-xs text-muted-foreground">{theme.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Próximos Passos
          </CardTitle>
          <CardDescription>Após definir o setor e temas materiais</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">1</span>
              </div>
              <div>
                <p className="text-sm font-medium">Atribuir Responsabilidades</p>
                <p className="text-xs text-muted-foreground">Definir owners e reviewers por tema</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">2</span>
              </div>
              <div>
                <p className="text-sm font-medium">Iniciar Coleta de Dados</p>
                <p className="text-xs text-muted-foreground">Preencher disclosures por categoria</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-medium text-primary">3</span>
              </div>
              <div>
                <p className="text-sm font-medium">Análise de Materialidade</p>
                <p className="text-xs text-muted-foreground">Matriz de dupla materialidade</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
