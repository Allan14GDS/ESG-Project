"use client"

import type React from "react"
import { useState, useEffect } from "react"
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

interface EditQuestionButtonProps {
  question: {
    id: string
    linha_coleta: string
    disclosure: string
    tipo_resposta: string
    evidencias: string
    obs_nao_aplicavel: string
    sub_frameworks?: string[]
  }
  currentTemplates?: string[]
  allTemplates?: { id: string; name: string }[]
}

export function EditQuestionButton({ question, currentTemplates = [], allTemplates = [] }: EditQuestionButtonProps) {
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

  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(currentTemplates)
  const [subFrameworks, setSubFrameworks] = useState<string[]>(
    question.sub_frameworks && question.sub_frameworks.length > 0 ? question.sub_frameworks : [""],
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
      setSubFrameworks(question.sub_frameworks && question.sub_frameworks.length > 0 ? question.sub_frameworks : [""])
    }
  }, [open, question, currentTemplates])

  const handleToggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId],
    )
  }

  const addSubFramework = () => {
    setSubFrameworks([...subFrameworks, ""])
  }

  const removeSubFramework = (index: number) => {
    if (subFrameworks.length > 1) {
      setSubFrameworks(subFrameworks.filter((_, i) => i !== index))
    }
  }

  const updateSubFramework = (index: number, value: string) => {
    const updated = [...subFrameworks]
    updated[index] = value
    setSubFrameworks(updated)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const filteredSubFrameworks = subFrameworks.filter((sf) => sf.trim() !== "")

      const response = await fetch(`/api/questions/${question.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          templateIds: selectedTemplates,
          sub_frameworks: filteredSubFrameworks.length > 0 ? filteredSubFrameworks : undefined,
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Questão e Cadernos</DialogTitle>
          <DialogDescription>
            Altere os campos da questão e selecione os cadernos aos quais ela deve ser atribuída
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* 1. Linha de Coleta (Atomizada) */}
          <div className="space-y-2">
            <Label htmlFor="linha_coleta" className="text-sm font-medium">
              Linha de Coleta (Atomizada) *
            </Label>
            <Textarea
              id="linha_coleta"
              value={formData.linha_coleta}
              onChange={(e) => setFormData({ ...formData, linha_coleta: e.target.value })}
              placeholder="Digite a pergunta principal..."
              rows={4}
              required
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">Esta é a pergunta em si que aparecerá no formulário</p>
          </div>

          {/* 2. Disclosure and 3. Tipo da Resposta - Side by Side */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="disclosure" className="text-sm font-medium">
                Disclosure
              </Label>
              <Input
                id="disclosure"
                value={formData.disclosure}
                onChange={(e) => setFormData({ ...formData, disclosure: e.target.value })}
                placeholder="IFRS / ISSB"
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">Detalhamento ou código da pergunta</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_resposta" className="text-sm font-medium">
                Tipo da Resposta *
              </Label>
              <Select
                value={formData.tipo_resposta}
                onValueChange={(value) => setFormData({ ...formData, tipo_resposta: value })}
              >
                <SelectTrigger className="text-sm">
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

          {/* 4. Evidência */}
          <div className="space-y-2">
            <Label htmlFor="evidencias" className="text-sm font-medium">
              Evidência
            </Label>
            <Input
              id="evidencias"
              value={formData.evidencias}
              onChange={(e) => setFormData({ ...formData, evidencias: e.target.value })}
              placeholder="Tipo de documento que será anexado..."
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">Descreva o tipo de documento ou evidência esperada</p>
          </div>

          {/* 5. Observação */}
          <div className="space-y-2">
            <Label htmlFor="obs_nao_aplicavel" className="text-sm font-medium">
              Observação
            </Label>
            <Textarea
              id="obs_nao_aplicavel"
              value={formData.obs_nao_aplicavel}
              onChange={(e) => setFormData({ ...formData, obs_nao_aplicavel: e.target.value })}
              placeholder="Observações gerais sobre a questão..."
              rows={3}
              className="resize-none text-sm"
            />
            <p className="text-xs text-muted-foreground">Texto de observação para a pergunta</p>
          </div>

          {/* 6. Sub-frameworks */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Sub-frameworks</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubFramework}
                className="h-8 gap-1 text-xs bg-transparent"
              >
                <Plus className="h-3 w-3" />
                Adicionar Nível
              </Button>
            </div>
            <div className="space-y-2">
              {subFrameworks.map((subFramework, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={subFramework}
                    onChange={(e) => updateSubFramework(index, e.target.value)}
                    placeholder={index === 0 ? "Ex: 301" : index === 1 ? "Gestão de Materiais" : "Sub-categoria"}
                    className="flex-1 text-sm"
                  />
                  {subFrameworks.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubFramework(index)}
                      className="h-10 w-10 p-0 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Hierarquia de categorias (ex: "301", "Gestão de Materiais"). Serão exibidas como label da questão.
            </p>
          </div>

          {/* Templates Section - Only if templates exist */}
          {allTemplates && allTemplates.length > 0 && (
            <>
              <Separator className="my-4" />

              <div className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Atribuir aos Cadernos</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Selecione os cadernos onde esta questão deve aparecer
                  </p>
                </div>

                <div className="space-y-2 max-h-[180px] overflow-y-auto border border-border rounded-lg p-3">
                  {allTemplates.map((template) => (
                    <label
                      key={template.id}
                      htmlFor={`template-${template.id}`}
                      className="flex items-center gap-3 p-2.5 rounded-md border border-border/50 hover:border-primary/30 hover:bg-accent/30 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        id={`template-${template.id}`}
                        checked={selectedTemplates.includes(template.id)}
                        onCheckedChange={() => handleToggleTemplate(template.id)}
                        className="h-4 w-4"
                      />
                      <span className="flex-1 text-sm text-foreground">{template.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border/30">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
