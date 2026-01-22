"use client"

import type React from "react"
import { useState, memo } from "react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

export const CreateTemplateButton = memo(function CreateTemplateButton() {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "gri",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao criar caderno")
      }

      toast({
        title: "✅ Caderno Criado",
        description: "O caderno foi adicionado ao sistema com sucesso.",
        duration: 3000,
      })

      // Reset form
      setFormData({
        name: "",
        description: "",
        type: "gri",
      })

      setOpen(false)
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      console.error("[v0] Error creating template:", error)
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao criar caderno",
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
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Caderno
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar Novo Caderno</DialogTitle>
          <DialogDescription>Adicione um novo caderno de coleta ESG ao sistema.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Caderno *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: GRI 2 - Disclosure Geral, ANEEL Energia"
                required
              />
              <p className="text-xs text-muted-foreground">Nome descritivo para identificar o caderno</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descreva o propósito deste caderno..."
                rows={3}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">Informações adicionais sobre o caderno (opcional)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Categoria *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gri">GRI</SelectItem>
                  <SelectItem value="aneel">ANEEL</SelectItem>
                  <SelectItem value="ifrs">IFRS</SelectItem>
                  <SelectItem value="governanca">Governança</SelectItem>
                  <SelectItem value="organizacional">Organizacional</SelectItem>
                  <SelectItem value="ambiental">Ambiental</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="custom">Customizado</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Tipo ou framework do caderno</p>
            </div>
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
                "Criar Caderno"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
})
