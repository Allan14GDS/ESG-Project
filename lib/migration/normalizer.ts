// ============================================================================
// Text Normalization & Fuzzy Matching for Migration
// Based on scripts/update-book-questions-metadata.js (lines 60-69)
// ============================================================================

import type { DbQuestion, MatchResult } from "./types"

/**
 * Normalize text for comparison: remove accents, lowercase, trim, collapse spaces
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return ""
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
}

/**
 * Compute Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = []

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i]
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        )
      }
    }
  }

  return matrix[b.length][a.length]
}

/**
 * Compute similarity score between two strings (0..1)
 */
export function computeSimilarity(a: string, b: string): number {
  if (!a && !b) return 1
  if (!a || !b) return 0

  const normA = normalizeText(a)
  const normB = normalizeText(b)

  if (normA === normB) return 1

  const maxLen = Math.max(normA.length, normB.length)
  if (maxLen === 0) return 1

  const distance = levenshteinDistance(normA, normB)
  return 1 - distance / maxLen
}

/**
 * Try to match an Excel label to a database question.
 * Strategy: exact → normalized → fuzzy (above threshold)
 */
export function matchQuestion(
  excelLabel: string,
  dbQuestions: DbQuestion[],
  threshold: number = 0.85
): MatchResult | null {
  if (!excelLabel || !excelLabel.trim()) return null

  const normalizedExcel = normalizeText(excelLabel)

  // 1. Exact match
  for (const q of dbQuestions) {
    if (q.label === excelLabel) {
      return { dbQuestion: q, matchType: "exact", similarity: 1 }
    }
  }

  // 2. Normalized match
  for (const q of dbQuestions) {
    if (normalizeText(q.label) === normalizedExcel) {
      return { dbQuestion: q, matchType: "normalized", similarity: 1 }
    }
  }

  // 3. Fuzzy match (best above threshold)
  let bestMatch: MatchResult | null = null
  let bestSimilarity = 0

  for (const q of dbQuestions) {
    const sim = computeSimilarity(excelLabel, q.label)
    if (sim > bestSimilarity && sim >= threshold) {
      bestSimilarity = sim
      bestMatch = { dbQuestion: q, matchType: "fuzzy", similarity: sim }
    }
  }

  return bestMatch
}

/**
 * Find the best fuzzy match for an unmatched row (for debugging display)
 */
export function findBestFuzzyMatch(
  label: string,
  dbQuestions: DbQuestion[]
): { label: string; similarity: number } | undefined {
  let bestLabel = ""
  let bestSim = 0

  for (const q of dbQuestions) {
    const sim = computeSimilarity(label, q.label)
    if (sim > bestSim) {
      bestSim = sim
      bestLabel = q.label
    }
  }

  if (bestSim > 0.3) {
    return { label: bestLabel, similarity: bestSim }
  }
  return undefined
}
