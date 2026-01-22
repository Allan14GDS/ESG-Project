"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Create a book template within a form template
export async function createBookTemplate(formData: FormData) {
  try {
    const supabase = createClient()

    const templateId = formData.get("templateId") as string
    const title = formData.get("title") as string
    const description = formData.get("description") as string

    console.log("[v0] Creating book template:", { templateId, title, description })

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error("Usuário não autenticado")
    }

    // Insert into question_notebooks (this represents book templates)
    const { data, error } = await supabase
      .from("question_notebooks")
      .insert({
        title,
        description,
        company_id: templateId, // Using company_id as template_id for now
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating book template:", error)
      throw error
    }

    console.log("[v0] ✓ Book template created successfully:", data)

    revalidatePath(`/admin/templates/${templateId}`)
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Error in createBookTemplate:", error)
    return { success: false, error: error.message }
  }
}

// Delete a book template
export async function deleteBookTemplate(bookId: string, templateId: string) {
  try {
    const supabase = createClient()

    console.log("[v0] Deleting book template:", bookId)

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error("Usuário não autenticado")
    }

    // First delete all questions in this book
    const { error: questionsError } = await supabase.from("questions").delete().eq("caderno_id", bookId)

    if (questionsError) {
      console.error("[v0] Error deleting book questions:", questionsError)
    }

    // Delete the book
    const { error } = await supabase.from("question_notebooks").delete().eq("id", bookId)

    if (error) {
      console.error("[v0] Error deleting book template:", error)
      throw error
    }

    console.log("[v0] ✓ Book template deleted successfully")

    revalidatePath(`/admin/templates/${templateId}`)
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in deleteBookTemplate:", error)
    return { success: false, error: error.message }
  }
}

// Add question to a book template
export async function addQuestionToBook(formData: FormData) {
  try {
    const supabase = createClient()

    const bookId = formData.get("bookId") as string
    const label = formData.get("label") as string
    const type = formData.get("type") as string
    const orderIndex = Number.parseInt(formData.get("orderIndex") as string)

    console.log("[v0] Adding question to book:", { bookId, label, type, orderIndex })

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error("Usuário não autenticado")
    }

    // Insert question
    const { data, error } = await supabase
      .from("questions")
      .insert({
        caderno_id: bookId,
        label,
        type,
        order_index: orderIndex,
        metadata: {},
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error adding question:", error)
      throw error
    }

    console.log("[v0] ✓ Question added successfully:", data)

    revalidatePath(`/admin/templates/books/${bookId}`)
    return { success: true, data }
  } catch (error: any) {
    console.error("[v0] Error in addQuestionToBook:", error)
    return { success: false, error: error.message }
  }
}

// Delete question from book
export async function deleteQuestion(questionId: string, bookId: string) {
  try {
    const supabase = createClient()

    console.log("[v0] Deleting question:", questionId)

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new Error("Usuário não autenticado")
    }

    // First delete all answers for this question
    const { error: answersError } = await supabase.from("answers").delete().eq("question_id", questionId)

    if (answersError) {
      console.error("[v0] Error deleting question answers:", answersError)
    }

    // Delete the question
    const { error } = await supabase.from("questions").delete().eq("id", questionId)

    if (error) {
      console.error("[v0] Error deleting question:", error)
      throw error
    }

    console.log("[v0] ✓ Question deleted successfully")

    revalidatePath(`/admin/templates/books/${bookId}`)
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Error in deleteQuestion:", error)
    return { success: false, error: error.message }
  }
}
