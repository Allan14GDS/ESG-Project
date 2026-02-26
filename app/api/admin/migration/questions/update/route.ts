import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * PATCH /api/admin/migration/questions/update
 *
 * Updates metadata fields for a single question.
 * Body: { questionId, fields: { disclosure?, framework_gri?, sub_framework_gri?, framework_aneel?, sub_framework_aneel?, framework_ifrs?, sub_framework_ifrs? } }
 */
export async function PATCH(request: Request) {
  try {
    const adminClient = createAdminClient()
    const body = await request.json()
    const { questionId, fields } = body

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 })
    }

    if (!fields || typeof fields !== "object") {
      return NextResponse.json({ error: "fields object is required" }, { status: 400 })
    }

    // Allowed fields to update
    const ALLOWED_FIELDS = [
      "disclosure",
      "framework_gri",
      "sub_framework_gri",
      "framework_aneel",
      "sub_framework_aneel",
      "framework_ifrs",
      "sub_framework_ifrs",
      "evidencias",
      "obs_nao_aplicavel",
    ]

    // Filter to only allowed fields
    const sanitized: Record<string, string> = {}
    for (const [key, value] of Object.entries(fields)) {
      if (ALLOWED_FIELDS.includes(key)) {
        sanitized[key] = String(value || "").trim()
      }
    }

    if (Object.keys(sanitized).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 })
    }

    // Fetch current question
    const { data: question, error: fetchError } = await adminClient
      .from("book_questions")
      .select("id, label, metadata, metadata_v2")
      .eq("id", questionId)
      .single()

    if (fetchError || !question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 })
    }

    const existingMeta = question.metadata || {}
    const existingMetaV2 = question.metadata_v2 || {}

    // Build backup
    const backup = {
      timestamp: new Date().toISOString(),
      log_id: "manual-edit",
      previous_metadata: { ...existingMeta },
    }

    // Build generic framework fields from named ones
    const mergedFields = { ...existingMeta, ...sanitized }
    const genericFields: Record<string, string> = {}
    const fwPairs = [
      { fw: mergedFields.framework_gri, sub: mergedFields.sub_framework_gri },
      { fw: mergedFields.framework_aneel, sub: mergedFields.sub_framework_aneel },
      { fw: mergedFields.framework_ifrs, sub: mergedFields.sub_framework_ifrs },
    ].filter((p) => p.fw)

    fwPairs.forEach((pair, index) => {
      if (index < 2) {
        genericFields[`framework_${index + 1}`] = pair.fw || ""
        genericFields[`sub_framework_${index + 1}`] = pair.sub || ""
      }
    })

    // Merge into metadata
    const newMetadata = {
      ...existingMeta,
      ...sanitized,
      ...genericFields,
      _migration_backup: backup,
    }

    const newMetadataV2 = {
      ...existingMetaV2,
      ...sanitized,
      ...genericFields,
      _migration_backup: backup,
    }

    // Update
    const { error: updateError } = await adminClient
      .from("book_questions")
      .update({
        metadata: newMetadata,
        metadata_v2: newMetadataV2,
      })
      .eq("id", questionId)

    if (updateError) {
      console.error("[migration/questions/update] Error:", updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      questionId,
      updatedFields: Object.keys(sanitized),
    })
  } catch (error: any) {
    console.error("[migration/questions/update] Error:", error)
    return NextResponse.json({ error: error.message || "Erro interno" }, { status: 500 })
  }
}
