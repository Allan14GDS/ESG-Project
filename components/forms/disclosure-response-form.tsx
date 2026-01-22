"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Save, Send, AlertTriangle, Loader2 } from "lucide-react"
import { supabaseSyncService } from "@/lib/supabase-sync"
import { useToast } from "@/hooks/use-toast"

interface DisclosureResponseFormProps {
  disclosureId: string
  disclosureTitle: string
  initialValue?: string
  onSave?: (value: string) => void
  onSubmit?: (value: string) => void
  requiresQuantitative?: boolean
  minCharacters?: number
}

export function DisclosureResponseForm({
  disclosureId,
  disclosureTitle,
  initialValue = "",
  onSave,
  onSubmit,
  requiresQuantitative = false,
  minCharacters = 100,
}: DisclosureResponseFormProps) {
  const [response, setResponse] = useState(initialValue)
  const [isSaving, setIsSaving] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await supabaseSyncService.saveResponse(disclosureId, "main", disclosureTitle, response, "text", [])

      const progress = response.trim() ? 50 : 0
      const status = response.trim() ? "in_progress" : "not_started"
      await supabaseSyncService.updateDisclosureStatus(disclosureId, status, progress)

      toast({
        title: "Rascunho salvo",
        description: "Suas alterações foram salvas com sucesso.",
      })

      onSave?.(response)
    } catch (error) {
      console.error("[v0] Error saving response:", error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas alterações.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (response.length < minCharacters) {
      toast({
        title: "Resposta muito curta",
        description: `Por favor, forneça uma resposta com pelo menos ${minCharacters} caracteres.`,
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      await supabaseSyncService.saveResponse(disclosureId, "main", disclosureTitle, response, "text", [])

      await supabaseSyncService.updateDisclosureStatus(disclosureId, "under_review", 100)

      toast({
        title: "Submetido para revisão",
        description: "Seu disclosure foi enviado para revisão com sucesso.",
      })

      onSubmit?.(response)
    } catch (error) {
      console.error("[v0] Error submitting response:", error)
      toast({
        title: "Erro ao submeter",
        description: "Não foi possível submeter para revisão.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isValid = response.trim().length >= minCharacters

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resposta do Disclosure</CardTitle>
        <CardDescription>Preencha as informações solicitadas de forma clara e completa</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {requiresQuantitative && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Este disclosure requer dados quantitativos. Certifique-se de incluir métricas e valores numéricos na sua
              resposta.
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
          <div className="flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              {response.length} caracteres • Mínimo recomendado: {minCharacters} caracteres
            </p>
            {isValid && <p className="text-primary font-medium">✓ Resposta válida</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4">
          <Button variant="outline" onClick={handleSave} disabled={isSaving || isSubmitting}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </>
            )}
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || isSaving || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submetendo...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submeter para Revisão
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
