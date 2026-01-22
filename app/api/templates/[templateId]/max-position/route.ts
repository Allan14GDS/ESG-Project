import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { templateId: string } }) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      },
    )

    const { templateId } = params

    // Get max position for this template
    const { data: maxPositionData } = await supabase
      .from("book_question_junction")
      .select("position")
      .eq("book_template_id", templateId)
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle()

    return NextResponse.json({
      maxPosition: maxPositionData?.position || 0,
    })
  } catch (error) {
    console.error("[v0] Error fetching max position:", error)
    return NextResponse.json({ maxPosition: 0 })
  }
}
