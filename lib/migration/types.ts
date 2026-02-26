// ============================================================================
// Migration System Types
// ============================================================================

export interface ColumnMapping {
  linha_coleta?: string
  disclosure?: string
  evidencias?: string
  obs_nao_aplicavel?: string
  tipo_resposta?: string
  framework_gri?: string
  sub_framework_gri?: string
  framework_aneel?: string
  sub_framework_aneel?: string
  framework_ifrs?: string
  sub_framework_ifrs?: string
  position?: string
  unmapped: string[]
}

export interface FieldChange {
  field: string
  oldValue: string | null
  newValue: string
}

export interface MatchResult {
  dbQuestion: DbQuestion
  matchType: "exact" | "normalized" | "fuzzy"
  similarity: number
}

export interface DbQuestion {
  id: string
  label: string
  type: string
  metadata: any
  metadata_v2?: any
  unique_identifier?: string
}

export interface MigrationPreviewItem {
  questionId: string
  label: string
  matchType: "exact" | "normalized" | "fuzzy"
  similarity: number
  changes: FieldChange[]
  excelRowIndex: number
  included: boolean // user can toggle
}

export interface UnmatchedRow {
  excelRowIndex: number
  label: string
  bestMatch?: { label: string; similarity: number }
}

export interface MigrationPreviewResult {
  templateId: string
  templateName: string
  totalExcelRows: number
  matched: MigrationPreviewItem[]
  unmatched: UnmatchedRow[]
  alreadyEnriched: number
  columnMapping: ColumnMapping
}

export interface MigrationExecuteItem {
  questionId: string
  metadata: any
  metadata_v2: any
}

export interface MigrationExecuteResult {
  templateId: string
  success: number
  errors: { questionId: string; error: string }[]
  skipped: number
  logId: string
  warning?: string
}

export interface MigrationLogEntry {
  id: string
  template_id: string
  template_name: string
  executed_by: string
  executed_at: string
  total_excel_rows: number
  total_matched: number
  total_updated: number
  total_errors: number
  total_unmatched: number
  column_mapping: any
  match_details: any
  error_details: any
  created_at: string
}

export interface TemplateEnrichmentStatus {
  templateId: string
  templateName: string
  templateType: string
  totalQuestions: number
  enrichedCount: number
  unenrichedCount: number
  enrichmentPercent: number
  lastMigration?: string
}

export interface ExcelRow {
  [key: string]: string | number | undefined
}

export interface MetadataUpdate {
  metadata: any
  metadata_v2: any
  backup: any
}
