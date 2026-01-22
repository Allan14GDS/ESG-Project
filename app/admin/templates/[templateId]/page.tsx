import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, HelpCircle } from "lucide-react"
import Link from "next/link"
import { CreateQuestionButton } from "@/components/questions/create-question-button"
import { EditQuestionWithTemplatesButton } from "@/components/questions/edit-question-with-templates-button"
import { DeleteQuestionButton } from "@/components/questions/delete-question-button"

export default async function TemplateDetailPage({ params }: { params: { templateId: string } }) {
  if (params.templateId === "create" || params.templateId === "create-question") {
    redirect("/admin/templates")
  }

  const supabase = createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const { data: template, error: templateError } = await supabase
    .from("book_templates")
    .select("*")
    .eq("id", params.templateId)
    .single()

  if (templateError || !template) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Template não encontrado</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const { data: junctionData } = await supabase
    .from("book_question_junction")
    .select("question_template_id")
    .eq("book_template_id", params.templateId)

  const questionIds = junctionData?.map((j) => j.question_template_id) || []

  let questions: any[] = []
  if (questionIds.length > 0) {
    const { data: questionsData } = await supabase
      .from("book_questions")
      .select("*")
      .in("id", questionIds)
      .order("created_at", { ascending: true })

    questions = questionsData || []
  }

  const { data: allTemplates } = await supabase.from("book_templates").select("id, name").order("name")

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="mb-2">
              <Link href="/admin/templates">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para Templates
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">{template.name}</h1>
            <p className="text-muted-foreground">{template.description || "Sem descrição"}</p>
          </div>
          <CreateQuestionButton allTemplates={allTemplates || []} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Perguntas do Template
            </CardTitle>
            <CardDescription>{questions?.length || 0} pergunta(s) vinculada(s) a este caderno</CardDescription>
          </CardHeader>
          <CardContent>
            {!questions || questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <HelpCircle className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">Nenhuma pergunta vinculada</p>
                <p className="text-sm text-muted-foreground">
                  Use o botão "Nova Questão" para adicionar perguntas a este caderno
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Linha de Coleta</TableHead>
                    <TableHead>Disclosure</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => {
                    const metadata = question.metadata || {}
                    return (
                      <TableRow key={question.id}>
                        <TableCell className="max-w-md">
                          <div className="line-clamp-2">{question.label}</div>
                        </TableCell>
                        <TableCell>{metadata.disclosure || "-"}</TableCell>
                        <TableCell className="capitalize">{question.type || "texto"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <EditQuestionWithTemplatesButton
                              question={{
                                id: question.id,
                                linha_coleta: question.label || "",
                                disclosure: metadata.disclosure || "",
                                tipo_resposta: question.type || "",
                                evidencias: metadata.evidencias || "",
                                obs_nao_aplicavel: metadata.obs || "",
                              }}
                              currentTemplates={[params.templateId]}
                              allTemplates={allTemplates || []}
                            />
                            <DeleteQuestionButton questionId={question.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
