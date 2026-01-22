export interface MaterialityTopic {
  id: string
  name: string
  description: string
  category: MaterialityCategory
  subcategory?: string

  // GRI Topic Standards mapping
  griTopicStandards?: string[]

  // SASB mapping
  sasbMetrics?: string[]

  // TCFD mapping
  tcfdPillars?: ("governance" | "strategy" | "risk_management" | "metrics_targets")[]

  // Industry relevance
  industries?: string[]

  // Stakeholder groups that care about this topic
  relevantStakeholders: StakeholderGroup[]
}

export type MaterialityCategory = "environmental" | "social" | "governance" | "economic"

export type StakeholderGroup =
  | "investors"
  | "customers"
  | "employees"
  | "communities"
  | "suppliers"
  | "regulators"
  | "ngos"
  | "media"

export interface MaterialityAssessment {
  id: string
  organizationId: string
  name: string
  description: string

  // Assessment period
  assessmentPeriod: {
    start: Date
    end: Date
  }

  // Topics being assessed
  topics: MaterialityTopicAssessment[]

  // Stakeholder engagement
  stakeholderEngagement: StakeholderEngagement[]

  // Matrix configuration
  matrixConfig: {
    xAxisLabel: string // e.g., "Impact on Business"
    yAxisLabel: string // e.g., "Importance to Stakeholders"
    scale: {
      min: number
      max: number
    }
    thresholds: {
      material: number // Topics above this threshold are considered material
      highPriority: number // Topics above this are high priority
    }
  }

  // Status and workflow
  status: "draft" | "stakeholder_review" | "management_review" | "approved" | "published"
  createdBy: string
  approvedBy?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
  approvedAt?: Date
  publishedAt?: Date

  // Results
  materialTopics: string[] // IDs of topics determined to be material
  priorityTopics: string[] // IDs of high-priority topics
}

export interface MaterialityTopicAssessment {
  topicId: string

  // Business impact assessment (x-axis)
  businessImpact: {
    score: number
    rationale: string
    assessedBy: string
    assessedAt: Date

    // Detailed impact areas
    financial: number
    operational: number
    strategic: number
    reputational: number
    regulatory: number
  }

  // Stakeholder importance assessment (y-axis)
  stakeholderImportance: {
    score: number
    rationale: string
    assessedBy: string
    assessedAt: Date

    // By stakeholder group
    byStakeholder: Record<StakeholderGroup, number>
  }

  // Supporting evidence
  evidence: MaterialityEvidence[]

  // Final determination
  isMaterial: boolean
  isPriority: boolean
  materialityRationale: string
}

export interface MaterialityEvidence {
  id: string
  type: "stakeholder_feedback" | "industry_analysis" | "regulatory_requirement" | "risk_assessment" | "other"
  title: string
  description: string
  source: string
  url?: string
  attachmentId?: string
  weight: number // How much this evidence influences the assessment
  addedBy: string
  addedAt: Date
}

export interface StakeholderEngagement {
  id: string
  stakeholderGroup: StakeholderGroup
  engagementMethod: "survey" | "interview" | "workshop" | "focus_group" | "public_consultation" | "other"

  // Engagement details
  title: string
  description: string
  participants: number
  conductedBy: string
  conductedAt: Date

  // Results
  topicRankings: Record<string, number> // topicId -> importance score
  keyInsights: string[]
  recommendations: string[]

  // Documentation
  reportUrl?: string
  attachments: string[]
}

export interface MaterialityReport {
  id: string
  assessmentId: string

  // Report configuration
  title: string
  executiveSummary: string
  methodology: string

  // Content sections
  sections: ReportSection[]

  // Visualizations
  matrixVisualization: MatrixVisualization
  stakeholderEngagementSummary: string

  // Publication
  isPublic: boolean
  publishedUrl?: string

  // Timestamps
  generatedAt: Date
  publishedAt?: Date
}

export interface ReportSection {
  id: string
  title: string
  content: string
  order: number
  includeInPublicReport: boolean
}

export interface MatrixVisualization {
  topics: {
    topicId: string
    name: string
    x: number // Business impact score
    y: number // Stakeholder importance score
    isMaterial: boolean
    isPriority: boolean
    category: MaterialityCategory
  }[]

  quadrants: {
    topLeft: { label: string; description: string }
    topRight: { label: string; description: string }
    bottomLeft: { label: string; description: string }
    bottomRight: { label: string; description: string }
  }
}

// Predefined materiality topics based on GRI, SASB, and common ESG themes
export const DEFAULT_MATERIALITY_TOPICS: MaterialityTopic[] = [
  // Environmental
  {
    id: "climate-change",
    name: "Climate Change & GHG Emissions",
    description: "Greenhouse gas emissions, climate risks, and climate adaptation strategies",
    category: "environmental",
    subcategory: "Climate",
    griTopicStandards: ["GRI 305"],
    tcfdPillars: ["strategy", "risk_management", "metrics_targets"],
    relevantStakeholders: ["investors", "regulators", "ngos", "communities"],
  },
  {
    id: "energy-management",
    name: "Energy Management",
    description: "Energy consumption, efficiency, and renewable energy adoption",
    category: "environmental",
    subcategory: "Energy",
    griTopicStandards: ["GRI 302"],
    relevantStakeholders: ["investors", "regulators", "communities"],
  },
  {
    id: "water-stewardship",
    name: "Water & Wastewater Management",
    description: "Water consumption, quality, and wastewater management",
    category: "environmental",
    subcategory: "Water",
    griTopicStandards: ["GRI 303"],
    relevantStakeholders: ["communities", "regulators", "ngos"],
  },
  {
    id: "waste-management",
    name: "Waste & Circular Economy",
    description: "Waste generation, recycling, and circular economy practices",
    category: "environmental",
    subcategory: "Waste",
    griTopicStandards: ["GRI 306"],
    relevantStakeholders: ["communities", "regulators", "customers"],
  },
  {
    id: "biodiversity",
    name: "Biodiversity & Ecosystems",
    description: "Impact on biodiversity and ecosystem conservation",
    category: "environmental",
    subcategory: "Biodiversity",
    griTopicStandards: ["GRI 304"],
    relevantStakeholders: ["ngos", "communities", "regulators"],
  },

  // Social
  {
    id: "employee-wellbeing",
    name: "Employee Health & Safety",
    description: "Workplace safety, occupational health, and employee wellbeing",
    category: "social",
    subcategory: "Workplace",
    griTopicStandards: ["GRI 403"],
    relevantStakeholders: ["employees", "regulators"],
  },
  {
    id: "diversity-inclusion",
    name: "Diversity, Equity & Inclusion",
    description: "Workforce diversity, equal opportunities, and inclusive culture",
    category: "social",
    subcategory: "Workplace",
    griTopicStandards: ["GRI 405"],
    relevantStakeholders: ["employees", "investors", "communities"],
  },
  {
    id: "labor-practices",
    name: "Labor Practices & Human Rights",
    description: "Fair labor practices, human rights, and supply chain labor standards",
    category: "social",
    subcategory: "Human Rights",
    griTopicStandards: ["GRI 407", "GRI 408", "GRI 409"],
    relevantStakeholders: ["employees", "ngos", "suppliers"],
  },
  {
    id: "community-impact",
    name: "Community Relations & Impact",
    description: "Local community engagement, social investment, and community impact",
    category: "social",
    subcategory: "Community",
    griTopicStandards: ["GRI 413"],
    relevantStakeholders: ["communities", "ngos"],
  },
  {
    id: "customer-satisfaction",
    name: "Customer Satisfaction & Product Quality",
    description: "Product quality, customer satisfaction, and product safety",
    category: "social",
    subcategory: "Product",
    griTopicStandards: ["GRI 416", "GRI 417"],
    relevantStakeholders: ["customers", "regulators"],
  },

  // Governance
  {
    id: "corporate-governance",
    name: "Corporate Governance",
    description: "Board composition, governance structures, and oversight",
    category: "governance",
    subcategory: "Governance",
    griTopicStandards: ["GRI 2-9", "GRI 2-10"],
    tcfdPillars: ["governance"],
    relevantStakeholders: ["investors", "regulators"],
  },
  {
    id: "business-ethics",
    name: "Business Ethics & Integrity",
    description: "Anti-corruption, business ethics, and integrity programs",
    category: "governance",
    subcategory: "Ethics",
    griTopicStandards: ["GRI 205"],
    relevantStakeholders: ["investors", "regulators", "customers"],
  },
  {
    id: "data-privacy",
    name: "Data Privacy & Security",
    description: "Data protection, cybersecurity, and privacy practices",
    category: "governance",
    subcategory: "Technology",
    griTopicStandards: ["GRI 418"],
    relevantStakeholders: ["customers", "regulators", "investors"],
  },
  {
    id: "supply-chain",
    name: "Supply Chain Management",
    description: "Supplier assessment, supply chain sustainability, and procurement practices",
    category: "governance",
    subcategory: "Supply Chain",
    griTopicStandards: ["GRI 308", "GRI 414"],
    relevantStakeholders: ["suppliers", "investors", "ngos"],
  },

  // Economic
  {
    id: "economic-performance",
    name: "Economic Performance",
    description: "Financial performance, economic value creation, and distribution",
    category: "economic",
    subcategory: "Performance",
    griTopicStandards: ["GRI 201"],
    relevantStakeholders: ["investors", "employees", "communities"],
  },
  {
    id: "innovation",
    name: "Innovation & R&D",
    description: "Research and development, innovation, and technological advancement",
    category: "economic",
    subcategory: "Innovation",
    relevantStakeholders: ["investors", "customers"],
  },
]
