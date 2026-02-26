import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { isQuestionEnriched } from "@/lib/migration/metadata-builder"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/migration/logs?limit=50&templateId=xxx
 *
 * Returns migration history. Tries the migration_logs table first.
 * If the table doesn't exist, falls back to computing history from
 * question metadata (_migration_backup timestamps).
 */
export async function GET(request: Request) {
  try {
    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("templateId")
    const limit = parseInt(searchParams.get("limit") || "50", 10)

    // Try the migration_logs table first
    let query = adminClient
      .from("migration_logs")
      .select("*")
      .order("executed_at", { ascending: false })
      .limit(limit)

    if (templateId) {
      query = query.eq("template_id", templateId)
    }

    const { data, error } = await query

    if (!error && data) {
      return NextResponse.json({ data })
    }

    // Table doesn't exist or other error — fall back to computing from metadata
    if (
      error?.message?.includes("relation") ||
      error?.message?.includes("schema cache") ||
      error?.code === "42P01"
    ) {
      return await computeLogsFromMetadata(adminClient, templateId, limit)
    }

    console.error("[migration/logs] Error:", error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  } catch (error: any) {
    console.error("[migration/logs] Error:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}

/**
 * Fallback: compute migration history from question metadata.
 * Groups enriched questions by template and extracts _migration_backup timestamps.
 */
async function computeLogsFromMetadata(
  adminClient: any,
  filterTemplateId: string | null,
  limit: number
) {
  const PAGE_SIZE = 1000

  // Fetch templates
  const { data: templates, error: tErr } = await adminClient
    .from("book_templates")
    .select("id, name, description")
    .order("name")

  if (tErr) {
    return NextResponse.json({ data: [], warning: "Erro ao buscar templates" })
  }

  const templateMap = new Map<string, string>()
  for (const t of templates || []) {
    templateMap.set(t.id, t.name)
  }

  // Fetch junctions (paginated)
  const junctions: { question_template_id: string; book_template_id: string }[] = []
  let offset = 0
  while (true) {
    const { data: batch, error: jErr } = await adminClient
      .from("book_question_junction")
      .select("question_template_id, book_template_id")
      .range(offset, offset + PAGE_SIZE - 1)

    if (jErr || !batch || batch.length === 0) break
    junctions.push(...batch)
    if (batch.length < PAGE_SIZE) break
    offset += batch.length
  }

  // Build template→question map
  const templateToQuestions = new Map<string, string[]>()
  for (const j of junctions) {
    if (!templateToQuestions.has(j.book_template_id)) {
      templateToQuestions.set(j.book_template_id, [])
    }
    templateToQuestions.get(j.book_template_id)!.push(j.question_template_id)
  }

  // Fetch all questions with metadata (paginated)
  const questionMeta = new Map<string, any>()
  offset = 0
  while (true) {
    const { data: batch, error: qErr } = await adminClient
      .from("book_questions")
      .select("id, metadata, metadata_v2")
      .range(offset, offset + PAGE_SIZE - 1)

    if (qErr || !batch || batch.length === 0) break
    for (const q of batch) {
      questionMeta.set(q.id, { metadata: q.metadata, metadata_v2: q.metadata_v2 })
    }
    if (batch.length < PAGE_SIZE) break
    offset += batch.length
  }

  // Compute per-template migration stats
  const logs: any[] = []

  const templatesToProcess = filterTemplateId
    ? [[filterTemplateId, templateToQuestions.get(filterTemplateId) || []]] as [string, string[]][]
    : Array.from(templateToQuestions.entries())

  for (const [tid, qIds] of templatesToProcess) {
    const tName = templateMap.get(tid)
    if (!tName) continue

    let enrichedCount = 0
    let latestTimestamp: string | null = null

    for (const qId of qIds) {
      const qData = questionMeta.get(qId)
      if (!qData) continue

      const merged = { ...(qData.metadata || {}), ...(qData.metadata_v2 || {}) }
      if (isQuestionEnriched(merged)) {
        enrichedCount++

        // Extract migration timestamp from backup
        const backup = merged._migration_backup
        if (backup?.timestamp) {
          if (!latestTimestamp || backup.timestamp > latestTimestamp) {
            latestTimestamp = backup.timestamp
          }
        }
      }
    }

    if (enrichedCount > 0) {
      logs.push({
        id: `computed-${tid}`,
        template_id: tid,
        template_name: tName,
        executed_by: "00000000-0000-0000-0000-000000000000",
        executed_at: latestTimestamp || new Date().toISOString(),
        total_excel_rows: enrichedCount,
        total_matched: enrichedCount,
        total_updated: enrichedCount,
        total_errors: 0,
        total_unmatched: qIds.length - enrichedCount,
        column_mapping: {},
        match_details: { source: "computed-from-metadata" },
        error_details: null,
        created_at: latestTimestamp || new Date().toISOString(),
      })
    }
  }

  // Sort by executed_at desc
  logs.sort((a, b) => b.executed_at.localeCompare(a.executed_at))

  return NextResponse.json({
    data: logs.slice(0, limit),
    computed: true,
    warning: "Historico computado a partir dos metadados das questoes (tabela migration_logs nao existe)",
  })
}
