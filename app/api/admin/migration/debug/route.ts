import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * Debug endpoint to inspect actual metadata stored in the database.
 * GET /api/admin/migration/debug?templateId=xxx
 *
 * Returns:
 * - First 5 questions with their full metadata and metadata_v2
 * - Which companies have this template assigned via company_templates
 * - Junction count for this template
 */
export async function GET(request: Request) {
  try {
    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("templateId")

    if (!templateId) {
      return NextResponse.json({ error: "templateId is required" }, { status: 400 })
    }

    // 1. Get template info
    const { data: template } = await adminClient
      .from("book_templates")
      .select("id, name, description")
      .eq("id", templateId)
      .single()

    // 2. Get junction entries for this template
    const { data: junctions } = await adminClient
      .from("book_question_junction")
      .select("question_template_id, sort_order")
      .eq("book_template_id", templateId)
      .order("sort_order")

    const questionIds = (junctions || []).map((j) => j.question_template_id)

    // 3. Get actual question data (with FULL metadata)
    let questions: any[] = []
    if (questionIds.length > 0) {
      const idsToFetch = questionIds.slice(0, 5) // Only first 5 for debug
      const { data: qData } = await adminClient
        .from("book_questions")
        .select("id, label, type, metadata, metadata_v2, unique_identifier")
        .in("id", idsToFetch)
      questions = qData || []
    }

    // 4. Check company_templates — which companies have this template assigned?
    const { data: companyTemplates } = await adminClient
      .from("company_templates")
      .select("company_id, active, companies(id, name)")
      .eq("template_id", templateId)

    // 5. Build debug response
    const debugInfo = {
      template: template || null,
      junctionCount: questionIds.length,
      questionsSample: questions.map((q) => ({
        id: q.id,
        label: q.label?.substring(0, 80),
        type: q.type,
        metadata_keys: q.metadata ? Object.keys(q.metadata) : [],
        metadata_v2_keys: q.metadata_v2 ? Object.keys(q.metadata_v2) : [],
        metadata_framework_gri: q.metadata?.framework_gri || null,
        metadata_v2_framework_gri: q.metadata_v2?.framework_gri || null,
        metadata_disclosure: q.metadata?.disclosure || null,
        metadata_v2_disclosure: q.metadata_v2?.disclosure || null,
        metadata_sub_framework_gri: q.metadata?.sub_framework_gri || null,
        metadata_v2_sub_framework_gri: q.metadata_v2?.sub_framework_gri || null,
        metadata_evidencias: q.metadata?.evidencias?.substring(0, 100) || null,
        metadata_full: q.metadata,
        metadata_v2_full: q.metadata_v2,
      })),
      companiesWithTemplate: (companyTemplates || []).map((ct: any) => ({
        companyId: ct.company_id,
        companyName: ct.companies?.name || "unknown",
        active: ct.active,
      })),
      diagnosis: {
        hasQuestions: questionIds.length > 0,
        hasEnrichedMetadata: questions.some((q) =>
          q.metadata?.framework_gri || q.metadata?.disclosure ||
          q.metadata_v2?.framework_gri || q.metadata_v2?.disclosure
        ),
        hasCompanyAssignment: (companyTemplates || []).length > 0,
        metadataV2IsEmptyObject: questions.some((q) =>
          q.metadata_v2 && typeof q.metadata_v2 === "object" && Object.keys(q.metadata_v2).length === 0
        ),
      },
    }

    return NextResponse.json(debugInfo)
  } catch (error: any) {
    console.error("[migration/debug] Error:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
