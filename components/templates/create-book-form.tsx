"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBookTemplate } from "@/app/actions/book-template-actions"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateBookForm({ templateId }: { templateId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append("templateId", templateId)

    const result = await createBookTemplate(formData)

    if (result.success) {
      // Reset form
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    } else {
      setError(result.error || "Erro ao criar caderno")
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Título do Caderno *</Label>
          <Input id="title" name="title" required placeholder="Ex: Caderno de Governança" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            name="description"
            placeholder="Descrição breve do caderno"
            rows={1}
            className="resize-none"
          />
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Criar Caderno
      </Button>
    </form>
  )
}
