import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: templates, error } = await supabase
      .from("book_templates")
      .select("id, name, type")
      .order("name", { ascending: true })

    if (error) {
      console.error("[v0] Error fetching templates:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(templates)
  } catch (error: any) {
    console.error("[v0] Error in GET /api/templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description, type } = body

    if (!name || !type) {
      return NextResponse.json({ error: "Nome e tipo são obrigatórios" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: newTemplate, error } = await supabase
      .from("book_templates")
      .insert({
        name,
        description: description || null,
        type,
      })
      .select()
      .single()

    if (error) {
      console.error("[v0] Error creating template:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(newTemplate, { status: 201 })
  } catch (error: any) {
    console.error("[v0] Error in POST /api/templates:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
