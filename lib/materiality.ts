import type {
  MaterialityTopic,
  MaterialityAssessment,
  MaterialityTopicAssessment,
  StakeholderEngagement,
  MaterialityReport,
  MaterialityEvidence,
  StakeholderGroup,
  MaterialityCategory,
} from "@/types/materiality"
import { DEFAULT_MATERIALITY_TOPICS } from "@/types/materiality"

class MaterialityService {
  private topics: MaterialityTopic[] = DEFAULT_MATERIALITY_TOPICS
  private assessments: MaterialityAssessment[] = []
  private stakeholderEngagements: StakeholderEngagement[] = []
  private reports: MaterialityReport[] = []

  // Topic Management
  getTopics(category?: MaterialityCategory, industry?: string): MaterialityTopic[] {
    let filtered = this.topics

    if (category) {
      filtered = filtered.filter((t) => t.category === category)
    }

    if (industry) {
      filtered = filtered.filter((t) => !t.industries || t.industries.includes(industry))
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name))
  }

  getTopicById(id: string): MaterialityTopic | null {
    return this.topics.find((t) => t.id === id) || null
  }

  addCustomTopic(topic: Omit<MaterialityTopic, "id">): MaterialityTopic {
    const newTopic: MaterialityTopic = {
      ...topic,
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    this.topics.push(newTopic)
    return newTopic
  }

  // Assessment Management
  getAssessments(organizationId: string): MaterialityAssessment[] {
    return this.assessments
      .filter((a) => a.organizationId === organizationId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  getAssessmentById(id: string): MaterialityAssessment | null {
    return this.assessments.find((a) => a.id === id) || null
  }

  createAssessment(assessment: Omit<MaterialityAssessment, "id" | "createdAt" | "updatedAt">): MaterialityAssessment {
    const newAssessment: MaterialityAssessment = {
      ...assessment,
      id: `assessment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    this.assessments.push(newAssessment)
    return newAssessment
  }

  updateAssessment(id: string, updates: Partial<MaterialityAssessment>): MaterialityAssessment | null {
    const index = this.assessments.findIndex((a) => a.id === id)
    if (index === -1) return null

    this.assessments[index] = {
      ...this.assessments[index],
      ...updates,
      updatedAt: new Date(),
    }

    return this.assessments[index]
  }

  // Topic Assessment
  updateTopicAssessment(
    assessmentId: string,
    topicId: string,
    assessment: Partial<MaterialityTopicAssessment>,
  ): MaterialityAssessment | null {
    const materialityAssessment = this.getAssessmentById(assessmentId)
    if (!materialityAssessment) return null

    const topicIndex = materialityAssessment.topics.findIndex((t) => t.topicId === topicId)

    if (topicIndex === -1) {
      // Add new topic assessment
      const newTopicAssessment: MaterialityTopicAssessment = {
        topicId,
        businessImpact: {
          score: 0,
          rationale: "",
          assessedBy: "",
          assessedAt: new Date(),
          financial: 0,
          operational: 0,
          strategic: 0,
          reputational: 0,
          regulatory: 0,
        },
        stakeholderImportance: {
          score: 0,
          rationale: "",
          assessedBy: "",
          assessedAt: new Date(),
          byStakeholder: {} as Record<StakeholderGroup, number>,
        },
        evidence: [],
        isMaterial: false,
        isPriority: false,
        materialityRationale: "",
        ...assessment,
      }

      materialityAssessment.topics.push(newTopicAssessment)
    } else {
      // Update existing topic assessment
      materialityAssessment.topics[topicIndex] = {
        ...materialityAssessment.topics[topicIndex],
        ...assessment,
      }
    }

    // Recalculate materiality
    this.calculateMateriality(materialityAssessment)

    return this.updateAssessment(assessmentId, materialityAssessment)
  }

  // Materiality Calculation
  private calculateMateriality(assessment: MaterialityAssessment): void {
    const materialTopics: string[] = []
    const priorityTopics: string[] = []

    assessment.topics.forEach((topicAssessment) => {
      const businessScore = topicAssessment.businessImpact.score
      const stakeholderScore = topicAssessment.stakeholderImportance.score

      // Calculate combined materiality score
      const materialityScore = Math.sqrt((businessScore ** 2 + stakeholderScore ** 2) / 2)

      // Determine materiality
      const isMaterial = materialityScore >= assessment.matrixConfig.thresholds.material
      const isPriority = materialityScore >= assessment.matrixConfig.thresholds.highPriority

      topicAssessment.isMaterial = isMaterial
      topicAssessment.isPriority = isPriority

      if (isMaterial) {
        materialTopics.push(topicAssessment.topicId)
      }
      if (isPriority) {
        priorityTopics.push(topicAssessment.topicId)
      }
    })

    assessment.materialTopics = materialTopics
    assessment.priorityTopics = priorityTopics
  }

  // Stakeholder Engagement
  addStakeholderEngagement(
    assessmentId: string,
    engagement: Omit<StakeholderEngagement, "id">,
  ): StakeholderEngagement | null {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return null

    const newEngagement: StakeholderEngagement = {
      ...engagement,
      id: `engagement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    assessment.stakeholderEngagement.push(newEngagement)
    this.stakeholderEngagements.push(newEngagement)

    this.updateAssessment(assessmentId, assessment)
    return newEngagement
  }

  getStakeholderEngagements(assessmentId: string): StakeholderEngagement[] {
    const assessment = this.getAssessmentById(assessmentId)
    return assessment?.stakeholderEngagement || []
  }

  // Evidence Management
  addEvidence(
    assessmentId: string,
    topicId: string,
    evidence: Omit<MaterialityEvidence, "id">,
  ): MaterialityEvidence | null {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return null

    const topicAssessment = assessment.topics.find((t) => t.topicId === topicId)
    if (!topicAssessment) return null

    const newEvidence: MaterialityEvidence = {
      ...evidence,
      id: `evidence-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }

    topicAssessment.evidence.push(newEvidence)
    this.updateAssessment(assessmentId, assessment)

    return newEvidence
  }

  // Report Generation
  generateReport(
    assessmentId: string,
    config: {
      title: string
      executiveSummary: string
      methodology: string
      isPublic: boolean
    },
  ): MaterialityReport | null {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return null

    const report: MaterialityReport = {
      id: `report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      assessmentId,
      title: config.title,
      executiveSummary: config.executiveSummary,
      methodology: config.methodology,
      sections: this.generateReportSections(assessment),
      matrixVisualization: this.generateMatrixVisualization(assessment),
      stakeholderEngagementSummary: this.generateStakeholderSummary(assessment),
      isPublic: config.isPublic,
      generatedAt: new Date(),
    }

    this.reports.push(report)
    return report
  }

  private generateReportSections(assessment: MaterialityAssessment): any[] {
    // Generate standard report sections
    return [
      {
        id: "methodology",
        title: "Methodology",
        content: "Our materiality assessment methodology...",
        order: 1,
        includeInPublicReport: true,
      },
      {
        id: "stakeholder-engagement",
        title: "Stakeholder Engagement",
        content: "We engaged with key stakeholders...",
        order: 2,
        includeInPublicReport: true,
      },
      {
        id: "material-topics",
        title: "Material Topics",
        content: "The following topics were identified as material...",
        order: 3,
        includeInPublicReport: true,
      },
    ]
  }

  private generateMatrixVisualization(assessment: MaterialityAssessment): any {
    const topics = assessment.topics.map((ta) => {
      const topic = this.getTopicById(ta.topicId)
      return {
        topicId: ta.topicId,
        name: topic?.name || "Unknown Topic",
        x: ta.businessImpact.score,
        y: ta.stakeholderImportance.score,
        isMaterial: ta.isMaterial,
        isPriority: ta.isPriority,
        category: topic?.category || "other",
      }
    })

    return {
      topics,
      quadrants: {
        topLeft: {
          label: "Monitor",
          description: "High stakeholder importance, lower business impact",
        },
        topRight: {
          label: "Material",
          description: "High stakeholder importance and business impact",
        },
        bottomLeft: {
          label: "Low Priority",
          description: "Lower stakeholder importance and business impact",
        },
        bottomRight: {
          label: "Manage",
          description: "High business impact, lower stakeholder importance",
        },
      },
    }
  }

  private generateStakeholderSummary(assessment: MaterialityAssessment): string {
    const engagements = assessment.stakeholderEngagement
    const totalParticipants = engagements.reduce((sum, e) => sum + e.participants, 0)
    const stakeholderGroups = [...new Set(engagements.map((e) => e.stakeholderGroup))]

    return `We engaged ${totalParticipants} stakeholders across ${stakeholderGroups.length} stakeholder groups through ${engagements.length} engagement activities.`
  }

  // Analytics
  getAssessmentStats(assessmentId: string): {
    totalTopics: number
    assessedTopics: number
    materialTopics: number
    priorityTopics: number
    stakeholderEngagements: number
    completionRate: number
  } {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) {
      return {
        totalTopics: 0,
        assessedTopics: 0,
        materialTopics: 0,
        priorityTopics: 0,
        stakeholderEngagements: 0,
        completionRate: 0,
      }
    }

    const totalTopics = assessment.topics.length
    const assessedTopics = assessment.topics.filter(
      (t) => t.businessImpact.score > 0 && t.stakeholderImportance.score > 0,
    ).length

    return {
      totalTopics,
      assessedTopics,
      materialTopics: assessment.materialTopics.length,
      priorityTopics: assessment.priorityTopics.length,
      stakeholderEngagements: assessment.stakeholderEngagement.length,
      completionRate: totalTopics > 0 ? Math.round((assessedTopics / totalTopics) * 100) : 0,
    }
  }
}

export const materialityService = new MaterialityService()
export type { MaterialityTopic, MaterialityAssessment, MaterialityTopicAssessment, StakeholderEngagement }
