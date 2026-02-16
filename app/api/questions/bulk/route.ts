import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

function generateUniqueIdentifier(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .trim()
        .replace(/\s+/g, "_")
        .substring(0, 100)
}

export async function POST(request: NextRequest) {
    try {
        const { questions } = await request.json()

        if (!questions || !Array.isArray(questions)) {
            return NextResponse.json({ error: "questions deve ser um array" }, { status: 400 })
        }

        if (questions.length === 0) {
            return NextResponse.json({ success: true, created: 0 })
        }

        const adminClient = createAdminClient()

        // 1. Prepare questions for insertion
        const questionsToInsert = questions.map((q) => ({
            label: q.linha_coleta,
            type: q.tipo_resposta || "text",
            unique_identifier: generateUniqueIdentifier(q.linha_coleta),
            metadata: {
                disclosure: q.disclosure || "",
                evidencias: q.evidencias || "",
                obs: q.obs || "",
                framework_1: q.framework_1 || "",
                sub_framework_1: q.sub_framework_1 || "",
                framework_2: q.framework_2 || "",
                sub_framework_2: q.sub_framework_2 || "",
                sub_frameworks: q.subFrameworks || {},
            },
            metadata_v2: {
                disclosure: q.disclosure || "",
                evidencias: q.evidencias || "",
                obs: q.obs || "",
                framework_1: q.framework_1 || "",
                sub_framework_1: q.sub_framework_1 || "",
                framework_2: q.framework_2 || "",
                sub_framework_2: q.sub_framework_2 || "",
                sub_frameworks: q.subFrameworks || {},
                legacy_sub_frameworks: q.subFrameworks || {},
            },
        }))

        // 2. Perform bulk insertion
        // Use upsert on unique_identifier to avoid errors if some were created just now or missed by check
        const { data: insertedQuestions, error: insertError } = await adminClient
            .from("book_questions")
            .upsert(questionsToInsert, { onConflict: "unique_identifier" })
            .select("id, unique_identifier")

        if (insertError) {
            console.error("Error in bulk insert questions:", insertError)
            return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        // 3. Prepare junctions
        const junctionEntries: any[] = []

        questions.forEach((q) => {
            const inserted = insertedQuestions?.find(iq => iq.unique_identifier === generateUniqueIdentifier(q.linha_coleta))
            if (inserted && q.templateIds && Array.isArray(q.templateIds)) {
                q.templateIds.forEach((templateId: string) => {
                    const position = q.positionsByTemplate?.[templateId] || q.position || 0
                    junctionEntries.push({
                        question_template_id: inserted.id,
                        book_template_id: templateId,
                        position: position
                    })
                })
            }
        })

        // 4. Perform bulk junction insertion
        if (junctionEntries.length > 0) {
            const { error: junctionError } = await adminClient
                .from("book_question_junction")
                .upsert(junctionEntries, { onConflict: "book_template_id,question_template_id" })

            if (junctionError) {
                console.error("Error in bulk insert junctions:", junctionError)
                // We don't fail the whole request here but log it
            }
        }

        return NextResponse.json({
            success: true,
            created: insertedQuestions?.length || 0,
            junctions: junctionEntries.length
        })
    } catch (error) {
        console.error("Error in bulk import API:", error)
        return NextResponse.json({ error: "Erro interno no servidor para importação em massa" }, { status: 500 })
    }
}
