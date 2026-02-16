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

  const supabase = await createClient()

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

  const questionIds = junctionData?.map((j: { question_template_id: string }) => j.question_template_id) || []

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
                    <TableHead>Metadados</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => {
                    const metadataV2 = (question as any).metadata_v2 || {}
                    const meta = metadataV2.disclosure ? metadataV2 : (question.metadata || {})

                    const disclosureValue = meta.disclosure || meta.framework_1 || meta.sub_framework_1 || ""
                    const evidenciaValue = meta.evidencias || meta.evidencia || ""
                    const obsValue = meta.obs || meta.obs_nao_aplicavel || ""

                    return (
                      <TableRow key={question.id}>
                        <TableCell className="max-w-md">
                          <div className="font-medium line-clamp-2">{question.label}</div>
                        </TableCell>
                        <TableCell>
                          {disclosureValue ? (
                            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                              {disclosureValue}
                            </span>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                            {(() => {
                              const typeMapping: { [key: string]: string } = {
                                text: "texto",
                                number: "numero",
                                percentage: "porcentagem",
                                date: "data",
                                file: "arquivo",
                                multiple_choice: "multipla_escolha",
                                yes_no: "sim_nao",
                                texto: "texto",
                                numero: "numero",
                                porcentagem: "porcentagem",
                                data: "data",
                                arquivo: "arquivo",
                                multipla_escolha: "multipla_escolha",
                                sim_nao: "sim_nao",
                              }
                              return typeMapping[question.type] || question.type || "texto"
                            })()}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 max-w-[200px]">
                            {evidenciaValue && (
                              <div className="text-[10px] text-muted-foreground truncate" title={evidenciaValue}>
                                <strong>Evidência:</strong> {evidenciaValue}
                              </div>
                            )}
                            {obsValue && (
                              <div className="text-[10px] text-muted-foreground truncate" title={obsValue}>
                                <strong>Obs:</strong> {obsValue}
                              </div>
                            )}
                            {meta.sub_frameworks?.[params.templateId] &&
                              Array.isArray(meta.sub_frameworks[params.templateId]) && (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {meta.sub_frameworks[params.templateId]
                                    .filter((sf: string) => sf.trim() !== "")
                                    .map((sf: string, i: number) => (
                                      <span
                                        key={i}
                                        className="text-[9px] bg-blue-50 text-blue-700 border border-blue-100 px-1 py-0 rounded-sm"
                                      >
                                        {sf}
                                      </span>
                                    ))}
                                </div>
                              )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <EditQuestionWithTemplatesButton
                              question={{
                                id: question.id,
                                linha_coleta: question.label || "",
                                disclosure: disclosureValue,
                                tipo_resposta: question.type || "",
                                evidencias: evidenciaValue,
                                obs_nao_aplicavel: obsValue,
                                sub_frameworks: meta.sub_frameworks,
                              }}
                              currentTemplates={[params.templateId]}
                              allTemplates={allTemplates || []}
                            />
                            <DeleteQuestionButton questionId={question.id} questionTitle={question.label} />
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
