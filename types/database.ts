// Core database types for the ESG Materiality & Reporting Platform

export interface Cycle {
  id: string
  name: string
  organizationId: string
  startDate: Date
  endDate: Date
  status: "draft" | "active" | "closed" | "archived"
  frameworks: Framework[]
  description?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Unit {
  id: string
  name: string
  type: "headquarters" | "subsidiary" | "branch" | "other"
  organizationId: string
  cnpj?: string
  address?: Address
  responsibleUserId?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Address {
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

export interface Theme {
  id: string
  name: string
  code: string
  framework: Framework
  category: "governance" | "social" | "environmental" | "economic"
  isMaterial: boolean
  justification?: string
  organizationId: string
  cycleId: string
  createdAt: Date
  updatedAt: Date
}

export interface Disclosure {
  id: string
  code: string
  title: string
  description: string
  framework: Framework
  themeId: string
  cycleId: string
  unitId: string
  status: DisclosureStatus
  assignedTo?: string
  reviewerId?: string
  dueDate?: Date
  responses: DisclosureResponse[]
  evidences: Evidence[]
  comments: Comment[]
  alerts: Alert[]
  createdAt: Date
  updatedAt: Date
}

export type DisclosureStatus =
  | "not_started"
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "reopened"

export interface DisclosureResponse {
  id: string
  disclosureId: string
  fieldType: "text" | "number" | "date" | "boolean" | "file"
  fieldName: string
  value: string | number | boolean | Date
  version: number
  createdBy: string
  createdAt: Date
}

export interface Evidence {
  id: string
  disclosureId: string
  fileName: string
  fileType: string
  fileSize: number
  fileUrl: string
  description?: string
  isConfidential: boolean
  status: "pending" | "approved" | "rejected"
  uploadedBy: string
  reviewedBy?: string
  reviewedAt?: Date
  reviewComments?: string
  createdAt: Date
  updatedAt: Date
}

export interface Comment {
  id: string
  disclosureId: string
  content: string
  type: "general" | "review" | "alert"
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Alert {
  id: string
  disclosureId: string
  type: "incorrect_document" | "illegible" | "outdated" | "missing_info" | "other"
  description: string
  status: "open" | "resolved" | "ignored"
  createdBy: string
  resolvedBy?: string
  resolvedAt?: Date
  resolutionComment?: string
  createdAt: Date
  updatedAt: Date
}

export interface MaterialityMatrix {
  id: string
  organizationId: string
  cycleId: string
  type: "gri" | "ifrs" | "combined"
  themes: MaterialityTheme[]
  createdAt: Date
  updatedAt: Date
}

export interface MaterialityTheme {
  themeId: string
  stakeholderImpact: number // 1-5 scale
  businessImpact: number // 1-5 scale
  financialImpact: number // 1-5 scale
  probability: number // 1-5 scale
  position: { x: number; y: number }
}

export interface Report {
  id: string
  name: string
  type: "gri" | "ifrs" | "combined" | "custom"
  organizationId: string
  cycleId: string
  status: "draft" | "published" | "archived"
  config: ReportConfig
  generatedBy: string
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ReportConfig {
  includeExecutiveSummary: boolean
  includeGraphics: boolean
  includeEvidence: boolean
  includeJustifications: boolean
  includeAlerts: boolean
  languages: string[]
  branding: BrandingConfig
}

export interface BrandingConfig {
  logoUrl?: string
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  watermark?: string
  footer?: string
}

export interface AuditLog {
  id: string
  organizationId: string
  userId: string
  action: string
  entityType: string
  entityId: string
  oldValue?: any
  newValue?: any
  ipAddress: string
  userAgent: string
  createdAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: "assignment" | "approval" | "rejection" | "comment" | "alert" | "deadline" | "system"
  title: string
  message: string
  relatedEntityType?: string
  relatedEntityId?: string
  isRead: boolean
  createdAt: Date
  readAt?: Date
}

export interface ESGGoal {
  id: string
  organizationId: string
  cycleId: string
  title: string
  description: string
  category: "environmental" | "social" | "governance"
  baseline: number
  target: number
  unit: string
  deadline: Date
  status: "on_track" | "at_risk" | "delayed" | "completed"
  progress: number
  justification?: string
  relatedODS: number[]
  responsibleUserId: string
  createdAt: Date
  updatedAt: Date
}

export interface PublicPage {
  id: string
  organizationId: string
  cycleId: string
  slug: string
  title: string
  isActive: boolean
  config: PublicPageConfig
  publishedBy: string
  publishedAt: Date
  lastUpdated: Date
}

export interface PublicPageConfig {
  includedSections: string[]
  allowDownloads: boolean
  includeGraphics: boolean
  includeQRCode: boolean
  branding: BrandingConfig
  languages: string[]
}

// Framework-specific types
export type Framework = "GRI" | "IFRS" | "SASB" | "TCFD"

export interface FrameworkConfig {
  id: string
  organizationId: string
  framework: Framework
  version: string
  isActive: boolean
  disclosures: FrameworkDisclosure[]
  createdAt: Date
  updatedAt: Date
}

export interface FrameworkDisclosure {
  code: string
  title: string
  description: string
  category: string
  isRequired: boolean
  fields: DisclosureField[]
}

export interface DisclosureField {
  name: string
  type: "text" | "number" | "date" | "boolean" | "file" | "select"
  isRequired: boolean
  placeholder?: string
  options?: string[]
  validation?: FieldValidation
}

export interface FieldValidation {
  min?: number
  max?: number
  pattern?: string
  message?: string
}
