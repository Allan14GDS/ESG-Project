import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { FileText, ArrowLeft, Building2, HelpCircle } from "lucide-react"
import Link from "next/link"
import { CreateTemplateButton } from "@/components/templates/create-template-button"
import { requireAuth, getUserOrganizationIds } from "@/lib/auth-utils"
import { CommandCenterButton } from "@/components/command-center-button"
import { AdminTemplatesList } from "@/components/admin/admin-templates-list"

export default async function AdminTemplatesPage() {
  const profile = await requireAuth()

  if (profile.role === "holding_admin") {
    redirect("/dashboard/questions")
  }

  const adminClient = createAdminClient()

  let templates

  if (profile.role === "admin_main") {
    // Admin can see all templates
    const { data } = await adminClient
      .from("book_templates")
      .select("*, company_templates(company_id), book_question_junction(book_template_id)")
      .order("created_at", { ascending: false })
    templates = data
  } else if (profile.role === "holding_admin") {
    // Gestor can only see templates assigned to their organizations
    const orgIds = await getUserOrganizationIds(profile.id)

    if (orgIds.length === 0) {
      templates = []
    } else {
      // Get templates assigned to user's organizations
      const { data } = await adminClient
        .from("book_templates")
        .select("*, company_templates!inner(company_id), book_question_junction(book_template_id)")
        .in("company_templates.company_id", orgIds)
        .order("created_at", { ascending: false })
      templates = data
    }
  } else {
    // Other roles redirect to dashboard
    redirect("/dashboard")
  }

  const { count: totalUniqueQuestions } = await adminClient
    .from("book_questions")
    .select("*", { count: "exact", head: true })

  // Calculate statistics
  const totalTemplates = templates?.length || 0
  const totalQuestions = totalUniqueQuestions || 0 // Use unique questions count
  const totalAssignments = templates?.reduce((sum, t) => sum + (t.company_templates?.length || 0), 0) || 0

  const getCategoryBadge = (type: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      governanca: { bg: "bg-purple-100", text: "text-purple-700", label: "Governança" },
      organizacional: { bg: "bg-blue-100", text: "text-blue-700", label: "Organizacional" },
      ambiental: { bg: "bg-teal-100", text: "text-teal-700", label: "Ambiental" },
      social: { bg: "bg-pink-100", text: "text-pink-700", label: "Social" },
      gri: { bg: "bg-emerald-100", text: "text-emerald-700", label: "GRI" },
      aneel: { bg: "bg-amber-100", text: "text-amber-700", label: "ANEEL" },
      ifrs: { bg: "bg-cyan-100", text: "text-cyan-700", label: "IFRS" },
      custom: { bg: "bg-gray-100", text: "text-gray-700", label: "Customizado" },
    }

    const style = config[type?.toLowerCase()] || config.custom

    return (
      <Badge className={`${style.bg} ${style.text} border-0 font-medium`} variant="secondary">
        {style.label}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Link href={profile.role === "admin_main" ? "/admin" : "/dashboard"}>
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {profile.role === "admin_main" ? "Voltar ao Painel" : "Voltar ao Dashboard"}
            </Button>
          </Link>
          <CommandCenterButton userRole={profile.role} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {profile.role === "admin_main" ? "Todos os Cadernos" : "Meus Cadernos"}
            </h1>
            <p className="text-muted-foreground">
              {profile.role === "admin_main"
                ? "Sistema completo de coleta GRI 2 + ANEEL + IFRS"
                : "Cadernos atribuídos às suas empresas"}
            </p>
          </div>
          {profile.role === "admin_main" && <CreateTemplateButton />}
        </div>

        {/* Stats Overview - More colorful */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">Total de Cadernos</p>
                  <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-300">{totalTemplates}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
                  <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/30 dark:border-blue-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Questões Únicas</p>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-300">{totalQuestions}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
                  <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 dark:bg-purple-950/30 dark:border-purple-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-400">Empresas Vinculadas</p>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-300">{totalAssignments}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50">
                  <Building2 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/30 dark:border-amber-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Progresso Geral</p>
                  <p className="text-3xl font-bold text-amber-600 dark:text-amber-300">0%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                  <Progress value={0} className="w-8 h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates List - Colorful cards like disclosures */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Cadernos</CardTitle>
            <CardDescription>
              Clique em um caderno para gerenciar questões e atribuições. Cadernos criados para coleta de dados ESG.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!templates || templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-100 border border-emerald-200">
                  <FileText className="h-10 w-10 text-emerald-600" />
                </div>
                <p className="text-xl font-semibold">Nenhum caderno cadastrado</p>
                <p className="mt-2 text-muted-foreground">
                  {profile.role === "admin_main"
                    ? 'Clique em "Novo Caderno" para começar'
                    : "Nenhum caderno atribuído às suas empresas"}
                </p>
              </div>
            ) : (
              <AdminTemplatesList templates={templates} userRole={profile.role} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
