import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BookOpen, FileText, CheckCircle2, Clock, AlertCircle, AlertTriangle, Building2, ChevronRight } from "lucide-react"
import { MeusCadernosClient } from "@/components/cadernos/meus-cadernos-client"

export default async function MeusCadernosPage() {
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
  
  // Fetch answers based on user type
  let answers: any[] = []
  try {
    if (isGestor) {
      // Gestores see ALL answers for companies/holdings they manage
      const companyIds = [...new Set(assignments.map((a: any) => a.company_id).filter(Boolean))]
      const orgIds = [...new Set(assignments.map((a: any) => a.organization_id).filter(Boolean))]
      
      if (companyIds.length > 0 || orgIds.length > 0) {
        const { data: allAnswers, error: answersError } = await adminClient
          .from("book_answers")
          .select("template_id, question_id, status, company_id, holding_id, user_id")
          .or(`company_id.in.(${companyIds.join(",")}),holding_id.in.(${orgIds.join(",")})`)
        
        if (answersError) {
          console.error("[v0] Error fetching answers:", answersError)
        }
        
        answers = allAnswers || []
      }
    } else {
      // Regular users only see their own answers
      const { data: userAnswers, error: answersError } = await adminClient
        .from("book_answers")
        .select("template_id, question_id, status, company_id, holding_id")
        .eq("user_id", profile.id)
      
      if (answersError) {
        console.error("[v0] Error fetching user answers:", answersError)
      }
      
      answers = userAnswers || []
    }
    

  } catch (error) {
    console.error("[v0] Exception fetching answers:", error)
    answers = []
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
    const questionCountPromises = uniqueTemplateIds.map(async (templateId) => {
      try {
        const { count, error } = await adminClient
          .from("book_question_junction")
          .select("*", { count: "exact", head: true })
          .eq("book_template_id", templateId)
        
        if (error) {
          console.error(`[v0] Error counting questions for template ${templateId}:`, error)
          return { templateId, count: 0 }
        }
        
        return { templateId, count: count || 0 }
      } catch (error) {
        console.error(`[v0] Exception counting questions for template ${templateId}:`, error)
        return { templateId, count: 0 }
      }
    })

    const questionCounts = await Promise.all(questionCountPromises)
    
    // Populate the map
    for (const { templateId, count } of questionCounts) {
      questionCountMap.set(templateId, count)
    }
  } catch (error) {
    console.error("[v0] Exception fetching question counts:", error)
  }



  // Update cadernos with question counts and answers (per company)
  for (const [uniqueKey, caderno] of cadernosMap) {
    const questionCount = questionCountMap.get(caderno.id) || 0

    // Filter answers for this specific template AND company
    // IMPORTANT: Each company has its own set of answers for the same template
    // We must filter by company_id to count answers specific to this company
    const answeredForCaderno = answers.filter((a: any) => {
      if (a.template_id !== caderno.id) return false
      
      console.log(`[v0] Checking answer for caderno ${caderno.name}:`, {
        answerCompanyId: a.company_id,
        answerHoldingId: a.holding_id,
        cadernoCompanyId: caderno.company_id,
        cadernoOrgId: caderno.organization_id,
        questionId: a.question_id
      })
      
      // If caderno has company_id (assigned to specific company)
      if (caderno.company_id) {
        // STRICT MATCH: Only count answers that have the exact same company_id
        // This ensures we don't mix answers from different companies
        const match = a.company_id === caderno.company_id
        console.log(`[v0] Caderno has company_id, match: ${match}`)
        return match
      }
      
      // If no company_id (direct to holding), match answers for that holding
      // Accept answers with matching holding_id (regardless of whether answer has company_id or not)
      const match = a.holding_id === caderno.organization_id
      console.log(`[v0] Caderno is direct to holding, match: ${match}`)
      return match
    })

    // Count unique questions answered for this specific company
    const uniqueAnsweredQuestions = new Set(answeredForCaderno.map((a) => a.question_id))

    // Count questions that need correction (rejected or pending revision)
    const needsCorrectionCount = answeredForCaderno.filter((a) =>
      a.status === "rejeitado" || a.status === "pendente_revisao"
    ).length

    caderno.questionsCount = questionCount
    caderno.answeredCount = uniqueAnsweredQuestions.size
    caderno.needsCorrection = needsCorrectionCount

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
      // Also include directCadernos (holding-level) that should be visible to all companies
      const cadernosForCompany = cadernos.filter((caderno) => 
        caderno.company_id === company.id ||
        (caderno.organization_id === holding.id && !caderno.company_id)
      )

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

  const totalCadernos = cadernos.length
  const completedCadernos = cadernos.filter((c) => c.status === "completed").length
  const inProgressCadernos = cadernos.filter((c) => c.status === "in_progress").length
  const pendingCadernos = cadernos.filter((c) => c.status === "pending").length
  const totalNeedsCorrection = cadernos.reduce((sum, c) => sum + c.needsCorrection, 0)
  const cadernosWithCorrections = cadernos.filter((c) => c.needsCorrection > 0)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Meus Cadernos</span>
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
