"use client"

import { useState, useTransition } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { MessageSquare, CheckCircle2, XCircle, AlertTriangle, Send, Loader2, User } from "lucide-react"
import { requestRevision, approveQuestion, rejectQuestion, submitCorrection } from "@/app/actions/review-actions"
import { toast } from "sonner"

interface ReviewPanelProps {
  junctionId: string
  questionId: string
  templateId: string
  currentComment: string | null
  currentAnswer: string | null
  answerStatus: string | null
  userRole: string
  isGestor: boolean
  anoReferencia: number
  onUpdate?: () => void
}

export function ReviewPanel({
  junctionId,
  questionId,
  templateId,
  currentComment,
  currentAnswer,
  answerStatus,
  userRole,
  isGestor,
  anoReferencia,
  onUpdate,
}: ReviewPanelProps) {
  const [comment, setComment] = useState("")
  const [correctedAnswer, setCorrectedAnswer] = useState(currentAnswer || "")
  const [isPending, startTransition] = useTransition()

  const handleRequestRevision = () => {
    console.log("[v0] handleRequestRevision CHAMADO")
    console.log("[v0] Params:", { junctionId, questionId, templateId, comment })
    
    if (!comment.trim()) {
      console.log("[v0] handleRequestRevision: Comentário vazio, mostrando toast de erro")
      toast.error("Digite uma observação para solicitar ajuste")
      return
    }

    console.log("[v0] handleRequestRevision: Iniciando transition")
    
    startTransition(async () => {
      console.log("[v0] handleRequestRevision: Dentro do startTransition, chamando action")
      
      const result = await requestRevision({
        junctionId,
        questionId,
        templateId,
        comment: comment.trim(),
        anoReferencia,
      })

      console.log("[v0] handleRequestRevision: Resultado da action:", result)

      if (result.success) {
        toast.success("Ajuste solicitado com sucesso")
        setComment("")
        onUpdate?.()
      } else {
        toast.error(result.error || "Erro ao solicitar ajuste")
      }
    })
  }

  const handleApprove = () => {
    console.log("[v0] handleApprove CHAMADO")
    console.log("[v0] Params:", { junctionId, questionId, templateId, currentAnswer })
    
    startTransition(async () => {
      console.log("[v0] handleApprove: Dentro do startTransition, chamando action")
      
      const result = await approveQuestion({
        junctionId,
        questionId,
        templateId,
        anoReferencia,
      })

      console.log("[v0] handleApprove: Resultado da action:", result)

      if (result.success) {
        toast.success("Questão aprovada com sucesso")
        onUpdate?.()
      } else {
        toast.error(result.error || "Erro ao aprovar questão")
      }
    })
  }

  const handleReject = () => {
    console.log("[v0] handleReject CHAMADO")
    console.log("[v0] Params:", { junctionId, questionId, templateId, comment })
    
    if (!comment.trim()) {
      console.log("[v0] handleReject: Comentário vazio, mostrando toast de erro")
      toast.error("Digite o motivo da rejeição")
      return
    }

    console.log("[v0] handleReject: Iniciando transition")
    
    startTransition(async () => {
      console.log("[v0] handleReject: Dentro do startTransition, chamando action")
      
      const result = await rejectQuestion({
        junctionId,
        questionId,
        templateId,
        reason: comment.trim(),
        anoReferencia,
      })

      console.log("[v0] handleReject: Resultado da action:", result)

      if (result.success) {
        toast.success("Questão rejeitada")
        setComment("")
        onUpdate?.()
      } else {
        toast.error(result.error || "Erro ao rejeitar questão")
      }
    })
  }

  const handleSubmitCorrection = () => {
    if (!correctedAnswer.trim()) {
      toast.error("Digite a resposta corrigida")
      return
    }

    startTransition(async () => {
      const result = await submitCorrection({
        junctionId,
        questionId,
        templateId,
        newValue: correctedAnswer.trim(),
        anoReferencia,
      })

      if (result.success) {
        toast.success("Correção enviada com sucesso")
        onUpdate?.()
      } else {
        toast.error(result.error || "Erro ao enviar correção")
      }
    })
  }

  const getStatusBadge = () => {
    switch (answerStatus) {
      case "aprovado":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Aprovado</Badge>
      case "revisao":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Em Revisão</Badge>
      case "rejeitado":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeitado</Badge>
      case "reenviado":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Reenviado</Badge>
      case "rascunho":
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Rascunho</Badge>
      default:
        return <Badge variant="outline">Pendente</Badge>
    }
  }

  // Visão do GESTOR / ADMIN
  if (isGestor) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Painel de Revisão
            </CardTitle>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Resposta atual do usuário */}
          {currentAnswer && (
            <div className="rounded-lg bg-muted/50 p-3 border">
              <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                <User className="h-3 w-3" />
                Resposta do Usuário:
              </p>
              <p className="text-sm">{currentAnswer}</p>
            </div>
          )}

          {/* Textarea para observações */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              Observações de Revisão
              <span className="text-xs text-amber-600 font-normal">(obrigatório para Solicitar Ajuste ou Reprovar)</span>
            </label>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Digite o motivo da solicitação de ajuste ou reprovação..."
              rows={3}
              className={`resize-none ${!comment.trim() ? "border-amber-300 focus:border-amber-500" : ""}`}
            />
            {!comment.trim() && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Preencha este campo antes de solicitar ajuste ou reprovar
              </p>
            )}
          </div>

          {/* Botões de ação */}
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleRequestRevision}
              disabled={isPending}
              variant="outline"
              className="bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Solicitar Ajuste
            </Button>

            <Button
              onClick={handleApprove}
              disabled={isPending || !currentAnswer}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Aprovar Questão
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Visão do USUÁRIO - apenas informativo
  return (
    <div className="space-y-3">
      {/* Alerta de revisão se houver comentário do gestor */}
      {currentComment && answerStatus !== "aprovado" && (
        <Alert className="bg-amber-50 border-amber-200">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Ajuste Solicitado pelo Gestor</AlertTitle>
          <AlertDescription className="text-amber-700 mt-2">
            {currentComment}
            <p className="text-xs mt-2 text-amber-600">
              Por favor, corrija sua resposta no campo acima e salve novamente.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Status da questão */}
      {answerStatus && answerStatus !== "rascunho" && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          {getStatusBadge()}
        </div>
      )}

      {/* Mostrar que está aprovado */}
      {answerStatus === "aprovado" && (
        <Alert className="bg-emerald-50 border-emerald-200">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <AlertTitle className="text-emerald-800">Questão Aprovada</AlertTitle>
          <AlertDescription className="text-emerald-700">
            Esta questão foi aprovada pelo gestor e não pode mais ser editada.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
