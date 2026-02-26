import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { isQuestionEnriched } from "@/lib/migration/metadata-builder"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/migration/questions?templateId=xxx&filter=unenriched|enriched|all
 *
 * Returns questions for a template with their enrichment status.
 * Useful for seeing which specific questions are missing metadata.
 */
export async function GET(request: Request) {
  try {
    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("templateId")
    const filter = searchParams.get("filter") || "unenriched" // unenriched | enriched | all

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 })
    }

    // Fetch junctions for this template (paginated)
    const PAGE_SIZE = 1000
    const junctions: { question_template_id: string; sort_order: number }[] = []
    let offset = 0
    let hasMore = true

    while (hasMore) {
      const { data: batch, error } = await adminClient
        .from("book_question_junction")
        .select("question_template_id, sort_order")
        .eq("book_template_id", templateId)
        .order("sort_order")
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) throw error
      if (batch && batch.length > 0) {
        junctions.push(...batch)
        offset += batch.length
        hasMore = batch.length === PAGE_SIZE
      } else {
        hasMore = false
      }
    }

    if (junctions.length === 0) {
      return NextResponse.json({ data: [], total: 0 })
    }

    // Fetch question details (paginated batches of 500)
    const questionIds = junctions.map((j) => j.question_template_id)
    const questionsMap = new Map<string, any>()
    const BATCH = 500

    for (let i = 0; i < questionIds.length; i += BATCH) {
      const batch = questionIds.slice(i, i + BATCH)
      const { data: qBatch } = await adminClient
        .from("book_questions")
        .select("id, label, type, metadata, metadata_v2")
        .in("id", batch)

      if (qBatch) {
        for (const q of qBatch) {
          questionsMap.set(q.id, q)
        }
      }
    }

    // Build result with enrichment status
    const questions = junctions.map((j) => {
      const q = questionsMap.get(j.question_template_id)
      if (!q) return null

      const mergedMeta = { ...(q.metadata || {}), ...(q.metadata_v2 || {}) }
      const enriched = isQuestionEnriched(mergedMeta)

      return {
        id: q.id,
        label: q.label,
        type: q.type,
        sortOrder: j.sort_order,
        enriched,
        metadata: {
          disclosure: mergedMeta.disclosure || null,
          framework_gri: mergedMeta.framework_gri || null,
          sub_framework_gri: mergedMeta.sub_framework_gri || null,
          framework_aneel: mergedMeta.framework_aneel || null,
          sub_framework_aneel: mergedMeta.sub_framework_aneel || null,
          framework_ifrs: mergedMeta.framework_ifrs || null,
          sub_framework_ifrs: mergedMeta.sub_framework_ifrs || null,
        },
      }
    }).filter(Boolean)

    // Apply filter
    let filtered = questions
    if (filter === "unenriched") {
      filtered = questions.filter((q: any) => !q.enriched)
    } else if (filter === "enriched") {
      filtered = questions.filter((q: any) => q.enriched)
    }

    return NextResponse.json({
      data: filtered,
      total: questions.length,
      enrichedCount: questions.filter((q: any) => q.enriched).length,
      unenrichedCount: questions.filter((q: any) => !q.enriched).length,
    })
  } catch (error: any) {
    console.error("[migration/questions] Error:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
