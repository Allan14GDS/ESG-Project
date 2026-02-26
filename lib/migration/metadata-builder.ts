// ============================================================================
// Metadata Builder for Migration
// Based on scripts/update-book-questions-metadata.js (lines 197-261)
// ============================================================================

import type { ColumnMapping, ExcelRow, FieldChange, MetadataUpdate } from "./types"
import { getExcelValue } from "./column-detector"

/**
 * Build updated metadata and metadata_v2 from an Excel row.
 * Rules:
 * - Only overwrite a field if the Excel provides a non-empty value
 * - Preserve existing metadata fields not in the Excel
 * - Create a backup snapshot of the previous metadata
 * - Generate both named (framework_gri) and generic (framework_1) fields
 */
export function buildMetadataUpdate(
  row: ExcelRow,
  mapping: ColumnMapping,
  existingMetadata: any,
  existingMetadataV2: any,
  templateIds: string[],
  logId?: string
): MetadataUpdate {
  const meta = existingMetadata || {}
  const metaV2 = existingMetadataV2 || {}

  // Extract values from Excel row
  const disclosure = getExcelValue(row, mapping, "disclosure")
  const evidencias = getExcelValue(row, mapping, "evidencias")
  const obs = getExcelValue(row, mapping, "obs_nao_aplicavel")
  const fwGri = getExcelValue(row, mapping, "framework_gri")
  const subFwGri = getExcelValue(row, mapping, "sub_framework_gri")
  const fwAneel = getExcelValue(row, mapping, "framework_aneel")
  const subFwAneel = getExcelValue(row, mapping, "sub_framework_aneel")
  const fwIfrs = getExcelValue(row, mapping, "framework_ifrs")
  const subFwIfrs = getExcelValue(row, mapping, "sub_framework_ifrs")

  // Build framework pairs array
  const subFrameworksArray: Array<{ framework: string; subFramework: string }> = []
  if (fwGri) subFrameworksArray.push({ framework: fwGri, subFramework: subFwGri })
  if (fwAneel) subFrameworksArray.push({ framework: fwAneel, subFramework: subFwAneel })
  if (fwIfrs) subFrameworksArray.push({ framework: fwIfrs, subFramework: subFwIfrs })

  // Build template-keyed sub_frameworks map
  const existingSfMap =
    typeof meta.sub_frameworks === "object" && !Array.isArray(meta.sub_frameworks)
      ? meta.sub_frameworks
      : {}

  const subFrameworksByTemplate = { ...existingSfMap }
  if (subFrameworksArray.length > 0) {
    const subValues = subFrameworksArray.map((sf) => sf.subFramework).filter(Boolean)
    for (const tid of templateIds) {
      subFrameworksByTemplate[tid] = subValues
    }
  }

  // Build generic framework fields (framework_1, framework_2)
  const genericFields: Record<string, string> = {
    framework_1: "",
    sub_framework_1: "",
    framework_2: "",
    sub_framework_2: "",
  }
  subFrameworksArray.forEach((pair, index) => {
    if (index < 2) {
      genericFields[`framework_${index + 1}`] = pair.framework
      genericFields[`sub_framework_${index + 1}`] = pair.subFramework
    }
  })

  // Build named framework fields
  const namedFields: Record<string, string> = {
    framework_gri: fwGri || meta.framework_gri || "",
    sub_framework_gri: subFwGri || meta.sub_framework_gri || "",
    framework_aneel: fwAneel || meta.framework_aneel || "",
    sub_framework_aneel: subFwAneel || meta.sub_framework_aneel || "",
    framework_ifrs: fwIfrs || meta.framework_ifrs || "",
    sub_framework_ifrs: subFwIfrs || meta.sub_framework_ifrs || "",
  }

  // Only overwrite with non-empty values (preserve existing)
  const applyIfNonEmpty = (existing: string | undefined, newVal: string): string => {
    return newVal || existing || ""
  }

  // Build backup snapshot
  const backup = {
    timestamp: new Date().toISOString(),
    log_id: logId || "preview",
    previous_metadata: { ...meta },
  }

  // Build new metadata (v1)
  const newMetadata = {
    ...meta,
    disclosure: applyIfNonEmpty(meta.disclosure, disclosure),
    evidencias: applyIfNonEmpty(meta.evidencias, evidencias),
    obs: applyIfNonEmpty(meta.obs, obs),
    obs_nao_aplicavel: applyIfNonEmpty(meta.obs_nao_aplicavel, obs),
    sub_frameworks: subFrameworksByTemplate,
    ...genericFields,
    ...namedFields,
    _migration_backup: backup,
  }

  // Build new metadata_v2
  const newMetadataV2 = {
    ...metaV2,
    disclosure: applyIfNonEmpty(metaV2.disclosure, disclosure),
    evidencias: applyIfNonEmpty(metaV2.evidencias, evidencias),
    obs: applyIfNonEmpty(metaV2.obs, obs),
    obs_nao_aplicavel: applyIfNonEmpty(metaV2.obs_nao_aplicavel, obs),
    sub_frameworks: subFrameworksByTemplate,
    legacy_sub_frameworks: subFrameworksArray.length > 0 ? subFrameworksArray : metaV2.legacy_sub_frameworks || [],
    ...genericFields,
    ...namedFields,
    _migration_backup: backup,
  }

  return { metadata: newMetadata, metadata_v2: newMetadataV2, backup }
}

/**
 * Compute the field changes (diff) between existing metadata and new metadata.
 * Returns only fields that actually changed.
 */
export function computeFieldChanges(existingMeta: any, newMeta: any): FieldChange[] {
  const changes: FieldChange[] = []
  const meta = existingMeta || {}

  const fieldsToCheck = [
    "disclosure",
    "evidencias",
    "obs",
    "obs_nao_aplicavel",
    "framework_gri",
    "sub_framework_gri",
    "framework_aneel",
    "sub_framework_aneel",
    "framework_ifrs",
    "sub_framework_ifrs",
    "framework_1",
    "sub_framework_1",
    "framework_2",
    "sub_framework_2",
  ]

  for (const field of fieldsToCheck) {
    const oldVal = meta[field] || ""
    const newVal = newMeta[field] || ""
    if (oldVal !== newVal && newVal !== "") {
      changes.push({ field, oldValue: oldVal || null, newValue: newVal })
    }
  }

  return changes
}

/**
 * Check if a question is already enriched (has framework metadata)
 */
export function isQuestionEnriched(metadata: any): boolean {
  if (!metadata) return false
  const meta = metadata
  return !!(
    meta.disclosure ||
    meta.framework_gri ||
    meta.framework_aneel ||
    meta.framework_ifrs ||
    meta.framework_1 ||
    meta.framework_2
  )
}
