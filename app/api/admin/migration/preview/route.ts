import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { detectColumns, getExcelValue } from "@/lib/migration/column-detector"
import { matchQuestion, findBestFuzzyMatch } from "@/lib/migration/normalizer"
import { buildMetadataUpdate, computeFieldChanges, isQuestionEnriched } from "@/lib/migration/metadata-builder"
import type { MigrationPreviewResult, MigrationPreviewItem, UnmatchedRow, DbQuestion } from "@/lib/migration/types"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const templateId = formData.get("templateId") as string | null
    const customMappingJson = formData.get("columnMapping") as string | null

    if (!file || !templateId) {
      return NextResponse.json({ error: "Arquivo e templateId sao obrigatorios" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Get template info
    const { data: template, error: templateError } = await adminClient
      .from("book_templates")
      .select("id, name, type")
      .eq("id", templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Template nao encontrado" }, { status: 404 })
    }

    // 2. Parse Excel file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: "array" })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: "" })

    if (rows.length === 0) {
      return NextResponse.json({ error: "Excel vazio" }, { status: 400 })
    }

    // 3. Detect or use custom column mapping
    const headers = Object.keys(rows[0])
    let mapping = detectColumns(headers)

    // Apply custom mapping if provided
    if (customMappingJson) {
      try {
        const customMapping = JSON.parse(customMappingJson)
        mapping = { ...mapping, ...customMapping, unmapped: mapping.unmapped }
      } catch { /* ignore parse errors */ }
    }

    if (!mapping.linha_coleta) {
      return NextResponse.json({
        error: "Nao foi possivel detectar a coluna de 'Linha de Coleta'. Verifique o Excel.",
        columnMapping: mapping,
        headers,
      }, { status: 400 })
    }

    // 4. Fetch ALL questions linked to this template (paginated)
    const allJunctionIds: string[] = []
    let jOffset = 0
    let jHasMore = true
    while (jHasMore) {
      const { data: jBatch } = await adminClient
        .from("book_question_junction")
        .select("question_template_id")
        .eq("book_template_id", templateId)
        .range(jOffset, jOffset + 999)

      if (jBatch && jBatch.length > 0) {
        allJunctionIds.push(...jBatch.map((j) => j.question_template_id))
        jOffset += jBatch.length
        jHasMore = jBatch.length === 1000
      } else {
        jHasMore = false
      }
    }

    if (allJunctionIds.length === 0) {
      return NextResponse.json({
        error: "Nenhuma questao vinculada a este caderno",
        columnMapping: mapping,
      }, { status: 400 })
    }

    const questionIds = allJunctionIds

    // Fetch questions in batches
    const dbQuestions: DbQuestion[] = []
    for (let i = 0; i < questionIds.length; i += 500) {
      const batch = questionIds.slice(i, i + 500)
      const { data: questions } = await adminClient
        .from("book_questions")
        .select("id, label, type, metadata, metadata_v2, unique_identifier")
        .in("id", batch)

      if (questions) {
        dbQuestions.push(...questions)
      }
    }

    // 5. Match Excel rows to DB questions
    const matched: MigrationPreviewItem[] = []
    const unmatched: UnmatchedRow[] = []
    const matchedQuestionIds = new Set<string>()
    let alreadyEnriched = 0

    for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
      const row = rows[rowIdx]
      const label = getExcelValue(row, mapping, "linha_coleta")

      if (!label) {
        unmatched.push({ excelRowIndex: rowIdx + 1, label: "(vazio)", bestMatch: undefined })
        continue
      }

      // Skip already-matched questions (avoid duplicates)
      const availableQuestions = dbQuestions.filter((q) => !matchedQuestionIds.has(q.id))
      const match = matchQuestion(label, availableQuestions)

      if (match) {
        matchedQuestionIds.add(match.dbQuestion.id)

        const existingMeta = match.dbQuestion.metadata_v2 || match.dbQuestion.metadata || {}

        // Build what the new metadata would look like
        const update = buildMetadataUpdate(row, mapping, match.dbQuestion.metadata, match.dbQuestion.metadata_v2, [templateId])
        const changes = computeFieldChanges(existingMeta, update.metadata_v2)

        if (isQuestionEnriched(existingMeta) && changes.length === 0) {
          alreadyEnriched++
        }

        matched.push({
          questionId: match.dbQuestion.id,
          label: match.dbQuestion.label,
          matchType: match.matchType,
          similarity: Math.round(match.similarity * 100) / 100,
          changes,
          excelRowIndex: rowIdx + 1,
          included: true,
        })
      } else {
        const bestFuzzy = findBestFuzzyMatch(label, dbQuestions)
        unmatched.push({
          excelRowIndex: rowIdx + 1,
          label,
          bestMatch: bestFuzzy,
        })
      }
    }

    const result: MigrationPreviewResult = {
      templateId,
      templateName: template.name,
      totalExcelRows: rows.length,
      matched,
      unmatched,
      alreadyEnriched,
      columnMapping: mapping,
    }

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error("[migration/preview] Error:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
