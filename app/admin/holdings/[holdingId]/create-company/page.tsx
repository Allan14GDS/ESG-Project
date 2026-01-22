"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Building2, Loader2, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createCompany } from "@/app/actions/create-company"

export default function CreateCompanyPage() {
  const router = useRouter()
  const params = useParams()
  const holdingId = params.holdingId as string

  const [isAuthorized, setIsAuthorized] = useState(false)
  const [companyName, setCompanyName] = useState("")
  const [companyCnpj, setCompanyCnpj] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/check-role")
        const data = await response.json()

        if (data.role !== "admin_main") {
          router.push("/dashboard")
        } else {
          setIsAuthorized(true)
        }
      } catch (error) {
        router.push("/dashboard")
      }
    }
    checkAuth()
  }, [router])

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Verificando permissões...</div>
      </div>
    )
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2")
    }
    return value
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    if (!companyName) {
      setResult({
        success: false,
        message: "Nome da empresa é obrigatório",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await createCompany({
        holdingId,
        companyName,
        companyCnpj,
      })

      if (response.error) {
        setResult({
          success: false,
          message: response.error,
        })
      } else {
        setResult({
          success: true,
          message: "Empresa criada com sucesso!",
        })

        setTimeout(() => {
          router.push(`/admin/holdings/${holdingId}`)
        }, 2000)
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Erro ao criar empresa",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-24 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link href={`/admin/holdings/${holdingId}`}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar à Holding
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card">
              <Building2 className="h-6 w-6 text-foreground" />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Nova Empresa</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Criar Empresa</h1>
          <p className="mt-3 text-muted-foreground">Adicione uma nova empresa vinculada a esta holding</p>
        </div>

        {/* Form Card */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 px-8 py-6">
            <CardTitle className="text-lg font-semibold text-foreground">Dados da Empresa</CardTitle>
            <CardDescription className="text-muted-foreground">
              Preencha os campos abaixo para criar a empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-sm font-medium text-foreground">
                  Nome da Empresa
                </Label>
                <Input
                  id="companyName"
                  type="text"
                  placeholder="Ex: Empresa ABC Ltda"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-border/50 bg-input text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-foreground/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyCnpj" className="text-sm font-medium text-foreground">
                  CNPJ (Opcional)
                </Label>
                <Input
                  id="companyCnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={companyCnpj}
                  onChange={(e) => {
                    const formatted = formatCNPJ(e.target.value)
                    setCompanyCnpj(formatted)
                  }}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-border/50 bg-input text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-foreground/20"
                  maxLength={18}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full gap-2 rounded-xl bg-foreground text-background hover:bg-foreground/90"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Building2 className="h-5 w-5" />
                    Criar Empresa
                  </>
                )}
              </Button>
            </form>

            {result && (
              <Alert
                className={`mt-6 border ${result.success ? "border-green-500/30 bg-green-500/10" : "border-destructive/50 bg-destructive/10"}`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-400" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive" />
                  )}
                  <div className="flex-1">
                    <AlertDescription
                      className={`font-medium ${result.success ? "text-green-400" : "text-destructive"}`}
                    >
                      {result.message}
                    </AlertDescription>
                    {result.success && (
                      <p className="mt-2 text-sm text-muted-foreground">Redirecionando para a holding...</p>
                    )}
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
