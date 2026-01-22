"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Users, UserCheck, Mail, Building2, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { useState } from "react"

export default function ResponsibilitiesPage() {
  const [selectedUnit, setSelectedUnit] = useState("")

  const organizationalUnits = [
    { value: "matriz", label: "Matriz - São Paulo" },
    { value: "filial1", label: "Filial 1 - Rio de Janeiro" },
    { value: "filial2", label: "Filial 2 - Belo Horizonte" },
    { value: "filial3", label: "Filial 3 - Porto Alegre" },
  ]

  const esgThemes = [
    {
      category: "Environmental",
      themes: [
        {
          id: "climate-change",
          name: "Mudanças Climáticas",
          contributor: "Ana Silva",
          reviewer: "Carlos Santos",
          status: "assigned",
        },
        { id: "water-management", name: "Gestão da Água", contributor: "", reviewer: "Maria Costa", status: "pending" },
        {
          id: "waste-management",
          name: "Gestão de Resíduos",
          contributor: "João Oliveira",
          reviewer: "",
          status: "partial",
        },
      ],
    },
    {
      category: "Social",
      themes: [
        {
          id: "employee-wellbeing",
          name: "Bem-estar dos Funcionários",
          contributor: "Juliana Lima",
          reviewer: "Pedro Alves",
          status: "assigned",
        },
        {
          id: "diversity-inclusion",
          name: "Diversidade e Inclusão",
          contributor: "Roberto Silva",
          reviewer: "Ana Paula",
          status: "assigned",
        },
        { id: "community-impact", name: "Impacto na Comunidade", contributor: "", reviewer: "", status: "unassigned" },
      ],
    },
    {
      category: "Governance",
      themes: [
        {
          id: "board-composition",
          name: "Composição do Conselho",
          contributor: "Fernanda Costa",
          reviewer: "Marcos Pereira",
          status: "assigned",
        },
        {
          id: "ethics-compliance",
          name: "Ética e Compliance",
          contributor: "Lucas Martins",
          reviewer: "Sandra Oliveira",
          status: "assigned",
        },
        {
          id: "risk-management",
          name: "Gestão de Riscos",
          contributor: "Patricia Santos",
          reviewer: "",
          status: "partial",
        },
      ],
    },
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "assigned":
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Completo
          </Badge>
        )
      case "partial":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Parcial
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Pendente
          </Badge>
        )
      case "unassigned":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Não Atribuído
          </Badge>
        )
      default:
        return <Badge variant="outline">-</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atribuição de Responsabilidades</h1>
          <p className="text-muted-foreground">
            Defina contributors e reviewers para cada tema ESG por unidade organizacional
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          85% Completo
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Unidade Organizacional
              </CardTitle>
              <CardDescription>Selecione a unidade para atribuir responsabilidades</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unidade</Label>
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizationalUnits.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 pt-4">
                <h4 className="text-sm font-medium">Resumo de Atribuições</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Temas completos:</span>
                    <span className="font-medium text-green-600">6/9</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcialmente atribuídos:</span>
                    <span className="font-medium text-yellow-600">2/9</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Não atribuídos:</span>
                    <span className="font-medium text-red-600">1/9</span>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                <UserCheck className="h-4 w-4 mr-2" />
                Salvar Atribuições
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3">
          <div className="space-y-6">
            {esgThemes.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{category.category}</span>
                    <Badge variant="outline">
                      {category.themes.filter((t) => t.status === "assigned").length}/{category.themes.length} completos
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Atribua contributors (responsáveis pelo preenchimento) e reviewers (responsáveis pela validação)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {category.themes.map((theme) => (
                      <div key={theme.id} className="grid gap-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{theme.name}</h4>
                            <p className="text-sm text-muted-foreground">ID: {theme.id}</p>
                          </div>
                          {getStatusBadge(theme.status)}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>Contributor (Preenchimento)</Label>
                            <div className="flex items-center gap-2">
                              {theme.contributor ? (
                                <>
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {theme.contributor
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{theme.contributor}</span>
                                  <Button variant="outline" size="sm">
                                    <Mail className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 w-full">
                                  <Input placeholder="Buscar colaborador..." className="flex-1" />
                                  <Button variant="outline" size="sm">
                                    Atribuir
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label>Reviewer (Validação)</Label>
                            <div className="flex items-center gap-2">
                              {theme.reviewer ? (
                                <>
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {theme.reviewer
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{theme.reviewer}</span>
                                  <Button variant="outline" size="sm">
                                    <Mail className="h-3 w-3" />
                                  </Button>
                                </>
                              ) : (
                                <div className="flex items-center gap-2 w-full">
                                  <Input placeholder="Buscar colaborador..." className="flex-1" />
                                  <Button variant="outline" size="sm">
                                    Atribuir
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Colaboradores Disponíveis
          </CardTitle>
          <CardDescription>
            Lista de colaboradores que podem ser atribuídos como contributors ou reviewers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Ana Silva", role: "Gerente Ambiental", unit: "Matriz", email: "ana.silva@empresa.com" },
              {
                name: "Carlos Santos",
                role: "Diretor de Sustentabilidade",
                unit: "Matriz",
                email: "carlos.santos@empresa.com",
              },
              { name: "Maria Costa", role: "Analista ESG", unit: "Filial 1", email: "maria.costa@empresa.com" },
              {
                name: "João Oliveira",
                role: "Coordenador de Meio Ambiente",
                unit: "Filial 2",
                email: "joao.oliveira@empresa.com",
              },
              { name: "Juliana Lima", role: "Gerente de RH", unit: "Matriz", email: "juliana.lima@empresa.com" },
              { name: "Pedro Alves", role: "Diretor de Pessoas", unit: "Matriz", email: "pedro.alves@empresa.com" },
            ].map((person) => (
              <div key={person.email} className="flex items-center gap-3 p-3 border rounded-lg">
                <Avatar>
                  <AvatarFallback>
                    {person.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{person.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{person.role}</p>
                  <p className="text-xs text-muted-foreground">{person.unit}</p>
                </div>
                <Button variant="outline" size="sm">
                  <Mail className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
