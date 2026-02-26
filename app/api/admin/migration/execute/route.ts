import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import type { MigrationExecuteResult } from "@/lib/migration/types"

export const dynamic = "force-dynamic"

const BATCH_SIZE = 50
const BATCH_DELAY_MS = 100

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { templateId, items, columnMapping, templateName, totalExcelRows, totalUnmatched } = body

    if (!templateId || !items || !Array.isArray(items)) {
      return NextResponse.json({ error: "templateId e items sao obrigatorios" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // 1. Validate template exists
    const { data: template, error: templateError } = await adminClient
      .from("book_templates")
      .select("id, name")
      .eq("id", templateId)
      .single()

    if (templateError || !template) {
      return NextResponse.json({ error: "Template nao encontrado" }, { status: 404 })
    }

    // 2. Validate all questions belong to this template
    const questionIds = items.map((item: any) => item.questionId)
    const { data: junctions } = await adminClient
      .from("book_question_junction")
      .select("question_template_id")
      .eq("book_template_id", templateId)
      .in("question_template_id", questionIds)

    const validQuestionIds = new Set((junctions || []).map((j) => j.question_template_id))
    const invalidIds = questionIds.filter((id: string) => !validQuestionIds.has(id))

    if (invalidIds.length > 0) {
      return NextResponse.json({
        error: `${invalidIds.length} questoes nao pertencem a este caderno`,
        invalidIds,
      }, { status: 400 })
    }

    // 3. Create migration log entry first (to get the logId)
    // Resilient: if migration_logs table doesn't exist, continue without logging
    let logId = "no-log-table"
    let logWarning: string | undefined
    try {
      const { data: logEntry, error: logError } = await adminClient
        .from("migration_logs")
        .insert({
          template_id: templateId,
          template_name: templateName || template.name,
          executed_by: "00000000-0000-0000-0000-000000000000", // Admin system user
          total_excel_rows: totalExcelRows || items.length,
          total_matched: items.length,
          total_updated: 0,
          total_errors: 0,
          total_unmatched: totalUnmatched || 0,
          column_mapping: columnMapping || {},
          match_details: {},
        })
        .select("id")
        .single()

      if (logError) {
        console.warn("[migration/execute] Could not create log entry:", logError.message)
        logWarning = "Tabela migration_logs nao encontrada. Migracao executada sem audit log. Execute o script SQL 003_create_migration_logs.sql no Supabase."
      } else {
        logId = logEntry?.id || "unknown"
      }
    } catch (logErr: any) {
      console.warn("[migration/execute] Log table error:", logErr.message)
      logWarning = "Tabela migration_logs nao encontrada. Migracao executada sem audit log."
    }

    // 4. Process updates in batches
    let successCount = 0
    const errors: { questionId: string; error: string }[] = []
    let skippedCount = 0

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = items.slice(i, i + BATCH_SIZE)

      const batchPromises = batch.map(async (item: any) => {
        try {
          // Fetch current metadata for backup
          const { data: currentQ, error: fetchError } = await adminClient
            .from("book_questions")
            .select("metadata, metadata_v2")
            .eq("id", item.questionId)
            .single()

          if (fetchError || !currentQ) {
            errors.push({ questionId: item.questionId, error: "Questao nao encontrada" })
            return
          }

          // Inject backup into metadata
          const backup = {
            timestamp: new Date().toISOString(),
            log_id: logId,
            previous_metadata: { ...currentQ.metadata },
          }

          const metadataToSave = {
            ...item.metadata,
            _migration_backup: backup,
          }

          const metadataV2ToSave = {
            ...item.metadata_v2,
            _migration_backup: {
              ...backup,
              previous_metadata_v2: { ...currentQ.metadata_v2 },
            },
          }

          // SAFETY: Only update metadata and metadata_v2 — NEVER other columns
          const { error: updateError } = await adminClient
            .from("book_questions")
            .update({
              metadata: metadataToSave,
              metadata_v2: metadataV2ToSave,
            })
            .eq("id", item.questionId)

          if (updateError) {
            errors.push({ questionId: item.questionId, error: updateError.message })
          } else {
            successCount++
          }
        } catch (err: any) {
          errors.push({ questionId: item.questionId, error: err.message || "Erro desconhecido" })
        }
      })

      await Promise.all(batchPromises)

      // Delay between batches to avoid hammering the database
      if (i + BATCH_SIZE < items.length) {
        await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS))
      }
    }

    // 5. Update migration log with results (resilient)
    if (logId !== "no-log-table") {
      try {
        await adminClient
          .from("migration_logs")
          .update({
            total_updated: successCount,
            total_errors: errors.length,
            match_details: {
              items_processed: items.length,
              success: successCount,
              errors: errors.length,
              skipped: skippedCount,
            },
            error_details: errors.length > 0 ? errors : null,
          })
          .eq("id", logId)
      } catch {
        // Silently fail log update — migration data is already saved
      }
    }

    const result: MigrationExecuteResult = {
      templateId,
      success: successCount,
      errors,
      skipped: skippedCount,
      logId,
      warning: logWarning,
    }

    return NextResponse.json({ data: result })
  } catch (error: any) {
    console.error("[migration/execute] Error:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
