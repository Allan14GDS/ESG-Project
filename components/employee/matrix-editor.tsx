"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table"
import { Copy, Users, AlertTriangle, HelpCircle } from "lucide-react"
import {
  type EmployeeMatrix,
  type Gender,
  type Race,
  type AgeBand,
  GENDERS,
  RACES,
  AGE_BANDS,
  createEmptyMatrix,
  updateMatrixCell,
  copyMatrixStructure,
} from "@/lib/employee-data"
import type { Organization } from "@/lib/organization"

interface MatrixEditorProps {
  organization: Organization
  onSubmit: (matrices: EmployeeMatrix[]) => void
  onBack: () => void
}

export function MatrixEditor({ organization, onSubmit, onBack }: MatrixEditorProps) {
  const [matrices, setMatrices] = useState<EmployeeMatrix[]>([])
  const [activeTab, setActiveTab] = useState("hq")
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [showInstructions, setShowInstructions] = useState(true)

  console.log("[v0] MatrixEditor render - organization:", organization)

  useEffect(() => {
    console.log("[v0] Initializing matrices for organization:", organization)

    // Initialize matrices for headquarters and branches
    const initialMatrices: EmployeeMatrix[] = []

    // Add headquarters
    initialMatrices.push(createEmptyMatrix("hq", "Matriz", "headquarters"))

    // Add branches
    organization.branches.forEach((branch) => {
      console.log("[v0] Adding branch matrix:", branch)
      initialMatrices.push(createEmptyMatrix(branch.id, branch.name, "branch"))
    })

    console.log("[v0] Created initial matrices:", initialMatrices)
    setMatrices(initialMatrices)
  }, [organization])

  const updateCell = (unitId: string, gender: Gender, race: Race, ageBand: AgeBand, value: string) => {
    const count = Number.parseInt(value) || 0
    console.log("[v0] Updating cell:", { unitId, gender, race, ageBand, count })

    setMatrices((prev) =>
      prev.map((matrix) =>
        matrix.unitId === unitId ? updateMatrixCell(matrix, gender, race, ageBand, count) : matrix,
      ),
    )
  }

  const copyHQToBranches = () => {
    console.log("[v0] Copying HQ data to branches")
    const hqMatrix = matrices.find((m) => m.unitType === "headquarters")
    if (!hqMatrix) {
      console.warn("[v0] No HQ matrix found")
      return
    }

    setMatrices((prev) =>
      prev.map((matrix) =>
        matrix.unitType === "branch" ? copyMatrixStructure(hqMatrix, matrix.unitId, matrix.unitName) : matrix,
      ),
    )
  }

  const validateMatrices = (): string[] => {
    const errors: string[] = []

    // Check if any matrix has data
    const hasData = matrices.some((matrix) => matrix.totals.total > 0)
    if (!hasData) {
      errors.push("Por favor, insira dados de funcionários para pelo menos uma unidade")
    }

    // Check for consistency (optional validation)
    const totalEmployees = matrices.reduce((sum, matrix) => sum + matrix.totals.total, 0)
    if (totalEmployees > 100000) {
      errors.push("O total de funcionários parece muito alto. Por favor, verifique seus dados.")
    }

    return errors
  }

  const handleSubmit = () => {
    console.log("[v0] Submitting matrices:", matrices)
    const errors = validateMatrices()
    setValidationErrors(errors)

    if (errors.length === 0) {
      onSubmit(matrices)
    } else {
      console.warn("[v0] Validation errors:", errors)
    }
  }

  const renderMatrix = (matrix: EmployeeMatrix) => (
    <div className="space-y-6">
      {showInstructions && (
        <Alert>
          <HelpCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Como preencher esta matriz:</p>
              <ul className="text-sm space-y-1">
                <li>
                  • <strong>Digite apenas números</strong> - contagem de funcionários em cada categoria demográfica
                </li>
                <li>
                  • <strong>Cada célula representa</strong> a interseção de gênero, raça e faixa etária
                </li>
                <li>
                  • <strong>Os totais são calculados automaticamente</strong> conforme você insere os dados
                </li>
                <li>
                  • <strong>Use "Copiar para Todas as Filiais"</strong> se suas localizações têm demografia similar
                </li>
              </ul>
              <Button variant="ghost" size="sm" onClick={() => setShowInstructions(false)} className="mt-2 h-6 text-xs">
                Ocultar Instruções
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            {matrix.unitName}
            {matrix.totals.total > 0 && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                ✓ {matrix.totals.total} funcionários
              </Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {matrix.totals.total === 0 ? (
              <span className="text-amber-600">⚠️ Nenhum dado inserido ainda</span>
            ) : (
              <>
                Total de Funcionários: <span className="font-medium">{matrix.totals.total}</span>
              </>
            )}
          </p>
        </div>
        {matrix.unitType === "headquarters" && organization.branches.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs text-muted-foreground mb-1">Economize tempo:</p>
              <Button variant="outline" onClick={copyHQToBranches} className="flex items-center gap-2 bg-transparent">
                <Copy className="w-4 h-4" />
                Copiar para Todas as Filiais
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24 bg-muted/50">Gênero</TableHead>
              <TableHead className="w-32 bg-muted/50">Raça/Etnia</TableHead>
              {AGE_BANDS.map((age) => (
                <TableHead key={age} className="text-center w-24 bg-muted/30">
                  <div className="flex flex-col items-center">
                    <span className="font-medium">{age}</span>
                    <span className="text-xs text-muted-foreground">anos</span>
                  </div>
                </TableHead>
              ))}
              <TableHead className="text-center w-24 font-medium bg-primary/10">
                <div className="flex flex-col items-center">
                  <span>Total</span>
                  <span className="text-xs text-muted-foreground">por linha</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {GENDERS.map((gender, genderIndex) =>
              RACES.map((race, raceIndex) => (
                <TableRow key={`${gender}-${race}`} className="hover:bg-muted/30">
                  {raceIndex === 0 && (
                    <TableCell rowSpan={RACES.length} className="font-medium border-r bg-muted/20">
                      {gender}
                    </TableCell>
                  )}
                  <TableCell className="font-medium bg-muted/10">{race}</TableCell>
                  {AGE_BANDS.map((ageBand) => {
                    const cell = matrix.data.find(
                      (c) => c.gender === gender && c.race === race && c.ageBand === ageBand,
                    )
                    return (
                      <TableCell key={ageBand} className="text-center">
                        <Input
                          type="number"
                          min="0"
                          value={cell?.count || ""}
                          onChange={(e) => updateCell(matrix.unitId, gender, race, ageBand, e.target.value)}
                          className="w-20 text-center focus:ring-2 focus:ring-primary/20"
                          placeholder="0"
                          style={{
                            backgroundColor: cell?.count ? "rgb(34 197 94 / 0.1)" : undefined,
                            borderColor: cell?.count ? "rgb(34 197 94 / 0.3)" : undefined,
                          }}
                        />
                      </TableCell>
                    )
                  })}
                  <TableCell className="text-center font-medium bg-primary/5">
                    {matrix.data
                      .filter((c) => c.gender === gender && c.race === race)
                      .reduce((sum, c) => sum + c.count, 0)}
                  </TableCell>
                </TableRow>
              )),
            )}
          </TableBody>
          <TableFooter>
            <TableRow className="bg-primary/10">
              <TableCell colSpan={2} className="font-medium">
                Totais por Idade
              </TableCell>
              {AGE_BANDS.map((ageBand) => (
                <TableCell key={ageBand} className="text-center font-medium">
                  {matrix.totals.byAge[ageBand]}
                </TableCell>
              ))}
              <TableCell className="text-center font-bold text-primary text-lg">{matrix.totals.total}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {matrix.totals.total > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="text-center">
            <div className="text-lg font-medium text-green-700">
              {Math.round((matrix.totals.byGender.Feminino / matrix.totals.total) * 100)}%
            </div>
            <div className="text-xs text-green-600">Feminino</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-green-700">
              {Math.round((matrix.totals.byGender.Masculino / matrix.totals.total) * 100)}%
            </div>
            <div className="text-xs text-green-600">Masculino</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-green-700">
              {Math.round((matrix.totals.byAge["≤30"] / matrix.totals.total) * 100)}%
            </div>
            <div className="text-xs text-green-600">≤30 anos</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-medium text-green-700">
              {Math.round((matrix.totals.byAge["50+"] / matrix.totals.total) * 100)}%
            </div>
            <div className="text-xs text-green-600">50+ anos</div>
          </div>
        </div>
      )}
    </div>
  )

  const organizationTotals = matrices.reduce(
    (totals, matrix) => ({
      byGender: {
        Feminino: totals.byGender.Feminino + matrix.totals.byGender.Feminino,
        Masculino: totals.byGender.Masculino + matrix.totals.byGender.Masculino,
        "Não binário": totals.byGender["Não binário"] + matrix.totals.byGender["Não binário"],
        Outros: totals.byGender.Outros + matrix.totals.byGender.Outros,
      },
      byRace: {
        Branca: totals.byRace.Branca + matrix.totals.byRace.Branca,
        "Preta/Parda": totals.byRace["Preta/Parda"] + matrix.totals.byRace["Preta/Parda"],
        Indígena: totals.byRace.Indígena + matrix.totals.byRace.Indígena,
        Outros: totals.byRace.Outros + matrix.totals.byRace.Outros,
      },
      byAge: {
        "≤30": totals.byAge["≤30"] + matrix.totals.byAge["≤30"],
        "30–50": totals.byAge["30–50"] + matrix.totals.byAge["30–50"],
        "50+": totals.byAge["50+"] + matrix.totals.byAge["50+"],
      },
      total: totals.total + matrix.totals.total,
    }),
    {
      byGender: { Feminino: 0, Masculino: 0, "Não binário": 0, Outros: 0 },
      byRace: { Branca: 0, "Preta/Parda": 0, Indígena: 0, Outros: 0 },
      byAge: { "≤30": 0, "30–50": 0, "50+": 0 },
      total: 0,
    },
  )

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-accent" />
          </div>
          <div className="flex-1">
            <CardTitle>Matriz Demográfica dos Funcionários</CardTitle>
            <CardDescription>
              Insira dados da força de trabalho por gênero, raça/etnia e faixas etárias (GRI 2-7)
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{organizationTotals.total}</div>
            <div className="text-sm text-muted-foreground">Total de Funcionários</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Organization Summary */}
        <Card className="bg-muted/30">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Total da Organização</h3>
                <p className="text-sm text-muted-foreground">Todas as unidades combinadas</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">{organizationTotals.total}</div>
                <div className="text-sm text-muted-foreground">Total de Funcionários</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-medium">{organizationTotals.byGender.Feminino}</div>
                <div className="text-xs text-muted-foreground">Feminino</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">{organizationTotals.byGender.Masculino}</div>
                <div className="text-xs text-muted-foreground">Masculino</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">{organizationTotals.byAge["≤30"]}</div>
                <div className="text-xs text-muted-foreground">≤30 anos</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-medium">{organizationTotals.byAge["50+"]}</div>
                <div className="text-xs text-muted-foreground">50+ anos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Matrix Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="hq" className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                HQ
              </Badge>
              Matriz
            </TabsTrigger>
            {organization.branches.map((branch, index) => (
              <TabsTrigger key={branch.id} value={branch.id} className="flex items-center gap-2">
                <Badge variant="outline">F{index + 1}</Badge>
                {branch.name}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="hq" className="mt-6">
            {matrices.find((m) => m.unitType === "headquarters") &&
              renderMatrix(matrices.find((m) => m.unitType === "headquarters")!)}
          </TabsContent>

          {organization.branches.map((branch) => (
            <TabsContent key={branch.id} value={branch.id} className="mt-6">
              {matrices.find((m) => m.unitId === branch.id) &&
                renderMatrix(matrices.find((m) => m.unitId === branch.id)!)}
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-between pt-6">
          <Button variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <Button onClick={handleSubmit}>Continuar</Button>
        </div>
      </CardContent>
    </Card>
  )
}
