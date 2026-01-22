import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, HelpCircle } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function GestorTemplatesPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile with role
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, email")
    .eq("email", user.email)
    .maybeSingle()

  if (!profile || (profile.role !== "holding_admin" && profile.role !== "admin_main")) {
    redirect("/dashboard")
  }

  // Get organizations assigned to this user
  const { data: userOrgs } = await adminClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)

  const orgIds = userOrgs?.map((o) => o.organization_id) || []

  // Get templates assigned to these organizations with question counts
  const { data: assignedBooks } = await adminClient
    .from("organization_books")
    .select(
      `
      book_template_id,
      book_template:book_templates!organization_books_book_template_id_fkey(
        id,
        name,
        description,
        type,
        metadata,
        created_at
      )
    `,
    )
    .in("organization_id", orgIds)

  const templates = assignedBooks?.map((ab) => ab.book_template).filter(Boolean) || []

  // Get question counts for each template
  const questionCounts: Record<string, number> = {}
  for (const template of templates) {
    const { count } = await adminClient
      .from("book_question_junction")
      .select("*", { count: "exact", head: true })
      .eq("book_template_id", template.id)

    questionCounts[template.id] = count || 0
  }

  // Count total unique questions
  const { data: allJunctions } = await adminClient
    .from("book_question_junction")
    .select("question_template_id")
    .in(
      "book_template_id",
      templates.map((t) => t.id),
    )

  const uniqueQuestions = new Set(allJunctions?.map((j) => j.question_template_id) || []).size

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <button className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar ao Dashboard
            </button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Gerenciar Cadernos</h1>
          <p className="text-muted-foreground">Visualize cadernos atribuídos às suas empresas</p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Cadernos Atribuídos</p>
                  <p className="text-3xl font-bold">{templates.length}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Total de Questões</p>
                  <p className="text-3xl font-bold">{uniqueQuestions}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Templates Grid */}
        {templates.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum caderno atribuído</h3>
              <p className="text-muted-foreground">
                Entre em contato com o administrador para atribuir cadernos à sua conta.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template: any) => (
              <Link key={template.id} href={`/admin/templates/${template.id}/questions`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <Badge variant="secondary">{questionCounts[template.id]} questões</Badge>
                    </div>
                    <h3 className="font-semibold mb-2 line-clamp-2">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{template.description}</p>
                    )}
                    {template.metadata?.subcategory && (
                      <Badge variant="outline" className="mt-3">
                        {template.metadata.subcategory}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
