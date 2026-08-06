"use client"

import { useState, useTransition, Fragment } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  CheckCircle2,
  Loader2,
  Save,
  LinkIcon,
  Edit,
  AlertCircle,
  FileText,
  AlertTriangle,
  Send,
  MessageSquare,
  User,
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import { saveQuestionnaireResponse, deleteUserAnswer } from "@/app/actions/questionnaire-actions"
import { clearRevision } from "@/app/actions/review-actions"
import { ReviewPanel } from "@/components/questionnaire/review-panel"
import { GapAnalysisInput, GapAnalysisReadOnly, GAP_ISO_EMPTY, type GapIsoState } from "@/components/questionnaire/gap-analysis-input"
import { extractCategory, slugifyCategory } from "@/components/questionnaire/questionnaire-sidebar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Question {
  id: string
  label: string
  type: string
  unique_identifier: string
  metadata?: {
    disclosure?: string
    evidencia?: string
    obs_nao_aplicavel?: string
    sub_frameworks?: string[]
    obs?: string
  }
  junction_id?: string
  comment?: string | null
  comment_author_name?: string | null
  comment_author_role?: string | null
}

type SavingStatus = "idle" | "saving" | "saved" | "error"

interface ExistingAnswer {
  value: string
  evidence_url?: string
  status?: string
  value_jsonb?: any
  last_edited_by_name?: string | null
  last_edited_at?: string | null
}

interface QuestionnaireFormProps {
  questions: any[]
  templateId: string
  userId: string
  companyId: string
  holdingId: string | null
  userRole: string
  isGestor: boolean
  existingAnswers?: Record<string, ExistingAnswer>
  answersByQuestion?: Record<string, any[]>
  anoReferencia?: number
  previousYearAnswers?: Record<string, { value: string; value_jsonb?: any }>
}

export function QuestionnaireForm({
  questions,
  templateId,
  userId,
  companyId,
  holdingId,
  userRole,
  isGestor,
  existingAnswers = {},
  answersByQuestion = {},
  anoReferencia,
  previousYearAnswers = {},
}: QuestionnaireFormProps) {
  const currentYear = anoReferencia ?? new Date().getFullYear()
  const router = useRouter()
  
  const [responses, setResponses] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const [qId, data] of Object.entries(existingAnswers)) {
      initial[qId] = data.value || ""
    }
    console.log("[v0] Estado inicial de responses:", initial)
    return initial
  })
  const [driveLinks, setDriveLinks] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const [qId, data] of Object.entries(existingAnswers)) {
      if (data.evidence_url) {
        initial[qId] = data.evidence_url
      }
    }
    return initial
  })
  const [needsJustification, setNeedsJustification] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    for (const [qId, data] of Object.entries(existingAnswers)) {
      // Check if justification exists in value_jsonb
      const valueJsonb = (data as any).value_jsonb
      if (valueJsonb && valueJsonb.justification) {
        initial[qId] = true
      }
    }
    return initial
  })
  const [justifications, setJustifications] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const [qId, data] of Object.entries(existingAnswers)) {
      // Extract justification from value_jsonb
      const valueJsonb = (data as any).value_jsonb
      if (valueJsonb && valueJsonb.justification) {
        initial[qId] = valueJsonb.justification
      }
    }
    return initial
  })
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set(Object.keys(existingAnswers)))
  const [savingQuestion, setSavingQuestion] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [notApplicable, setNotApplicable] = useState<Record<string, boolean>>({})
  const [corrections, setCorrections] = useState<Record<string, string>>({})
  const [submittingCorrection, setSubmittingCorrection] = useState<string | null>(null)
  const [clearingRevision, setClearingRevision] = useState<string | null>(null)
  const [deletingAnswer, setDeletingAnswer] = useState<string | null>(null)
  const [deletedAnswers, setDeletedAnswers] = useState<Set<string>>(new Set())
  const [savingStatus, setSavingStatus] = useState<SavingStatus>("idle")

  // Collapse: questões respondidas começam minimizadas, exceto as com ajuste pendente
  const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(() => {
    const pendingRevisionIds = new Set(questions.filter((q) => q.comment).map((q) => q.id))
    return new Set(
      Object.entries(existingAnswers)
        .filter(([qId, data]) => data.value && data.value.trim() !== "" && !pendingRevisionIds.has(qId))
        .map(([qId]) => qId)
    )
  })

  const toggleCollapsed = (questionId: string) => {
    setCollapsedQuestions((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
      } else {
        next.add(questionId)
      }
      return next
    })
  }

  const [gapAnswers, setGapAnswers] = useState<Record<string, GapIsoState>>(() => {
    const initial: Record<string, GapIsoState> = {}
    for (const [qId, data] of Object.entries(existingAnswers)) {
      const vj = (data as any).value_jsonb
      if (vj && vj.type === "gap_iso") {
        initial[qId] = {
          conformidade: vj.conformidade ?? null,
          gap_identificado: vj.gap_identificado ?? "",
          acao_necessaria: vj.acao_necessaria ?? "",
          prioridade: vj.prioridade ?? null,
          responsavel: vj.responsavel ?? "",
          prazo: vj.prazo ?? "",
        }
      }
    }
    return initial
  })

  const handleResponseChange = (questionId: string, value: string) => {
    setResponses((prev) => ({ ...prev, [questionId]: value }))
    setSavedQuestions((prev) => {
      const next = new Set(prev)
      next.delete(questionId)
      return next
    })
    setNotApplicable((prev) => ({ ...prev, [questionId]: false }))
  }

  const handleDriveLinkChange = (questionId: string, link: string) => {
    setDriveLinks((prev) => ({ ...prev, [questionId]: link }))
  }

  const handleEditClick = (questionId: string) => {
    setEditingQuestion(questionId)
    // Remove from saved questions so the Save button becomes enabled
    setSavedQuestions((prev) => {
      const next = new Set(prev)
      next.delete(questionId)
      return next
    })
  }

  const handleSaveQuestion = async (questionId: string, hasPendingRevision: boolean = false) => {
    const question = questions.find((q) => q.id === questionId)
    const isGapIso = question?.type?.toLowerCase() === "gap_iso"
    const value = responses[questionId]
    const isNA = notApplicable[questionId]

    if (isGapIso) {
      if (!gapAnswers[questionId]?.conformidade) {
        toast.error("Selecione o nível de conformidade antes de salvar.")
        return
      }
    } else {
      if (!value && !isNA) return
      if (needsJustification[questionId] && !justifications[questionId]?.trim()) {
        toast.error("Por favor, preencha a justificativa antes de salvar.")
        return
      }
    }

    setSavingQuestion(questionId)
    setSavingStatus("saving")

    startTransition(async () => {
      const result = await saveQuestionnaireResponse({
        templateId,
        questionId,
        userId,
        companyId,
        holdingId,
        responseValue: isGapIso ? (gapAnswers[questionId]?.conformidade ?? "") : isNA ? "N/A" : value,
        driveLink: driveLinks[questionId] || "",
        justification: !isGapIso && needsJustification[questionId] ? justifications[questionId] : undefined,
        statusOverride: hasPendingRevision ? "corrigido" : undefined,
        anoReferencia: currentYear,
        gapAnalysisData: isGapIso ? gapAnswers[questionId] : undefined,
      })

      if (result.success) {
        setSavedQuestions((prev) => new Set(prev).add(questionId))
        setSavingStatus("saved")
        // Auto-colapsa a questão após salvar com sucesso
        setTimeout(() => {
          setCollapsedQuestions((prev) => new Set(prev).add(questionId))
        }, 1200)
        if (hasPendingRevision) {
          toast.success("Correção enviada com sucesso! Aguardando revisão do gestor.")
          router.refresh()
        } else {
          toast.success("Resposta salva com sucesso!")
        }
      } else if (result.error) {
        setSavingStatus("error")
        toast.error(result.error)
      }
      setSavingQuestion(null)

      setTimeout(() => setSavingStatus("idle"), 3000)
    })
  }

  const handleNotApplicableChange = (questionId: string, checked: boolean) => {
    setNotApplicable((prev) => ({ ...prev, [questionId]: checked }))
    if (checked) {
      setSavedQuestions((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    } else {
      setResponses((prev) => ({ ...prev, [questionId]: "" }))
    }
  }

  const handleClearRevision = async (question: Question) => {
    if (!question.junction_id) return

    setClearingRevision(question.id)

    startTransition(async () => {
      const result = await clearRevision({
        junctionId: question.junction_id!,
        questionId: question.id,
        templateId,
        anoReferencia: currentYear,
      })

      if (result.success) {
        toast.success("Ajuste solicitado foi removido com sucesso!")
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao remover ajuste solicitado")
      }
      setClearingRevision(null)
    })
  }

  const handleDeleteAnswer = async (answerId: string, questionId: string) => {
    if (!confirm("Tem certeza que deseja deletar esta resposta? Esta ação não pode ser desfeita.")) {
      return
    }

    setDeletingAnswer(answerId)

    startTransition(async () => {
      const result = await deleteUserAnswer({
        answerId,
        templateId,
        questionId,
        deletedByUserId: userId,
        reason: "Deletado pelo gestor",
      })

      if (result.success) {
        // Adicionar ao set de respostas deletadas para remover do UI imediatamente
        setDeletedAnswers((prev) => new Set(prev).add(answerId))
        
        // Limpar os responses e outros estados relacionados à quest��o
        setResponses((prev) => {
          const newResponses = { ...prev }
          delete newResponses[questionId]
          return newResponses
        })
        
        setSavedQuestions((prev) => {
          const newSet = new Set(prev)
          newSet.delete(questionId)
          return newSet
        })
        
        toast.success("Resposta deletada com sucesso!")
        // Aguardar um pouco antes de atualizar para garantir que o estado foi atualizado
        setTimeout(() => {
          router.refresh()
        }, 100)
      } else {
        toast.error(result.error || "Erro ao deletar resposta")
      }
      setDeletingAnswer(null)
    })
  }

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (!numbers) return ""
    const amount = Number.parseFloat(numbers) / 100
    return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleCurrencyChange = (questionId: string, inputValue: string) => {
    const numbers = inputValue.replace(/\D/g, "")
    if (numbers) {
      const formatted = formatCurrency(inputValue)
      setResponses((prev) => ({ ...prev, [questionId]: formatted }))
    } else {
      setResponses((prev) => ({ ...prev, [questionId]: "" }))
    }
    setSavedQuestions((prev) => {
      const next = new Set(prev)
      next.delete(questionId)
      return next
    })
    setNotApplicable((prev) => ({ ...prev, [questionId]: false }))
  }

  const renderQuestionInputReadOnly = (question: Question, answerValue: string) => {
    const questionType = question.type?.toLowerCase() || "texto"
    const value = answerValue || "Sem resposta"

    switch (questionType) {
      case "sim_nao":
        return (
          <div className="flex gap-4">
            <Badge variant={value === "sim" ? "default" : "outline"} className="px-3 py-1">
              {value === "sim" ? "✓ Sim" : "Sim"}
            </Badge>
            <Badge variant={value === "nao" ? "default" : "outline"} className="px-3 py-1">
              {value === "nao" ? "✓ Não" : "Não"}
            </Badge>
            <Badge variant={value === "na" ? "default" : "outline"} className="px-3 py-1">
              {value === "na" ? "✓ N/A" : "N/A"}
            </Badge>
          </div>
        )

      case "moeda":
      case "currency":
      case "monetario":
        return (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">R$</span>
            <span className="font-medium">{value}</span>
          </div>
        )

      case "numero":
      case "number":
        return <span className="font-medium">{value}</span>

      case "porcentagem":
      case "percentage":
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{value}</span>
            <span className="text-muted-foreground">%</span>
          </div>
        )

      case "data":
      case "date":
        return <span className="font-medium">{value}</span>

      case "multipla_escolha":
        return (
          <Badge variant="secondary" className="px-3 py-1">
            {value}
          </Badge>
        )

      case "texto_longo":
      case "long_text":
      case "texto":
      case "text":
      default:
        return <p className="text-sm whitespace-pre-wrap">{value}</p>
    }
  }

  // Versão para gestores: renderiza com valor específico (somente leitura)
  const renderQuestionInputWithValue = (question: Question, inputValue: string) => {
    const value = inputValue || ""
    const questionType = question.type?.toLowerCase() || "texto"

    switch (questionType) {
      case "sim_nao":
        return (
          <RadioGroup value={value} disabled className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id={`${question.id}-sim-gestor`} />
              <Label htmlFor={`${question.id}-sim-gestor`}>Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id={`${question.id}-nao-gestor`} />
              <Label htmlFor={`${question.id}-nao-gestor`}>Não</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="na" id={`${question.id}-na-gestor`} />
              <Label htmlFor={`${question.id}-na-gestor`}>N/A</Label>
            </div>
          </RadioGroup>
        )

      case "moeda":
      case "currency":
      case "monetario":
        return (
          <div className="flex items-center gap-2 max-w-xs">
            <span className="text-muted-foreground font-medium">R$</span>
            <Input type="text" value={value} disabled className="text-right" />
          </div>
        )

      case "numero":
      case "number":
        return <Input type="number" step="any" value={value} disabled />

      case "porcentagem":
      case "percentage":
        return (
          <div className="flex items-center gap-2 max-w-xs">
            <Input type="number" min="0" max="100" step="0.01" value={value} disabled className="text-right" />
            <span className="text-muted-foreground font-medium">%</span>
          </div>
        )

      case "data":
      case "date":
        return <Input type="date" value={value} disabled />

      case "multipla_escolha":
        const options = question.metadata?.sub_frameworks || []
        return (
          <RadioGroup value={value} disabled>
            {options.map((option: string, idx: number) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-gestor-${idx}`} />
                <Label htmlFor={`${question.id}-gestor-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "texto_longo":
      case "long_text":
        return <Textarea value={value} disabled rows={4} className="resize-y min-h-[100px]" />

      case "texto":
      case "text":
      default:
        return <Textarea value={value} disabled rows={2} className="resize-y" />
    }
  }

  const renderQuestionInput = (question: Question) => {
    const value = responses[question.id] || ""
    const questionType = question.type?.toLowerCase() || "texto"

    switch (questionType) {
      case "sim_nao":
        return (
          <RadioGroup value={value} onValueChange={(v) => handleResponseChange(question.id, v)} className="flex gap-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id={`${question.id}-sim`} />
              <Label htmlFor={`${question.id}-sim`}>Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id={`${question.id}-nao`} />
              <Label htmlFor={`${question.id}-nao`}>Não</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="na" id={`${question.id}-na`} />
              <Label htmlFor={`${question.id}-na`}>N/A</Label>
            </div>
          </RadioGroup>
        )

      case "moeda":
      case "currency":
      case "monetario":
        return (
          <div className="flex items-center gap-2 max-w-xs">
            <span className="text-muted-foreground font-medium">R$</span>
            <Input
              type="text"
              value={value}
              onChange={(e) => handleCurrencyChange(question.id, e.target.value)}
              placeholder="0,00"
              className="text-right"
            />
          </div>
        )

      case "numero":
      case "number":
        return (
          <Input
            type="number"
            step="any"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Digite um número..."
            className="max-w-xs"
          />
        )

      case "porcentagem":
      case "percentage":
        return (
          <div className="flex items-center gap-2 max-w-xs">
            <Input
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={value}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              placeholder="0"
              className="text-right"
            />
            <span className="text-muted-foreground font-medium">%</span>
          </div>
        )

      case "data":
      case "date":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            className="max-w-xs"
          />
        )

      case "texto_curto":
      case "text_short":
      case "short_text":
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Digite sua resposta..."
            className="max-w-2xl"
          />
        )

      case "email":
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="exemplo@email.com"
            className="max-w-md"
          />
        )

      case "telefone":
      case "phone":
        return (
          <Input
            type="tel"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="(00) 00000-0000"
            className="max-w-xs"
          />
        )

      case "url":
      case "link":
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="https://exemplo.com"
            className="max-w-2xl"
          />
        )

      case "multipla_escolha":
        const options = question.metadata?.sub_frameworks || ["Opção 1", "Opção 2", "Opção 3"]
        return (
          <RadioGroup value={value} onValueChange={(v) => handleResponseChange(question.id, v)} className="space-y-2">
            {options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${question.id}-${idx}`} />
                <Label htmlFor={`${question.id}-${idx}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        )

      case "gap_iso": {
        const isDisabled = savedQuestions.has(question.id) || isQuestionLocked(question)
        return (
          <GapAnalysisInput
            questionId={question.id}
            value={gapAnswers[question.id] ?? GAP_ISO_EMPTY}
            onChange={(qId, update) => {
              setGapAnswers((prev) => ({
                ...prev,
                [qId]: { ...GAP_ISO_EMPTY, ...prev[qId], ...update },
              }))
              setSavedQuestions((prev) => {
                const next = new Set(prev)
                next.delete(qId)
                return next
              })
            }}
            disabled={isDisabled}
          />
        )
      }

      case "texto_longo":
      case "long_text":
      case "texto":
      case "text":
      default:
        return (
          <Textarea
            value={value}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Digite sua resposta..."
            rows={4}
            className="resize-y min-h-[100px]"
          />
        )
    }
  }

  const isQuestionLocked = (question: Question) => {
    const answerData = existingAnswers[question.id]
    return answerData?.status === "aprovado"
  }

  const hasRevisionPending = (question: Question) => {
    return !!question.comment
  }

  console.log("[v0] QuestionnaireForm recebeu:", {
    existingAnswersKeys: Object.keys(existingAnswers),
    answersByQuestionKeys: Object.keys(answersByQuestion),
    isGestor,
    questionsWithComments: questions.filter(q => q.comment).map(q => ({
      id: q.id,
      label: q.label,
      comment: q.comment,
      junction_id: q.junction_id
    }))
  })

  return (
    <div className="space-y-8 scroll-smooth">
      {/* Indicador global de salvamento */}
      {savingStatus !== "idle" && (
        <div
          data-testid="saving-status-badge"
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-lg ring-1 transition-all duration-300 ${
            savingStatus === "saving"
              ? "bg-zinc-900 text-zinc-100 ring-zinc-700"
              : savingStatus === "saved"
                ? "bg-emerald-950 text-emerald-300 ring-emerald-700"
                : "bg-red-950 text-red-300 ring-red-700"
          }`}
        >
          {savingStatus === "saving" && (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Salvando...
            </>
          )}
          {savingStatus === "saved" && (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Salvo
            </>
          )}
          {savingStatus === "error" && (
            <>
              <AlertCircle className="h-3.5 w-3.5" />
              Erro ao salvar
            </>
          )}
        </div>
      )}

      {questions.map((question, index) => {
        // Detecta mudança de categoria para injetar âncora de scroll
        const category = extractCategory(question)
        const prevCategory = index > 0 ? extractCategory(questions[index - 1]) : null
        const isCategoryStart = category !== prevCategory

        const isSaved = savedQuestions.has(question.id)
        const isSaving = savingQuestion === question.id
        const isGapIso = question.type?.toLowerCase() === "gap_iso"
        const hasValue = isGapIso
          ? !!gapAnswers[question.id]?.conformidade
          : !!responses[question.id]
        const needsJustificationChecked = needsJustification[question.id]
        const hasJustification = !needsJustificationChecked || !!justifications[question.id]
        const isNA = notApplicable[question.id]
        const questionNumber = index + 1
        const userAnswers = answersByQuestion[question.id] || []
        const currentAnswer = responses[question.id] || userAnswers[0]?.value || ""
        const answerStatus = userAnswers[0]?.status || "rascunho"
        const isLocked = isQuestionLocked(question)
        const hasPendingRevision = hasRevisionPending(question)
        const isSubmittingCorrection = submittingCorrection === question.id
        const isCollapsed = collapsedQuestions.has(question.id)

        return (
          <Fragment key={question.id}>
            {/* Âncora invisível para scroll da sidebar */}
            {isCategoryStart && (
              <div
                id={`category-${slugifyCategory(category)}`}
                className="scroll-mt-24"
                aria-hidden="true"
              />
            )}
          <Card
            className={`transition-all ${
              isLocked
                ? "border-emerald-300 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20"
                : "border-border/50 bg-card hover:border-primary/30 hover:shadow-lg dark:border-border dark:hover:border-primary/50"
            }`}
          >
            <CardHeader className={cn("space-y-4", isCollapsed ? "pb-5" : "pb-4")}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-4 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-medium">
                      Questão {questionNumber}
                    </Badge>
                    {isLocked && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aprovada
                      </Badge>
                    )}
                    {answerStatus === "corrigido" && !isLocked && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Correção Enviada
                      </Badge>
                    )}
                    {hasPendingRevision && !isLocked && answerStatus !== "corrigido" && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Ajuste Solicitado
                      </Badge>
                    )}
                    {answerStatus === "reenviado" && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">Reenviado</Badge>
                    )}
                    {isSaved && !isLocked && !hasPendingRevision && (
                      <Badge variant="outline" className="text-emerald-700 border-emerald-300 bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:bg-emerald-950/40">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Respondida
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-xl font-bold leading-tight text-foreground">{question.label}</h3>

                  {!isCollapsed && question.metadata?.obs && (
                    <p className="text-base font-normal text-muted-foreground leading-relaxed">
                      {question.metadata.obs}
                    </p>
                  )}
                </div>

                {/* Botão de collapse */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCollapsed(question.id)}
                  aria-label={isCollapsed ? "Expandir questão" : "Minimizar questão"}
                  className="mt-0.5 shrink-0 h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  {isCollapsed ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronUp className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {hasPendingRevision && !isLocked && answerStatus !== "corrigido" && (
                <Alert className="mt-4 bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      Ajuste Solicitado pelo Gestor
                      {question.comment_author_name && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          <User className="h-3 w-3 mr-1" />
                          {question.comment_author_name}
                        </Badge>
                      )}
                    </div>
                    {isGestor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleClearRevision(question)}
                        disabled={clearingRevision === question.id}
                        className="h-7 text-xs hover:bg-amber-100 hover:text-amber-900"
                      >
                        {clearingRevision === question.id ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Excluindo...
                          </>
                        ) : (
                          "Excluir Ajuste"
                        )}
                      </Button>
                    )}
                  </AlertTitle>
                  <AlertDescription className="text-amber-700 mt-2">{question.comment}</AlertDescription>
                </Alert>
              )}

              {answerStatus === "corrigido" && !isLocked && (
                <Alert className="mt-4 bg-blue-50 border-blue-200">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800">Correção Enviada com Sucesso</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Sua correção foi enviada e está aguardando revisão do gestor.
                  </AlertDescription>
                </Alert>
              )}

              {isLocked && (
                <Alert className="mt-4 bg-emerald-50 border-emerald-200">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <AlertTitle className="text-emerald-800">Questão Aprovada</AlertTitle>
                  <AlertDescription className="text-emerald-700">
                    Esta questão foi aprovada e não pode mais ser editada.
                  </AlertDescription>
                </Alert>
              )}

              {(question.metadata?.evidencia || question.metadata?.obs_nao_aplicavel) && (
                <div className="mt-4 space-y-3">
                  {question.metadata.evidencia && (
                    <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-start gap-2">
                        <LinkIcon className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-purple-900 dark:text-purple-100 mb-1">
                            Evidências Necessárias:
                          </p>
                          <p className="text-sm text-purple-800 dark:text-purple-200">{question.metadata.evidencia}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {question.metadata.obs_nao_aplicavel &&
                    question.metadata.obs_nao_aplicavel.trim().length > 0 &&
                    question.metadata.obs_nao_aplicavel.trim() !== "-" && (
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-amber-900 dark:text-amber-100 mb-1">Atenção:</p>
                          <p className="text-sm text-amber-800 dark:text-amber-200">
                            {question.metadata.obs_nao_aplicavel}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardHeader>

            {/* Corpo do card com animação de collapse via CSS grid */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isCollapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"
              )}
            >
              <div className="overflow-hidden">
            <CardContent className="space-y-4">
              {isGestor && userAnswers.length > 0 ? (
                // Visão do Gestor - Mostrar respostas dos usuários (EXATAMENTE como aparecem para o usuário)
                <div className="space-y-4">
                  {userAnswers
                    .filter((answer) => answer.id && !deletedAnswers.has(answer.id))
                    .map((answer, idx) => {
                      const userName = answer.profiles?.full_name || answer.profiles?.email || "Usuário"
                      const answerValue = answer.value || ""
                      const answerValueJsonb = answer.value_jsonb || {}
                      const isNA = answerValue === "N/A" || answerValue.includes("Não aplicável")
                      const hasJustification = answerValueJsonb.justification

                      return (
                        <div
                          key={answer.id || idx}
                          className="space-y-4 p-4 rounded-lg bg-amber-50/30 border border-amber-200"
                        >
                        {/* Header com nome do usuário, status e botão de deletar */}
                        <div className="flex items-center justify-between pb-3 border-b border-amber-200">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              <User className="h-3 w-3 mr-1" />
                              {userName}
                            </Badge>
                            <Badge
                              variant={
                                answer.status === "aprovado"
                                  ? "default"
                                  : answer.status === "corrigido"
                                    ? "secondary"
                                    : "outline"
                              }
                              className={
                                answer.status === "aprovado"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : answer.status === "corrigido"
                                    ? "bg-blue-100 text-blue-700"
                                    : ""
                              }
                            >
                              {answer.status === "aprovado"
                                ? "Aprovado"
                                : answer.status === "corrigido"
                                  ? "Corrigido"
                                  : answer.status || "Rascunho"}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAnswer(answer.id, question.id)}
                            disabled={deletingAnswer === answer.id}
                            className="h-7 text-xs hover:bg-red-100 hover:text-red-700 text-red-600"
                          >
                            {deletingAnswer === answer.id ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                Deletando...
                              </>
                            ) : (
                              <>
                                <Trash2 className="h-3 w-3 mr-1" />
                                Deletar
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Não Aplicável - Se marcado */}
                        {isNA && (
                          <div className="flex items-center space-x-2 p-3 rounded-lg border border-amber-300 bg-amber-50">
                            <Checkbox checked={true} disabled={true} />
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-amber-600" />
                              Marcado como Não Aplicável
                            </Label>
                          </div>
                        )}

                        {/* Resposta do Usuário - Renderizar com valores do Supabase */}
                        {isNA ? (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Motivo da Não Aplicabilidade:</Label>
                            <Select value={answerValue} disabled>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Selecione o motivo..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Não aplicável">Não aplicável</SelectItem>
                                <SelectItem value="Proibições legais">Proibições legais</SelectItem>
                                <SelectItem value="Restrições de confidencialidade">
                                  Restrições de confidencialidade
                                </SelectItem>
                                <SelectItem value="Informação indisponível/incompleta">
                                  Informação indisponível/incompleta
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ) : question.type?.toLowerCase() === "gap_iso" ? (
                          <GapAnalysisReadOnly value={answerValueJsonb} />
                        ) : (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Resposta do Usuário:</Label>
                            {renderQuestionInputWithValue(question, answerValue)}
                          </div>
                        )}

                        {/* Justificativa - Se houver */}
                        {hasJustification && (
                          <div className="space-y-3 pt-2 border-t border-amber-200">
                            <div className="flex items-center space-x-2">
                              <Checkbox checked={true} disabled={true} />
                              <Label className="text-sm font-medium flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                Justificativa adicionada pelo usuário
                              </Label>
                            </div>
                            <div className="ml-6 space-y-2">
                              <Label className="text-sm text-muted-foreground">Justificativa:</Label>
                              <div className="p-3 rounded-lg border bg-white opacity-80">
                                <p className="text-sm whitespace-pre-wrap">{answerValueJsonb.justification}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Link de Comprovação - Se houver */}
                        {answer.evidence_url && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium flex items-center gap-2">
                              <LinkIcon className="h-4 w-4 text-primary" />
                              Link de Comprovação
                            </Label>
                            <div className="p-3 rounded-lg border bg-white flex items-center gap-2">
                              <LinkIcon className="h-4 w-4 text-primary" />
                              <a
                                href={answer.evidence_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm hover:underline text-primary flex-1 truncate"
                              >
                                {answer.evidence_url}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Status Visual */}
                        <div className="flex items-center gap-2 pt-3 border-t border-amber-200">
                          <CheckCircle2
                            className={`h-5 w-5 ${
                              answer.status === "aprovado"
                                ? "text-emerald-600"
                                : answer.status === "corrigido"
                                  ? "text-blue-600"
                                  : "text-gray-400"
                            }`}
                          />
                          <span
                            className={`text-sm font-medium ${
                              answer.status === "aprovado"
                                ? "text-emerald-600"
                                : answer.status === "corrigido"
                                  ? "text-blue-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {answer.status === "aprovado"
                              ? "Resposta aprovada"
                              : answer.status === "corrigido"
                                ? "Correção enviada pelo usuário"
                                : "Aguardando revisão"}
                          </span>
                        </div>
                      </div>
                    )
                  })}

                  {/* ReviewPanel para gestor adicionar comentários/aprovar/reprovar */}
                  <ReviewPanel
                    junctionId={question.junction_id || ""}
                    questionId={question.id}
                    templateId={templateId}
                    currentComment={question.comment}
                    currentAnswer={userAnswers[0]?.value || null}
                    answerStatus={answerStatus}
                    userRole={userRole}
                    isGestor={isGestor}
                    anoReferencia={currentYear}
                    onUpdate={() => {
                      toast.success("Atualização salva")
                    }}
                  />
                </div>
              ) : !isLocked ? (
                // Campos editáveis (normal ou em correção) - Visão do Usuário
                <>
                  {!isGapIso && (
                    <div className="flex items-center space-x-2 p-3 rounded-lg border border-muted bg-muted/30">
                      <Checkbox
                        id={`na-${question.id}`}
                        checked={isNA || false}
                        onCheckedChange={(checked) => handleNotApplicableChange(question.id, checked as boolean)}
                        disabled={isSaved || isLocked}
                      />
                      <Label
                        htmlFor={`na-${question.id}`}
                        className="text-sm font-medium cursor-pointer flex items-center gap-2"
                      >
                        <AlertCircle className="h-4 w-4 text-amber-600" />
                        Marcar como Não Aplicável
                      </Label>
                    </div>
                  )}

                  {!isGapIso && isNA ? (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Motivo da Não Aplicabilidade:</Label>
                      <Select
                        value={responses[question.id] || ""}
                        onValueChange={(value) => handleResponseChange(question.id, value)}
                        disabled={isSaved || isLocked}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o motivo..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Não aplicável">Não aplicável</SelectItem>
                          <SelectItem value="Proibições legais">Proibições legais</SelectItem>
                          <SelectItem value="Restrições de confidencialidade">
                            Restrições de confidencialidade
                          </SelectItem>
                          <SelectItem value="Informação indisponível/incompleta">
                            Informação indisponível/incompleta
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {!isGapIso && <Label className="text-sm font-medium">Sua Resposta:</Label>}
                      <div className={!isGapIso && (isSaved || isLocked) ? "opacity-60 pointer-events-none" : ""}>
                        {renderQuestionInput(question)}
                      </div>
                      {existingAnswers[question.id]?.last_edited_by_name && (
                        <p className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                          <User className="h-3 w-3 shrink-0" />
                          Última edição por{" "}
                          <span className="font-medium">{existingAnswers[question.id].last_edited_by_name}</span>
                          {existingAnswers[question.id].last_edited_at && (
                            <>
                              {" "}em{" "}
                              <span className="font-medium">
                                {new Intl.DateTimeFormat("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }).format(new Date(existingAnswers[question.id].last_edited_at!))}
                              </span>
                            </>
                          )}
                        </p>
                      )}
                      {!isGapIso && previousYearAnswers[question.id] && (
                        <p className="mt-1.5 text-xs text-muted-foreground border-l-2 border-muted pl-2">
                          Sua resposta em {currentYear - 1}:{" "}
                          <span className="font-medium">{previousYearAnswers[question.id].value || "—"}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {!isGapIso && (
                    <div className="space-y-3 pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`justify-${question.id}`}
                          checked={needsJustification[question.id] || false}
                          onCheckedChange={(checked) =>
                            setNeedsJustification((prev) => ({ ...prev, [question.id]: checked as boolean }))
                          }
                          disabled={isSaved || isLocked}
                        />
                        <Label
                          htmlFor={`justify-${question.id}`}
                          className="text-sm font-medium cursor-pointer flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          Adicionar justificativa ou observação
                        </Label>
                      </div>

                      {needsJustification[question.id] && (
                        <div className="ml-6 space-y-2 animate-in slide-in-from-top-2">
                          <Label htmlFor={`justification-${question.id}`} className="text-sm text-muted-foreground">
                            Justificativa:
                          </Label>
                          <Textarea
                            id={`justification-${question.id}`}
                            value={justifications[question.id] || ""}
                            onChange={(e) => setJustifications((prev) => ({ ...prev, [question.id]: e.target.value }))}
                            placeholder="Explique o motivo da sua resposta, adicione contexto ou observações importantes..."
                            rows={4}
                            disabled={isSaved || isLocked}
                            className="resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            Use este espaço para fornecer contexto adicional, explicar exceções ou detalhar sua resposta.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {!isGapIso && (
                    <div className="space-y-2">
                      <Label htmlFor={`drive-${question.id}`} className="text-sm font-medium flex items-center gap-2">
                        <LinkIcon className="h-4 w-4 text-primary" />
                        Link de Comprovação
                      </Label>
                      <Input
                        id={`drive-${question.id}`}
                        type="url"
                        value={driveLinks[question.id] || ""}
                        onChange={(e) => handleDriveLinkChange(question.id, e.target.value)}
                        placeholder="Cole o link do Google Drive com os documentos comprobatórios..."
                        className="text-sm"
                        disabled={isSaved || isLocked}
                      />
                      <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <LinkIcon className="h-3 w-3 mt-0.5 shrink-0" />
                        Adicione links para documentos que comprovem suas respostas (Google Drive, SharePoint, etc.)
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    {isSaved && !isLocked ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">Resposta salva</span>
                      </div>
                    ) : isLocked ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm text-emerald-600 font-medium">Aprovada pelo gestor</span>
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-2">
                      {isSaved && !isLocked && (
                        <Button variant="outline" size="sm" onClick={() => handleEditClick(question.id)}>
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      )}

                      {!isLocked && (
                        <Button
                          onClick={() => handleSaveQuestion(question.id, hasPendingRevision)}
                          disabled={
                            isSaving ||
                            (!hasValue && !isNA) ||
                            (needsJustificationChecked && !hasJustification) ||
                            (isSaved && !hasPendingRevision)
                          }
                          size="sm"
                          className={hasPendingRevision ? "bg-amber-600 hover:bg-amber-700" : ""}
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              Salvando...
                            </>
                          ) : hasPendingRevision ? (
                            <>
                              <Send className="h-4 w-4 mr-1" />
                              Enviar Correção
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-1" />
                              Salvar Resposta
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="mt-4">
                  <ReviewPanel
                    junctionId={question.junction_id || ""}
                    questionId={question.id}
                    templateId={templateId}
                    currentComment={question.comment}
                    currentAnswer={userAnswers[0]?.value || null}
                    answerStatus={answerStatus}
                    userRole={userRole}
                    isGestor={isGestor}
                    anoReferencia={currentYear}
                    onUpdate={() => {
                      // Refresh local state instead of reloading
                      toast.success("Atualização salva")
                    }}
                  />
                </div>
              )}
            </CardContent>
              </div>
            </div>
          </Card>
          </Fragment>
        )
      })}
    </div>
  )
}
