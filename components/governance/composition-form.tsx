"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Shield } from "lucide-react"
import { type GovernanceComposition, type Committee, DEFAULT_COMMITTEES } from "@/lib/governance-data"
import { GENDERS, RACES, AGE_BANDS } from "@/lib/employee-data"

interface CompositionFormProps {
  initialData?: GovernanceComposition
  onSubmit: (data: GovernanceComposition) => void
  onBack: () => void
}

export function CompositionForm({ initialData, onSubmit, onBack }: CompositionFormProps) {
  const [totalMembers, setTotalMembers] = useState(initialData?.totalMembers || 0)
  const [independentMembers, setIndependentMembers] = useState(initialData?.independentMembers || 0)
  const [executiveMembers, setExecutiveMembers] = useState(initialData?.executiveMembers || 0)
  const [demographics, setDemographics] = useState(
    initialData?.demographics || {
      byGender: { Feminino: 0, Masculino: 0, "Não binário": 0, Outros: 0 },
      byRace: { Branca: 0, "Preta/Parda": 0, Indígena: 0, Outros: 0 },
      byAge: { "≤30": 0, "30–50": 0, "50+": 0 },
    },
  )
  const [committees, setCommittees] = useState<Committee[]>(initialData?.committees || [])
  const [chairpersonExecutive, setChairpersonExecutive] = useState(initialData?.chairpersonExecutive || false)
  const [chairpersonDescription, setChairpersonDescription] = useState(
    initialData?.chairpersonExecutiveDescription || "",
  )
  const [error, setError] = useState("")

  const nonExecutiveMembers = totalMembers - executiveMembers

  const updateDemographic = (category: "byGender" | "byRace" | "byAge", key: string, value: number) => {
    setDemographics((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value,
      },
    }))
  }

  const addCommittee = () => {
    const newCommittee: Committee = {
      id: Date.now().toString(),
      name: "",
      purpose: "",
      memberCount: 0,
      chairperson: "",
      responsibilities: [],
    }
    setCommittees([...committees, newCommittee])
  }

  const updateCommittee = (id: string, field: keyof Committee, value: any) => {
    setCommittees((prev) =>
      prev.map((committee) => (committee.id === id ? { ...committee, [field]: value } : committee)),
    )
  }

  const removeCommittee = (id: string) => {
    setCommittees((prev) => prev.filter((committee) => committee.id !== id))
  }

  const addDefaultCommittee = (name: string) => {
    const newCommittee: Committee = {
      id: Date.now().toString(),
      name,
      purpose: "",
      memberCount: 0,
      chairperson: "",
      responsibilities: [],
    }
    setCommittees([...committees, newCommittee])
  }

  const validateForm = (): string[] => {
    const errors: string[] = []

    if (totalMembers <= 0) {
      errors.push("O total de membros deve ser maior que 0")
    }

    if (independentMembers > totalMembers) {
      errors.push("Membros independentes não podem exceder o total de membros")
    }

    if (executiveMembers > totalMembers) {
      errors.push("Membros executivos não podem exceder o total de membros")
    }

    // Check demographic totals
    const genderTotal = Object.values(demographics.byGender).reduce((sum, val) => sum + val, 0)
    const raceTotal = Object.values(demographics.byRace).reduce((sum, val) => sum + val, 0)
    const ageTotal = Object.values(demographics.byAge).reduce((sum, val) => sum + val, 0)

    if (genderTotal !== totalMembers) {
      errors.push(`Total de gênero (${genderTotal}) deve ser igual ao total de membros (${totalMembers})`)
    }
    if (raceTotal !== totalMembers) {
      errors.push(`Total de raça/etnia (${raceTotal}) deve ser igual ao total de membros (${totalMembers})`)
    }
    if (ageTotal !== totalMembers) {
      errors.push(`Total de idade (${ageTotal}) deve ser igual ao total de membros (${totalMembers})`)
    }

    if (chairpersonExecutive && !chairpersonDescription.trim()) {
      errors.push("Por favor, forneça uma descrição quando o presidente tem funções executivas")
    }

    return errors
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const errors = validateForm()
    setError(errors.join(". "))

    if (errors.length === 0) {
      const compositionData: GovernanceComposition = {
        totalMembers,
        independentMembers,
        executiveMembers,
        nonExecutiveMembers,
        demographics,
        committees,
        chairpersonExecutive,
        chairpersonExecutiveDescription: chairpersonExecutive ? chairpersonDescription : undefined,
      }
      onSubmit(compositionData)
    }
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <CardTitle>Composição e Governança do Conselho</CardTitle>
            <CardDescription>
              Estrutura do conselho, demografia e informações de comitês (GRI 2-9 a 2-11)
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Board Composition */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Composição do Conselho</h3>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalMembers">Total de Membros do Conselho *</Label>
                <Input
                  id="totalMembers"
                  type="number"
                  min="1"
                  value={totalMembers || ""}
                  onChange={(e) => setTotalMembers(Number.parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="independentMembers">Membros Independentes</Label>
                <Input
                  id="independentMembers"
                  type="number"
                  min="0"
                  max={totalMembers}
                  value={independentMembers || ""}
                  onChange={(e) => setIndependentMembers(Number.parseInt(e.target.value) || 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="executiveMembers">Membros Executivos</Label>
                <Input
                  id="executiveMembers"
                  type="number"
                  min="0"
                  max={totalMembers}
                  value={executiveMembers || ""}
                  onChange={(e) => setExecutiveMembers(Number.parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-center">
              <Card className="p-4">
                <div className="text-2xl font-bold text-primary">{totalMembers}</div>
                <div className="text-sm text-muted-foreground">Total de Membros</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-accent">{independentMembers}</div>
                <div className="text-sm text-muted-foreground">Independentes</div>
              </Card>
              <Card className="p-4">
                <div className="text-2xl font-bold text-secondary">{nonExecutiveMembers}</div>
                <div className="text-sm text-muted-foreground">Não-Executivos</div>
              </Card>
            </div>
          </div>

          {/* Demographics */}
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Demografia do Conselho</h3>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Gender */}
              <Card className="p-4">
                <h4 className="font-medium mb-4">Por Gênero</h4>
                <div className="space-y-3">
                  {GENDERS.map((gender) => (
                    <div key={gender} className="flex items-center justify-between">
                      <Label className="text-sm">{gender}</Label>
                      <Input
                        type="number"
                        min="0"
                        max={totalMembers}
                        value={demographics.byGender[gender] || ""}
                        onChange={(e) => updateDemographic("byGender", gender, Number.parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between font-medium">
                      <span>Total</span>
                      <span>{Object.values(demographics.byGender).reduce((sum, val) => sum + val, 0)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Race */}
              <Card className="p-4">
                <h4 className="font-medium mb-4">Por Raça/Etnia</h4>
                <div className="space-y-3">
                  {RACES.map((race) => (
                    <div key={race} className="flex items-center justify-between">
                      <Label className="text-sm">{race}</Label>
                      <Input
                        type="number"
                        min="0"
                        max={totalMembers}
                        value={demographics.byRace[race] || ""}
                        onChange={(e) => updateDemographic("byRace", race, Number.parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between font-medium">
                      <span>Total</span>
                      <span>{Object.values(demographics.byRace).reduce((sum, val) => sum + val, 0)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Age */}
              <Card className="p-4">
                <h4 className="font-medium mb-4">Por Faixa Etária</h4>
                <div className="space-y-3">
                  {AGE_BANDS.map((age) => (
                    <div key={age} className="flex items-center justify-between">
                      <Label className="text-sm">{age} anos</Label>
                      <Input
                        type="number"
                        min="0"
                        max={totalMembers}
                        value={demographics.byAge[age] || ""}
                        onChange={(e) => updateDemographic("byAge", age, Number.parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                    </div>
                  ))}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between font-medium">
                      <span>Total</span>
                      <span>{Object.values(demographics.byAge).reduce((sum, val) => sum + val, 0)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Chairperson Executive Functions */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium">Funções Executivas do Presidente</h3>
                <p className="text-sm text-muted-foreground">O presidente também atua em capacidade executiva?</p>
              </div>
              <Switch checked={chairpersonExecutive} onCheckedChange={setChairpersonExecutive} />
            </div>

            {chairpersonExecutive && (
              <div className="space-y-2">
                <Label htmlFor="chairpersonDescription">Descrição das Funções Executivas *</Label>
                <Textarea
                  id="chairpersonDescription"
                  value={chairpersonDescription}
                  onChange={(e) => setChairpersonDescription(e.target.value)}
                  placeholder="Descreva as funções executivas desempenhadas pelo presidente..."
                  rows={3}
                />
              </div>
            )}
          </Card>

          {/* Committees */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Comitês do Conselho</h3>
                <p className="text-sm text-muted-foreground">Adicione comitês e suas funções</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={addCommittee}>
                  <Plus className="w-4 h-4 mr-2" />
                  Comitê Personalizado
                </Button>
              </div>
            </div>

            {/* Quick Add Common Committees */}
            <div className="flex flex-wrap gap-2">
              {DEFAULT_COMMITTEES.filter((name) => !committees.some((c) => c.name === name)).map((name) => (
                <Badge
                  key={name}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => addDefaultCommittee(name)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  {name}
                </Badge>
              ))}
            </div>

            {committees.map((committee, index) => (
              <Card key={committee.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Comitê {index + 1}</h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeCommittee(committee.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nome do Comitê</Label>
                    <Input
                      value={committee.name}
                      onChange={(e) => updateCommittee(committee.id, "name", e.target.value)}
                      placeholder="ex: Comitê de Auditoria"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Número de Membros</Label>
                    <Input
                      type="number"
                      min="0"
                      value={committee.memberCount || ""}
                      onChange={(e) =>
                        updateCommittee(committee.id, "memberCount", Number.parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label>Propósito e Responsabilidades</Label>
                  <Textarea
                    value={committee.purpose}
                    onChange={(e) => updateCommittee(committee.id, "purpose", e.target.value)}
                    placeholder="Descreva o propósito e principais responsabilidades do comitê..."
                    rows={2}
                  />
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-between pt-6">
            <Button type="button" variant="outline" onClick={onBack}>
              Voltar
            </Button>
            <Button type="submit">Continuar</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
