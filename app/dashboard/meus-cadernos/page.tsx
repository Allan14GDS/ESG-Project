import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BookOpen, Building2, ChevronRight, FileText, CheckCircle2, Clock, AlertCircle, AlertTriangle } from "lucide-react"
import Link from "next/link"

export default async function MeusCadernosPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Middleware already verified auth, so we can safely get user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Fetch profile
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("email", user.email)
    .single()

  if (profileError || !profile) {
    redirect("/auth/login")
  }

  const [assignmentsResult, templatesResult, organizationsResult, answersResult] = await Promise.allSettled([
    adminClient
      .from("book_assignments")
      .select("caderno_id, organization_id, company_id, role")
      .eq("user_id", profile.id)
      .then((res) => res.data || []),
    Promise.resolve([]), // Will be populated after we get assignments
    Promise.resolve([]), // Will be populated after we get assignments
    adminClient
      .from("book_answers")
      .select("template_id, question_id, status, company_id")
      .eq("user_id", profile.id)
      .then((res) => res.data || []),
  ])

  const assignments = assignmentsResult.status === "fulfilled" ? assignmentsResult.value : []
  const answers = answersResult.status === "fulfilled" ? answersResult.value : []

  // Get unique caderno IDs
  const cadernoIds = [...new Set(assignments.map((a) => a.caderno_id))]

  let templates: any[] = []
  let organizations: any[] = []
  let holdings: any[] = []
  let companies: any[] = []
  let orgsWithNullType: any[] = []

  if (cadernoIds.length > 0) {
    const orgIds = [...new Set(assignments.map((a) => a.organization_id).filter(Boolean))]

    const [templatesResult2, organizationsResult2, companiesResult] = await Promise.allSettled([
      adminClient
        .from("book_templates")
        .select("*")
        .in("id", cadernoIds)
        .then((res) => res.data || []),
      orgIds.length > 0
        ? adminClient
            .from("organizations")
            .select("*")
            .in("id", orgIds)
            .then((res) => res.data || [])
        : Promise.resolve([]),
      // Also fetch companies from the companies table
      orgIds.length > 0
        ? adminClient
            .from("companies")
            .select("*")
            .in("holding_id", orgIds)
            .then((res) => res.data || [])
        : Promise.resolve([]),
    ])

    templates = templatesResult2.status === "fulfilled" ? templatesResult2.value : []
    organizations = organizationsResult2.status === "fulfilled" ? organizationsResult2.value : []
    companies = companiesResult.status === "fulfilled" ? companiesResult.value : []

    // Separate holdings and organizations with null type
    holdings = organizations.filter((o) => o.type === "holding")
    orgsWithNullType = organizations.filter((o) => o.type === null || o.type === undefined)

    const companiesFromTable = companiesResult.status === "fulfilled" ? companiesResult.value : []

    // Merge companies into organizations with type='company'
    const companiesAsOrgs = companiesFromTable.map((company: any) => ({
      id: company.id,
      name: company.name,
      type: "company",
      cnpj: company.cnpj,
      holding_id: company.holding_id,
      created_at: company.created_at,
    }))

    organizations = [...organizations, ...companiesAsOrgs]

    console.log("[v0] Fetched organizations:", organizations.length)
    console.log("[v0] Fetched companies from companies table:", companiesFromTable.length)
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

  const questionCountPromises = uniqueTemplateIds.map((templateId) =>
    adminClient
      .from("book_question_junction")
      .select("*", { count: "exact", head: true })
      .eq("book_template_id", templateId)
      .then((res) => ({ templateId, count: res.count || 0 }))
      .catch(() => ({ templateId, count: 0 })),
  )

  const questionCounts = await Promise.allSettled(questionCountPromises)

  // Create a map of templateId -> questionCount
  const questionCountMap = new Map<string, number>()
  for (const result of questionCounts) {
    if (result.status === "fulfilled") {
      const { templateId, count } = result.value
      questionCountMap.set(templateId, count)
    }
  }

  // Update cadernos with question counts and answers (per company)
  for (const [uniqueKey, caderno] of cadernosMap) {
    const questionCount = questionCountMap.get(caderno.id) || 0

    // Filter answers for this specific template AND company
    // Need to match by company_id (not organization_id which is the holding)
    const answeredForCaderno = answers.filter((a) => {
      if (a.template_id !== caderno.id) return false
      
      // If caderno has company_id, match by company_id
      if (caderno.company_id) {
        return a.company_id === caderno.company_id
      }
      
      // If no company_id (direct to holding), match by organization_id
      return a.company_id === caderno.organization_id || (!a.company_id && !caderno.company_id)
    })

    const uniqueAnsweredQuestions = new Set(answeredForCaderno.map((a) => a.question_id))

    // Count questions that need correction (rejected or pending revision)
    const needsCorrectionCount = answeredForCaderno.filter((a) =>
      a.status === "rejeitado" || a.status === "pendente_revisao"
    ).length

    caderno.questionsCount = questionCount
    caderno.answeredCount = uniqueAnsweredQuestions.size
    caderno.needsCorrection = needsCorrectionCount

    if (caderno.answeredCount === 0) {
      caderno.status = "pending"
    } else if (caderno.answeredCount >= caderno.questionsCount) {
      caderno.status = "completed"
    } else {
      caderno.status = "in_progress"
    }
  }

  const cadernos = Array.from(cadernosMap.values())

  console.log("[v0] Total organizations:", organizations.length)
  console.log("[v0] Organizations:", organizations.map(o => ({ id: o.id, name: o.name, type: o.type, holding_id: o.holding_id })))
  console.log("[v0] Total cadernos:", cadernos.length)
  console.log("[v0] Cadernos with company_id:", cadernos.filter(c => c.company_id).length)
  console.log("[v0] Cadernos without company_id:", cadernos.filter(c => !c.company_id).length)
  console.log("[v0] Sample caderno:", cadernos[0])
  console.log("[v0] Holdings:", holdings.length)
  console.log("[v0] Companies:", companies.length)
  console.log("[v0] Standalone orgs:", orgsWithNullType.length)

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
      const cadernosForCompany = cadernos.filter((caderno) => caderno.company_id === company.id)

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

        {/* Holdings → Empresas → Cadernos Hierarchy */}
        <div className="space-y-6">
          {allHoldingsAndOrgs.length === 0 ? (
            <Card className="border-border/50 bg-card">
              <CardContent className="p-0">
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum caderno atribuído</h3>
                  <p className="text-muted-foreground max-w-md">
                    Você ainda não tem cadernos atribuídos para preenchimento. Entre em contato com seu gestor para
                    solicitar acesso aos cadernos.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            allHoldingsAndOrgs.map((holding) => (
              <Card key={holding.id} className="border-border/50 bg-card overflow-hidden">
                {/* Holding Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border/50 px-8 py-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/20 border-2 border-primary/30">
                        <Building2 className="h-7 w-7 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-foreground">{holding.name}</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                          {holding.type === "holding"
                            ? `${holding.companies.length} ${holding.companies.length === 1 ? "empresa" : "empresas"}`
                            : "Organização"
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="text-center px-4 py-2 rounded-lg bg-background/50">
                        <p className="text-2xl font-bold text-foreground">{holding.totalCadernos}</p>
                        <p className="text-xs text-muted-foreground">Cadernos</p>
                      </div>
                      <div className="text-center px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{holding.completedCadernos}</p>
                        <p className="text-xs text-muted-foreground">Concluídos</p>
                      </div>
                      {holding.needsCorrection > 0 && (
                        <div className="text-center px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{holding.needsCorrection}</p>
                          <p className="text-xs text-muted-foreground">Correções</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Companies within Holding or Direct Cadernos */}
                <CardContent className="p-6 space-y-4">
                  {/* Show direct cadernos for holdings without companies or standalone orgs */}
                  {holding.hasDirectCadernos && (
                    <Card className="border-border/50 bg-muted/30">
                      <div className="border-b border-border/50 px-6 py-4 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">Cadernos Diretos</h3>
                              <p className="text-xs text-muted-foreground">Atribuídos diretamente à organização</p>
                            </div>
                          </div>
                          <Badge variant="outline" className="font-medium">
                            {holding.directCadernos.length} {holding.directCadernos.length === 1 ? "caderno" : "cadernos"}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-0">
                        <div className="divide-y divide-border/50">
                          {holding.directCadernos.map((caderno: any) => (
                            <Link
                              key={`${caderno.id}_${caderno.company_id || caderno.organization_id}`}
                              href={`/dashboard/questionnaire/${caderno.id}?company=${caderno.company_id || caderno.organization_id}`}
                              className="flex items-center justify-between p-4 hover:bg-background/50 transition-colors group"
                            >
                              <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                    {caderno.name}
                                  </h4>
                                  {caderno.description && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{caderno.description}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1.5">
                                    {caderno.needsCorrection > 0 && (
                                      <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {caderno.needsCorrection} {caderno.needsCorrection === 1 ? "correção" : "correções"}
                                      </Badge>
                                    )}
                                    <Badge
                                      variant={
                                        caderno.status === "completed"
                                          ? "default"
                                          : caderno.status === "in_progress"
                                            ? "secondary"
                                            : "outline"
                                      }
                                      className={
                                        caderno.status === "completed"
                                          ? "text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                          : caderno.status === "in_progress"
                                            ? "text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                            : "text-xs"
                                      }
                                    >
                                      {caderno.status === "completed"
                                        ? "Concluído"
                                        : caderno.status === "in_progress"
                                          ? "Em Progresso"
                                          : "Pendente"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-foreground">
                                    {caderno.answeredCount}/{caderno.questionsCount}
                                  </p>
                                  <p className="text-xs text-muted-foreground">questões</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Companies with their cadernos */}
                  {holding.companies.map((company: any) => (
                    <Card key={company.id} className="border-border/50 bg-muted/30">
                      {/* Company Header */}
                      <div className="border-b border-border/50 px-6 py-4 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background border border-border/50">
                              <Building2 className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground">{company.name}</h3>
                              {company.cnpj && (
                                <p className="text-xs text-muted-foreground">CNPJ: {company.cnpj}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="font-medium">
                              {company.totalCadernos} {company.totalCadernos === 1 ? "caderno" : "cadernos"}
                            </Badge>
                            {company.completedCadernos > 0 && (
                              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                {company.completedCadernos} {company.completedCadernos === 1 ? "concluído" : "concluídos"}
                              </Badge>
                            )}
                            {company.needsCorrection > 0 && (
                              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                {company.needsCorrection}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Cadernos for this Company */}
                      <CardContent className="p-0">
                        {company.cadernos.length === 0 ? (
                          <div className="py-8 text-center">
                            <p className="text-sm text-muted-foreground">Nenhum caderno atribuído</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-border/50">
                            {company.cadernos.map((caderno: any) => (
                              <Link
                                key={`${caderno.id}_${caderno.company_id || caderno.organization_id}`}
                                href={`/dashboard/questionnaire/${caderno.id}?company=${caderno.company_id || company.id}`}
                                className="flex items-center justify-between p-4 hover:bg-background/50 transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                    <FileText className="h-5 w-5 text-primary" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                      {caderno.name}
                                    </h4>
                                    {caderno.description && (
                                      <p className="text-xs text-muted-foreground mt-0.5">{caderno.description}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1.5">
                                      {caderno.needsCorrection > 0 && (
                                        <Badge className="text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800">
                                          <AlertTriangle className="h-3 w-3 mr-1" />
                                          {caderno.needsCorrection} {caderno.needsCorrection === 1 ? "correção" : "correções"}
                                        </Badge>
                                      )}
                                      <Badge
                                        variant={
                                          caderno.status === "completed"
                                            ? "default"
                                            : caderno.status === "in_progress"
                                              ? "secondary"
                                              : "outline"
                                        }
                                        className={
                                          caderno.status === "completed"
                                            ? "text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                            : caderno.status === "in_progress"
                                              ? "text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                              : "text-xs"
                                        }
                                      >
                                        {caderno.status === "completed"
                                          ? "Concluído"
                                          : caderno.status === "in_progress"
                                            ? "Em Progresso"
                                            : "Pendente"}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-sm font-semibold text-foreground">
                                      {caderno.answeredCount}/{caderno.questionsCount}
                                    </p>
                                    <p className="text-xs text-muted-foreground">questões</p>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
