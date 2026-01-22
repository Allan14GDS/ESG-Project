"use client"

import { useState, useTransition } from "react"
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
} from "lucide-react"
import { saveQuestionnaireResponse } from "@/app/actions/questionnaire-actions"
import { ReviewPanel } from "@/components/questionnaire/review-panel"
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

interface QuestionnaireFormProps {
  questions: any[]
  templateId: string
  userId: string
  companyId: string
  holdingId: string | null
  userRole: string
  isGestor: boolean
  existingAnswers?: Record<string, { value: string; evidence_url?: string; status?: string }>
  answersByQuestion?: Record<string, any[]>
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
}: QuestionnaireFormProps) {
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
  const [needsJustification, setNeedsJustification] = useState<Record<string, boolean>>({})
  const [justifications, setJustifications] = useState<Record<string, string>>({})
  const [savedQuestions, setSavedQuestions] = useState<Set<string>>(new Set(Object.keys(existingAnswers)))
  const [savingQuestion, setSavingQuestion] = useState<string | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [notApplicable, setNotApplicable] = useState<Record<string, boolean>>({})
  const [corrections, setCorrections] = useState<Record<string, string>>({})
  const [submittingCorrection, setSubmittingCorrection] = useState<string | null>(null)

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
    const value = responses[questionId]
    const isNA = notApplicable[questionId]

    if (!value && !isNA) return

    if (needsJustification[questionId] && !justifications[questionId]?.trim()) {
      toast.error("Por favor, preencha a justificativa antes de salvar.")
      return
    }

    setSavingQuestion(questionId)

    startTransition(async () => {
      const result = await saveQuestionnaireResponse({
        templateId,
        questionId,
        userId,
        companyId,
        holdingId,
        responseValue: isNA ? "N/A" : value,
        driveLink: driveLinks[questionId] || "",
        justification: needsJustification[questionId] ? justifications[questionId] : undefined,
        statusOverride: hasPendingRevision ? "corrigido" : undefined,
      })

      if (result.success) {
        setSavedQuestions((prev) => new Set(prev).add(questionId))
        if (hasPendingRevision) {
          toast.success("Correção enviada com sucesso! Aguardando revisão do gestor.")
          // Atualizar a página para refletir o novo status
          router.refresh()
        } else {
          toast.success("Resposta salva com sucesso!")
        }
      } else if (result.error) {
        toast.error(result.error)
      }
      setSavingQuestion(null)
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
    isGestor
  })

  return (
    <div className="space-y-8">
      {questions.map((question, index) => {
        const isSaved = savedQuestions.has(question.id)
        const isSaving = savingQuestion === question.id
        const hasValue = !!responses[question.id]
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

        return (
          <Card
            key={question.id}
            className={`transition-all ${
              isLocked
                ? "border-emerald-300 bg-emerald-50/30 dark:border-emerald-800 dark:bg-emerald-950/20"
                : "border-border/50 bg-card hover:border-primary/30 hover:shadow-lg dark:border-border dark:hover:border-primary/50"
            }`}
          >
            <CardHeader className="space-y-4 pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs font-medium">
                      Questão {questionNumber}
                    </Badge>
                    {isLocked && (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Aprovada
                      </Badge>
                    )}
                    {answerStatus === "corrigido" && !isLocked && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Correção Enviada
                      </Badge>
                    )}
                    {hasPendingRevision && !isLocked && answerStatus !== "corrigido" && (
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Ajuste Solicitado
                      </Badge>
                    )}
                    {answerStatus === "reenviado" && (
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200">Reenviado</Badge>
                    )}
                    {isSaved && !isLocked && !hasPendingRevision && (
                      <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Respondida
                      </Badge>
                    )}
                  </div>

                  <h1 className="text-2xl font-bold leading-tight text-foreground">{question.label}</h1>

                  {question.metadata?.obs && (
                    <h2 className="text-base font-normal text-muted-foreground leading-relaxed">
                      {question.metadata.obs}
                    </h2>
                  )}
                </div>
              </div>

              {hasPendingRevision && !isLocked && answerStatus !== "corrigido" && (
                <Alert className="mt-4 bg-amber-50 border-amber-200">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800 flex items-center gap-2">
                    Ajuste Solicitado pelo Gestor
                    {question.comment_author_name && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        <User className="h-3 w-3 mr-1" />
                        {question.comment_author_name}
                      </Badge>
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

                  {question.metadata.obs_nao_aplicavel && (
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
            <CardContent className="space-y-4">
              {isGestor && userAnswers.length > 0 ? (
                // Visão do Gestor - Mostrar respostas dos usuários (EXATAMENTE como aparecem para o usuário)
                <div className="space-y-4">
                  {userAnswers.map((answer, idx) => {
                    const userName = answer.profiles?.full_name || answer.profiles?.email || "Usuário"
                    const answerValue = answer.value || ""
                    const answerValueJsonb = answer.value_jsonb || {}
                    const isNA = answerValue === "N/A" || answerValue.includes("Não aplicável")
                    const hasJustification = answerValueJsonb.justification
                    
                    return (
                      <div key={idx} className="space-y-4 p-4 rounded-lg bg-amber-50/30 border border-amber-200">
                        {/* Header com nome do usuário e status */}
                        <div className="flex items-center justify-between pb-3 border-b border-amber-200">
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
                    onUpdate={() => {
                      toast.success("Atualização salva")
                    }}
                  />
                </div>
              ) : !isLocked ? (
                // Campos editáveis (normal ou em correção) - Visão do Usuário
                <>
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

                  {isNA ? (
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
                      <Label className="text-sm font-medium">Sua Resposta:</Label>
                      <div className={isSaved || isLocked ? "opacity-60 pointer-events-none" : ""}>
                        {renderQuestionInput(question)}
                      </div>
                    </div>
                  )}

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
                    onUpdate={() => {
                      // Refresh local state instead of reloading
                      toast.success("Atualização salva")
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
