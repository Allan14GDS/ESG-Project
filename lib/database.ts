// Mock database service for the ESG platform
import type { Cycle, Unit, Theme, Disclosure, DisclosureStatus } from "@/types/database"

// Mock data for demonstration
const mockCycles: Cycle[] = [
  {
    id: "cycle-2025",
    name: "Relatório ESG 2025",
    organizationId: "org-acme-corp",
    startDate: new Date("2025-01-01"),
    endDate: new Date("2025-12-31"),
    status: "active",
    frameworks: ["GRI", "IFRS"],
    description: "Ciclo anual de relatório ESG 2025 com foco em GRI e IFRS",
    createdBy: "user-master-001",
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date(),
  },
]

const mockUnits: Unit[] = [
  {
    id: "unit-matriz",
    name: "Matriz",
    type: "headquarters",
    organizationId: "org-acme-corp",
    cnpj: "12.345.678/0001-99",
    address: {
      street: "Av. Paulista, 1000",
      city: "São Paulo",
      state: "SP",
      zipCode: "01310-100",
      country: "Brasil",
    },
    responsibleUserId: "user-owner-001",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date(),
  },
  {
    id: "unit-filial-sp",
    name: "Filial São Paulo",
    type: "branch",
    organizationId: "org-acme-corp",
    cnpj: "12.345.678/0002-88",
    address: {
      street: "Rua Augusta, 500",
      city: "São Paulo",
      state: "SP",
      zipCode: "01305-000",
      country: "Brasil",
    },
    responsibleUserId: "user-contrib-001",
    isActive: true,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date(),
  },
]

const mockThemes: Theme[] = [
  {
    id: "theme-governance",
    name: "Estrutura de Governança",
    code: "GRI-2-9",
    framework: "GRI",
    category: "governance",
    isMaterial: true,
    organizationId: "org-acme-corp",
    cycleId: "cycle-2025",
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date(),
  },
  {
    id: "theme-emissions",
    name: "Emissões de GEE",
    code: "GRI-305",
    framework: "GRI",
    category: "environmental",
    isMaterial: true,
    organizationId: "org-acme-corp",
    cycleId: "cycle-2025",
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date(),
  },
]

const mockDisclosures: Disclosure[] = [
  {
    id: "disclosure-001",
    code: "GRI-2-1",
    title: "Detalhes organizacionais",
    description: "Informações sobre a estrutura organizacional",
    framework: "GRI",
    themeId: "theme-governance",
    cycleId: "cycle-2025",
    unitId: "unit-matriz",
    status: "draft",
    assignedTo: "user-contrib-001",
    reviewerId: "user-reviewer-001",
    dueDate: new Date("2025-03-31"),
    responses: [],
    evidences: [],
    comments: [],
    alerts: [],
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date(),
  },
]

export const databaseService = {
  // Cycles
  async getCycles(organizationId: string): Promise<Cycle[]> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return mockCycles.filter((cycle) => cycle.organizationId === organizationId)
  },

  async getCycle(id: string): Promise<Cycle | null> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockCycles.find((cycle) => cycle.id === id) || null
  },

  async createCycle(cycle: Omit<Cycle, "id" | "createdAt" | "updatedAt">): Promise<Cycle> {
    await new Promise((resolve) => setTimeout(resolve, 800))
    const newCycle: Cycle = {
      ...cycle,
      id: `cycle-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockCycles.push(newCycle)
    return newCycle
  },

  // Units
  async getUnits(organizationId: string): Promise<Unit[]> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return mockUnits.filter((unit) => unit.organizationId === organizationId)
  },

  async createUnit(unit: Omit<Unit, "id" | "createdAt" | "updatedAt">): Promise<Unit> {
    await new Promise((resolve) => setTimeout(resolve, 600))
    const newUnit: Unit = {
      ...unit,
      id: `unit-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    mockUnits.push(newUnit)
    return newUnit
  },

  // Themes
  async getThemes(cycleId: string): Promise<Theme[]> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return mockThemes.filter((theme) => theme.cycleId === cycleId)
  },

  // Disclosures
  async getDisclosures(cycleId: string, unitId?: string): Promise<Disclosure[]> {
    await new Promise((resolve) => setTimeout(resolve, 600))
    let filtered = mockDisclosures.filter((disclosure) => disclosure.cycleId === cycleId)
    if (unitId) {
      filtered = filtered.filter((disclosure) => disclosure.unitId === unitId)
    }
    return filtered
  },

  async getDisclosure(id: string): Promise<Disclosure | null> {
    await new Promise((resolve) => setTimeout(resolve, 300))
    return mockDisclosures.find((disclosure) => disclosure.id === id) || null
  },

  async updateDisclosureStatus(id: string, status: DisclosureStatus, userId: string): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const disclosure = mockDisclosures.find((d) => d.id === id)
    if (disclosure) {
      disclosure.status = status
      disclosure.updatedAt = new Date()
      // Log the action
      this.logAction(userId, "update_disclosure_status", "disclosure", id, disclosure.status, status)
    }
  },

  // Audit logging
  async logAction(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    oldValue?: any,
    newValue?: any,
  ): Promise<void> {
    // In a real app, this would write to an audit log table
    console.log(`[AUDIT] ${userId} performed ${action} on ${entityType}:${entityId}`, {
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    })
  },

  // Dashboard statistics
  async getDashboardStats(organizationId: string, cycleId: string) {
    await new Promise((resolve) => setTimeout(resolve, 800))

    const disclosures = await this.getDisclosures(cycleId)
    const total = disclosures.length
    const byStatus = disclosures.reduce(
      (acc, disclosure) => {
        acc[disclosure.status] = (acc[disclosure.status] || 0) + 1
        return acc
      },
      {} as Record<DisclosureStatus, number>,
    )

    return {
      totalDisclosures: total,
      completed: byStatus.approved || 0,
      inProgress: (byStatus.draft || 0) + (byStatus.submitted || 0),
      pending: byStatus.not_started || 0,
      rejected: byStatus.rejected || 0,
      completionPercentage: total > 0 ? Math.round(((byStatus.approved || 0) / total) * 100) : 0,
    }
  },
}
