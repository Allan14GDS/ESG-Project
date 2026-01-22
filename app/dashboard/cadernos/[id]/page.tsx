"use client"

import { useEffect, useState, useCallback } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Plus, Trash2, FileText, HelpCircle, List } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { EditQuestionWithTemplatesButton } from "@/components/questions/edit-question-with-templates-button"

export const dynamic = "force-dynamic"

interface Question {
  id: string
  label: string
  type: string
  order_index: number
  caderno_id: string | null
  metadata: any
  created_at: string
  updated_at: string
}

interface BookTemplate {
  id: string
  name: string
  description: string | null
  type: string | null
}

export default function CadernoQuestionsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string }
}) {
  const [cadernoId, setCadernoId] = useState<string | null>(null)
  const [caderno, setCaderno] = useState<BookTemplate | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [allTemplates, setAllTemplates] = useState<Array<{ id: string; name: string }>>([])
  const [questionTemplateMap, setQuestionTemplateMap] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showExistingDialog, setShowExistingDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)

  const [newQuestion, setNewQuestion] = useState({
    label: "",
    type: "text",
    order_index: 0,
    metadata: {
      disclosure: "",
      evidencia: "",
      obs: "",
    },
  })

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const loadData = useCallback(async () => {
    if (!cadernoId) return

    try {
      setLoading(true)
      console.log("[v0] Starting to load data for caderno:", cadernoId)

      const { data: cadernoData, error: cadernoError } = await supabase
        .from("book_templates")
        .select("*")
        .eq("id", cadernoId)
        .single()

      if (cadernoError) {
        console.error("[v0] Error fetching caderno:", cadernoError)
        toast.error("Erro ao carregar caderno")
        setLoading(false)
        return
      }
      setCaderno(cadernoData)
      console.log("[v0] Caderno loaded:", cadernoData)

      const { data: templatesData, error: templatesError } = await supabase
        .from("book_templates")
        .select("id, name")
        .order("name", { ascending: true })

      if (templatesError) {
        console.error("[v0] Error fetching templates:", templatesError)
      } else {
        setAllTemplates(templatesData || [])
      }

      const { data: questionLinks, error: linksError } = await supabase
        .from("book_question_junction")
        .select("question_template_id")
        .eq("book_template_id", cadernoId)

      if (linksError) {
        console.error("[v0] Error fetching question links:", linksError)
      }

      const questionIds = questionLinks?.map((link) => link.question_template_id) || []
      console.log("[v0] Found question IDs:", questionIds)

      if (questionIds.length === 0) {
        setQuestions([])
      } else {
        const { data: questionsData, error: questionsError } = await supabase
          .from("book_questions")
          .select("*")
          .in("id", questionIds)
          .order("created_at", { ascending: true })

        if (questionsError) {
          console.error("[v0] Error fetching questions:", questionsError)
          toast.error("Erro ao carregar questões")
        } else {
          setQuestions(questionsData || [])
          console.log("[v0] Questions loaded:", questionsData?.length)
        }
      }

      const { data: allJunctions, error: junctionsError } = await supabase
        .from("book_question_junction")
        .select("question_template_id, book_template_id")

      if (junctionsError) {
        console.error("[v0] Error fetching all junctions:", junctionsError)
      } else {
        const templateMap: Record<string, string[]> = {}
        allJunctions?.forEach((junction) => {
          if (!templateMap[junction.question_template_id]) {
            templateMap[junction.question_template_id] = []
          }
          templateMap[junction.question_template_id].push(junction.book_template_id)
        })
        setQuestionTemplateMap(templateMap)
      }

      const { data: allQuestionsData, error: allQuestionsError } = await supabase
        .from("book_questions")
        .select("*")
        .order("created_at", { ascending: false })

      if (allQuestionsError) {
        console.error("[v0] Error fetching all questions:", allQuestionsError)
      } else {
        setAllQuestions(allQuestionsData || [])
        console.log("[v0] All questions loaded:", allQuestionsData?.length)
      }

      setLoading(false)
      console.log("[v0] Data loading complete")
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast.error("Erro ao carregar dados")
      setLoading(false)
    }
  }, [cadernoId, supabase])

  useEffect(() => {
    const resolveParams = async () => {
      if (params && typeof params === "object" && "then" in params) {
        const resolved = await params
        setCadernoId(resolved.id)
      } else if (params && typeof params === "object") {
        setCadernoId((params as { id: string }).id)
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (cadernoId) {
      loadData()
    }
  }, [cadernoId, loadData])

  const resetNewQuestion = () => {
    setNewQuestion({
      label: "",
      type: "text",
      order_index: 0,
      metadata: {
        disclosure: "",
        evidencia: "",
        obs: "",
      },
    })
  }

  const handleCreateQuestion = async () => {
    setError(null)
    if (!newQuestion.label.trim()) {
      setError("Por favor, preencha a linha de coleta (pergunta)")
      return
    }

    setSaving(true)
    try {
      // Insert into book_questions
      const { data: insertedQuestion, error: insertError } = await supabase
        .from("book_questions")
        .insert({
          label: newQuestion.label,
          type: newQuestion.type,
          order_index: questions.length + 1,
          metadata: newQuestion.metadata,
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Link to caderno via junction table
      const { error: junctionError } = await supabase.from("book_question_junction").insert({
        book_template_id: cadernoId,
        question_template_id: insertedQuestion.id,
        sort_order: questions.length + 1,
      })

      if (junctionError) throw junctionError

      await loadData()
      resetNewQuestion()
      setShowNewDialog(false)
      toast.success("Questão criada com sucesso!")
    } catch (err: any) {
      console.error("[v0] Error creating question:", err)
      setError(err.message)
      toast.error("Erro ao criar questão")
    } finally {
      setSaving(false)
    }
  }

  const handleLinkExistingQuestion = async (questionId: string) => {
    if (!cadernoId) return

    try {
      const { error } = await supabase.from("book_question_junction").insert({
        book_template_id: cadernoId,
        question_template_id: questionId,
        sort_order: questions.length + 1,
      })

      if (error) throw error

      toast.success("Questão vinculada ao caderno!")
      setShowExistingDialog(false)
      loadData()
    } catch (error: any) {
      console.error("[v0] Error linking question:", error.message)
      toast.error("Erro ao vincular questão: " + error.message)
    }
  }

  const handleUnlinkQuestion = async () => {
    if (!selectedQuestion || !cadernoId) return

    try {
      const { error } = await supabase
        .from("book_question_junction")
        .delete()
        .eq("book_template_id", cadernoId)
        .eq("question_template_id", selectedQuestion.id)

      if (error) throw error

      toast.success("Questão desvinculada do caderno!")
      setShowDeleteDialog(false)
      setSelectedQuestion(null)
      loadData()
    } catch (error) {
      console.error("[v0] Error unlinking question:", error)
      toast.error("Erro ao desvincular questão")
    }
  }

  const openDeleteDialog = (question: Question) => {
    setSelectedQuestion(question)
    setShowDeleteDialog(true)
  }

  // Filter available questions (exclude already linked ones)
  const availableQuestions = allQuestions.filter((q) => !questions.some((linkedQ) => linkedQ.id === q.id))

  const totalPages = Math.ceil(questions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedQuestions = questions.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando questões...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen h-screen overflow-y-auto bg-background">
      <div className="mx-auto max-w-7xl space-y-6 p-6 pb-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/disclosures">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Questões do Caderno</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">{caderno?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Button onClick={() => setShowExistingDialog(true)} variant="outline" className="flex-1 sm:flex-none">
              <List className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Vincular Existente</span>
              <span className="sm:hidden">Vincular</span>
            </Button>
            <Button
              onClick={() => setShowNewDialog(true)}
              className="bg-primary hover:bg-primary/90 flex-1 sm:flex-none"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Nova Questão</span>
              <span className="sm:hidden">Nova</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Total de Questões</p>
                  <p className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">{questions.length}</p>
                </div>
                <HelpCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Disponíveis p/ Vincular</p>
                  <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{availableQuestions.length}</p>
                </div>
                <List className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/30">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Tipo do Caderno</p>
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">{caderno?.type || "N/A"}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 px-4 sm:px-8 py-4 sm:py-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Lista de Questões
            </CardTitle>
            <CardDescription className="text-sm">Gerencie as questões vinculadas a este caderno</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-8">
            {questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                <HelpCircle className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
                <p className="text-base sm:text-lg font-medium text-foreground mb-2">Nenhuma questão cadastrada</p>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 px-4">
                  Comece criando uma nova questão ou vinculando uma existente
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4">
                  <Button onClick={() => setShowNewDialog(true)} className="bg-primary w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Questão
                  </Button>
                  <Button onClick={() => setShowExistingDialog(true)} variant="outline" className="w-full sm:w-auto">
                    <List className="mr-2 h-4 w-4" />
                    Vincular Existente
                  </Button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <div className="inline-block min-w-full align-middle">
                  <table className="min-w-full divide-y divide-border">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Ordem
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Pergunta
                        </th>
                        <th className="text-left p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="text-right p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedQuestions.map((question, index) => (
                        <tr key={question.id} className="border-b border-border hover:bg-muted transition-colors">
                          <td className="p-4 text-sm text-muted-foreground">#{startIndex + index + 1}</td>
                          <td className="p-4">
                            <p className="font-medium text-foreground">{question.label}</p>
                            {question.metadata?.disclosure && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Disclosure: {question.metadata.disclosure}
                              </p>
                            )}
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                              {question.type}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <EditQuestionWithTemplatesButton
                                question={{
                                  id: question.id,
                                  linha_coleta: question.label,
                                  disclosure: question.metadata?.disclosure || "",
                                  tipo_resposta: question.type,
                                  evidencias: question.metadata?.evidencia || "",
                                  obs_nao_aplicavel: question.metadata?.obs || "",
                                  sub_frameworks: question.metadata?.sub_frameworks || [],
                                }}
                                currentTemplates={questionTemplateMap[question.id] || []}
                                allTemplates={allTemplates}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog(question)}
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-4 px-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, questions.length)} de {questions.length} questões
                    </p>
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            onClick={() => goToPage(currentPage - 1)}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum: number
                          if (totalPages <= 5) {
                            pageNum = i + 1
                          } else if (currentPage <= 3) {
                            pageNum = i + 1
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i
                          } else {
                            pageNum = currentPage - 2 + i
                          }
                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                onClick={() => goToPage(pageNum)}
                                isActive={currentPage === pageNum}
                                className="cursor-pointer"
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          )
                        })}

                        <PaginationItem>
                          <PaginationNext
                            onClick={() => goToPage(currentPage + 1)}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* New Question Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Questão</DialogTitle>
              <DialogDescription>Crie uma nova questão para este caderno</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-label">Linha de Coleta (Pergunta) *</Label>
                <Textarea
                  id="new-label"
                  value={newQuestion.label}
                  onChange={(e) => setNewQuestion({ ...newQuestion, label: e.target.value })}
                  placeholder="Digite a pergunta..."
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new-disclosure">Disclosure</Label>
                  <Input
                    id="new-disclosure"
                    value={newQuestion.metadata.disclosure}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        metadata: { ...newQuestion.metadata, disclosure: e.target.value },
                      })
                    }
                    placeholder="Ex: GRI 2-1"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-type">Tipo de Resposta</Label>
                  <Select
                    value={newQuestion.type}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="date">Data</SelectItem>
                      <SelectItem value="file">Arquivo</SelectItem>
                      <SelectItem value="select">Seleção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-evidencia">Evidência</Label>
                <Textarea
                  id="new-evidencia"
                  value={newQuestion.metadata.evidencia}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      metadata: { ...newQuestion.metadata, evidencia: e.target.value },
                    })
                  }
                  placeholder="Tipo de evidência esperada..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-obs">Observação</Label>
                <Textarea
                  id="new-obs"
                  value={newQuestion.metadata.obs}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      metadata: { ...newQuestion.metadata, obs: e.target.value },
                    })
                  }
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateQuestion} disabled={saving}>
                {saving ? "Criando..." : "Criar Questão"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link Existing Question Dialog */}
        <Dialog open={showExistingDialog} onOpenChange={setShowExistingDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vincular Questão Existente</DialogTitle>
              <DialogDescription>Selecione uma questão do banco para vincular a este caderno</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {availableQuestions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Todas as questões já estão vinculadas a este caderno
                </p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {availableQuestions.slice(0, 50).map((question) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleLinkExistingQuestion(question.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{question.label}</p>
                        <p className="text-xs text-muted-foreground">
                          Tipo: {question.type} | Criado em: {new Date(question.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Desvincular Questão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desvincular esta questão do caderno? A questão não será excluída do banco, apenas
                removida deste caderno.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleUnlinkQuestion} className="bg-red-600 hover:bg-red-700">
                Desvincular
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
