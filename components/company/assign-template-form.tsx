"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { assignTemplateToCompany } from "@/app/actions/company-actions"
import { Check, FileText, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string
  name: string
  description: string | null
}

export function AssignTemplateForm({ companyId, templates }: { companyId: string; templates: Template[] }) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleToggle = (templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Starting template assignment", { selectedTemplates, companyId })

    if (selectedTemplates.length === 0) {
      console.log("[v0] No templates selected")
      return
    }

    setLoading(true)
    try {
      for (const templateId of selectedTemplates) {
        console.log("[v0] Assigning template", templateId)
        await assignTemplateToCompany(companyId, templateId)
      }

      console.log("[v0] All templates assigned successfully")

      toast({
        title: "✅ Templates atribuídos com sucesso!",
        description: `${selectedTemplates.length} ${selectedTemplates.length === 1 ? "template foi atribuído" : "templates foram atribuídos"} à empresa.`,
        variant: "default",
        duration: 3000,
      })

      console.log("[v0] Redirecting to company dashboard")

      setTimeout(() => {
        window.location.href = `/company/${companyId}/dashboard`
      }, 1000)
    } catch (error) {
      console.error("[v0] Error assigning templates:", error)
      toast({
        title: "❌ Erro ao atribuir templates",
        description: "Ocorreu um erro ao atribuir os templates. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setLoading(false)
    }
  }

  if (!templates || templates.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">Todos os templates já foram atribuídos a esta empresa</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        {templates.map((template) => {
          const isSelected = selectedTemplates.includes(template.id)
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleToggle(template.id)}
              className="group relative flex w-full items-start gap-4 rounded-lg border border-border/50 bg-card p-4 text-left transition-all hover:border-primary/50 hover:bg-accent/30 hover:shadow-sm"
            >
              {/* Checkbox visual */}
              <div
                className={`mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border-2 transition-all ${
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-muted-foreground/30 bg-background group-hover:border-primary/50"
                }`}
              >
                {isSelected && <Check className="h-3.5 w-3.5 text-primary-foreground" />}
              </div>

              {/* Icon */}
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/20">
                <FileText className="h-5 w-5 text-primary" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {template.name}
                </h3>
                {template.description && (
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selectedTemplates.length > 0 && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
          <p className="text-sm font-medium text-primary">
            {selectedTemplates.length}{" "}
            {selectedTemplates.length === 1 ? "template selecionado" : "templates selecionados"}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/company/${companyId}/dashboard`)}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={selectedTemplates.length === 0 || loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Atribuir {selectedTemplates.length > 0 && `(${selectedTemplates.length})`}
        </Button>
      </div>
    </form>
  )
}
