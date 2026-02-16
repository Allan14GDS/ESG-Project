"use client"

import type React from "react"
import { useState, memo, useEffect } from "react"
import { Pencil, Loader2, Plus, X } from "lucide-react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Separator } from "@/components/ui/separator"

interface EditQuestionWithTemplatesButtonProps {
  question: {
    id: string
    linha_coleta: string
    disclosure: string
    tipo_resposta: string
    evidencias: string
    obs_nao_aplicavel: string
    sub_frameworks?: string[] | any[]
  }
  currentTemplates: string[]
  allTemplates: { id: string; name: string }[]
}

export const EditQuestionWithTemplatesButton = memo(function EditQuestionWithTemplatesButton({
  question,
  currentTemplates,
  allTemplates,
}: EditQuestionWithTemplatesButtonProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    linha_coleta: question.linha_coleta || "",
    disclosure: question.disclosure || "",
    tipo_resposta: question.tipo_resposta || "texto",
    evidencias: question.evidencias || "",
    obs_nao_aplicavel: question.obs_nao_aplicavel || "",
  })

  const parseSubFrameworks = (sfData: any): Array<{ framework: string; subFramework: string }> => {
    if (!sfData) return [{ framework: '', subFramework: '' }]

    // Case 1: Standard object { [templateId]: string[] } 
    if (typeof sfData === 'object' && !Array.isArray(sfData)) {
      // Check for legacy array-of-objects if accidentally keyed
      const firstVal = Object.values(sfData)[0]
      if (Array.isArray(firstVal) && firstVal.length > 0) {
        if (typeof firstVal[0] === 'object') {
          return firstVal.map((v: any) => ({
            framework: v.framework || '',
            subFramework: v.subFramework || v.sub_framework || ''
          }))
        }
        return firstVal.map(v => ({ framework: '', subFramework: String(v) }))
      }

      // If it's a flat object from our new extract logic
      const result: Array<{ framework: string; subFramework: string }> = []
      if (sfData.framework_1 || sfData.sub_framework_1) {
        result.push({ framework: sfData.framework_1 || '', subFramework: sfData.sub_framework_1 || '' })
      }
      if (sfData.framework_2 || sfData.sub_framework_2) {
        result.push({ framework: sfData.framework_2 || '', subFramework: sfData.sub_framework_2 || '' })
      }
      if (result.length > 0) return result
    }

    // Case 2: Array (could be strings or objects)
    if (Array.isArray(sfData) && sfData.length > 0) {
      const parsed = sfData.map((sf: any) => {
        if (typeof sf === 'string') {
          return { framework: '', subFramework: sf }
        }
        return {
          framework: sf.framework || sf.framework_name || '',
          subFramework: sf.subFramework || sf.sub_framework || sf.disclosure || ''
        }
      })
      if (parsed.length > 0) return parsed
    }

    return [{ framework: '', subFramework: '' }]
  }

  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(currentTemplates)
  const [frameworkPairs, setFrameworkPairs] = useState<Array<{ framework: string; subFramework: string }>>(
    parseSubFrameworks(question.sub_frameworks)
  )

  useEffect(() => {
    if (open) {
      setFormData({
        linha_coleta: question.linha_coleta || "",
        disclosure: question.disclosure || "",
        tipo_resposta: question.tipo_resposta || "texto",
        evidencias: question.evidencias || "",
        obs_nao_aplicavel: question.obs_nao_aplicavel || "",
      })
      setSelectedTemplates(currentTemplates)
      setFrameworkPairs(parseSubFrameworks(question.sub_frameworks))
    }
  }, [open, question, currentTemplates])

  const handleToggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId],
    )
  }

  const addFrameworkPair = () => {
    setFrameworkPairs([...frameworkPairs, { framework: '', subFramework: '' }])
  }

  const removeFrameworkPair = (index: number) => {
    if (frameworkPairs.length > 1) {
      setFrameworkPairs(frameworkPairs.filter((_, i) => i !== index))
    }
  }

  const updateFrameworkPair = (index: number, field: 'framework' | 'subFramework', value: string) => {
    const updated = [...frameworkPairs]
    updated[index][field] = value
    setFrameworkPairs(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const filteredFrameworkPairs = frameworkPairs.filter(
        (pair) => pair.framework.trim() !== "" || pair.subFramework.trim() !== ""
      )

      const response = await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          templateIds: selectedTemplates,
          sub_frameworks: filteredFrameworkPairs,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao atualizar questão")
      }

      toast({
        title: "✅ Questão Atualizada",
        description: "As alterações e atribuições de cadernos foram salvas com sucesso.",
        duration: 3000,
      })

      setOpen(false)
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      console.error("[v0] Error updating question:", error)
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar questão",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 border-none sm:border overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-none bg-background/95 backdrop-blur px-6 py-4 border-b border-border/50">
          <DialogHeader>
            <DialogTitle className="text-xl">Editar Questão e Cadernos</DialogTitle>
            <DialogDescription>
              Altere os campos da questão e selecione os cadernos aos quais ela deve ser atribuída
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-8 custom-scrollbar">
          <form id="edit-question-form" onSubmit={handleSubmit} className="space-y-10">
            {/* Question Fields Section */}
            <div className="grid gap-8">
              <div className="space-y-3">
                <Label htmlFor="linha_coleta" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Linha de Coleta (Atomizada) *</Label>
                <Textarea
                  id="linha_coleta"
                  value={formData.linha_coleta}
                  onChange={(e) => setFormData({ ...formData, linha_coleta: e.target.value })}
                  placeholder="Digite a pergunta principal..."
                  rows={3}
                  required
                  className="resize-none focus-visible:ring-primary rounded-xl border-border/50"
                />
                <p className="text-xs text-muted-foreground italic">Esta é a pergunta em si que aparecerá no formulário</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="disclosure" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Disclosure</Label>
                  <Input
                    id="disclosure"
                    value={formData.disclosure}
                    onChange={(e) => setFormData({ ...formData, disclosure: e.target.value })}
                    placeholder="Ex: GRI 2-1, GRI 2-2"
                    className="focus-visible:ring-primary rounded-xl h-11 border-border/50"
                  />
                  <p className="text-xs text-muted-foreground italic">Detalhamento ou código da pergunta</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="tipo_resposta" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Tipo da Resposta *</Label>
                  <Select
                    value={formData.tipo_resposta}
                    onValueChange={(value) => setFormData({ ...formData, tipo_resposta: value })}
                  >
                    <SelectTrigger className="focus-visible:ring-primary h-11 rounded-xl border-border/50">
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

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="evidencias" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Evidência</Label>
                  <Textarea
                    id="evidencias"
                    value={formData.evidencias}
                    onChange={(e) => setFormData({ ...formData, evidencias: e.target.value })}
                    placeholder="Tipo de documento que será anexado..."
                    rows={2}
                    className="resize-none focus-visible:ring-primary rounded-xl border-border/50"
                  />
                  <p className="text-xs text-muted-foreground italic">Descreva o tipo de documento esperado</p>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="obs_nao_aplicavel" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Observação</Label>
                  <Textarea
                    id="obs_nao_aplicavel"
                    value={formData.obs_nao_aplicavel}
                    onChange={(e) => setFormData({ ...formData, obs_nao_aplicavel: e.target.value })}
                    placeholder="Observações gerais sobre a questão..."
                    rows={2}
                    className="resize-none focus-visible:ring-primary rounded-xl border-border/50"
                  />
                  <p className="text-xs text-muted-foreground italic">Texto de observação para a pergunta</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-3">
                  <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Frameworks e Sub-frameworks</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addFrameworkPair}
                    className="h-8 gap-1 bg-primary/5 hover:bg-primary/10 border-primary/20 text-primary"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar Framework
                  </Button>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {frameworkPairs.map((pair, index) => (
                    <div key={index} className="space-y-4 rounded-xl border border-border/70 bg-muted/30 p-4 transition-all hover:bg-muted/50 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">Framework {index + 1}</span>
                        {frameworkPairs.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFrameworkPair(index)}
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-full"
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        <Input
                          value={pair.framework}
                          onChange={(e) => updateFrameworkPair(index, 'framework', e.target.value)}
                          placeholder="Ex: GRI, SASB"
                          className="h-9 text-sm focus-visible:ring-primary rounded-lg border-border/50"
                        />
                        <Input
                          value={pair.subFramework}
                          onChange={(e) => updateFrameworkPair(index, 'subFramework', e.target.value)}
                          placeholder="Ex: 301, Gestão de Materiais"
                          className="h-9 text-sm focus-visible:ring-primary rounded-lg border-border/50"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator className="bg-border/50" />

            {/* Templates Assignment Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Atribuir aos Cadernos</h3>
                  <p className="text-xs text-muted-foreground italic">
                    Selecione onde esta questão deve aparecer
                  </p>
                </div>
                <div className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 w-fit">
                  {selectedTemplates.length} selecionado(s)
                </div>
              </div>

              {allTemplates && allTemplates.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {allTemplates.map((template) => (
                    <label
                      key={template.id}
                      htmlFor={`template-${template.id}`}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${selectedTemplates.includes(template.id)
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/50 hover:border-primary/20 hover:bg-accent/30"
                        }`}
                    >
                      <Checkbox
                        id={`template-${template.id}`}
                        checked={selectedTemplates.includes(template.id)}
                        onCheckedChange={() => handleToggleTemplate(template.id)}
                        className="h-4 w-4 rounded-sm"
                      />
                      <span className="flex-1 text-xs font-semibold leading-tight text-foreground line-clamp-2">{template.name}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground text-sm border-2 border-dashed rounded-xl border-border/50">Nenhum caderno disponível</div>
              )}
            </div>
          </form>
        </div>

        {/* Fixed Footer */}
        <div className="flex-none bg-background/95 backdrop-blur px-6 py-4 border-t border-border/50">
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="w-full sm:w-auto rounded-xl">
              Cancelar
            </Button>
            <Button
              form="edit-question-form"
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Tudo"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
})
