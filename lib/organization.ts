// Organization data types and utilities for ESG reporting
export interface Branch {
  id: string
  name: string
  address: string
  cnpj: string
}

export interface Organization {
  id: string
  legalName: string
  legalForm: string
  address: string
  cnpj: string
  branches: Branch[]
}

export interface ReportingPeriod {
  startDate: string
  endDate: string
  entitiesIncluded: string
  restatement: {
    hasRestatement: boolean
    description?: string
  }
  externalAssurance: {
    hasAssurance: boolean
    documentId?: string
  }
}

export interface OnboardingData {
  organization: Organization | null
  reportingPeriod: ReportingPeriod | null
  currentStep: number
  isComplete: boolean
}

// Mock data service - in production this would connect to your backend
export const organizationService = {
  async saveOrganization(org: Organization): Promise<void> {
    localStorage.setItem("esg-organization", JSON.stringify(org))
  },

  async saveReportingPeriod(period: ReportingPeriod): Promise<void> {
    localStorage.setItem("esg-reporting-period", JSON.stringify(period))
  },

  getOrganization(): Organization | null {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem("esg-organization")
    return stored ? JSON.parse(stored) : null
  },

  getReportingPeriod(): ReportingPeriod | null {
    if (typeof window === "undefined") return null
    const stored = localStorage.getItem("esg-reporting-period")
    return stored ? JSON.parse(stored) : null
  },
}
