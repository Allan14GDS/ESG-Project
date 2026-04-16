import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const yearParam = request.nextUrl.searchParams.get("year")
  const targetYear = yearParam ? parseInt(yearParam) : new Date().getFullYear()
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ percentage: 0, answered: 0, total: 0 }, { status: 200 })
    }

    const adminClient = createAdminClient()

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError || !profile) {
      return NextResponse.json({ percentage: 0, answered: 0, total: 0 }, { status: 200 })
    }

    const isGlobalAdmin = profile.role === "admin_main" || profile.role === "admin"

    let assignments: { caderno_id: string; organization_id: string | null; company_id: string | null }[] = []

    if (isGlobalAdmin) {
      const { data, error } = await adminClient
        .from("book_assignments")
        .select("caderno_id, organization_id, company_id")

      if (error) {
        console.error("[progress] Error fetching global assignments:", error)
        return NextResponse.json({ percentage: 0, answered: 0, total: 0 })
      }
      assignments = data || []
    } else {
      const { data, error } = await adminClient
        .from("book_assignments")
        .select("caderno_id, organization_id, company_id")
        .eq("user_id", profile.id)

      if (error) {
        console.error("[progress] Error fetching user assignments:", error)
        return NextResponse.json({ percentage: 0, answered: 0, total: 0 })
      }
      assignments = data || []
    }

    if (assignments.length === 0) {
      return NextResponse.json({ percentage: 0, answered: 0, total: 0 })
    }

    // Build unique (template_id, company_id) pairs — the unit of work in this system.
    // A template used by 3 companies represents 3 independent units, each with their own
    // question pool and answer set. We must NOT deduplicate across companies.
    const pairsSeen = new Set<string>()
    const pairs: { templateId: string; companyId: string | null }[] = []

    for (const a of assignments) {
      if (!a.caderno_id) continue
      const key = `${a.caderno_id}__${a.company_id ?? ""}`
      if (!pairsSeen.has(key)) {
        pairsSeen.add(key)
        pairs.push({ templateId: a.caderno_id, companyId: a.company_id })
      }
    }

    const companyIds = [...new Set(assignments.map((a) => a.company_id).filter(Boolean))] as string[]
    const orgIds = [...new Set(assignments.map((a) => a.organization_id).filter(Boolean))] as string[]
    const templateIds = [...new Set(pairs.map((p) => p.templateId))]

    const [answersResult, questionsResult] = await Promise.all([
      companyIds.length > 0 || orgIds.length > 0
        ? adminClient.rpc("get_gestor_answer_counts", {
            p_company_ids: companyIds,
            p_org_ids: orgIds,
            p_year: targetYear,
          })
        : Promise.resolve({ data: [], error: null }),

      templateIds.length > 0
        ? adminClient.rpc("get_template_question_counts", {
            p_template_ids: templateIds,
          })
        : Promise.resolve({ data: [], error: null }),
    ])

    if (answersResult.error) {
      console.error("[progress] Error fetching answer counts:", answersResult.error)
    }
    if (questionsResult.error) {
      console.error("[progress] Error fetching question counts:", questionsResult.error)
    }

    // Build lookup maps — one entry per key, values are absolute counts (not percentages).
    // answerMap key: `${template_id}_${company_id}` matching the RPC output shape.
    const answerMap = new Map<string, number>()
    for (const row of (answersResult.data ?? []) as { template_id: string; company_id: string; answered_count: number }[]) {
      answerMap.set(`${row.template_id}_${row.company_id}`, Number(row.answered_count) || 0)
    }

    // questionMap key: template_id — question count is the same regardless of company.
    const questionMap = new Map<string, number>()
    for (const row of (questionsResult.data ?? []) as { template_id: string; question_count: number }[]) {
      questionMap.set(row.template_id, Number(row.question_count) || 0)
    }

    // Aggregate absolute counts across unique (template, company) pairs.
    // Each pair contributes its own question pool and its own answer count independently —
    // never summing percentages, only raw numbers before dividing once at the end.
    let totalAnswered = 0
    let totalQuestions = 0

    for (const { templateId, companyId } of pairs) {
      const qCount = questionMap.get(templateId) ?? 0
      const aCount = companyId ? (answerMap.get(`${templateId}_${companyId}`) ?? 0) : 0
      totalQuestions += qCount
      totalAnswered += aCount
    }

    const percentage =
      totalQuestions === 0
        ? 0
        : Math.min(100, Math.round((totalAnswered / totalQuestions) * 100))

    return NextResponse.json({ percentage, answered: totalAnswered, total: totalQuestions })
  } catch (error) {
    console.error("[progress] Unexpected error:", error)
    return NextResponse.json({ percentage: 0, answered: 0, total: 0 })
  }
}
