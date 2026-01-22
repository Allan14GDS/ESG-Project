"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addQuestionToBook } from "@/app/actions/book-template-actions"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function AddQuestionToBookForm({ bookId, nextOrderIndex }: { bookId: string; nextOrderIndex: number }) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [questionType, setQuestionType] = useState("text")
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append("bookId", bookId)
    formData.append("type", questionType)
    formData.append("orderIndex", nextOrderIndex.toString())

    const result = await addQuestionToBook(formData)

    if (result.success) {
      ;(e.target as HTMLFormElement).reset()
      router.refresh()
    } else {
      setError(result.error || "Erro ao adicionar pergunta")
    }

    setIsLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-1">
          <Label htmlFor="label">Pergunta *</Label>
          <Input id="label" name="label" required placeholder="Digite a pergunta" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="type">Tipo de Resposta *</Label>
          <Select value={questionType} onValueChange={setQuestionType} required>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto Curto</SelectItem>
              <SelectItem value="textarea">Texto Longo</SelectItem>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="select">Seleção</SelectItem>
              <SelectItem value="file">Arquivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <Button type="submit" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Adicionar Pergunta
      </Button>
    </form>
  )
}
