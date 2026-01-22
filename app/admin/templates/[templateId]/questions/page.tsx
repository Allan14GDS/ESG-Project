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
import { ArrowLeft, Plus, Pencil, Trash2, FileText, HelpCircle, List } from "lucide-react"
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

export default function TemplateQuestionsPage({
  params,
}: {
  params: Promise<{ templateId: string }> | { templateId: string }
}) {
  const [templateId, setTemplateId] = useState<string | null>(null)
  const [template, setTemplate] = useState<BookTemplate | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [availableBooks, setAvailableBooks] = useState<BookTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
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
  const ITEMS_PER_PAGE = 10

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const loadData = useCallback(async () => {
    if (!templateId) return

    try {
      setLoading(true)
      console.log("[v0] Starting to load data for template:", templateId)

      // Fetch template details
      const { data: templateData, error: templateError } = await supabase
        .from("book_templates")
        .select("*")
        .eq("id", templateId)
        .single()

      if (templateError) {
        console.error("[v0] Error fetching template:", templateError)
        toast.error("Erro ao carregar caderno")
        setLoading(false)
        return
      }
      setTemplate(templateData)
      console.log("[v0] Template loaded:", templateData)

      const { data: questionLinks, error: linksError } = await supabase
        .from("book_question_junction")
        .select("question_template_id, position")
        .eq("book_template_id", templateId)
        .order("position", { ascending: true })

      if (linksError) {
        console.error("[v0] Error fetching question links:", linksError)
      }

      console.log("[v0] Question links with position:", questionLinks?.slice(0, 5))

      const positionMap: Record<string, number> = {}
      questionLinks?.forEach((link) => {
        if (link.position !== null && link.position !== undefined) {
          positionMap[link.question_template_id] = link.position
        }
      })

      const questionIds = questionLinks?.map((link) => link.question_template_id) || []
      console.log("[v0] Found", questionIds.length, "question IDs in order")

      if (questionIds.length === 0) {
        setQuestions([])
      } else {
        const BATCH_SIZE = 100
        const batches = []

        for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
          const batchIds = questionIds.slice(i, i + BATCH_SIZE)
          batches.push(batchIds)
        }

        console.log("[v0] Fetching questions in", batches.length, "batches")

        let allQuestionsData: any[] = []

        for (const batchIds of batches) {
          const { data: batchData, error: batchError } = await supabase
            .from("book_questions")
            .select("*")
            .in("id", batchIds)

          if (batchError) {
            console.error("[v0] Error fetching batch:", batchError)
            throw batchError
          }

          if (batchData) {
            allQuestionsData = [...allQuestionsData, ...batchData]
          }
        }

        allQuestionsData.sort((a, b) => {
          const posA = positionMap[a.id]
          const posB = positionMap[b.id]

          // If both have positions, sort by position
          if (posA !== undefined && posB !== undefined) {
            return posA - posB
          }

          // If only A has position, it comes first
          if (posA !== undefined) return -1

          // If only B has position, it comes first
          if (posB !== undefined) return 1

          // If neither has position, sort by created_at as fallback
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })

        console.log(
          "[v0] First 5 sorted questions:",
          allQuestionsData.slice(0, 5).map((q) => ({
            id: q.id.slice(0, 8),
            label: q.label.slice(0, 50),
            position: positionMap[q.id],
          })),
        )

        setQuestions(allQuestionsData)
        console.log("[v0] Questions loaded and sorted:", allQuestionsData.length)
      }

      // Fetch all available books
      const { data: booksData, error: booksError } = await supabase
        .from("book_templates")
        .select("id, name, type")
        .order("name")

      if (booksError) {
        console.error("[v0] Error fetching books:", booksError)
      } else {
        setAvailableBooks(booksData || [])
      }

      const { data: allQuestionsDataFetch, error: allQuestionsError } = await supabase
        .from("book_questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500)

      if (allQuestionsError) {
        console.error("[v0] Error fetching all questions:", allQuestionsError)
      } else {
        setAllQuestions(allQuestionsDataFetch || [])
        console.log("[v0] All questions loaded:", allQuestionsDataFetch?.length)
      }

      setLoading(false)
      console.log("[v0] Data loading complete")
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast.error("Erro ao carregar dados")
      setLoading(false)
    }
  }, [templateId, supabase])

  useEffect(() => {
    const resolveParams = async () => {
      if (params && typeof params === "object" && "then" in params) {
        const resolved = await params
        setTemplateId(resolved.templateId)
      } else if (params && typeof params === "object") {
        setTemplateId((params as { templateId: string }).templateId)
      }
    }
    resolveParams()
  }, [params])

  useEffect(() => {
    if (templateId) {
      loadData()
    }
  }, [templateId, loadData])

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
      const { error: insertError } = await supabase.from("book_questions").insert({
        label: newQuestion.label,
        type: newQuestion.type,
        order_index: questions.length + 1,
        caderno_id: templateId,
        metadata: newQuestion.metadata,
      })

      if (insertError) throw insertError

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
    if (!templateId) return

    try {
      const { error } = await supabase.from("book_question_junction").insert({
        book_template_id: templateId,
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
    if (!selectedQuestion || !templateId) return

    try {
      const { error } = await supabase
        .from("book_question_junction")
        .delete()
        .eq("book_template_id", templateId)
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

  const openEditDialog = (question: Question) => {
    setSelectedQuestion(question)
    setShowEditDialog(true)
  }

  const handleUpdateQuestion = async () => {
    if (!selectedQuestion) return

    try {
      setSaving(true)

      const { error } = await supabase
        .from("book_questions")
        .update({
          label: selectedQuestion.label,
          type: selectedQuestion.type,
          metadata: selectedQuestion.metadata || {},
        })
        .eq("id", selectedQuestion.id)

      if (error) throw error

      toast.success("Questão atualizada com sucesso!")
      setShowEditDialog(false)
      setSelectedQuestion(null)
      loadData()
    } catch (error) {
      console.error("[v0] Error updating question:", error)
      toast.error("Erro ao atualizar questão")
    } finally {
      setSaving(false)
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
            <Link href="/admin/templates">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Questões do Caderno</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">{template?.name}</p>
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
                  <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                    {template?.type || "N/A"}
                  </p>
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
                <p className="text-base sm:text-lg font-medium text-foreground mb-2">Nenhuma questão vinculada</p>
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
                          </td>
                          <td className="p-4">
                            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                              {question.type}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openEditDialog(question)}
                                className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
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
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50 pt-6 mt-6 px-4">
                    <p className="text-sm text-muted-foreground">
                      Mostrando {startIndex + 1} a {Math.min(endIndex, questions.length)} de {questions.length} questões
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(1)}
                        disabled={currentPage === 1}
                        className="hidden sm:flex"
                      >
                        Primeira
                      </Button>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                goToPage(currentPage - 1)
                              }}
                              className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>

                          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                            let pageNumber
                            if (totalPages <= 3) {
                              pageNumber = i + 1
                            } else if (currentPage <= 2) {
                              pageNumber = i + 1
                            } else if (currentPage >= totalPages - 1) {
                              pageNumber = totalPages - 2 + i
                            } else {
                              pageNumber = currentPage - 1 + i
                            }

                            return (
                              <PaginationItem key={pageNumber}>
                                <PaginationLink
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    goToPage(pageNumber)
                                  }}
                                  isActive={currentPage === pageNumber}
                                >
                                  {pageNumber}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          })}

                          <PaginationItem>
                            <PaginationNext
                              href="#"
                              onClick={(e) => {
                                e.preventDefault()
                                goToPage(currentPage + 1)
                              }}
                              className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className="hidden sm:flex"
                      >
                        Última
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Question Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Nova Questão</DialogTitle>
            <DialogDescription>Preencha os campos para criar uma nova questão</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-disclosure">Disclosure</Label>
              <Input
                id="new-disclosure"
                placeholder="Ex: 2-1 Detalhes organizacionais"
                value={newQuestion.metadata.disclosure || ""}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    metadata: { ...newQuestion.metadata, disclosure: e.target.value },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Detalhamento da pergunta</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-label">Linha de Coleta (Atomizada) *</Label>
              <Textarea
                id="new-label"
                placeholder="Ex: Informe a razão social da organização"
                value={newQuestion.label}
                onChange={(e) => setNewQuestion({ ...newQuestion, label: e.target.value })}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">A pergunta em si</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-type">Tipo da Resposta *</Label>
              <Select
                value={newQuestion.type}
                onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value })}
              >
                <SelectTrigger id="new-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Texto</SelectItem>
                  <SelectItem value="number">Número</SelectItem>
                  <SelectItem value="percentage">Porcentagem</SelectItem>
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="boolean">Sim/Não</SelectItem>
                  <SelectItem value="currency">Moeda</SelectItem>
                  <SelectItem value="file">Arquivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-evidencia">Evidência</Label>
              <Input
                id="new-evidencia"
                placeholder="Ex: Contrato social, Estatuto"
                value={newQuestion.metadata.evidencia || ""}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    metadata: { ...newQuestion.metadata, evidencia: e.target.value },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">Tipo de documento que será anexado</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-obs">Observação</Label>
              <Textarea
                id="new-obs"
                placeholder="Ex: Campo obrigatório para empresas S.A."
                value={newQuestion.metadata.obs || ""}
                onChange={(e) =>
                  setNewQuestion({
                    ...newQuestion,
                    metadata: { ...newQuestion.metadata, obs: e.target.value },
                  })
                }
                rows={2}
              />
              <p className="text-xs text-muted-foreground">Texto de observação para a pergunta</p>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <p>{error}</p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateQuestion} disabled={saving}>
              {saving ? "Salvando..." : "Criar Questão"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Question Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Questão e Cadernos</DialogTitle>
            <DialogDescription>
              Altere os campos da questão e selecione os cadernos aos quais ela deve ser atribuída
            </DialogDescription>
          </DialogHeader>
          {selectedQuestion && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-label">Linha de Coleta (Atomizada) *</Label>
                <Textarea
                  id="edit-label"
                  placeholder="Impactos financeiros de riscos e oportunidades energéticas (preço do carbono, eficiência, PPAs) - Quantificar custos ou benefícios financeiros associados a mudanças energéticas ou de mercado"
                  value={selectedQuestion.label}
                  onChange={(e) => setSelectedQuestion({ ...selectedQuestion, label: e.target.value })}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Esta é a pergunta em si que aparecerá no formulário</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-disclosure">Disclosure</Label>
                  <Input
                    id="edit-disclosure"
                    placeholder="IFRS / ISSB"
                    value={selectedQuestion.metadata?.disclosure || ""}
                    onChange={(e) =>
                      setSelectedQuestion({
                        ...selectedQuestion,
                        metadata: { ...selectedQuestion.metadata, disclosure: e.target.value },
                      })
                    }
                  />
                  <p className="text-xs text-muted-foreground">Detalhamento ou código da pergunta</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-type">Tipo da Resposta *</Label>
                  <Select
                    value={selectedQuestion.type}
                    onValueChange={(value) => setSelectedQuestion({ ...selectedQuestion, type: value })}
                  >
                    <SelectTrigger id="edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="percentage">Porcentagem</SelectItem>
                      <SelectItem value="date">Data</SelectItem>
                      <SelectItem value="boolean">Sim/Não</SelectItem>
                      <SelectItem value="currency">Moeda</SelectItem>
                      <SelectItem value="file">Arquivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-evidencia">Evidência</Label>
                <Input
                  id="edit-evidencia"
                  placeholder="Tipo de documento que será anexado..."
                  value={selectedQuestion.metadata?.evidencia || ""}
                  onChange={(e) =>
                    setSelectedQuestion({
                      ...selectedQuestion,
                      metadata: { ...selectedQuestion.metadata, evidencia: e.target.value },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Descreva o tipo de documento ou evidência esperada</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-obs">Observação</Label>
                <Textarea
                  id="edit-obs"
                  placeholder="Aplicável quando houver impacto financeiro mensurável."
                  value={selectedQuestion.metadata?.obs || ""}
                  onChange={(e) =>
                    setSelectedQuestion({
                      ...selectedQuestion,
                      metadata: { ...selectedQuestion.metadata, obs: e.target.value },
                    })
                  }
                  rows={2}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Texto de observação para a pergunta</p>
              </div>

              <div className="space-y-2">
                <Label>Sub-frameworks</Label>
                <Input
                  placeholder="Ex: 301"
                  value={selectedQuestion.metadata?.subFrameworks || ""}
                  onChange={(e) =>
                    setSelectedQuestion({
                      ...selectedQuestion,
                      metadata: { ...selectedQuestion.metadata, subFrameworks: e.target.value },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Hierarquia de categorias (ex: "301", "Gestão de Materiais"). Serão exibidas como label da questão.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateQuestion} disabled={saving}>
              {saving ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Existing Question Dialog */}
      <Dialog open={showExistingDialog} onOpenChange={setShowExistingDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vincular Questão Existente</DialogTitle>
            <DialogDescription>Selecione uma questão para vincular a este caderno</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {availableQuestions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Todas as questões disponíveis já estão vinculadas a este caderno
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {availableQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{question.label}</p>
                      <p className="text-sm text-muted-foreground mt-1">Tipo: {question.type}</p>
                    </div>
                    <Button size="sm" onClick={() => handleLinkExistingQuestion(question.id)}>
                      Vincular
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowExistingDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular Questão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular esta questão do caderno? A questão não será deletada, apenas
              desvinculada.
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
  )
}
