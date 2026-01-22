import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CommandCenterButton } from "@/components/command-center-button"
import { Users, BookOpen, HelpCircle, Building2 } from "lucide-react"
import Link from "next/link"
import { requireAdmin } from "@/lib/auth-utils"

export default async function AdminPanelPage() {
  await requireAdmin()

  const adminClient = createAdminClient()

  // Fetch all stats in parallel using admin client
  const [templatesRes, questionsRes, usersRes] = await Promise.all([
    adminClient.from("book_templates").select("id", { count: "exact", head: true }),
    adminClient.from("book_questions").select("id", { count: "exact", head: true }),
    adminClient.from("profiles").select("id", { count: "exact", head: true }),
  ])

  const stats = {
    totalTemplates: templatesRes.count || 0,
    totalQuestions: questionsRes.count || 0,
    totalUsers: usersRes.count || 0,
  }

  const quickActions = [
    {
      label: "Gerenciar Cadernos",
      href: "/admin/templates",
      icon: BookOpen,
      description: "Criar e gerenciar templates de cadernos",
    },
    {
      label: "Gerenciar Questões",
      href: "/admin/questions",
      icon: HelpCircle,
      description: "Gerenciar questões e suas atribuições",
    },
    {
      label: "Gerenciar Usuários",
      href: "/admin/users",
      icon: Users,
      description: "Convidar e gerenciar usuários",
    },
    {
      label: "Gerenciar Organizações",
      href: "/admin/holdings",
      icon: Building2,
      description: "Gerenciar holdings e empresas",
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Central de Comando</h1>
            <p className="mt-2 text-muted-foreground">Painel administrativo do sistema GRI ESG</p>
          </div>
          <CommandCenterButton userRole="admin_main" />
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Cadernos</p>
                  <p className="mt-2 text-3xl font-bold">{stats.totalTemplates}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <BookOpen className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Questões</p>
                  <p className="mt-2 text-3xl font-bold">{stats.totalQuestions}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
                  <HelpCircle className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total de Usuários</p>
                  <p className="mt-2 text-3xl font-bold">{stats.totalUsers}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
                  <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-6 text-xl font-semibold">Ações Rápidas</h2>
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
                        <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{action.description}</p>
                      </div>
                      <Badge variant="secondary" className="w-fit bg-primary/10 text-primary hover:bg-primary/20 mt-4">
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
