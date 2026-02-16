import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
    try {
        const { unique_identifiers } = await request.json()

        if (!unique_identifiers || !Array.isArray(unique_identifiers)) {
            return NextResponse.json({ error: "unique_identifiers deve ser um array" }, { status: 400 })
        }

        if (unique_identifiers.length === 0) {
            return NextResponse.json({ duplicates: {} })
        }

        const adminClient = createAdminClient()

        // 1. Get all questions that match any of the identifiers
        const { data: existingQuestions, error: questionsError } = await adminClient
            .from("book_questions")
            .select("id, label, unique_identifier")
            .in("unique_identifier", unique_identifiers)

        if (questionsError) {
            console.error("Error fetching existing questions:", questionsError)
            return NextResponse.json({ error: "Erro ao buscar questões existentes" }, { status: 500 })
        }

        if (!existingQuestions || existingQuestions.length === 0) {
            return NextResponse.json({ duplicates: {} })
        }

        const questionIds = existingQuestions.map(q => q.id)

        // 2. Get all junctions for these questions
        const { data: junctions, error: junctionsError } = await adminClient
            .from("book_question_junction")
            .select("question_template_id, book_template_id, book_templates(name)")
            .in("question_template_id", questionIds)

        if (junctionsError) {
            console.error("Error fetching junctions:", junctionsError)
            return NextResponse.json({ error: "Erro ao buscar vínculos existentes" }, { status: 500 })
        }

        // 3. Map results back to unique_identifiers
        const results: Record<string, any> = {}

        existingQuestions.forEach(question => {
            const questionJunctions = junctions?.filter(j => j.question_template_id === question.id) || []
            const existingTemplates = questionJunctions.map((j: any) => j.book_templates?.name).filter(Boolean) || []

            results[question.unique_identifier] = {
                isDuplicate: true,
                questionId: question.id,
                existingTemplates,
            }
        })

        return NextResponse.json({ duplicates: results })
    } catch (error) {
        console.error("Error checking duplicates bulk:", error)
        return NextResponse.json({ error: "Erro ao verificar duplicatas em massa" }, { status: 500 })
    }
}
