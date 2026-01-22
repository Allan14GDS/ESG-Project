"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createHolding } from "@/app/actions/create-holding"

function formatCNPJ(value: string): string {
  // Remove all non-digit characters
  const numbers = value.replace(/\D/g, "")

  // Limit to 14 digits
  const limitedNumbers = numbers.slice(0, 14)

  // Apply CNPJ format: XX.XXX.XXX/XXXX-XX
  if (limitedNumbers.length <= 2) return limitedNumbers
  if (limitedNumbers.length <= 5) return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2)}`
  if (limitedNumbers.length <= 8)
    return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5)}`
  if (limitedNumbers.length <= 12)
    return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5, 8)}/${limitedNumbers.slice(8)}`
  return `${limitedNumbers.slice(0, 2)}.${limitedNumbers.slice(2, 5)}.${limitedNumbers.slice(5, 8)}/${limitedNumbers.slice(8, 12)}-${limitedNumbers.slice(12)}`
}

export function CreateHoldingButton() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setCnpj(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error("Por favor, preencha o nome da holding")
      return
    }

    setIsSubmitting(true)

    try {
      const cleanCnpj = cnpj.replace(/\D/g, "")

      const { data, error } = await createHolding({
        name: name.trim(),
        cnpj: cleanCnpj || undefined,
      })

      if (error) {
        toast.error("Erro ao criar holding: " + error)
        return
      }

      toast.success("Holding criada com sucesso!")
      setOpen(false)
      setName("")
      setCnpj("")
    } catch (error) {
      console.error("[v0] Unexpected error:", error)
      toast.error("Erro inesperado ao criar holding")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90">
          <Plus className="h-5 w-5" />
          Nova Holding
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Nova Holding</DialogTitle>
            <DialogDescription>Preencha os dados da nova holding para cadastrá-la no sistema.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Holding *</Label>
              <Input
                id="name"
                placeholder="Ex: ESPM Holdings"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                value={cnpj}
                onChange={handleCnpjChange}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">Campo opcional</p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
