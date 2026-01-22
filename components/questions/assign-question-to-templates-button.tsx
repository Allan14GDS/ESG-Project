"use client"

import { useState } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

interface AssignQuestionToTemplatesButtonProps {
  questionId: string
  questionTitle: string
  currentTemplates: string[]
  allTemplates: { id: string; name: string }[]
}

export function AssignQuestionToTemplatesButton({
  questionId,
  questionTitle,
  currentTemplates,
  allTemplates,
}: AssignQuestionToTemplatesButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(currentTemplates)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleToggleTemplate = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId],
    )
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    console.log("[v0] Assigning question to templates:", { questionId, selectedTemplates })

    try {
      const response = await fetch("/api/questions/assign-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId,
          templateIds: selectedTemplates,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atribuir questão")
      }

      console.log("[v0] Question assigned successfully")
      toast({
        title: "✅ Questão Atribuída",
        description: `A questão foi atribuída a ${selectedTemplates.length} caderno(s) com sucesso.`,
        duration: 3000,
      })

      setOpen(false)

      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error("[v0] Error assigning question:", error)
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao atribuir questão aos cadernos",
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
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-primary hover:bg-primary/10">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atribuir Questão a Cadernos</DialogTitle>
          <DialogDescription>
            Selecione os cadernos aos quais deseja atribuir esta questão: <strong>{questionTitle}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 space-y-4">
          <div className="grid gap-3">
            {allTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center space-x-3 rounded-lg border border-border/50 p-4 hover:bg-muted/20"
              >
                <Checkbox
                  id={`template-${template.id}`}
                  checked={selectedTemplates.includes(template.id)}
                  onCheckedChange={() => handleToggleTemplate(template.id)}
                />
                <Label
                  htmlFor={`template-${template.id}`}
                  className="flex-1 cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {template.name}
                </Label>
              </div>
            ))}
          </div>

          {allTemplates.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum caderno disponível</p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Atribuições"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
