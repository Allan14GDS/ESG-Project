"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Building2 } from "lucide-react"
import Link from "next/link"
import { createCompany } from "@/app/actions/create-company"

export default function CreateCompanyPage({ params }: { params: { holdingId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [companyName, setCompanyName] = useState("")
  const [companyCnpj, setCompanyCnpj] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createCompany({
      holdingId: params.holdingId,
      companyName,
      companyCnpj,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push(`/holding/${params.holdingId}/dashboard`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="mb-4">
            <Link href={`/holding/${params.holdingId}/dashboard`}>
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Building2 className="h-6 w-6" />
            Criar Nova Empresa
          </CardTitle>
          <CardDescription>Preencha os dados da empresa que será vinculada à holding</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa *</Label>
              <Input
                id="companyName"
                placeholder="Ex: Empresa ABC Ltda"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyCnpj">CNPJ *</Label>
              <Input
                id="companyCnpj"
                placeholder="00.000.000/0000-00"
                value={companyCnpj}
                onChange={(e) => setCompanyCnpj(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <p className="font-medium">Erro ao criar empresa:</p>
                <p>{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Criando empresa..." : "Criar Empresa"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
