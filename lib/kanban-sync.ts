import type { DisclosureData, DisclosureStatus } from "@/types/disclosures"

// Mapeamento entre status do Kanban e status do Disclosure
export const KANBAN_STATUS_MAP = {
  "not-started": "not_started" as DisclosureStatus,
  draft: "in_progress" as DisclosureStatus,
  submitted: "under_review" as DisclosureStatus,
  returned: "needs_revision" as DisclosureStatus,
  validated: "approved" as DisclosureStatus,
} as const

export const DISCLOSURE_STATUS_MAP = {
  not_started: "not-started",
  in_progress: "draft",
  under_review: "submitted",
  needs_revision: "returned",
  completed: "validated",
  approved: "validated",
} as const

export type KanbanStatus = keyof typeof KANBAN_STATUS_MAP
export type KanbanCategory = "governance" | "strategy" | "stakeholders" | "all"

export interface KanbanCard {
  id: string
  disclosureId: string
  griCode: string
  title: string
  category: KanbanCategory
  status: KanbanStatus
  owner: string
  deadline: string
  progress: number
  feedback?: string
  priority: "low" | "medium" | "high"
  tags: string[]
}

class KanbanSyncService {
  private readonly STORAGE_KEY = "esg-kanban-cards"
  private readonly DISCLOSURE_STORAGE_KEY = "esg-disclosures"

  private ensureDate(value: Date | string | undefined): Date {
    if (!value) return new Date()
    if (value instanceof Date) return value
    return new Date(value)
  }

  // Sincronização bidirecional: Disclosure → Kanban
  syncDisclosureToKanban(disclosure: DisclosureData): KanbanCard {
    if (!disclosure.requirementId) {
      console.error("[v0] Disclosure missing requirementId:", disclosure)
      throw new Error("Disclosure must have a requirementId")
    }

    const cards = this.getKanbanCards()
    const existingCard = cards.find((c) => c.disclosureId === disclosure.id)

    const kanbanStatus = DISCLOSURE_STATUS_MAP[disclosure.status] || "not-started"
    const progress = this.calculateProgress(disclosure)

    const endDate = this.ensureDate(disclosure.reportingPeriod.end)

    const card: KanbanCard = {
      id: existingCard?.id || `card-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      disclosureId: disclosure.id,
      griCode: disclosure.requirementId,
      title: disclosure.title,
      category: this.categorizeDisclosure(disclosure.requirementId),
      status: kanbanStatus as KanbanStatus,
      owner: disclosure.assignedTo || "Não atribuído",
      deadline: endDate.toLocaleDateString("pt-BR"),
      progress,
      feedback: disclosure.reviewComments,
      priority: this.calculatePriority(disclosure),
      tags: this.generateTags(disclosure),
    }

    if (existingCard) {
      const index = cards.findIndex((c) => c.id === card.id)
      cards[index] = card
    } else {
      cards.push(card)
    }

    this.saveKanbanCards(cards)
    return card
  }

  // Sincronização bidirecional: Kanban → Disclosure
  syncKanbanToDisclosure(cardId: string, newStatus: KanbanStatus): void {
    const cards = this.getKanbanCards()
    const card = cards.find((c) => c.id === cardId)
    if (!card) return

    // Atualizar status do card
    card.status = newStatus
    this.saveKanbanCards(cards)

    // Atualizar disclosure correspondente
    const disclosures = this.getDisclosures()
    const disclosure = disclosures.find((d) => d.id === card.disclosureId)
    if (!disclosure) return

    const disclosureStatus = KANBAN_STATUS_MAP[newStatus]
    disclosure.status = disclosureStatus
    disclosure.updatedAt = new Date()

    if (disclosureStatus === "approved") {
      disclosure.approvedAt = new Date()
    }

    this.saveDisclosures(disclosures)

    console.log("[v0] Synced Kanban to Disclosure:", {
      cardId,
      disclosureId: card.disclosureId,
      newStatus,
      disclosureStatus,
    })
  }

  // Obter todos os cards do Kanban
  getKanbanCards(): KanbanCard[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.STORAGE_KEY)
    return data ? JSON.parse(data) : []
  }

  // Salvar cards do Kanban
  private saveKanbanCards(cards: KanbanCard[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(cards))
  }

  // Obter disclosures
  private getDisclosures(): DisclosureData[] {
    if (typeof window === "undefined") return []
    const data = localStorage.getItem(this.DISCLOSURE_STORAGE_KEY)
    if (!data) return []

    const disclosures = JSON.parse(data) as DisclosureData[]
    return disclosures.map((d) => ({
      ...d,
      createdAt: this.ensureDate(d.createdAt),
      updatedAt: this.ensureDate(d.updatedAt),
      approvedAt: d.approvedAt ? this.ensureDate(d.approvedAt) : undefined,
      reportingPeriod: {
        start: this.ensureDate(d.reportingPeriod.start),
        end: this.ensureDate(d.reportingPeriod.end),
      },
    }))
  }

  // Salvar disclosures
  private saveDisclosures(disclosures: DisclosureData[]): void {
    if (typeof window === "undefined") return
    localStorage.setItem(this.DISCLOSURE_STORAGE_KEY, JSON.stringify(disclosures))
  }

  // Filtrar cards
  filterCards(
    cards: KanbanCard[],
    filters: {
      category?: KanbanCategory
      owner?: string
      deadline?: { start: Date; end: Date }
      search?: string
    },
  ): KanbanCard[] {
    let filtered = [...cards]

    if (filters.category && filters.category !== "all") {
      filtered = filtered.filter((c) => c.category === filters.category)
    }

    if (filters.owner) {
      filtered = filtered.filter((c) => c.owner.toLowerCase().includes(filters.owner!.toLowerCase()))
    }

    if (filters.deadline) {
      filtered = filtered.filter((c) => {
        const cardDeadline = this.parseDate(c.deadline)
        return cardDeadline >= filters.deadline!.start && cardDeadline <= filters.deadline!.end
      })
    }

    if (filters.search) {
      const search = filters.search.toLowerCase()
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(search) ||
          c.griCode.toLowerCase().includes(search) ||
          c.owner.toLowerCase().includes(search),
      )
    }

    return filtered
  }

  // Agrupar cards por status
  groupCardsByStatus(cards: KanbanCard[]): Record<KanbanStatus, KanbanCard[]> {
    const groups: Record<KanbanStatus, KanbanCard[]> = {
      "not-started": [],
      draft: [],
      submitted: [],
      returned: [],
      validated: [],
    }

    cards.forEach((card) => {
      groups[card.status].push(card)
    })

    return groups
  }

  // Calcular progresso do disclosure
  private calculateProgress(disclosure: DisclosureData): number {
    let progress = 0

    if (disclosure.response && disclosure.response.trim().length > 0) {
      progress += 40
    }

    if (disclosure.attachments && disclosure.attachments.length > 0) {
      progress += 30
    }

    if (disclosure.metrics && disclosure.metrics.length > 0) {
      progress += 30
    }

    return Math.min(progress, 100)
  }

  // Categorizar disclosure por código GRI
  private categorizeDisclosure(griCode: string): KanbanCategory {
    if (!griCode || typeof griCode !== "string") {
      console.warn("[v0] Invalid griCode:", griCode)
      return "governance"
    }

    if (griCode.startsWith("2-9") || griCode.startsWith("2-10") || griCode.startsWith("2-11")) {
      return "governance"
    }
    if (griCode.startsWith("2-22") || griCode.startsWith("2-23") || griCode.startsWith("2-24")) {
      return "strategy"
    }
    if (griCode.startsWith("2-29") || griCode.startsWith("2-30")) {
      return "stakeholders"
    }
    return "governance"
  }

  // Calcular prioridade
  private calculatePriority(disclosure: DisclosureData): "low" | "medium" | "high" {
    const endDate = this.ensureDate(disclosure.reportingPeriod.end)
    const daysUntilDeadline = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    if (daysUntilDeadline < 3) return "high"
    if (daysUntilDeadline < 7) return "medium"
    return "low"
  }

  // Gerar tags
  private generateTags(disclosure: DisclosureData): string[] {
    const tags: string[] = []

    if (disclosure.dataType === "quantitative") tags.push("Quantitativo")
    if (disclosure.dataType === "qualitative") tags.push("Qualitativo")
    if (disclosure.attachments && disclosure.attachments.length > 0) tags.push("Com evidências")
    if (disclosure.reviewStatus === "needs_revision") tags.push("Requer revisão")

    return tags
  }

  // Parse date string
  private parseDate(dateStr: string): Date {
    const [day, month, year] = dateStr.split("/")
    return new Date(Number.parseInt(year), Number.parseInt(month) - 1, Number.parseInt(day))
  }

  // Inicializar cards a partir de disclosures existentes
  initializeKanbanFromDisclosures(): void {
    const disclosures = this.getDisclosures()
    disclosures.forEach((disclosure) => {
      this.syncDisclosureToKanban(disclosure)
    })
  }
}

export const kanbanSyncService = new KanbanSyncService()
