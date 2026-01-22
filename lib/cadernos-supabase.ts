import { createClient } from "@/lib/supabase/client"

export interface BookQuestion {
  id: string
  label: string
  type: string
  metadata: any
  unique_identifier: string
}

export interface BookQuestionWithJunction extends BookQuestion {
  sort_order: number
}

/**
 * Fetch all questions for a specific book/caderno from Supabase
 * @param bookTemplateId The ID of the book template (caderno)
 * @returns Array of questions with their metadata
 */
export async function fetchBookQuestions(bookTemplateId: string): Promise<BookQuestionWithJunction[]> {
  const supabase = createClient()

  console.log("[v0] Fetching questions for book:", bookTemplateId)

  // Fetch questions through the junction table
  const { data: junctionData, error: junctionError } = await supabase
    .from("book_question_junction")
    .select(`
      sort_order,
      question_template_id,
      book_questions (
        id,
        label,
        type,
        metadata,
        unique_identifier
      )
    `)
    .eq("book_template_id", bookTemplateId)
    .order("sort_order", { ascending: true })

  if (junctionError) {
    console.error("[v0] Error fetching book questions:", junctionError)
    throw new Error(`Failed to fetch questions: ${junctionError.message}`)
  }

  if (!junctionData || junctionData.length === 0) {
    console.log("[v0] No questions found for book:", bookTemplateId)
    return []
  }

  // Map the data to the expected format
  const questions = junctionData
    .filter((item: any) => item.book_questions) // Filter out null relationships
    .map((item: any) => ({
      ...item.book_questions,
      sort_order: item.sort_order,
    }))

  console.log("[v0] Fetched questions count:", questions.length)
  return questions
}

/**
 * Fetch book/caderno details from Supabase
 * @param bookTemplateId The ID of the book template
 * @returns Book template details
 */
export async function fetchBookTemplate(bookTemplateId: string) {
  const supabase = createClient()

  const { data, error } = await supabase.from("book_templates").select("*").eq("id", bookTemplateId).single()

  if (error) {
    console.error("[v0] Error fetching book template:", error)
    throw new Error(`Failed to fetch book template: ${error.message}`)
  }

  return data
}
