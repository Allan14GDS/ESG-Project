import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

function generateUniqueIdentifier(text: string): string {
  // Normalize: lowercase, remove special chars, trim, replace spaces with underscore
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9\s]/g, "") // Remove special chars
    .trim()
    .replace(/\s+/g, "_") // Replace spaces with underscore
    .substring(0, 100) // Limit length
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      linha_coleta,
      disclosure,
      tipo_resposta,
      evidencias,
      obs_nao_aplicavel,
      sub_framework,
      framework_1,
      sub_framework_1,
      framework_2,
      sub_framework_2,
      templateIds,
      subFrameworks,
      confirmDuplicate, // New parameter to confirm adding duplicate to current template
      position, // Added position parameter to support ordering from CSV import
      positionsByTemplate, // New parameter for template-specific positions
    } = body

    if (!linha_coleta || !tipo_resposta) {
      return NextResponse.json({ error: "Linha de coleta e tipo de resposta são obrigatórios" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const uniqueIdentifier = generateUniqueIdentifier(linha_coleta)

    const { data: existingQuestion } = await adminClient
      .from("book_questions")
      .select("id, label")
      .eq("unique_identifier", uniqueIdentifier)
      .maybeSingle()

    if (existingQuestion) {
      if (!confirmDuplicate) {
        // Get the templates where this question is already assigned
        const { data: existingTemplates } = await adminClient
          .from("book_question_junction")
          .select("book_template_id, book_templates(name)")
          .eq("question_template_id", existingQuestion.id)

        const templateNames = existingTemplates?.map((t: any) => t.book_templates?.name).filter(Boolean) || []

        return NextResponse.json(
          {
            error: "duplicate",
            needsConfirmation: true,
            message: `Esta questão já existe nos cadernos: ${templateNames.join(", ")}`,
            question: existingQuestion,
            existingTemplates: templateNames,
            technicalDetails: {
              code: "DUPLICATE_QUESTION",
              unique_identifier: uniqueIdentifier,
              existing_question_id: existingQuestion.id,
              attempted_label: linha_coleta,
            },
          },
          { status: 409 },
        )
      } else {
        if (templateIds && Array.isArray(templateIds) && templateIds.length > 0) {
          const junctionEntries = await Promise.all(
            templateIds.map(async (templateId) => {
              let finalPosition = positionsByTemplate?.[templateId] || position

              // If no position provided, calculate next available position
              if (!finalPosition) {
                const { data: maxPositionData } = await adminClient
                  .from("book_question_junction")
                  .select("position")
                  .eq("book_template_id", templateId)
                  .order("position", { ascending: false })
                  .limit(1)
                  .maybeSingle()

                finalPosition = (maxPositionData?.position || 0) + 1
              }

              return {
                question_template_id: existingQuestion.id,
                book_template_id: templateId,
                position: finalPosition,
              }
            }),
          )

          const { error: junctionError } = await adminClient.from("book_question_junction").upsert(junctionEntries, {
            onConflict: "book_template_id,question_template_id",
          })

          if (junctionError) {
            console.error("[API] Error creating junction entries for duplicate:", junctionError)
            return NextResponse.json({ error: junctionError.message }, { status: 500 })
          }
        }

        return NextResponse.json({ success: true, question: existingQuestion, addedToTemplate: true })
      }
    }

    const { data: newQuestion, error: insertError } = await adminClient
      .from("book_questions")
      .insert({
        label: linha_coleta,
        type: tipo_resposta,
        unique_identifier: uniqueIdentifier,
        metadata: {
          disclosure: disclosure || "",
          evidencias: evidencias || "",
          obs: obs_nao_aplicavel || "",
          framework_1: framework_1 || "",
          sub_framework_1: sub_framework_1 || "",
          framework_2: framework_2 || "",
          sub_framework_2: sub_framework_2 || "",
          sub_framework: sub_framework || "",
          sub_frameworks: subFrameworks || {},
        },
        metadata_v2: {
          disclosure: disclosure || "",
          evidencias: evidencias || "",
          obs: obs_nao_aplicavel || "",
          framework_1: framework_1 || "",
          sub_framework_1: sub_framework_1 || "",
          framework_2: framework_2 || "",
          sub_framework_2: sub_framework_2 || "",
          sub_frameworks: subFrameworks || {}, // Added standard sub_frameworks field
          // Ensure we preserve the original structure too for migration/comparison if needed
          legacy_sub_frameworks: subFrameworks || {},
        },
      })
      .select()
      .single()

    if (insertError) {
      console.error("[API] Error creating question:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    if (templateIds && Array.isArray(templateIds) && templateIds.length > 0) {
      const junctionEntries = await Promise.all(
        templateIds.map(async (templateId) => {
          let finalPosition = positionsByTemplate?.[templateId] || position

          // If no position provided, calculate next available position
          if (!finalPosition) {
            const { data: maxPositionData } = await adminClient
              .from("book_question_junction")
              .select("position")
              .eq("book_template_id", templateId)
              .order("position", { ascending: false })
              .limit(1)
              .maybeSingle()

            finalPosition = (maxPositionData?.position || 0) + 1
          }

          return {
            question_template_id: newQuestion.id,
            book_template_id: templateId,
            position: finalPosition,
          }
        }),
      )

      const { error: junctionError } = await adminClient.from("book_question_junction").insert(junctionEntries)

      if (junctionError) {
        console.error("[API] Error creating junction entries:", junctionError)
      }
    }

    return NextResponse.json({ success: true, question: newQuestion })
  } catch (error) {
    console.error("[API] Error in POST /api/questions:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar questão" },
      { status: 500 },
    )
  }
}
