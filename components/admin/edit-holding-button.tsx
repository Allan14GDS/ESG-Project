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
import { Pencil } from "lucide-react"
import { updateHolding } from "@/app/actions/update-holding"
import { useRouter } from "next/navigation"

export function EditHoldingButton({
  holdingId,
  currentName,
  currentCnpj,
}: {
  holdingId: string
  currentName: string
  currentCnpj: string | null
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(currentName)
  const [cnpj, setCnpj] = useState(currentCnpj || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const formatCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
    }
    return cnpj
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value)
    setCnpj(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const cnpjNumbers = cnpj.replace(/\D/g, "")
      const result = await updateHolding(holdingId, name.trim(), cnpjNumbers)

      if (result.success) {
        setOpen(false)
        router.refresh()
      } else {
        alert(result.error || "Erro ao atualizar holding")
      }
    } catch (error) {
      console.error("Error updating holding:", error)
      alert("Erro ao atualizar holding")
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
          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Editar Holding</DialogTitle>
            <DialogDescription>Atualize o nome e CNPJ da holding.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Holding *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: BTG Pactual"
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <Input
                id="cnpj"
                value={cnpj}
                onChange={handleCnpjChange}
                placeholder="00.000.000/0000-00"
                maxLength={18}
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Atualizando..." : "Atualizar Holding"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
