export type DisclosureStatus = "not_started" | "in_progress" | "under_review" | "completed" | "approved"
export type DataType = "quantitative" | "qualitative" | "mixed"
export type ReviewStatus = "pending" | "approved" | "rejected" | "needs_revision"

export interface DisclosureData {
  id: string
  organizationId: string
  frameworkId: string
  standardId: string
  requirementId: string

  // Content
  title: string
  description: string
  response: string
  attachments: DisclosureAttachment[]

  // Metadata
  status: DisclosureStatus
  dataType: DataType
  reportingPeriod: {
    start: Date
    end: Date
  }

  // Workflow
  assignedTo?: string
  reviewedBy?: string
  reviewStatus?: ReviewStatus
  reviewComments?: string

  // Timestamps
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  approvedAt?: Date

  // Versioning
  version: number
  previousVersionId?: string

  // Validation
  isValid: boolean
  validationErrors: string[]

  // Metrics (for quantitative data)
  metrics?: DisclosureMetric[]
}

export interface DisclosureAttachment {
  id: string
  disclosureId: string
  fileName: string
  fileType: string
  fileSize: number
  uploadedBy: string
  uploadedAt: Date
  url: string
  description?: string
}

export interface DisclosureMetric {
  id: string
  disclosureId: string
  name: string
  value: number
  unit: string
  methodology?: string
  dataSource?: string
  calculationNotes?: string
  verificationStatus?: "unverified" | "internally_verified" | "externally_verified"
}

export interface DisclosureTemplate {
  id: string
  frameworkId: string
  standardId: string
  requirementId: string
  title: string
  description: string
  guidance: string
  examples: string[]
  requiredFields: TemplateField[]
  suggestedMetrics?: string[]
}

export interface TemplateField {
  id: string
  name: string
  type: "text" | "number" | "date" | "select" | "multiselect" | "file"
  label: string
  description?: string
  required: boolean
  options?: string[]
  validation?: {
    min?: number
    max?: number
    pattern?: string
    message?: string
  }
}

export interface DisclosureWorkflow {
  id: string
  organizationId: string
  name: string
  steps: WorkflowStep[]
  isActive: boolean
}

export interface WorkflowStep {
  id: string
  name: string
  description: string
  assigneeRole: string
  requiredActions: string[]
  autoAdvanceConditions?: string[]
  timeoutDays?: number
}
