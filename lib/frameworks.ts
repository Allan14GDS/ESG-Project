import {
  type Framework,
  type FrameworkStandard,
  type OrganizationFramework,
  AVAILABLE_FRAMEWORKS,
  GRI_UNIVERSAL_STANDARDS,
} from "@/types/frameworks"

class FrameworkService {
  private frameworks: Framework[] = AVAILABLE_FRAMEWORKS
  private standards: FrameworkStandard[] = GRI_UNIVERSAL_STANDARDS
  private organizationFrameworks: OrganizationFramework[] = []

  // Framework Management
  getAvailableFrameworks(): Framework[] {
    return this.frameworks.filter((f) => f.isActive)
  }

  getFrameworkById(id: string): Framework | null {
    return this.frameworks.find((f) => f.id === id) || null
  }

  getFrameworksByType(type: string): Framework[] {
    return this.frameworks.filter((f) => f.type === type && f.isActive)
  }

  // Standards Management
  getStandardsByFramework(frameworkId: string): FrameworkStandard[] {
    return this.standards.filter((s) => s.frameworkId === frameworkId)
  }

  getStandardById(id: string): FrameworkStandard | null {
    return this.standards.find((s) => s.id === id) || null
  }

  getRequiredStandards(frameworkId: string): FrameworkStandard[] {
    return this.standards.filter((s) => s.frameworkId === frameworkId && s.isRequired)
  }

  // Organization Framework Management
  getOrganizationFrameworks(organizationId: string): OrganizationFramework[] {
    return this.organizationFrameworks.filter((of) => of.organizationId === organizationId)
  }

  addOrganizationFramework(orgFramework: Omit<OrganizationFramework, "id">): OrganizationFramework {
    const newOrgFramework: OrganizationFramework = {
      ...orgFramework,
      id: `org-fw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    this.organizationFrameworks.push(newOrgFramework)
    return newOrgFramework
  }

  updateOrganizationFramework(id: string, updates: Partial<OrganizationFramework>): OrganizationFramework | null {
    const index = this.organizationFrameworks.findIndex((of) => of.id === id)
    if (index === -1) return null

    this.organizationFrameworks[index] = { ...this.organizationFrameworks[index], ...updates }
    return this.organizationFrameworks[index]
  }

  removeOrganizationFramework(id: string): boolean {
    const index = this.organizationFrameworks.findIndex((of) => of.id === id)
    if (index === -1) return false

    this.organizationFrameworks.splice(index, 1)
    return true
  }

  // Framework Selection Logic
  getRecommendedFrameworks(sector?: string, region?: string): Framework[] {
    const recommended = this.getAvailableFrameworks()

    // Always recommend GRI as it's universal
    const gri = recommended.filter((f) => f.type === "GRI")

    // Add IFRS for public companies
    const ifrs = recommended.filter((f) => f.type === "IFRS")

    // Add SASB if sector-specific
    let sasb: Framework[] = []
    if (sector) {
      sasb = recommended.filter((f) => f.type === "SASB" && (!f.sectors || f.sectors.includes(sector)))
    }

    // Always include TCFD for climate disclosures
    const tcfd = recommended.filter((f) => f.type === "TCFD")

    return [...gri, ...ifrs, ...sasb, ...tcfd]
  }

  // Compliance Checking
  checkCompliance(
    organizationId: string,
    frameworkId: string,
  ): {
    totalStandards: number
    completedStandards: number
    missingStandards: FrameworkStandard[]
    compliancePercentage: number
  } {
    const orgFramework = this.organizationFrameworks.find(
      (of) => of.organizationId === organizationId && of.frameworkId === frameworkId,
    )

    if (!orgFramework) {
      return {
        totalStandards: 0,
        completedStandards: 0,
        missingStandards: [],
        compliancePercentage: 0,
      }
    }

    const allStandards = this.getStandardsByFramework(frameworkId)
    const requiredStandards = allStandards.filter((s) => s.isRequired)
    const completedStandards = requiredStandards.filter((s) => orgFramework.selectedStandards.includes(s.id))
    const missingStandards = requiredStandards.filter((s) => !orgFramework.selectedStandards.includes(s.id))

    return {
      totalStandards: requiredStandards.length,
      completedStandards: completedStandards.length,
      missingStandards,
      compliancePercentage:
        requiredStandards.length > 0 ? Math.round((completedStandards.length / requiredStandards.length) * 100) : 0,
    }
  }
}

export const frameworkService = new FrameworkService()
export type { Framework, FrameworkStandard, OrganizationFramework }
