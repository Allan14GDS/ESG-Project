import { employeeDataService, createEmptyMatrix, updateMatrixCell, type NonEmployeeWorkers } from "./employee-data"

export const testDataGenerator = {
  async generateCompleteTestData(): Promise<void> {
    // Generate organization data
    const organizationData = {
      legalName: "ACME Corporation Ltda",
      tradeName: "ACME Corp",
      sector: "technology",
      cnpj: "12.345.678/0001-99",
      address: {
        street: "Av. Paulista, 1000",
        city: "São Paulo",
        state: "SP",
        zipCode: "01310-100",
        country: "Brasil",
      },
      website: "https://acme-corp.com.br",
      description: "Empresa de tecnologia focada em soluções ESG",
    }

    localStorage.setItem("esg-organization-data", JSON.stringify(organizationData))

    // Generate reporting period
    const reportingPeriod = {
      startDate: "2024-01-01",
      endDate: "2024-12-31",
      reportingCycle: "annual",
      previousPeriodStartDate: "2023-01-01",
      previousPeriodEndDate: "2023-12-31",
    }

    localStorage.setItem("esg-reporting-period", JSON.stringify(reportingPeriod))

    // Generate employee matrices with realistic data
    const matrices = [
      createEmptyMatrix("unit-matriz", "Matriz São Paulo", "headquarters"),
      createEmptyMatrix("unit-filial-rj", "Filial Rio de Janeiro", "branch"),
      createEmptyMatrix("unit-filial-bh", "Filial Belo Horizonte", "branch"),
    ]

    // Add realistic employee data to matrices
    // Matriz - 150 employees
    let matrizMatrix = matrices[0]
    matrizMatrix = updateMatrixCell(matrizMatrix, "Feminino", "Branca", "≤30", 25)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Feminino", "Branca", "30–50", 30)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Feminino", "Branca", "50+", 10)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Feminino", "Preta/Parda", "≤30", 15)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Feminino", "Preta/Parda", "30–50", 12)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Feminino", "Preta/Parda", "50+", 3)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Masculino", "Branca", "≤30", 20)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Masculino", "Branca", "30–50", 25)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Masculino", "Branca", "50+", 8)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Masculino", "Preta/Parda", "≤30", 12)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Masculino", "Preta/Parda", "30–50", 8)
    matrizMatrix = updateMatrixCell(matrizMatrix, "Masculino", "Preta/Parda", "50+", 2)
    matrices[0] = matrizMatrix

    // Filial RJ - 80 employees
    let rjMatrix = matrices[1]
    rjMatrix = updateMatrixCell(rjMatrix, "Feminino", "Branca", "≤30", 18)
    rjMatrix = updateMatrixCell(rjMatrix, "Feminino", "Branca", "30–50", 15)
    rjMatrix = updateMatrixCell(rjMatrix, "Feminino", "Branca", "50+", 5)
    rjMatrix = updateMatrixCell(rjMatrix, "Feminino", "Preta/Parda", "≤30", 12)
    rjMatrix = updateMatrixCell(rjMatrix, "Feminino", "Preta/Parda", "30–50", 8)
    rjMatrix = updateMatrixCell(rjMatrix, "Masculino", "Branca", "≤30", 10)
    rjMatrix = updateMatrixCell(rjMatrix, "Masculino", "Branca", "30–50", 8)
    rjMatrix = updateMatrixCell(rjMatrix, "Masculino", "Preta/Parda", "≤30", 4)
    matrices[1] = rjMatrix

    // Filial BH - 45 employees
    let bhMatrix = matrices[2]
    bhMatrix = updateMatrixCell(bhMatrix, "Feminino", "Branca", "≤30", 12)
    bhMatrix = updateMatrixCell(bhMatrix, "Feminino", "Branca", "30–50", 10)
    bhMatrix = updateMatrixCell(bhMatrix, "Feminino", "Preta/Parda", "≤30", 8)
    bhMatrix = updateMatrixCell(bhMatrix, "Masculino", "Branca", "≤30", 8)
    bhMatrix = updateMatrixCell(bhMatrix, "Masculino", "Branca", "30–50", 5)
    bhMatrix = updateMatrixCell(bhMatrix, "Masculino", "Preta/Parda", "≤30", 2)
    matrices[2] = bhMatrix

    await employeeDataService.saveEmployeeMatrices(matrices)

    // Generate non-employee workers data
    const nonEmployeeWorkers: NonEmployeeWorkers = {
      contractors: 25,
      freelancers: 15,
      temporaryWorkers: 8,
      total: 48,
    }

    await employeeDataService.saveNonEmployeeWorkers(nonEmployeeWorkers)

    // Generate governance data
    const governanceData = {
      boardComposition: {
        totalMembers: 7,
        independentMembers: 4,
        womenMembers: 3,
        diversityMembers: 2,
      },
      executiveCompensation: {
        hasESGMetrics: true,
        esgWeightPercentage: 25,
        sustainabilityBonus: true,
      },
      riskManagement: {
        hasESGRiskFramework: true,
        climateRiskAssessment: true,
        cybersecurityFramework: true,
      },
    }

    localStorage.setItem("esg-governance-data", JSON.stringify(governanceData))

    // Generate policies data
    const policiesData = {
      codeOfConduct: { exists: true, lastUpdated: "2024-01-15", publiclyAvailable: true },
      anticorruptionPolicy: { exists: true, lastUpdated: "2024-02-01", publiclyAvailable: true },
      diversityPolicy: { exists: true, lastUpdated: "2024-01-30", publiclyAvailable: true },
      environmentalPolicy: { exists: true, lastUpdated: "2024-03-01", publiclyAvailable: true },
      humanRightsPolicy: { exists: true, lastUpdated: "2024-01-20", publiclyAvailable: false },
      supplierCodeOfConduct: { exists: true, lastUpdated: "2024-02-15", publiclyAvailable: true },
    }

    localStorage.setItem("esg-policies-data", JSON.stringify(policiesData))

    // Trigger update event
    window.dispatchEvent(new CustomEvent("esg-data-updated"))

    console.log("✅ Dados de teste completos gerados com sucesso!")
    console.log("📊 Dados incluem:")
    console.log("- Organização: ACME Corporation Ltda")
    console.log("- Período: 2024 (anual)")
    console.log("- Funcionários: 275 pessoas em 3 unidades")
    console.log("- Trabalhadores não-funcionários: 48 pessoas")
    console.log("- Dados de governança completos")
    console.log("- 6 políticas corporativas")
  },

  async clearAllTestData(): Promise<void> {
    const keys = [
      "esg-organization-data",
      "esg-reporting-period",
      "esg-employee-matrices",
      "esg-non-employee-workers",
      "esg-governance-data",
      "esg-policies-data",
    ]

    keys.forEach((key) => localStorage.removeItem(key))

    // Trigger update event
    window.dispatchEvent(new CustomEvent("esg-data-updated"))

    console.log("🗑️ Todos os dados de teste foram removidos")
  },
}

// Make it available globally for easy testing
if (typeof window !== "undefined") {
  ;(window as any).testDataGenerator = testDataGenerator
}
