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
import { createCompany } from "@/app/actions/create-company"
import { useRouter } from "next/navigation"

interface CreateCompanyButtonProps {
  holdingId: string
}

export function CreateCompanyButton({ holdingId }: CreateCompanyButtonProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [name, setName] = useState("")
  const [cnpj, setCnpj] = useState("")
  const router = useRouter()

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "").slice(0, 14)
    if (numbers.length <= 2) return numbers
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`
    if (numbers.length <= 12)
      return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    setCnpj(formatted)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const cnpjNumbers = cnpj.replace(/\D/g, "")
      const result = await createCompany({
        holdingId,
        companyName: name,
        companyCnpj: cnpjNumbers,
      })

      if (result.error) {
        alert(`Erro ao criar empresa: ${result.error}`)
      } else {
        setOpen(false)
        setName("")
        setCnpj("")
        router.refresh()
      }
    } catch (error) {
      console.error("[v0] Error creating company:", error)
      alert("Erro ao criar empresa")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 rounded-xl bg-foreground px-6 text-background hover:bg-foreground/90">
          <Plus className="h-5 w-5" />
          Nova Empresa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Criar Nova Empresa</DialogTitle>
            <DialogDescription>Adicione uma nova empresa vinculada a esta holding</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Empresa</Label>
              <Input
                id="name"
                placeholder="Ex: Empresa ABC Ltda"
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
                placeholder="XX.XXX.XXX/XXXX-XX"
                value={cnpj}
                onChange={handleCNPJChange}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Criando..." : "Criar Empresa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
