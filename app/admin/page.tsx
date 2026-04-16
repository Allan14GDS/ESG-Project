import { createAdminClient } from "@/lib/supabase/admin"
import { requireGestor } from "@/lib/auth-utils"
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client"
import { GestorDashboardClient } from "@/components/gestor/gestor-dashboard-client"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminPanelPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const resolvedParams = await searchParams
  const yearParam = resolvedParams?.year
  const targetYear = yearParam ? parseInt(yearParam) : new Date().getFullYear()

  // Allow both admin_main and holding_admin
  const profile = await requireGestor()
  const isAdmin = profile.role === "admin_main"

  const adminClient = createAdminClient()

  if (isAdmin) {
    // ===== ADMIN: Global data =====
    const [templatesRes, questionsRes, usersRes, answersRes] = await Promise.all([
      adminClient.from("book_templates").select("id", { count: "exact", head: true }),
      adminClient.from("book_questions").select("id", { count: "exact", head: true }),
      adminClient.from("profiles").select("id", { count: "exact", head: true }),
      adminClient.from("book_answers").select("id", { count: "exact", head: true }),
    ])

    const totalTemplates = templatesRes.count || 0
    const totalQuestions = questionsRes.count || 0
    const totalUsers = usersRes.count || 0
    const totalAnswers = answersRes.count || 0

    const { data: holdingsData } = await adminClient
      .from("organizations").select("id, name").eq("type", "holding").order("name")
    const holdings = (holdingsData || []).map((h: any) => ({ id: h.id, name: h.name }))

    const { data: companiesData } = await adminClient
      .from("companies").select("id, name, holding_id").order("name")
    const companies = (companiesData || []).map((c: any) => ({
      id: c.id, name: c.name, holding_id: c.holding_id,
    }))

    // Use RPC for pre-aggregated daily answer counts (efficient, bypasses RLS)
    const { data: dailyCounts } = await adminClient
      .rpc("get_daily_answer_counts_all", { p_days: 30 })

    // Build the last 30 days date list on the server (UTC) so client doesn't have timezone issues
    const last30Days: string[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      last30Days.push(d.toISOString().split("T")[0])
    }

    const dailyCountsData = (dailyCounts || []).map((row: any) => ({
      date: row.activity_date,
      company_id: row.company_id,
      count: Number(row.answer_count),
    }))

    const { data: assignmentsData } = await adminClient
      .from("book_assignments")
      .select("caderno_id, company_id")
      .not("company_id", "is", null)
      .limit(10000)

    const templateIds = [...new Set((assignmentsData || []).map((a: any) => a.caderno_id).filter(Boolean))]
    const questionCountMap = new Map<string, number>()
    if (templateIds.length > 0) {
      const { data: questionCounts } = await adminClient
        .rpc("get_template_question_counts", { p_template_ids: templateIds })
      if (questionCounts) {
        for (const row of questionCounts) {
          questionCountMap.set(row.template_id, Number(row.question_count))
        }
      }
    }

    const companyTemplates = new Map<string, Set<string>>()
    for (const assignment of assignmentsData || []) {
      const compId = assignment.company_id
      const templateId = assignment.caderno_id
      if (!compId || !templateId) continue
      if (!companyTemplates.has(compId)) companyTemplates.set(compId, new Set())
      companyTemplates.get(compId)!.add(templateId)
    }

    const allCompanyIds = [...new Set((assignmentsData || []).map((a: any) => a.company_id).filter(Boolean))]
    const allOrgIds = [...new Set(companies.map((c) => c.holding_id).filter(Boolean))]
    const answerCountsMap = new Map<string, number>()

    if (allCompanyIds.length > 0 || allOrgIds.length > 0) {
      const { data: answerCounts } = await adminClient
        .rpc("get_gestor_answer_counts", { p_company_ids: allCompanyIds, p_org_ids: allOrgIds, p_year: targetYear })
      if (answerCounts) {
        for (const row of answerCounts) {
          answerCountsMap.set(`${row.template_id}_${row.company_id}`, Number(row.answered_count))
        }
      }
    }

    const answerCountsEntries = Array.from(answerCountsMap.entries()) as [string, number][]
    const questionCountEntries = Array.from(questionCountMap.entries()) as [string, number][]
    const companyTemplatesEntries = Array.from(companyTemplates.entries()).map(
      ([compId, templateSet]) => [compId, Array.from(templateSet)] as [string, string[]]
    )

    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Painel administrativo do sistema GRI ESG
            </p>
          </div>
          <AdminDashboardClient
            holdings={holdings}
            companies={companies}
            answerCountsEntries={answerCountsEntries}
            questionCountEntries={questionCountEntries}
            companyTemplatesEntries={companyTemplatesEntries}
            dailyCountsData={dailyCountsData}
            last30Days={last30Days}
            totalTemplates={totalTemplates}
            totalQuestions={totalQuestions}
            totalUsers={totalUsers}
            totalAnswers={totalAnswers}
            initialYear={targetYear}
          />
        </div>
      </div>
    )
  }

  // ===== GESTOR: Scoped data =====
  const { data: memberships } = await adminClient
    .from("organization_members").select("organization_id").eq("user_id", profile.id)

  const holdingIds = [...new Set((memberships || []).map((m: any) => m.organization_id).filter(Boolean))]

  const { data: holdingsData } = await adminClient
    .from("organizations").select("id, name")
    .in("id", holdingIds.length > 0 ? holdingIds : ["__none__"])
    .eq("type", "holding").order("name")
  const holdings = (holdingsData || []).map((h: any) => ({ id: h.id, name: h.name }))

  const { data: companiesData } = await adminClient
    .from("companies").select("id, name, holding_id")
    .in("holding_id", holdingIds.length > 0 ? holdingIds : ["__none__"])
    .order("name")
  const companies = (companiesData || []).map((c: any) => ({
    id: c.id, name: c.name, holding_id: c.holding_id,
  }))
  const companyIds = companies.map((c) => c.id)

  const { data: assignmentsData } = await adminClient
    .from("book_assignments").select("caderno_id, company_id, user_id")
    .in("company_id", companyIds.length > 0 ? companyIds : ["__none__"])
    .limit(10000)
  const assignments = assignmentsData || []

  // Fetch template names for caderno detail
  const templateIds = [...new Set(assignments.map((a: any) => a.caderno_id).filter(Boolean))]
  const { data: templateNamesData } = await adminClient
    .from("book_templates").select("id, name")
    .in("id", templateIds.length > 0 ? templateIds : ["__none__"])
  const templateNameMap = new Map<string, string>()
  for (const t of templateNamesData || []) {
    templateNameMap.set(t.id, t.name)
  }
  const questionCountMap = new Map<string, number>()
  if (templateIds.length > 0) {
    const { data: questionCounts } = await adminClient
      .rpc("get_template_question_counts", { p_template_ids: templateIds })
    if (questionCounts) {
      for (const row of questionCounts) {
        questionCountMap.set(row.template_id, Number(row.question_count))
      }
    }
  }

  const answerCountsMap = new Map<string, number>()
  if (companyIds.length > 0 || holdingIds.length > 0) {
    const { data: answerCounts } = await adminClient
      .rpc("get_gestor_answer_counts", { p_company_ids: companyIds, p_org_ids: holdingIds, p_year: targetYear })
    if (answerCounts) {
      for (const row of answerCounts) {
        answerCountsMap.set(`${row.template_id}_${row.company_id}`, Number(row.answered_count))
      }
    }
  }

  const companyTemplates = new Map<string, Set<string>>()
  for (const assignment of assignments) {
    const compId = assignment.company_id
    const templateId = assignment.caderno_id
    if (!compId || !templateId) continue
    if (!companyTemplates.has(compId)) companyTemplates.set(compId, new Set())
    companyTemplates.get(compId)!.add(templateId)
  }

  // Use RPC for pre-aggregated daily answer counts (efficient, bypasses RLS)
  const { data: dailyCounts } = await adminClient
    .rpc("get_daily_answer_counts", { p_company_ids: companyIds.length > 0 ? companyIds : [], p_days: 30 })

  // Build the last 30 days date list on the server (UTC)
  const last30Days: string[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    last30Days.push(d.toISOString().split("T")[0])
  }

  const dailyCountsData = (dailyCounts || []).map((row: any) => ({
    date: row.activity_date,
    company_id: row.company_id,
    count: Number(row.answer_count),
  }))

  // Per-user progress
  const userIds = [...new Set(assignments.map((a: any) => a.user_id).filter(Boolean))]

  const { data: userProfiles } = await adminClient
    .from("profiles").select("id, full_name, email, role")
    .in("id", userIds.length > 0 ? userIds : ["__none__"])

  const profilesMap = new Map<string, { full_name: string; email: string; role: string }>()
  for (const p of userProfiles || []) {
    profilesMap.set(p.id, { full_name: p.full_name || "", email: p.email || "", role: p.role || "user" })
  }

  const userAnswerCounts = new Map<string, number>()
  // Also track per-user per-company per-template answered question IDs
  const userTemplateCadernoAnswers = new Map<string, Set<string>>()
  if (userIds.length > 0 && companyIds.length > 0) {
    const { data: rawAnswers } = await adminClient
      .from("book_answers").select("user_id, company_id, question_id, template_id")
      .in("company_id", companyIds).in("user_id", userIds).limit(50000)

    if (rawAnswers) {
      const distinctSets = new Map<string, Set<string>>()
      for (const row of rawAnswers) {
        const key = `${row.user_id}_${row.company_id}`
        if (!distinctSets.has(key)) distinctSets.set(key, new Set())
        distinctSets.get(key)!.add(row.question_id)

        // Track per-user per-company per-template
        if (row.template_id) {
          const tKey = `${row.user_id}_${row.company_id}_${row.template_id}`
          if (!userTemplateCadernoAnswers.has(tKey)) userTemplateCadernoAnswers.set(tKey, new Set())
          userTemplateCadernoAnswers.get(tKey)!.add(row.question_id)
        }
      }
      for (const [key, questionSet] of distinctSets) {
        userAnswerCounts.set(key, questionSet.size)
      }
    }
  }

  const userAssignments = new Map<string, Set<string>>()
  for (const a of assignments) {
    if (!a.user_id || !a.company_id) continue
    if (!userAssignments.has(a.user_id)) userAssignments.set(a.user_id, new Set())
    userAssignments.get(a.user_id)!.add(a.company_id)
  }

  const companyNameMap = new Map(companies.map((c) => [c.id, c.name]))
  const userProgressEntries: {
    userId: string; userName: string; userEmail: string
    companyId: string; companyName: string; answered: number; total: number
  }[] = []

  for (const [userId, companySet] of userAssignments) {
    const userProfile = profilesMap.get(userId)
    if (!userProfile) continue
    if (userId === profile.id) continue

    for (const companyId of companySet) {
      const templates = companyTemplates.get(companyId)
      if (!templates || templates.size === 0) continue
      let totalQ = 0
      for (const tid of templates) totalQ += questionCountMap.get(tid) || 0
      if (totalQ === 0) continue

      const answered = userAnswerCounts.get(`${userId}_${companyId}`) || 0
      userProgressEntries.push({
        userId, userName: userProfile.full_name || userProfile.email?.split("@")[0] || "Sem nome",
        userEmail: userProfile.email, companyId, companyName: companyNameMap.get(companyId) || "",
        answered: Math.min(answered, totalQ), total: totalQ,
      })
    }
  }

  // Build per-user per-company per-caderno detail entries
  const userCadernoDetailEntries: {
    userId: string; companyId: string; cadernoId: string; cadernoName: string
    answered: number; total: number
  }[] = []

  for (const [userId, companySet] of userAssignments) {
    const userProfile = profilesMap.get(userId)
    if (!userProfile) continue
    if (userId === profile.id) continue

    for (const companyId of companySet) {
      const cadernoIds = companyTemplates.get(companyId)
      if (!cadernoIds || cadernoIds.size === 0) continue

      for (const cadernoId of cadernoIds) {
        const totalQ = questionCountMap.get(cadernoId) || 0
        if (totalQ === 0) continue
        const answeredKey = `${userId}_${companyId}_${cadernoId}`
        const answeredQ = userTemplateCadernoAnswers.get(answeredKey)?.size || 0
        userCadernoDetailEntries.push({
          userId,
          companyId,
          cadernoId,
          cadernoName: templateNameMap.get(cadernoId) || cadernoId,
          answered: Math.min(answeredQ, totalQ),
          total: totalQ,
        })
      }
    }
  }

  const totalUsers = userIds.length
  const totalAnswers = [...answerCountsMap.values()].reduce((sum, v) => sum + v, 0)

  const answerCountsEntries = Array.from(answerCountsMap.entries()) as [string, number][]
  const questionCountEntries = Array.from(questionCountMap.entries()) as [string, number][]
  const companyTemplatesEntries = Array.from(companyTemplates.entries()).map(
    ([compId, templateSet]) => [compId, Array.from(templateSet)] as [string, string[]]
  )

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Acompanhe o progresso das empresas e usuarios sob sua gestao
          </p>
        </div>
        <GestorDashboardClient
          holdings={holdings}
          companies={companies}
          answerCountsEntries={answerCountsEntries}
          questionCountEntries={questionCountEntries}
          companyTemplatesEntries={companyTemplatesEntries}
          dailyCountsData={dailyCountsData}
          last30Days={last30Days}
          userProgressEntries={userProgressEntries}
          userCadernoDetailEntries={userCadernoDetailEntries}
          totalUsers={totalUsers}
          totalAnswers={totalAnswers}
          initialYear={targetYear}
        />
      </div>
    </div>
  )
}
