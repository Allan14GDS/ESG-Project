import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import type { TemplateEnrichmentStatus } from "@/lib/migration/types"
import { isQuestionEnriched } from "@/lib/migration/metadata-builder"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("templateId")

    // Fetch templates
    let templatesQuery = adminClient.from("book_templates").select("id, name, type").order("name")
    if (templateId) {
      templatesQuery = templatesQuery.eq("id", templateId)
    }
    const { data: templates, error: templatesError } = await templatesQuery
    if (templatesError) throw templatesError

    if (!templates || templates.length === 0) {
      return NextResponse.json({ data: [] })
    }

    // Fetch ALL junctions with pagination (Supabase default limit is 1000)
    const templateIds = templates.map((t) => t.id)
    const allJunctions: { book_template_id: string; question_template_id: string }[] = []
    const PAGE_SIZE = 1000
    let junctionOffset = 0
    let hasMore = true

    while (hasMore) {
      const { data: batch, error: batchError } = await adminClient
        .from("book_question_junction")
        .select("book_template_id, question_template_id")
        .in("book_template_id", templateIds)
        .range(junctionOffset, junctionOffset + PAGE_SIZE - 1)

      if (batchError) throw batchError

      if (batch && batch.length > 0) {
        allJunctions.push(...batch)
        junctionOffset += batch.length
        hasMore = batch.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }

    // Group question IDs by template
    const templateQuestionMap: Record<string, string[]> = {}
    for (const j of allJunctions) {
      if (!templateQuestionMap[j.book_template_id]) {
        templateQuestionMap[j.book_template_id] = []
      }
      templateQuestionMap[j.book_template_id].push(j.question_template_id)
    }

    // Fetch all unique question IDs
    const allQuestionIds = [...new Set(allJunctions.map((j) => j.question_template_id))]

    // Fetch ALL questions metadata by paginating through book_questions
    const questionsMap: Record<string, any> = {}
    let qOffset = 0
    let qHasMore = true
    while (qHasMore) {
      const { data: qBatch } = await adminClient
        .from("book_questions")
        .select("id, metadata, metadata_v2")
        .range(qOffset, qOffset + PAGE_SIZE - 1)

      if (qBatch && qBatch.length > 0) {
        for (const q of qBatch) {
          questionsMap[q.id] = q
        }
        qOffset += qBatch.length
        qHasMore = qBatch.length === PAGE_SIZE
      } else {
        qHasMore = false
      }
    }

    // Fetch last migration log per template (resilient if table doesn't exist)
    let logs: any[] | null = null
    try {
      const { data: logsData } = await adminClient
        .from("migration_logs")
        .select("template_id, executed_at")
        .in("template_id", templateIds)
        .order("executed_at", { ascending: false })
      logs = logsData
    } catch {
      // Table may not exist yet
    }

    const lastMigrationMap: Record<string, string> = {}
    for (const log of logs || []) {
      if (!lastMigrationMap[log.template_id]) {
        lastMigrationMap[log.template_id] = log.executed_at
      }
    }

    // Compute enrichment status per template
    const statuses: TemplateEnrichmentStatus[] = templates.map((template) => {
      const questionIds = templateQuestionMap[template.id] || []
      let enrichedCount = 0

      for (const qId of questionIds) {
        const q = questionsMap[qId]
        if (q) {
          const meta = q.metadata_v2 || q.metadata
          if (isQuestionEnriched(meta)) {
            enrichedCount++
          }
        }
      }

      const total = questionIds.length
      return {
        templateId: template.id,
        templateName: template.name,
        templateType: template.type || "",
        totalQuestions: total,
        enrichedCount,
        unenrichedCount: total - enrichedCount,
        enrichmentPercent: total > 0 ? Math.round((enrichedCount / total) * 100) : 0,
        lastMigration: lastMigrationMap[template.id],
      }
    })

    // Sort: unenriched first, then by name
    statuses.sort((a, b) => {
      if (a.enrichmentPercent !== b.enrichmentPercent) {
        return a.enrichmentPercent - b.enrichmentPercent
      }
      return a.templateName.localeCompare(b.templateName)
    })

    return NextResponse.json({ data: statuses })
  } catch (error: any) {
    console.error("[migration/status] Error:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
