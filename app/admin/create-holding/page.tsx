"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createHolding } from "@/app/actions/create-holding"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"

function formatCNPJ(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "")

  // Apply CNPJ mask: XX.XXX.XXX/XXXX-XX
  if (digits.length <= 2) return digits
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`
}

function isValidCNPJ(cnpj: string): boolean {
  const digits = cnpj.replace(/\D/g, "")
  return digits.length === 14
}

export default function AdminCreateHoldingPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [holdingName, setHoldingName] = useState("")
  const [holdingCnpj, setHoldingCnpj] = useState("")
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

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value)
    if (formatted.replace(/\D/g, "").length <= 14) {
      setHoldingCnpj(formatted)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    if (!holdingName || !holdingCnpj) {
      setResult({
        success: false,
        message: "Nome e CNPJ são obrigatórios",
      })
      return
    }

    if (!isValidCNPJ(holdingCnpj)) {
      setResult({
        success: false,
        message: "CNPJ deve ter 14 dígitos no formato XX.XXX.XXX/XXXX-XX",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await createHolding({
        holdingName,
        holdingCnpj,
      })

      if (response.error) {
        setResult({
          success: false,
          message: response.error,
        })
      } else {
        setResult({
          success: true,
          message: "Sua holding foi criada com sucesso!",
        })

        setTimeout(() => {
          router.push("/admin/holdings")
        }, 2000)
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Erro ao criar holding",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-24">
        {/* Back link */}
        <Link
          href="/admin/holdings"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Holdings
        </Link>

        <Card className="border-border/50 bg-card/50 backdrop-blur">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl">Criar Nova Holding</CardTitle>
            <CardDescription>Preencha os dados básicos para criar uma nova holding no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="holdingName">Nome da Holding</Label>
                <Input
                  id="holdingName"
                  type="text"
                  placeholder="Ex: Holding ABC"
                  value={holdingName}
                  onChange={(e) => setHoldingName(e.target.value)}
                  disabled={isLoading}
                  className="h-12 bg-background/50"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="holdingCnpj">CNPJ</Label>
                <Input
                  id="holdingCnpj"
                  type="text"
                  placeholder="00.000.000/0000-00"
                  value={holdingCnpj}
                  onChange={handleCnpjChange}
                  disabled={isLoading}
                  className="h-12 bg-background/50"
                  required
                />
                <p className="text-xs text-muted-foreground">Formato: XX.XXX.XXX/XXXX-XX</p>
              </div>

              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Criar Holding"
                )}
              </Button>
            </form>

            {result && (
              <Alert
                className={`mt-6 ${result.success ? "border-primary/50 bg-primary/5" : "border-destructive/50 bg-destructive/5"}`}
              >
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription className="font-medium">{result.message}</AlertDescription>
                    {result.success && (
                      <p className="mt-2 text-sm text-muted-foreground">Redirecionando para a lista de holdings...</p>
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
