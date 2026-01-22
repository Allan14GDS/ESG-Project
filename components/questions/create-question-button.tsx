"use client"

import type React from "react"
import { useState, memo } from "react"
import { Plus, Loader2, Trash2, PlusCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"

interface CreateQuestionButtonProps {
  allTemplates: Array<{ id: string; name: string }>
}

interface SubFramework {
  id: string
  value: string
}

export const CreateQuestionButton = memo(function CreateQuestionButton({ allTemplates }: CreateQuestionButtonProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    linha_coleta: "",
    disclosure: "",
    tipo_resposta: "texto",
    evidencias: "",
    obs_nao_aplicavel: "",
    sub_framework: "",
  })

  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [templateSubFrameworks, setTemplateSubFrameworks] = useState<{ [templateId: string]: SubFramework[] }>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const subFrameworksData = selectedTemplates.reduce(
        (acc, templateId) => {
          const subs = templateSubFrameworks[templateId] || []
          if (subs.length > 0) {
            acc[templateId] = subs.filter((s) => s.value.trim()).map((s) => s.value)
          }
          return acc
        },
        {} as { [key: string]: string[] },
      )

      const response = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          templateIds: selectedTemplates,
          subFrameworks: subFrameworksData,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao criar questão")
      }

      toast({
        title: "✅ Questão Criada",
        description: "A questão foi adicionada ao banco com sucesso.",
        duration: 3000,
      })

      setFormData({
        linha_coleta: "",
        disclosure: "",
        tipo_resposta: "texto",
        evidencias: "",
        obs_nao_aplicavel: "",
        sub_framework: "",
      })
      setSelectedTemplates([])
      setTemplateSubFrameworks({})

      setOpen(false)
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      console.error("[v0] Error creating question:", error)
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao criar questão",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates((prev) => {
      const isRemoving = prev.includes(templateId)
      if (isRemoving) {
        const newSubs = { ...templateSubFrameworks }
        delete newSubs[templateId]
        setTemplateSubFrameworks(newSubs)
      } else {
        setTemplateSubFrameworks((prev) => ({
          ...prev,
          [templateId]: [{ id: Math.random().toString(36).substring(2), value: "" }],
        }))
      }
      return isRemoving ? prev.filter((id) => id !== templateId) : [...prev, templateId]
    })
  }

  const addSubFramework = (templateId: string) => {
    setTemplateSubFrameworks((prev) => ({
      ...prev,
      [templateId]: [...(prev[templateId] || []), { id: Math.random().toString(36).substring(2), value: "" }],
    }))
  }

  const removeSubFramework = (templateId: string, subId: string) => {
    setTemplateSubFrameworks((prev) => ({
      ...prev,
      [templateId]: (prev[templateId] || []).filter((s) => s.id !== subId),
    }))
  }

  const updateSubFramework = (templateId: string, subId: string, value: string) => {
    setTemplateSubFrameworks((prev) => ({
      ...prev,
      [templateId]: (prev[templateId] || []).map((s) => (s.id === subId ? { ...s, value } : s)),
    }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Questão
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Questão</DialogTitle>
          <DialogDescription>Adicione uma nova questão e atribua aos cadernos desejados.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="linha_coleta">Linha de Coleta (Atomizada) *</Label>
              <Textarea
                id="linha_coleta"
                value={formData.linha_coleta}
                onChange={(e) => setFormData({ ...formData, linha_coleta: e.target.value })}
                placeholder="Digite a pergunta principal..."
                rows={3}
                required
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Esta é a pergunta em si que aparecerá no formulário</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="disclosure">Disclosure</Label>
                <Input
                  id="disclosure"
                  value={formData.disclosure}
                  onChange={(e) => setFormData({ ...formData, disclosure: e.target.value })}
                  placeholder="Ex: GRI 2-1, GRI 2-2"
                />
                <p className="text-xs text-muted-foreground">Detalhamento ou código da pergunta</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_resposta">Tipo da Resposta *</Label>
                <Select
                  value={formData.tipo_resposta}
                  onValueChange={(value) => setFormData({ ...formData, tipo_resposta: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="texto">Texto</SelectItem>
                    <SelectItem value="numero">Número</SelectItem>
                    <SelectItem value="porcentagem">Porcentagem</SelectItem>
                    <SelectItem value="data">Data</SelectItem>
                    <SelectItem value="arquivo">Arquivo</SelectItem>
                    <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                    <SelectItem value="sim_nao">Sim/Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sub_framework">Sub-framework</Label>
              <Input
                id="sub_framework"
                value={formData.sub_framework}
                onChange={(e) => setFormData({ ...formData, sub_framework: e.target.value })}
                placeholder="Ex: 301, S1, Gestão de Materiais..."
              />
              <p className="text-xs text-muted-foreground">Sub-categoria ou código do framework</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="evidencias">Evidência</Label>
              <Textarea
                id="evidencias"
                value={formData.evidencias}
                onChange={(e) => setFormData({ ...formData, evidencias: e.target.value })}
                placeholder="Tipo de documento que será anexado..."
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Descreva o tipo de documento ou evidência esperada</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="obs_nao_aplicavel">Observação</Label>
              <Textarea
                id="obs_nao_aplicavel"
                value={formData.obs_nao_aplicavel}
                onChange={(e) => setFormData({ ...formData, obs_nao_aplicavel: e.target.value })}
                placeholder="Observações gerais sobre a questão..."
                rows={2}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Texto de observação para a pergunta</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Atribuir aos Cadernos (Opcional)
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Selecione os cadernos onde esta questão deve aparecer e adicione sub-frameworks
              </p>
            </div>

            {allTemplates && allTemplates.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto border border-border/50 rounded-lg p-3">
                {allTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="border-2 border-border/50 rounded-lg p-3 space-y-3 hover:border-primary/30 transition-all"
                  >
                    <label htmlFor={`template-${template.id}`} className="flex items-center gap-3 cursor-pointer">
                      <Checkbox
                        id={`template-${template.id}`}
                        checked={selectedTemplates.includes(template.id)}
                        onCheckedChange={() => handleTemplateToggle(template.id)}
                        className="h-5 w-5 border-2"
                      />
                      <span className="flex-1 text-sm font-medium text-foreground">{template.name}</span>
                    </label>

                    {selectedTemplates.includes(template.id) && (
                      <div className="ml-8 space-y-2 pt-2 border-t border-border/30">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs text-muted-foreground">Sub-frameworks (opcional)</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => addSubFramework(template.id)}
                            className="h-7 text-xs gap-1"
                          >
                            <PlusCircle className="h-3 w-3" />
                            Adicionar
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {(templateSubFrameworks[template.id] || []).map((sub) => (
                            <div key={sub.id} className="flex items-center gap-2">
                              <Input
                                value={sub.value}
                                onChange={(e) => updateSubFramework(template.id, sub.id, e.target.value)}
                                placeholder="Ex: 301, S1, Gestão de Materiais..."
                                className="flex-1 h-8 text-sm"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSubFramework(template.id, sub.id)}
                                className="h-8 w-8 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">Nenhum caderno disponível</div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Questão"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
})
