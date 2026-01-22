import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, History, MessageSquare, User, Calendar, FileText } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

interface PageProps {
  searchParams: Promise<{ template?: string; question?: string }>
}

function getStatusBadge(status: string) {
  switch (status) {
    case "APPROVED":
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Aprovado</Badge>
    case "REVISION_REQUESTED":
      return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Correção Solicitada</Badge>
    case "REJECTED":
      return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeitado</Badge>
    case "CORRECTION_SUBMITTED":
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Reenviado</Badge>
    case "DRAFT":
      return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Rascunho</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default async function HistoricoPage({ searchParams }: PageProps) {
  const { template: templateId, question: questionId } = await searchParams

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // Buscar perfil do usuário
  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single()

  const isGestor = ["admin_main", "holding_admin", "revisor"].includes(profile?.role || "")

  let accessibleTemplateIds: string[] = []
  if (isGestor) {
    const { data: assignments } = await adminClient
      .from("user_template_assignments")
      .select("template_id")
      .eq("user_id", user.id)

    accessibleTemplateIds = assignments?.map((a) => a.template_id) || []
  }

  // Buscar histórico
  let query = adminClient
    .from("comment_history")
    .select(`
      *,
      question:book_questions(label),
      template:book_templates(name)
    `)
    .order("created_at", { ascending: false })
    .limit(100)

  if (templateId) {
    query = query.eq("template_id", templateId)
  }

  if (questionId) {
    query = query.eq("question_id", questionId)
  }

  if (isGestor && accessibleTemplateIds.length > 0) {
    query = query.in("template_id", accessibleTemplateIds)
  } else if (!isGestor) {
    query = query.eq("user_id", user.id)
  }

  const { data: history, error: historyError } = await query

  let templatesQuery = adminClient.from("book_templates").select("id, name").order("name")

  if (isGestor && accessibleTemplateIds.length > 0) {
    templatesQuery = templatesQuery.in("id", accessibleTemplateIds)
  } else if (!isGestor) {
    // Para usuários regulares, buscar templates de seus cadernos atribuídos
    const { data: userAssignments } = await adminClient
      .from("user_template_assignments")
      .select("template_id")
      .eq("user_id", user.id)

    const userTemplateIds = userAssignments?.map((a) => a.template_id) || []
    if (userTemplateIds.length > 0) {
      templatesQuery = templatesQuery.in("id", userTemplateIds)
    }
  }

  const { data: templates } = await templatesQuery

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/meus-cadernos">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Histórico de Revisões</h1>
          </div>
          <p className="text-muted-foreground">Log de auditoria das questões com todas as interações de revisão</p>
        </div>

        {/* Filtros */}
        {templates && templates.length > 0 && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <Link href="/dashboard/historico">
                  <Button variant={!templateId ? "default" : "outline"} size="sm">
                    Todos
                  </Button>
                </Link>
                {templates.map((t) => (
                  <Link key={t.id} href={`/dashboard/historico?template=${t.id}`}>
                    <Button variant={templateId === t.id ? "default" : "outline"} size="sm">
                      {t.name}
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de histórico */}
        {!history || history.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <History className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum histórico registrado</h3>
              <p className="text-muted-foreground">
                As interações de revisão aparecerão aqui quando houver solicitações de ajuste ou aprovações.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Questão */}
                      <div className="flex items-start gap-2">
                        <FileText className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">Questão</p>
                          <p className="font-medium text-sm">{item.question?.label || "Questão não encontrada"}</p>
                        </div>
                      </div>

                      {/* Caderno */}
                      {item.template?.name && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Caderno:</span>
                          <Badge variant="outline" className="font-normal">
                            {item.template.name}
                          </Badge>
                        </div>
                      )}

                      {/* Mensagem */}
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="bg-muted/50 rounded-lg p-3 flex-1">
                          <p className="text-sm">{item.message}</p>
                        </div>
                      </div>

                      {/* Autor e Data */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{item.author_name || "Usuário"}</span>
                          {item.author_role && (
                            <Badge variant="secondary" className="text-xs ml-1">
                              {item.author_role === "admin_main"
                                ? "Admin"
                                : item.author_role === "holding_admin"
                                  ? "Gestor"
                                  : item.author_role === "revisor"
                                    ? "Revisor"
                                    : "Usuário"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">{getStatusBadge(item.status)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
