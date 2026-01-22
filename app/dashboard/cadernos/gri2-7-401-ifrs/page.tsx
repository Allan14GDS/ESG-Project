"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Save, Send, Users, Building2, TrendingUp, FileText } from "lucide-react"
import { toast } from "sonner"

type Location = "SEDE" | "FILIAL 1" | "FILIAL 2"
type Race = "Brancas" | "Pretas" | "Pardas" | "Amarelas" | "Indígenas" | "Não Declarada"
type Gender = "Mulheres" | "Homens"
type AgeGroup = "até 30" | "30 a 50" | "50+"

interface MatrixData {
  [location: string]: {
    [gender: string]: {
      [race: string]: {
        [ageGroup: string]: {
          contratagoes: string
          contratações_percent: string
          desligamentos: string
          desligamentos_percent: string
          taxa_rotatividade: string
        }
      }
    }
  }
}

const LOCATIONS: Location[] = ["SEDE", "FILIAL 1", "FILIAL 2"]
const RACES: Race[] = ["Brancas", "Pretas", "Pardas", "Amarelas", "Indígenas", "Não Declarada"]
const GENDERS: Gender[] = ["Mulheres", "Homens"]
const AGE_GROUPS: AgeGroup[] = ["até 30", "30 a 50", "50+"]

export default function GRI27401IFRSPage() {
  const router = useRouter()
  const [currentTab, setCurrentTab] = useState<Location>("SEDE")
  const [matrixData, setMatrixData] = useState<MatrixData>({})
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    // Carregar dados salvos
    const saved = localStorage.getItem("gri2-7-401-matrix")
    if (saved) {
      setMatrixData(JSON.parse(saved))
    } else {
      // Inicializar estrutura vazia
      const initial: MatrixData = {}
      LOCATIONS.forEach((loc) => {
        initial[loc] = {}
        GENDERS.forEach((gender) => {
          initial[loc][gender] = {}
          RACES.forEach((race) => {
            initial[loc][gender][race] = {}
            AGE_GROUPS.forEach((age) => {
              initial[loc][gender][race][age] = {
                contratagoes: "",
                contratações_percent: "",
                desligamentos: "",
                desligamentos_percent: "",
                taxa_rotatividade: "",
              }
            })
          })
        })
      })
      setMatrixData(initial)
    }
  }, [])

  const handleChange = (
    location: Location,
    gender: Gender,
    race: Race,
    age: AgeGroup,
    field: string,
    value: string,
  ) => {
    setMatrixData((prev) => ({
      ...prev,
      [location]: {
        ...prev[location],
        [gender]: {
          ...prev[location]?.[gender],
          [race]: {
            ...prev[location]?.[gender]?.[race],
            [age]: {
              ...prev[location]?.[gender]?.[race]?.[age],
              [field]: value,
            },
          },
        },
      },
    }))
  }

  const handleSave = async (submit = false) => {
    setIsSaving(true)
    localStorage.setItem("gri2-7-401-matrix", JSON.stringify(matrixData))
    window.dispatchEvent(new Event("esg-data-updated"))

    setTimeout(() => {
      setIsSaving(false)
      toast.success(submit ? "Dados submetidos com sucesso!" : "Rascunho salvo!")

      if (submit) {
        router.push("/dashboard/disclosures")
      }
    }, 500)
  }

  const calculateProgress = () => {
    let total = 0
    let filled = 0

    LOCATIONS.forEach((loc) => {
      GENDERS.forEach((gender) => {
        RACES.forEach((race) => {
          AGE_GROUPS.forEach((age) => {
            total += 5 // 5 campos por célula
            const cell = matrixData[loc]?.[gender]?.[race]?.[age]
            if (cell) {
              if (cell.contratagoes) filled++
              if (cell.contratações_percent) filled++
              if (cell.desligamentos) filled++
              if (cell.desligamentos_percent) filled++
              if (cell.taxa_rotatividade) filled++
            }
          })
        })
      })
    })

    return total > 0 ? Math.round((filled / total) * 100) : 0
  }

  const progress = calculateProgress()

  return (
    <div className="container mx-auto py-4 md:py-6 space-y-4 md:space-y-6 max-w-7xl px-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/disclosures")}
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">GRI 2-7 e 401 + IFRS</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Demografia dos Funcionários (sub-caderno)</p>
          </div>
        </div>
        <Badge variant={progress === 100 ? "default" : "secondary"} className="self-start sm:self-auto">
          {progress}% Completo
        </Badge>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-4 md:pt-6">
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between gap-1 text-xs md:text-sm">
              <span className="text-muted-foreground">Progresso do Preenchimento</span>
              <span className="font-medium">{progress}% dos campos preenchidos</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs por Localização */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Building2 className="h-4 w-4 md:h-5 md:w-5" />
            Contratações, Desligamentos e Taxa de Rotatividade por Localização
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Preencha os dados para cada localização, gênero, raça e faixa etária
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as Location)}>
            <TabsList className="mb-4 md:mb-6 w-full">
              {LOCATIONS.map((location) => (
                <TabsTrigger key={location} value={location} className="flex-1">
                  <Building2 className="h-4 w-4 mr-2" />
                  {location}
                </TabsTrigger>
              ))}
            </TabsList>

            {LOCATIONS.map((location) => (
              <TabsContent key={location} value={location} className="space-y-6">
                {GENDERS.map((gender) => (
                  <Card key={gender}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {gender}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {RACES.map((race) => (
                          <div key={race} className="border rounded-lg p-4 space-y-4">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-primary" />
                              {race}
                            </h4>

                            {AGE_GROUPS.map((age) => (
                              <div key={age} className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 bg-muted/30 rounded">
                                <div className="md:col-span-5 mb-2">
                                  <p className="text-xs font-medium text-muted-foreground">{age} anos</p>
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-xs">Nº Contratações</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={matrixData[location]?.[gender]?.[race]?.[age]?.contratagoes || ""}
                                    onChange={(e) =>
                                      handleChange(location, gender, race, age, "contratagoes", e.target.value)
                                    }
                                    className="h-9"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-xs">% Contratações</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={matrixData[location]?.[gender]?.[race]?.[age]?.contratações_percent || ""}
                                    onChange={(e) =>
                                      handleChange(location, gender, race, age, "contratações_percent", e.target.value)
                                    }
                                    className="h-9"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-xs">Nº Desligamentos</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={matrixData[location]?.[gender]?.[race]?.[age]?.desligamentos || ""}
                                    onChange={(e) =>
                                      handleChange(location, gender, race, age, "desligamentos", e.target.value)
                                    }
                                    className="h-9"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-xs">% Desligamentos</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={matrixData[location]?.[gender]?.[race]?.[age]?.desligamentos_percent || ""}
                                    onChange={(e) =>
                                      handleChange(location, gender, race, age, "desligamentos_percent", e.target.value)
                                    }
                                    className="h-9"
                                  />
                                </div>

                                <div className="space-y-1.5">
                                  <Label className="text-xs">Taxa Rotatividade %</Label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    value={matrixData[location]?.[gender]?.[race]?.[age]?.taxa_rotatividade || ""}
                                    onChange={(e) =>
                                      handleChange(location, gender, race, age, "taxa_rotatividade", e.target.value)
                                    }
                                    className="h-9"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Informações Complementares */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Informações Complementares do GRI 401
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Período de referência da análise (ano-calendário ou exercício social)</Label>
              <Input placeholder="Ex: 2024" />
            </div>

            <div className="space-y-2">
              <Label>Abrangência organizacional (unidades, filiais e operações incluídas)</Label>
              <Input placeholder="Descreva as unidades incluídas" />
            </div>

            <div className="space-y-2">
              <Label>Fontes primárias de dados (Sistemas de RH, RAIS, eSocial, folha de pagamento)</Label>
              <Input placeholder="Ex: Sistema de RH XYZ, eSocial" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-3">
        <Button variant="outline" onClick={() => handleSave(false)} disabled={isSaving} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          Salvar Rascunho
        </Button>
        <Button onClick={() => handleSave(true)} disabled={isSaving} className="w-full sm:w-auto">
          <Send className="h-4 w-4 mr-2" />
          Submeter para Revisão
        </Button>
      </div>
    </div>
  )
}
