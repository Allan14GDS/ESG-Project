"use client"
import { useState, useEffect } from "react"
import { CompositionForm } from "@/components/governance/composition-form"
import { PoliciesForm } from "@/components/governance/policies-form"
import { OversightForm } from "@/components/governance/oversight-form"
import { CompensationForm } from "@/components/governance/compensation-form"
import { Stepper } from "@/components/ui/stepper"
import {
  type GovernanceData,
  type GovernanceComposition,
  type GovernancePolicies,
  governanceDataService,
} from "@/lib/governance-data"

const governanceSteps = [
  { title: "Composição do Conselho", description: "Estrutura e demografia" },
  { title: "Políticas e Ética", description: "Políticas corporativas" },
  { title: "Supervisão e Processos", description: "Processos de governança" },
  { title: "Remuneração", description: "Remuneração executiva" },
]

export default function GovernancePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [governanceData, setGovernanceData] = useState<GovernanceData | null>(null)
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    const loadGovernanceData = async () => {
      try {
        setDataLoading(true)

        const existingData = governanceDataService.getGovernanceData()

        if (existingData) {
          setGovernanceData(existingData)
          // Determine current step based on completed data
          if (existingData.composition?.totalMembers > 0) setCurrentStep(1)
          if (existingData.policies && Object.values(existingData.policies).some(Boolean)) setCurrentStep(2)
          if (existingData.oversight) setCurrentStep(3)
          if (existingData.compensation) setCurrentStep(4)
        } else {
          // Create empty data
          const emptyData = governanceDataService.createEmptyGovernanceData()
          setGovernanceData(emptyData)
        }
      } catch (error) {
        console.error("[v0] Error loading governance data:", error)
        // Fallback to empty data
        const emptyData = governanceDataService.createEmptyGovernanceData()
        setGovernanceData(emptyData)
      } finally {
        setDataLoading(false)
      }
    }

    loadGovernanceData()
  }, [])

  const handleCompositionSubmit = async (composition: GovernanceComposition) => {
    if (!governanceData) return

    const updatedData = { ...governanceData, composition }
    await governanceDataService.saveGovernanceData(updatedData)
    setGovernanceData(updatedData)
    setCurrentStep(1)
  }

  const handlePoliciesSubmit = async (policies: GovernancePolicies) => {
    if (!governanceData) return

    const updatedData = { ...governanceData, policies }
    await governanceDataService.saveGovernanceData(updatedData)
    setGovernanceData(updatedData)
    setCurrentStep(2)
  }

  const handleOversightSubmit = async (oversight: any) => {
    if (!governanceData) return

    const updatedData = { ...governanceData, oversight }
    await governanceDataService.saveGovernanceData(updatedData)
    setGovernanceData(updatedData)
    setCurrentStep(3)
  }

  const handleCompensationSubmit = async (compensation: any) => {
    if (!governanceData) return

    const updatedData = { ...governanceData, compensation }
    await governanceDataService.saveGovernanceData(updatedData)
    setGovernanceData(updatedData)
    window.location.href = "/dashboard"
  }

  const getStepperSteps = () => {
    return governanceSteps.map((step, index) => ({
      ...step,
      status: index < currentStep ? "complete" : index === currentStep ? "current" : "pending",
    }))
  }

  if (dataLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando dados de governança...</p>
        </div>
      </div>
    )
  }

  if (!governanceData) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <div className="text-center">
          <p>Erro ao carregar dados de governança. Tente recarregar a página.</p>
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-primary text-white rounded">
            Recarregar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-7xl space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Coleta de Dados de Governança</h1>
          <p className="text-muted-foreground">Composição do conselho, políticas e estruturas de governança</p>
        </div>

        {/* Stepper */}
        <div className="py-4">
          <Stepper steps={getStepperSteps()} />
        </div>

        {/* Form Content */}
        <div className="pb-8">
          {currentStep === 0 && (
            <CompositionForm
              initialData={governanceData.composition}
              onSubmit={handleCompositionSubmit}
              onBack={() => (window.location.href = "/dashboard")}
            />
          )}

          {currentStep === 1 && (
            <PoliciesForm
              initialData={governanceData.policies}
              onSubmit={handlePoliciesSubmit}
              onBack={() => setCurrentStep(0)}
            />
          )}

          {currentStep === 2 && (
            <OversightForm
              initialData={governanceData.oversight}
              onSubmit={handleOversightSubmit}
              onBack={() => setCurrentStep(1)}
            />
          )}

          {currentStep === 3 && (
            <CompensationForm
              initialData={governanceData.compensation}
              onSubmit={handleCompensationSubmit}
              onBack={() => setCurrentStep(2)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
