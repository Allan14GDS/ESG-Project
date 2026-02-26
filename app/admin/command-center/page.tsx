import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  BookOpen,
  HelpCircle,
  Building2,
  TrendingUp,
  UserPlus,
  Database,
} from "lucide-react"
import Link from "next/link"
import { requireGestor } from "@/lib/auth-utils"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function CommandCenterPage() {
  const profile = await requireGestor()
  const isAdmin = profile.role === "admin_main"

  const adminClient = createAdminClient()

  let totalCompanies = 0
  let totalHoldings = 0
  let totalTemplates = 0
  let totalQuestions = 0
  let totalUsers = 0
  let totalAnswers = 0
  let answersLast7Days = 0

  if (isAdmin) {
    // Admin: global stats
    const [
      templatesRes,
      questionsRes,
      usersRes,
      companiesRes,
      holdingsRes,
      answersRes,
    ] = await Promise.all([
      adminClient.from("book_templates").select("id", { count: "exact", head: true }),
      adminClient.from("book_questions").select("id", { count: "exact", head: true }),
      adminClient.from("profiles").select("id", { count: "exact", head: true }),
      adminClient.from("companies").select("id", { count: "exact", head: true }),
      adminClient.from("organizations").select("id", { count: "exact", head: true }).eq("type", "holding"),
      adminClient.from("book_answers").select("id", { count: "exact", head: true }),
    ])

    totalTemplates = templatesRes.count || 0
    totalQuestions = questionsRes.count || 0
    totalUsers = usersRes.count || 0
    totalCompanies = companiesRes.count || 0
    totalHoldings = holdingsRes.count || 0
    totalAnswers = answersRes.count || 0

    // Last 7 days answers
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const { count: recentCount } = await adminClient
      .from("book_answers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString())
    answersLast7Days = recentCount || 0
  } else {
    // Gestor: scoped stats
    const { data: memberships } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", profile.id)

    const holdingIds = [...new Set((memberships || []).map((m) => m.organization_id).filter(Boolean))]
    totalHoldings = holdingIds.length

    if (holdingIds.length > 0) {
      const { data: companiesData } = await adminClient
        .from("companies")
        .select("id")
        .in("holding_id", holdingIds)
      const companyIds = (companiesData || []).map((c) => c.id)
      totalCompanies = companyIds.length

      const [templatesRes, questionsRes, answersRes] = await Promise.all([
        adminClient.from("book_templates").select("id", { count: "exact", head: true }),
        adminClient.from("book_questions").select("id", { count: "exact", head: true }),
        companyIds.length > 0
          ? adminClient.from("book_answers").select("id", { count: "exact", head: true }).in("company_id", companyIds)
          : Promise.resolve({ count: 0 }),
      ])

      totalTemplates = templatesRes.count || 0
      totalQuestions = questionsRes.count || 0
      totalAnswers = (answersRes as any).count || 0

      // Users assigned to these companies
      if (companyIds.length > 0) {
        const { data: assignments } = await adminClient
          .from("book_assignments")
          .select("user_id")
          .in("company_id", companyIds)
          .limit(10000)
        const userIds = [...new Set((assignments || []).map((a: any) => a.user_id).filter(Boolean))]
        totalUsers = userIds.length
      }

      // Last 7 days answers
      if (companyIds.length > 0) {
        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
        const { count: recentCount } = await adminClient
          .from("book_answers")
          .select("id", { count: "exact", head: true })
          .in("company_id", companyIds)
          .gte("created_at", sevenDaysAgo.toISOString())
        answersLast7Days = recentCount || 0
      }
    }
  }

  const quickActions = [
    {
      label: "Gerenciar Holdings",
      href: "/admin/holdings",
      icon: Building2,
      description: "Gerenciar holdings e empresas",
    },
    {
      label: "Gerenciar Cadernos",
      href: "/admin/templates",
      icon: BookOpen,
      description: "Gerenciar templates de cadernos",
    },
    {
      label: "Gerenciar Questoes",
      href: "/admin/questions",
      icon: HelpCircle,
      description: "Gerenciar questoes e suas atribuicoes",
    },
    {
      label: "Gerenciar Usuarios",
      href: "/admin/users",
      icon: UserPlus,
      description: "Convidar e gerenciar usuarios",
    },
    {
      label: "Migracao de Metadados",
      href: "/admin/migration",
      icon: Database,
      description: "Enriquecer metadados das questoes com Excels",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Central de Comando</h1>
          <p className="mt-2 text-muted-foreground">
            Painel administrativo do sistema GRI ESG
          </p>
        </div>

        {/* Primary Stats - 4 cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Empresas</p>
                  <p className="mt-2 text-3xl font-bold">{totalCompanies}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalHoldings} {totalHoldings === 1 ? "holding" : "holdings"}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Cadernos</p>
                  <p className="mt-2 text-3xl font-bold">{totalTemplates}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {totalQuestions} questoes no total
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Usuarios</p>
                  <p className="mt-2 text-3xl font-bold">{totalUsers}</p>
                  <p className="text-xs text-muted-foreground mt-1">cadastrados no sistema</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Respostas</p>
                  <p className="mt-2 text-3xl font-bold">{totalAnswers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {answersLast7Days} nos ultimos 7 dias
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/30">
                  <TrendingUp className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-6 text-xl font-semibold">Acoes Rapidas</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link key={action.href} href={action.href} className="group">
                  <Card className="h-full border-border/50 bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5">
                    <CardContent className="flex h-full flex-col justify-between p-8">
                      <div>
                        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 transition-all duration-300 group-hover:bg-primary group-hover:border-primary">
                          <Icon className="h-7 w-7 text-primary transition-all duration-300 group-hover:text-primary-foreground" />
                        </div>
                        <h3 className="font-semibold transition-all duration-300 group-hover:text-primary">
                          {action.label}
                        </h3>
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                          {action.description}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="w-fit bg-primary/10 text-primary hover:bg-primary/20 mt-4"
                      >
                        Acessar
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
