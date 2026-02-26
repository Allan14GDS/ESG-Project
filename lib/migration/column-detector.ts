// ============================================================================
// Auto-detect Column Mappings from Excel Headers
// Based on import-csv-button.tsx autoMapColumns pattern
// ============================================================================

import type { ColumnMapping } from "./types"

interface ColumnPattern {
  field: keyof Omit<ColumnMapping, "unmapped">
  patterns: RegExp[]
}

/**
 * Known column patterns for ESG questionnaire Excels.
 * Order matters: first match wins within a field.
 */
const KNOWN_COLUMN_PATTERNS: ColumnPattern[] = [
  {
    field: "linha_coleta",
    patterns: [
      /^linha\s*de\s*coleta/i,
      /atomizada/i,
      /^pergunta$/i,
      /^metrica$/i,
      /^questao$/i,
      /^quest[aã]o$/i,
      /^indicador$/i,
      /^label$/i,
    ],
  },
  {
    field: "disclosure",
    patterns: [
      /^disclosure$/i,
      /^disclo/i,
      /^codigo.*disclosure/i,
      /^cod.*disclosure/i,
    ],
  },
  {
    field: "evidencias",
    patterns: [
      /evid[eê]ncia/i,
      /^evidencias/i,
      /evidencias.*disclosure/i,
      /^evid/i,
    ],
  },
  {
    field: "obs_nao_aplicavel",
    patterns: [
      /obs.*n[aã]o.*aplic[aá]vel/i,
      /^obs$/i,
      /^observa[cç][aã]o/i,
      /n[aã]o.*aplic/i,
    ],
  },
  {
    field: "tipo_resposta",
    patterns: [
      /^tipo.*resposta/i,
      /^resposta$/i,
      /^tipo$/i,
      /^type$/i,
    ],
  },
  {
    field: "framework_gri",
    patterns: [
      /framework.*gri/i,
      /^gri$/i,
      /^framework\s*\/?\s*gri/i,
    ],
  },
  {
    field: "sub_framework_gri",
    patterns: [
      /sub.*framework.*gri/i,
      /^sub.*gri/i,
      /sub-framework.*gri/i,
    ],
  },
  {
    field: "framework_aneel",
    patterns: [
      /framework.*aneel/i,
      /^aneel$/i,
      /^framework\s*\/?\s*aneel/i,
    ],
  },
  {
    field: "sub_framework_aneel",
    patterns: [
      /sub.*framework.*aneel/i,
      /^sub.*aneel/i,
      /sub-framework.*aneel/i,
    ],
  },
  {
    field: "framework_ifrs",
    patterns: [
      /framework.*ifrs/i,
      /^ifrs$/i,
      /^framework\s*\/?\s*ifrs/i,
    ],
  },
  {
    field: "sub_framework_ifrs",
    patterns: [
      /sub.*framework.*ifrs/i,
      /^sub.*ifrs/i,
      /sub-framework.*ifrs/i,
    ],
  },
  {
    field: "position",
    patterns: [
      /^posi[cç][aã]o$/i,
      /^position$/i,
      /^ordem$/i,
      /^order$/i,
      /^#$/,
    ],
  },
]

/**
 * Auto-detect column mappings from Excel header row.
 * Returns mapping of standard field names to actual Excel column names.
 */
export function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = { unmapped: [] }
  const usedHeaders = new Set<string>()

  for (const pattern of KNOWN_COLUMN_PATTERNS) {
    for (const header of headers) {
      if (usedHeaders.has(header)) continue

      for (const regex of pattern.patterns) {
        if (regex.test(header.trim())) {
          ;(mapping as any)[pattern.field] = header
          usedHeaders.add(header)
          break
        }
      }

      if ((mapping as any)[pattern.field]) break
    }
  }

  // Collect unmapped headers
  mapping.unmapped = headers.filter((h) => !usedHeaders.has(h))

  return mapping
}

/**
 * Get the value from an Excel row using the column mapping.
 */
export function getExcelValue(
  row: Record<string, any>,
  mapping: ColumnMapping,
  field: keyof Omit<ColumnMapping, "unmapped">
): string {
  const columnName = mapping[field]
  if (!columnName) return ""
  const val = row[columnName]
  if (val === null || val === undefined) return ""
  return String(val).trim()
}

/**
 * Get all available target fields for manual column mapping
 */
export function getTargetFields(): { field: string; label: string }[] {
  return [
    { field: "linha_coleta", label: "Linha de Coleta (Pergunta)" },
    { field: "disclosure", label: "Disclosure" },
    { field: "evidencias", label: "Evidencias" },
    { field: "obs_nao_aplicavel", label: "OBS de Nao Aplicavel" },
    { field: "tipo_resposta", label: "Tipo de Resposta" },
    { field: "framework_gri", label: "Framework / GRI" },
    { field: "sub_framework_gri", label: "Sub-framework GRI" },
    { field: "framework_aneel", label: "Framework / ANEEL" },
    { field: "sub_framework_aneel", label: "Sub-framework ANEEL" },
    { field: "framework_ifrs", label: "Framework / IFRS" },
    { field: "sub_framework_ifrs", label: "Sub-framework IFRS" },
    { field: "position", label: "Posicao / Ordem" },
  ]
}
