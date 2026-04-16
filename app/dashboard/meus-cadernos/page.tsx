import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BookOpen, FileText, CheckCircle2, Clock, AlertCircle, AlertTriangle, Building2, ChevronRight } from "lucide-react"
import { MeusCadernosClient } from "@/components/cadernos/meus-cadernos-client"
import { DemoDashboard } from "@/components/demo-dashboard"
import { DEMO_USER } from "@/lib/demo-mode"
import { YearFilter } from "@/components/ui/year-filter"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function MeusCadernosPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>
}) {
  const resolvedParams = await searchParams
  const yearParam = resolvedParams?.year
  const targetYear = yearParam ? parseInt(yearParam) : new Date().getFullYear()
  // Check for demo mode
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  if (!hasSupabaseConfig) {
    return <DemoDashboard userName={DEMO_USER.full_name} />
  }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Middleware already verified auth, so we can safely get user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Fetch profile by user ID (not email)
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    console.error("[v0] Error fetching profile:", profileError)
    redirect("/auth/login")
  }

  // Fetch assignments
  const { data: assignmentsData, error: assignmentsError } = await adminClient
    .from("book_assignments")
    .select("caderno_id, organization_id, company_id, role")
    .eq("user_id", profile.id)

  if (assignmentsError) {
    console.error("[v0] Error fetching assignments:", assignmentsError)
  }

  const assignments = assignmentsData || []

  // Check if user is a gestor (has any role that includes 'gestor' or 'admin')
  const isGestor = profile.role === "holding_admin" ||
    profile.role === "company_admin" ||
    profile.role === "admin_main" ||
    profile.role === "admin"

  // Use RPC to get answer counts (bypasses PostgREST 1000-row limit)
  let answerCountsMap = new Map<string, number>() // key: `${template_id}_${company_id}` -> count
  try {
    const companyIds = [...new Set(assignments.map((a: any) => a.company_id).filter(Boolean))]
    const orgIds = [...new Set(assignments.map((a: any) => a.organization_id).filter(Boolean))]

    if (companyIds.length > 0 || orgIds.length > 0) {
      const { data: counts, error: countsError } = await adminClient
        .rpc("get_gestor_answer_counts", {
          p_company_ids: companyIds,
          p_org_ids: orgIds,
          p_year: targetYear,
        })

      if (countsError) {
        console.error("Error fetching answer counts via RPC:", countsError)
      } else if (counts) {
        for (const row of counts) {
          const key = `${row.template_id}_${row.company_id}`
          answerCountsMap.set(key, row.answered_count)
        }
      }
    }
  } catch (error) {
    console.error("Exception fetching answer counts:", error)
  }

  // Get unique caderno IDs
  const cadernoIds = [...new Set(assignments.map((a) => a.caderno_id))]

  let templates: any[] = []
  let organizations: any[] = []
  let holdings: any[] = []
  let companies: any[] = []
  let orgsWithNullType: any[] = []

  if (cadernoIds.length > 0) {
    const orgIds = [...new Set(assignments.map((a) => a.organization_id).filter(Boolean))]

    try {
      // Fetch templates
      const { data: templatesData, error: templatesError } = await adminClient
        .from("book_templates")
        .select("*")
        .in("id", cadernoIds)

      if (templatesError) {
        console.error("[v0] Error fetching templates:", templatesError)
      }
      templates = templatesData || []

      // Fetch organizations if we have org IDs
      if (orgIds.length > 0) {
        const { data: organizationsData, error: orgsError } = await adminClient
          .from("organizations")
          .select("*")
          .in("id", orgIds)

        if (orgsError) {
          console.error("[v0] Error fetching organizations:", orgsError)
        }
        organizations = organizationsData || []

        // Fetch companies from the companies table
        const { data: companiesData, error: companiesError } = await adminClient
          .from("companies")
          .select("*")
          .in("holding_id", orgIds)

        if (companiesError) {
          console.error("[v0] Error fetching companies:", companiesError)
        }
        companies = companiesData || []
      }
    } catch (error) {
      console.error("[v0] Exception fetching data:", error)
      templates = []
      organizations = []
      companies = []
    }

    // Separate holdings and organizations with null type
    holdings = organizations.filter((o) => o.type === "holding")
    orgsWithNullType = organizations.filter((o) => o.type === null || o.type === undefined)

    // Merge companies into organizations with type='company'
    const companiesAsOrgs = companies.map((company: any) => ({
      id: company.id,
      name: company.name,
      type: "company",
      cnpj: company.cnpj,
      holding_id: company.holding_id,
      created_at: company.created_at,
    }))

    organizations = [...organizations, ...companiesAsOrgs]

    console.log("[v0] Fetched organizations:", organizations.length)
    console.log("[v0] Fetched companies from companies table:", companies.length)
  }

  // Build cadernos list with progress
  // Each combination of (template_id, organization_id) is a unique caderno
  const cadernosMap = new Map<
    string,
    {
      id: string
      name: string
      description: string | null
      organization: any
      organization_id: string
      company_id?: string | null
      questionsCount: number
      answeredCount: number
      needsCorrection: number
      status: "pending" | "in_progress" | "completed"
    }
  >()

  for (const assignment of assignments) {
    const template = templates.find((t) => t.id === assignment.caderno_id)
    if (template) {
      // Create unique key: template_id + company_id (or organization_id if no company)
      const companyId = (assignment as any).company_id
      const uniqueKey = `${template.id}_${companyId || assignment.organization_id}`

      if (!cadernosMap.has(uniqueKey)) {
        const org = organizations.find((o) => o.id === assignment.organization_id)
        cadernosMap.set(uniqueKey, {
          id: template.id,
          name: template.name,
          description: template.description,
          organization: org,
          organization_id: assignment.organization_id,
          company_id: companyId,
          questionsCount: 0,
          answeredCount: 0,
          needsCorrection: 0,
          status: "pending",
        })
      }
    }
  }

  // Get unique template IDs for question count queries
  const uniqueTemplateIds = [...new Set(Array.from(cadernosMap.values()).map(c => c.id))]

  // Fetch question counts for all templates
  const questionCountMap = new Map<string, number>()

  try {
    const validTemplateIds = uniqueTemplateIds.filter(Boolean)
    if (validTemplateIds.length > 0) {
      // Optimized bulk fetch - Fetch all junctions for these templates and count them in memory
      // This is much faster than sequential requests for each template
      const { data: counts, error: countsError } = await adminClient
        .rpc("get_template_question_counts", {
          p_template_ids: validTemplateIds,
        })

      if (countsError) {
        console.error("[v0] Error fetching RPC question counts:", countsError)
      } else if (counts) {
        counts.forEach((row: any) => {
          questionCountMap.set(row.template_id, Number(row.question_count))
        })
      }
    }
  } catch (error) {
    console.error("[v0] Exception fetching question counts:", error)
  }



  // Update cadernos with question counts and answers (per company)
  for (const [uniqueKey, caderno] of cadernosMap) {
    const questionCount = questionCountMap.get(caderno.id) || 0

    // Get count from RPC result
    const countKey = `${caderno.id}_${caderno.company_id}`
    const answeredCount = caderno.company_id ? (answerCountsMap.get(countKey) || 0) : 0

    caderno.questionsCount = questionCount
    caderno.answeredCount = answeredCount
    caderno.needsCorrection = 0 // TODO: Add correction count RPC if needed

    // Status based on answered count vs total questions
    if (caderno.answeredCount === 0) {
      caderno.status = "pending"
    } else if (caderno.answeredCount >= caderno.questionsCount && caderno.questionsCount > 0) {
      caderno.status = "completed"
    } else {
      caderno.status = "in_progress"
    }
  }

  const cadernos = Array.from(cadernosMap.values())

  // Build hierarchy: holding -> companies/direct cadernos
  const holdingsWithCompanies = holdings.map((holding) => {
    const companiesInHolding = companies.filter((company) => company.holding_id === holding.id)

    // Cadernos assigned directly to the holding (not through a company)
    // These are cadernos where organization_id = holding.id AND company_id is null
    const directCadernos = cadernos.filter((caderno) =>
      caderno.organization_id === holding.id && !caderno.company_id
    )

    const companiesWithCadernos = companiesInHolding.map((company) => {
      // Filter cadernos that are assigned to this specific company
      const companyCadernos = cadernos.filter((caderno) =>
        caderno.company_id === company.id
      )

      // For holding-level cadernos, create company-specific instances with correct answer counts
      const holdingCadernosForCompany = directCadernos.map((holdingCaderno) => {
        const questionCount = questionCountMap.get(holdingCaderno.id) || 0

        // Get count from RPC result for this company
        const countKey = `${holdingCaderno.id}_${company.id}`
        const answeredCount = answerCountsMap.get(countKey) || 0

        let status: "pending" | "in_progress" | "completed" = "pending"
        if (answeredCount === 0) {
          status = "pending"
        } else if (answeredCount >= questionCount && questionCount > 0) {
          status = "completed"
        } else {
          status = "in_progress"
        }

        return {
          ...holdingCaderno,
          company_id: company.id, // Override with company ID
          questionsCount: questionCount,
          answeredCount: answeredCount,
          needsCorrection: 0, // TODO: Add correction count RPC if needed
          status: status,
        }
      })

      const cadernosForCompany = [...companyCadernos, ...holdingCadernosForCompany]

      return {
        ...company,
        cadernos: cadernosForCompany,
        totalCadernos: cadernosForCompany.length,
        completedCadernos: cadernosForCompany.filter((c) => c.status === "completed").length,
        inProgressCadernos: cadernosForCompany.filter((c) => c.status === "in_progress").length,
        pendingCadernos: cadernosForCompany.filter((c) => c.status === "pending").length,
        needsCorrection: cadernosForCompany.reduce((sum, c) => sum + c.needsCorrection, 0),
      }
    })

    // Calculate totals including direct cadernos
    const companyTotals = companiesWithCadernos.reduce(
      (acc, c) => ({
        total: acc.total + c.totalCadernos,
        completed: acc.completed + c.completedCadernos,
        inProgress: acc.inProgress + c.inProgressCadernos,
        pending: acc.pending + c.pendingCadernos,
        corrections: acc.corrections + c.needsCorrection,
      }),
      { total: 0, completed: 0, inProgress: 0, pending: 0, corrections: 0 }
    )

    return {
      ...holding,
      companies: companiesWithCadernos,
      directCadernos: directCadernos,
      hasDirectCadernos: directCadernos.length > 0,
      totalCadernos: companyTotals.total + directCadernos.length,
      completedCadernos: companyTotals.completed + directCadernos.filter((c) => c.status === "completed").length,
      inProgressCadernos: companyTotals.inProgress + directCadernos.filter((c) => c.status === "in_progress").length,
      pendingCadernos: companyTotals.pending + directCadernos.filter((c) => c.status === "pending").length,
      needsCorrection: companyTotals.corrections + directCadernos.reduce((sum, c) => sum + c.needsCorrection, 0),
    }
  })

  // Handle organizations with null type as standalone holdings (legacy/other orgs)
  const standaloneOrgs = orgsWithNullType.map((org) => {
    const orgCadernos = cadernos.filter((caderno) => caderno.organization_id === org.id)

    return {
      ...org,
      type: "standalone" as const,
      companies: [] as any[],
      directCadernos: orgCadernos,
      hasDirectCadernos: orgCadernos.length > 0,
      totalCadernos: orgCadernos.length,
      completedCadernos: orgCadernos.filter((c) => c.status === "completed").length,
      inProgressCadernos: orgCadernos.filter((c) => c.status === "in_progress").length,
      pendingCadernos: orgCadernos.filter((c) => c.status === "pending").length,
      needsCorrection: orgCadernos.reduce((sum, c) => sum + c.needsCorrection, 0),
    }
  }).filter((org) => org.totalCadernos > 0) // Only show if has cadernos

  // Combine holdings and standalone orgs
  const allHoldingsAndOrgs = [...holdingsWithCompanies, ...standaloneOrgs]



  // Calculate totals from allHoldingsAndOrgs to include all company-level cadernos
  // (including holding-level cadernos expanded per company)
  const totalCadernos = allHoldingsAndOrgs.reduce((sum, h) => sum + h.totalCadernos, 0)
  const completedCadernos = allHoldingsAndOrgs.reduce((sum, h) => sum + h.completedCadernos, 0)
  const inProgressCadernos = allHoldingsAndOrgs.reduce((sum, h) => sum + h.inProgressCadernos, 0)
  const pendingCadernos = allHoldingsAndOrgs.reduce((sum, h) => sum + h.pendingCadernos, 0)
  const totalNeedsCorrection = allHoldingsAndOrgs.reduce((sum, h) => sum + h.needsCorrection, 0)
  const allCadernosFlat = allHoldingsAndOrgs.flatMap((h) => [
    ...h.companies.flatMap((c: any) => c.cadernos),
    ...(h.directCadernos || []),
  ])
  const cadernosWithCorrections = allCadernosFlat.filter((c: any) => c.needsCorrection > 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Meus Cadernos</span>
            </div>
            <YearFilter initialYear={targetYear} />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Olá, {profile.full_name || profile.email}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Aqui estão os cadernos atribuídos a você para preenchimento
          </p>
        </div>

        {/* Correction Alert - Destacado */}
        {totalNeedsCorrection > 0 && (
          <Alert className="mb-8 border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-amber-100 dark:border-amber-600 dark:from-amber-950/50 dark:to-amber-900/50 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 dark:bg-amber-600">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <AlertTitle className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-2">
                  ⚠️ Atenção: Você tem {totalNeedsCorrection} {totalNeedsCorrection === 1 ? "questão" : "questões"} para corrigir!
                </AlertTitle>
                <AlertDescription className="text-base text-amber-800 dark:text-amber-300">
                  {totalNeedsCorrection === 1 ? "Existe" : "Existem"} {totalNeedsCorrection}{" "}
                  {totalNeedsCorrection === 1 ? "questão que precisa" : "questões que precisam"} de correção em{" "}
                  {cadernosWithCorrections.length} {cadernosWithCorrections.length === 1 ? "caderno" : "cadernos"}.
                  <br />
                  <span className="font-semibold mt-1 inline-block">
                    📋 Clique nos cadernos marcados com o ícone amarelo abaixo para revisar e corrigir as respostas.
                  </span>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 md:grid-cols-4">
          <Card className="border-border/50 bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Cadernos</p>
                  <p className="mt-2 text-3xl font-bold text-foreground">{totalCadernos}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Concluídos</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{completedCadernos}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Em Progresso</p>
                  <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{inProgressCadernos}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                  <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">{pendingCadernos}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Holdings → Empresas → Cadernos Hierarchy with Search */}
        <MeusCadernosClient allHoldingsAndOrgs={allHoldingsAndOrgs} />
      </div>
    </div>
  )
}
