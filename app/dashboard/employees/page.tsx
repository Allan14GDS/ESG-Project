"use client"

import { useState, useEffect } from "react"
import { MatrixEditor } from "@/components/employee/matrix-editor"
import { NonEmployeeForm } from "@/components/employee/non-employee-form"
import { organizationService, type Organization } from "@/lib/organization"
import { employeeDataService, type EmployeeMatrix, type NonEmployeeWorkers } from "@/lib/employee-data"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Users2, HelpCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function EmployeesPage() {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [employeeMatrices, setEmployeeMatrices] = useState<EmployeeMatrix[]>([])
  const [nonEmployeeWorkers, setNonEmployeeWorkers] = useState<NonEmployeeWorkers | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const org = organizationService.getOrganization()
    if (!org) {
      window.location.href = "/dashboard"
      return
    }

    setOrganization(org)

    // Load existing data
    const existingMatrices = employeeDataService.getEmployeeMatrices()
    const existingNonEmployees = employeeDataService.getNonEmployeeWorkers()

    if (existingMatrices.length > 0) {
      setEmployeeMatrices(existingMatrices)
      setCurrentStep(1)
    }
    if (existingNonEmployees) {
      setNonEmployeeWorkers(existingNonEmployees)
    }

    setIsLoading(false)
  }, [])

  const handleMatrixSubmit = async (matrices: EmployeeMatrix[]) => {
    await employeeDataService.saveEmployeeMatrices(matrices)
    setEmployeeMatrices(matrices)
    setCurrentStep(1)
  }

  const handleNonEmployeeSubmit = async (workers: NonEmployeeWorkers) => {
    await employeeDataService.saveNonEmployeeWorkers(workers)
    setNonEmployeeWorkers(workers)
    window.location.href = "/dashboard"
  }

  if (isLoading || !organization) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dados dos funcionários...</p>
        </div>
      </div>
    )
  }

  const progress = currentStep === 0 ? 25 : currentStep === 1 ? 75 : 100
  const totalSteps = 2

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Demografia dos Funcionários</h1>
              <p className="text-muted-foreground">
                Colete dados da força de trabalho para conformidade com GRI 2-7 e 2-8
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHelp(!showHelp)}
              className="flex items-center gap-2"
            >
              <HelpCircle className="w-4 h-4" />
              {showHelp ? "Ocultar Ajuda" : "Mostrar Ajuda"}
            </Button>
          </div>

          {/* Progress Indicator */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Progresso</span>
                <span className="text-sm text-muted-foreground">
                  Etapa {currentStep + 1} de {totalSteps}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  {currentStep >= 0 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span
                    className={`text-sm ${currentStep >= 0 ? "text-green-600 font-medium" : "text-muted-foreground"}`}
                  >
                    Matriz de Funcionários
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2">
                  {currentStep >= 1 ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted-foreground" />
                  )}
                  <span
                    className={`text-sm ${currentStep >= 1 ? "text-green-600 font-medium" : "text-muted-foreground"}`}
                  >
                    Trabalhadores Não-Funcionários
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          {showHelp && (
            <Alert>
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">O que você precisará para completar esta seção:</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2">📊 Demografia dos Funcionários (Etapa 1)</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Contagem de funcionários por gênero (Masculino, Feminino, Não-binário, Outros)</li>
                        <li>• Contagem de funcionários por raça/etnia</li>
                        <li>• Contagem de funcionários por faixas etárias (≤30, 30-50, 50+)</li>
                        <li>• Dados para cada unidade de negócio/localização</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm mb-2">👥 Trabalhadores Não-Funcionários (Etapa 2)</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Número de contratados/terceirizados</li>
                        <li>• Número de freelancers/contratados independentes</li>
                        <li>• Número de trabalhadores temporários/sazonais</li>
                      </ul>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Dica:</strong> Você pode copiar dados da matriz para todas as filiais para economizar
                    tempo, depois ajustar localizações individuais conforme necessário.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Current Step Indicator */}
          <div className="flex items-center gap-4">
            <Badge variant={currentStep === 0 ? "default" : "secondary"} className="flex items-center gap-2">
              <Users className="w-3 h-3" />
              {currentStep === 0 ? "Atual: " : ""}Matriz de Funcionários
            </Badge>
            <Badge variant={currentStep === 1 ? "default" : "outline"} className="flex items-center gap-2">
              <Users2 className="w-3 h-3" />
              {currentStep === 1 ? "Atual: " : ""}Trabalhadores Não-Funcionários
            </Badge>
          </div>
        </div>

        {/* Form Content */}
        {currentStep === 0 && (
          <MatrixEditor
            organization={organization}
            onSubmit={handleMatrixSubmit}
            onBack={() => (window.location.href = "/dashboard")}
          />
        )}

        {currentStep === 1 && (
          <NonEmployeeForm
            initialData={nonEmployeeWorkers || undefined}
            onSubmit={handleNonEmployeeSubmit}
            onBack={() => setCurrentStep(0)}
          />
        )}
      </div>
    </div>
  )
}
