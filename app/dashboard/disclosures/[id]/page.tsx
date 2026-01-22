"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  ArrowLeft,
  Save,
  Send,
  FileText,
  Upload,
  User,
  Clock,
  AlertTriangle,
  History,
  CheckCircle2,
} from "lucide-react"
import type { DisclosureData } from "@/types/disclosures"
import { supabaseSyncService } from "@/lib/supabase-sync"
import { useToast } from "@/hooks/use-toast"

export default function DisclosureDetailPage() {
  const params = useParams()
  const disclosureId = params.id as string
  const { toast } = useToast()

  const [disclosure, setDisclosure] = useState<DisclosureData | null>(null)
  const [response, setResponse] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedResponses, setSavedResponses] = useState<any[]>([])
  const [responseHistory, setResponseHistory] = useState<any[]>([])

  useEffect(() => {
    loadDisclosure()
  }, [disclosureId])

  const loadDisclosure = async () => {
    if (typeof window === "undefined") return

    const disclosures = localStorage.getItem("esg-disclosures")
    if (!disclosures) {
      setIsLoading(false)
      return
    }

    const allDisclosures = JSON.parse(disclosures) as DisclosureData[]
    const found = allDisclosures.find((d) => d.id === disclosureId)

    if (found) {
      setDisclosure(found)

      try {
        const responses = await supabaseSyncService.getResponses(disclosureId)
        setSavedResponses(responses)

        // If we have a saved response, use it
        if (responses.length > 0) {
          const latestResponse = responses[0]
          setResponse(latestResponse.response_value || "")
        } else {
          setResponse(found.response || "")
        }

        // Load response history
        if (responses.length > 0) {
          const history = await supabaseSyncService.getResponseHistory(disclosureId, "main")
          setResponseHistory(history)
        }
      } catch (error) {
        console.error("[v0] Error loading responses from Supabase:", error)
        // Fallback to localStorage data
        setResponse(found.response || "")
      }
    }

    setIsLoading(false)
  }

  const handleSave = async () => {
    if (!disclosure) return

    setIsSaving(true)

    try {
      await supabaseSyncService.saveResponse(
        disclosureId,
        "main", // question_id for the main response
        disclosure.title,
        response,
        "text",
        [],
      )

      const progress = response.trim() ? 50 : 0
      const status = response.trim() ? "in_progress" : "not_started"

      await supabaseSyncService.updateDisclosureStatus(disclosureId, status, progress)

      // Update localStorage for backward compatibility
      const disclosures = localStorage.getItem("esg-disclosures")
      if (disclosures) {
        const allDisclosures = JSON.parse(disclosures) as DisclosureData[]
        const index = allDisclosures.findIndex((d) => d.id === disclosureId)

        if (index !== -1) {
          allDisclosures[index] = {
            ...allDisclosures[index],
            response,
            status: status as any,
            updatedAt: new Date(),
          }

          localStorage.setItem("esg-disclosures", JSON.stringify(allDisclosures))
          setDisclosure(allDisclosures[index])
        }
      }

      // Disparar evento para atualizar Kanban
      window.dispatchEvent(new Event("esg-data-updated"))

      toast({
        title: "Rascunho salvo",
        description: "Suas alterações foram salvas com sucesso.",
      })

      // Reload responses to show updated history
      await loadDisclosure()
    } catch (error) {
      console.error("[v0] Error saving response:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas alterações. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!disclosure) return

    setIsSaving(true)

    try {
      await supabaseSyncService.saveResponse(disclosureId, "main", disclosure.title, response, "text", [])

      await supabaseSyncService.updateDisclosureStatus(disclosureId, "under_review", 100)

      // Update localStorage
      const disclosures = localStorage.getItem("esg-disclosures")
      if (disclosures) {
        const allDisclosures = JSON.parse(disclosures) as DisclosureData[]
        const index = allDisclosures.findIndex((d) => d.id === disclosureId)

        if (index !== -1) {
          allDisclosures[index] = {
            ...allDisclosures[index],
            response,
            status: "under_review",
            updatedAt: new Date(),
          }

          localStorage.setItem("esg-disclosures", JSON.stringify(allDisclosures))
        }
      }

      // Disparar evento para atualizar Kanban
      window.dispatchEvent(new Event("esg-data-updated"))

      toast({
        title: "Submetido para revisão",
        description: "Seu disclosure foi enviado para revisão com sucesso.",
      })

      setTimeout(() => {
        window.location.href = "/dashboard/status"
      }, 1000)
    } catch (error) {
      console.error("[v0] Error submitting response:", error)
      toast({
        title: "Erro ao submeter",
        description: "Não foi possível submeter para revisão. Tente novamente.",
        variant: "destructive",
      })
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando disclosure...</p>
        </div>
      </div>
    )
  }

  if (!disclosure) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Disclosure não encontrado</CardTitle>
            <CardDescription>O disclosure solicitado não existe ou foi removido.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => (window.location.href = "/dashboard/disclosures")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para lista
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return "bg-green-100 text-green-700 border-green-200"
      case "in_progress":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "under_review":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "needs_revision":
        return "bg-red-100 text-red-700 border-red-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="container mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => (window.location.href = "/dashboard/status")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Kanban
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Rascunho"}
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving || !response.trim()}>
              <Send className="h-4 w-4 mr-2" />
              Submeter para Revisão
            </Button>
          </div>
        </div>

        {/* Disclosure Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-base">
                    {disclosure.requirementId}
                  </Badge>
                  <Badge className={getStatusColor(disclosure.status)}>{disclosure.status.replace("_", " ")}</Badge>
                  {savedResponses.length > 0 && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Salvo no banco
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl">{disclosure.title}</CardTitle>
                <CardDescription className="text-base">{disclosure.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="form" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="form">
              <FileText className="h-4 w-4 mr-2" />
              Formulário
            </TabsTrigger>
            <TabsTrigger value="evidence">
              <Upload className="h-4 w-4 mr-2" />
              Evidências
            </TabsTrigger>
            <TabsTrigger value="responsible">
              <User className="h-4 w-4 mr-2" />
              Responsáveis
            </TabsTrigger>
            <TabsTrigger value="history">
              <History className="h-4 w-4 mr-2" />
              Histórico
              {responseHistory.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {responseHistory.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Form Tab */}
          <TabsContent value="form" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Resposta do Disclosure</CardTitle>
                <CardDescription>
                  Preencha as informações solicitadas conforme o padrão {disclosure.frameworkId}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {disclosure.status === "needs_revision" && disclosure.reviewComments && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Devolvido para revisão:</strong> {disclosure.reviewComments}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="response">Resposta *</Label>
                  <Textarea
                    id="response"
                    placeholder="Digite sua resposta aqui..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    rows={12}
                    className="resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    {response.length} caracteres • Mínimo recomendado: 100 caracteres
                  </p>
                </div>

                {disclosure.dataType === "quantitative" && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Este disclosure requer dados quantitativos. Certifique-se de incluir métricas e valores numéricos
                      na sua resposta.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Evidence Tab */}
          <TabsContent value="evidence">
            <Card>
              <CardHeader>
                <CardTitle>Evidências e Documentos</CardTitle>
                <CardDescription>Anexe documentos que comprovem as informações fornecidas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="border-2 border-dashed rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">Arraste arquivos aqui ou clique para selecionar</p>
                  <p className="text-xs text-muted-foreground">PDF, Excel, Word, Imagens (máx. 10MB)</p>
                  <Button variant="outline" className="mt-4 bg-transparent">
                    Selecionar Arquivos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Responsible Tab */}
          <TabsContent value="responsible">
            <Card>
              <CardHeader>
                <CardTitle>Responsáveis</CardTitle>
                <CardDescription>Defina quem pode editar, revisar e visualizar este disclosure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Owner (Responsável)</Label>
                  <Input value={disclosure.assignedTo || "Não atribuído"} disabled />
                </div>
                <div className="space-y-2">
                  <Label>Reviewer (Revisor)</Label>
                  <Input value={disclosure.reviewedBy || "Não atribuído"} disabled />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Alterações</CardTitle>
                <CardDescription>Trilha de auditoria completa das ações realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {responseHistory.length > 0 ? (
                    responseHistory.map((historyItem, index) => (
                      <div key={historyItem.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                        <div
                          className={`p-2 rounded-full ${
                            historyItem.change_type === "created" ? "bg-primary/10" : "bg-blue-100"
                          }`}
                        >
                          {historyItem.change_type === "created" ? (
                            <Clock className="h-4 w-4 text-primary" />
                          ) : (
                            <Save className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {historyItem.change_type === "created" ? "Resposta criada" : "Resposta atualizada"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(historyItem.created_at).toLocaleString("pt-BR")}
                          </p>
                          {historyItem.changed_by && (
                            <p className="text-xs text-muted-foreground mt-1">Por: {historyItem.changed_by}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-start gap-4 pb-4 border-b">
                        <div className="bg-primary/10 p-2 rounded-full">
                          <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Disclosure criado</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(disclosure.createdAt).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      </div>
                      {disclosure.updatedAt && disclosure.updatedAt !== disclosure.createdAt && (
                        <div className="flex items-start gap-4 pb-4 border-b">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Save className="h-4 w-4 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Última atualização</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(disclosure.updatedAt).toLocaleString("pt-BR")}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
