import type {
  DisclosureData,
  DisclosureTemplate,
  DisclosureAttachment,
  DisclosureMetric,
  DisclosureStatus,
} from "@/types/disclosures"

class DisclosureService {
  private disclosures: DisclosureData[] = []
  private templates: DisclosureTemplate[] = []
  private attachments: DisclosureAttachment[] = []
  private metrics: DisclosureMetric[] = []

  // Disclosure Management
  getDisclosures(
    organizationId: string,
    filters?: {
      frameworkId?: string
      status?: DisclosureStatus
      assignedTo?: string
      reportingPeriod?: { start: Date; end: Date }
    },
  ): DisclosureData[] {
    let filtered = this.disclosures.filter((d) => d.organizationId === organizationId)

    if (filters) {
      if (filters.frameworkId) {
        filtered = filtered.filter((d) => d.frameworkId === filters.frameworkId)
      }
      if (filters.status) {
        filtered = filtered.filter((d) => d.status === filters.status)
      }
      if (filters.assignedTo) {
        filtered = filtered.filter((d) => d.assignedTo === filters.assignedTo)
      }
      if (filters.reportingPeriod) {
        filtered = filtered.filter(
          (d) =>
            d.reportingPeriod.start >= filters.reportingPeriod!.start &&
            d.reportingPeriod.end <= filters.reportingPeriod!.end,
        )
      }
    }

    return filtered.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  getDisclosureById(id: string): DisclosureData | null {
    return this.disclosures.find((d) => d.id === id) || null
  }

  createDisclosure(disclosure: Omit<DisclosureData, "id" | "createdAt" | "updatedAt" | "version">): DisclosureData {
    const newDisclosure: DisclosureData = {
      ...disclosure,
      id: `disclosure-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
    }

    this.disclosures.push(newDisclosure)
    return newDisclosure
  }

  updateDisclosure(id: string, updates: Partial<DisclosureData>): DisclosureData | null {
    const index = this.disclosures.findIndex((d) => d.id === id)
    if (index === -1) return null

    const currentDisclosure = this.disclosures[index]
    const updatedDisclosure: DisclosureData = {
      ...currentDisclosure,
      ...updates,
      updatedAt: new Date(),
      version: currentDisclosure.version + 1,
      previousVersionId: currentDisclosure.id,
    }

    this.disclosures[index] = updatedDisclosure
    return updatedDisclosure
  }

  deleteDisclosure(id: string): boolean {
    const index = this.disclosures.findIndex((d) => d.id === id)
    if (index === -1) return false

    this.disclosures.splice(index, 1)
    return true
  }

  // Status Management
  updateDisclosureStatus(id: string, status: DisclosureStatus, userId?: string): DisclosureData | null {
    const disclosure = this.getDisclosureById(id)
    if (!disclosure) return null

    const updates: Partial<DisclosureData> = { status }

    if (status === "completed") {
      updates.completedAt = new Date()
    }
    if (status === "approved") {
      updates.approvedAt = new Date()
      updates.reviewedBy = userId
    }

    return this.updateDisclosure(id, updates)
  }

  // Template Management
  getTemplates(frameworkId?: string): DisclosureTemplate[] {
    if (frameworkId) {
      return this.templates.filter((t) => t.frameworkId === frameworkId)
    }
    return this.templates
  }

  getTemplateById(id: string): DisclosureTemplate | null {
    return this.templates.find((t) => t.id === id) || null
  }

  // Attachment Management
  addAttachment(attachment: Omit<DisclosureAttachment, "id" | "uploadedAt">): DisclosureAttachment {
    const newAttachment: DisclosureAttachment = {
      ...attachment,
      id: `attachment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      uploadedAt: new Date(),
    }

    this.attachments.push(newAttachment)
    return newAttachment
  }

  getAttachments(disclosureId: string): DisclosureAttachment[] {
    return this.attachments.filter((a) => a.disclosureId === disclosureId)
  }

  removeAttachment(id: string): boolean {
    const index = this.attachments.findIndex((a) => a.id === id)
    if (index === -1) return false

    this.attachments.splice(index, 1)
    return true
  }

  // Metrics Management
  addMetric(metric: Omit<DisclosureMetric, "id">): DisclosureMetric {
    const newMetric: DisclosureMetric = {
      ...metric,
      id: `metric-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    this.metrics.push(newMetric)
    return newMetric
  }

  getMetrics(disclosureId: string): DisclosureMetric[] {
    return this.metrics.filter((m) => m.disclosureId === disclosureId)
  }

  updateMetric(id: string, updates: Partial<DisclosureMetric>): DisclosureMetric | null {
    const index = this.metrics.findIndex((m) => m.id === id)
    if (index === -1) return null

    this.metrics[index] = { ...this.metrics[index], ...updates }
    return this.metrics[index]
  }

  // Analytics
  getDisclosureStats(organizationId: string): {
    total: number
    byStatus: Record<DisclosureStatus, number>
    byFramework: Record<string, number>
    completionRate: number
    overdue: number
  } {
    const orgDisclosures = this.getDisclosures(organizationId)

    const byStatus = orgDisclosures.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1
        return acc
      },
      {} as Record<DisclosureStatus, number>,
    )

    const byFramework = orgDisclosures.reduce(
      (acc, d) => {
        acc[d.frameworkId] = (acc[d.frameworkId] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const completed = byStatus.completed || 0
    const approved = byStatus.approved || 0
    const total = orgDisclosures.length

    return {
      total,
      byStatus,
      byFramework,
      completionRate: total > 0 ? Math.round(((completed + approved) / total) * 100) : 0,
      overdue: 0, // TODO: Implement overdue calculation based on deadlines
    }
  }

  // Validation
  validateDisclosure(disclosure: DisclosureData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!disclosure.response || disclosure.response.trim().length === 0) {
      errors.push("Response is required")
    }

    if (disclosure.dataType === "quantitative" && (!disclosure.metrics || disclosure.metrics.length === 0)) {
      errors.push("Quantitative disclosures must include at least one metric")
    }

    // Add more validation rules as needed

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

export const disclosureService = new DisclosureService()
export type { DisclosureData, DisclosureTemplate, DisclosureAttachment, DisclosureMetric }
