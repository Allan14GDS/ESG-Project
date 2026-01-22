// Governance data types and utilities for ESG reporting
import type { Gender, Race, AgeBand } from "./employee-data"

export interface GovernanceMember {
  id: string
  name: string
  position: string
  gender: Gender
  race: Race
  ageBand: AgeBand
  isIndependent: boolean
  committees: string[]
  tenure: number // years
}

export interface GovernanceComposition {
  totalMembers: number
  independentMembers: number
  executiveMembers: number
  nonExecutiveMembers: number
  demographics: {
    byGender: Record<Gender, number>
    byRace: Record<Race, number>
    byAge: Record<AgeBand, number>
  }
  committees: Committee[]
  chairpersonExecutive: boolean
  chairpersonExecutiveDescription?: string
}

export interface Committee {
  id: string
  name: string
  purpose: string
  memberCount: number
  chairperson: string
  responsibilities: string[]
}

export interface GovernancePolicies {
  hasEthicsCode: boolean
  ethicsCodeDescription?: string
  hasConflictPolicy: boolean
  conflictPolicyDescription?: string
  hasWhistleblowerPolicy: boolean
  whistleblowerPolicyDescription?: string
  hasAntiCorruptionPolicy: boolean
  antiCorruptionPolicyDescription?: string
  hasDiversityPolicy: boolean
  diversityPolicyDescription?: string
}

export interface GovernanceOversight {
  hasNominationProcess: boolean
  nominationProcessDescription?: string
  hasPerformanceEvaluation: boolean
  performanceEvaluationDescription?: string
  hasSuccessionPlanning: boolean
  successionPlanningDescription?: string
  hasRiskManagement: boolean
  riskManagementDescription?: string
}

export interface GovernanceCompensation {
  hasCompensationPolicy: boolean
  compensationPolicyDescription?: string
  executiveCompensationRatio?: number
  compensationMethodology?: string
  hasPerformanceIncentives: boolean
  performanceIncentivesDescription?: string
}

export interface GovernanceData {
  composition: GovernanceComposition
  policies: GovernancePolicies
  oversight: GovernanceOversight
  compensation: GovernanceCompensation
}

export const DEFAULT_COMMITTEES = [
  "Audit Committee",
  "Compensation Committee",
  "Nominating Committee",
  "Risk Committee",
  "ESG/Sustainability Committee",
  "Strategy Committee",
]

// Governance data service
export const governanceDataService = {
  async saveGovernanceData(data: GovernanceData): Promise<void> {
    const dataWithVersion = { ...data, _version: "2.0" }
    localStorage.setItem("esg-governance-data", JSON.stringify(dataWithVersion))
  },

  getGovernanceData(): GovernanceData | null {
    if (typeof window === "undefined") return null

    try {
      const stored = localStorage.getItem("esg-governance-data")
      if (!stored) return null

      const parsed = JSON.parse(stored)

      // Check if data has the correct structure (composition, policies, oversight, compensation)
      if (!parsed.composition || !parsed.policies || !parsed.oversight || !parsed.compensation) {
        console.log("[v0] Invalid or old governance data structure detected, clearing...")
        localStorage.removeItem("esg-governance-data")
        return null
      }

      if (typeof parsed.composition.totalMembers !== "number") {
        console.log("[v0] Invalid composition structure, clearing...")
        localStorage.removeItem("esg-governance-data")
        return null
      }

      return parsed as GovernanceData
    } catch (error) {
      console.error("[v0] Error parsing governance data:", error)
      localStorage.removeItem("esg-governance-data")
      return null
    }
  },

  createEmptyGovernanceData(): GovernanceData {
    return {
      composition: {
        totalMembers: 0,
        independentMembers: 0,
        executiveMembers: 0,
        nonExecutiveMembers: 0,
        demographics: {
          byGender: { Feminino: 0, Masculino: 0, "Não binário": 0, Outros: 0 },
          byRace: { Branca: 0, "Preta/Parda": 0, Indígena: 0, Outros: 0 },
          byAge: { "≤30": 0, "30–50": 0, "50+": 0 },
        },
        committees: [],
        chairpersonExecutive: false,
      },
      policies: {
        hasEthicsCode: false,
        hasConflictPolicy: false,
        hasWhistleblowerPolicy: false,
        hasAntiCorruptionPolicy: false,
        hasDiversityPolicy: false,
      },
      oversight: {
        hasNominationProcess: false,
        hasPerformanceEvaluation: false,
        hasSuccessionPlanning: false,
        hasRiskManagement: false,
      },
      compensation: {
        hasCompensationPolicy: false,
        hasPerformanceIncentives: false,
      },
    }
  },
}
