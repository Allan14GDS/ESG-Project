import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, ArrowLeft, BookOpen } from "lucide-react"
import Link from "next/link"
import { CreateQuestionButton } from "@/components/questions/create-question-button"
import { ImportCsvButton } from "@/components/questions/import-csv-button"
import { AdminQuestionsTable } from "@/components/admin/admin-questions-table"
import { requireAuth } from "@/lib/auth-utils"
import { redirect } from "next/navigation"
import { CommandCenterButton } from "@/components/command-center-button"

export default async function AdminQuestionsPage() {
  const profile = await requireAuth()

  // Only admin_main and holding_admin can access this page
  if (profile.role !== "admin_main" && profile.role !== "holding_admin") {
    redirect("/dashboard")
  }

  const adminClient = createAdminClient()

  const { count: totalQuestionsCount } = await adminClient
    .from("book_questions")
    .select("*", { count: "exact", head: true })

  const { data: questions, error: questionsError } = await adminClient
    .from("book_questions")
    .select(`
      *,
      book_question_junction(
        book_template_id,
        book_templates(id, name)
      )
    `)
    .order("created_at", { ascending: false })
    .range(0, 9999)

  console.log("[v0] Total questions count:", totalQuestionsCount)
  console.log("[v0] Total questions fetched:", questions?.length || 0)
  if (questions && questions.length > 0) {
    console.log("[v0] First question with junctions:", questions[0])
  }

  if (questionsError) {
    console.error("[v0] Error fetching questions:", questionsError)
  }

  const questionsWithAssignments =
    questions?.filter((q) => q.book_question_junction && q.book_question_junction.length > 0).length || 0
  console.log("[v0] Questions with assignments:", questionsWithAssignments)

  // Fetch all templates for the assignment dropdown
  const { data: allTemplates } = await adminClient
    .from("book_templates")
    .select("id, name")
    .order("name", { ascending: true })

  const ITEMS_PER_PAGE = 20

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href={profile.role === "admin_main" ? "/admin" : "/dashboard"}>
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              {profile.role === "admin_main" ? "Voltar ao Painel" : "Voltar ao Dashboard"}
            </Button>
          </Link>
          <div className="flex items-center gap-2 mb-4">
            <Link href={profile.role === "admin_main" ? "/admin" : "/dashboard"}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                {profile.role === "admin_main" ? "Voltar ao Painel" : "Voltar ao Dashboard"}
              </Button>
            </Link>
            <CommandCenterButton userRole={profile.role} />
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <HelpCircle className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest text-primary">Banco de Questões</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">Gerenciar Questões</h1>
              <p className="mt-3 text-muted-foreground">
                Visualize todas as questões master e atribua-as rapidamente a múltiplos cadernos
              </p>
            </div>
            <div className="flex items-center gap-2">
              <ImportCsvButton allTemplates={allTemplates || []} />
              <CreateQuestionButton allTemplates={allTemplates || []} />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-blue-700 dark:text-blue-300">
                    Total de Questões
                  </p>
                  <p className="mt-2 text-4xl font-bold text-blue-600 dark:text-blue-400">{totalQuestionsCount || 0}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-700">
                  <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    Cadernos Disponíveis
                  </p>
                  <p className="mt-2 text-4xl font-bold text-purple-600 dark:text-purple-400">
                    {allTemplates?.length || 0}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/50 border border-purple-200 dark:border-purple-700">
                  <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions Table */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 px-8 py-6">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <HelpCircle className="h-5 w-5 text-primary" />
              Lista de Questões Master
            </CardTitle>
            <CardDescription>
              Clique no botão de edição para modificar a questão e atribuir a múltiplos cadernos
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="p-6">
              <AdminQuestionsTable questions={questions || []} allTemplates={allTemplates || []} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
