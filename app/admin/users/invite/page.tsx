"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, UserPlus, Loader2, CheckCircle2, XCircle, Mail, Shield, User, Copy, Check } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { inviteUser } from "@/app/actions/user-invite-actions"
import { createClient } from "@/lib/supabase/client"

export default function InviteUserPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string; tempPassword?: string } | null>(null)
  const [copied, setCopied] = useState(false)
  const [userRole, setUserRole] = useState<string>("")

  useEffect(() => {
    async function fetchUserRole() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

        if (profile) {
          setUserRole(profile.role)
        }
      }
    }
    fetchUserRole()
  }, [])

  const isGestor = userRole === "holding_admin"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setResult(null)

    if (!email || !role) {
      setResult({
        success: false,
        message: "E-mail e perfil são obrigatórios",
      })
      return
    }

    setIsLoading(true)

    try {
      const response = await inviteUser(email, role, fullName)

      if (response.success) {
        setResult({
          success: true,
          message: response.message || "Usuário criado com sucesso!",
          tempPassword: response.tempPassword,
        })

        // Redirect after 5 seconds to give time to copy password
        setTimeout(() => {
          router.push("/admin/users")
          router.refresh()
        }, 5000)
      } else {
        setResult({
          success: false,
          message: response.error || "Erro ao criar usuário",
        })
      }
    } catch (error) {
      console.error("[v0] Error inviting user:", error)
      setResult({
        success: false,
        message: "Erro ao criar usuário. Tente novamente.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyPassword = () => {
    if (result?.tempPassword) {
      navigator.clipboard.writeText(result.tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-6 py-24 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar aos Usuários
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card">
              <UserPlus className="h-6 w-6 text-foreground" />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Novo Convite</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Convidar Usuário</h1>
          <p className="mt-3 text-muted-foreground">
            {isGestor
              ? "Crie um novo revisor ou usuário no sistema"
              : "Crie um novo usuário no sistema com senha temporária"}
          </p>
        </div>

        {/* Form Card */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 px-8 py-6">
            <CardTitle className="text-lg font-semibold text-foreground">Dados do Usuário</CardTitle>
            <CardDescription className="text-muted-foreground">
              Preencha os campos abaixo para criar o novo usuário
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Nome Completo
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="João da Silva"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-border/50 bg-input text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-foreground/20"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  E-mail do Usuário
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-border/50 bg-input text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-foreground/20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Perfil de Acesso
                </Label>
                <Select value={role} onValueChange={setRole} disabled={isLoading}>
                  <SelectTrigger className="h-12 rounded-xl border-border/50 bg-input text-foreground focus:border-foreground/30 focus:ring-foreground/20">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent className="border-border/50 bg-card">
                    <SelectItem value="holding_admin">Gestor</SelectItem>
                    <SelectItem value="revisor">Revisor</SelectItem>
                    <SelectItem value="user">Usuário</SelectItem>
                  </SelectContent>
                </Select>
                {isGestor && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Como gestor, você pode criar Gestores, Revisores e Usuários
                  </p>
                )}
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
                    Criando Usuário...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    Criar Usuário
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
                    {result.success && result.tempPassword && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm text-muted-foreground">
                          Senha temporária gerada (copie antes de sair desta página):
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 rounded-lg bg-background/50 px-3 py-2 font-mono text-sm text-foreground">
                            {result.tempPassword}
                          </code>
                          <Button size="sm" variant="outline" onClick={copyPassword} className="gap-2 bg-transparent">
                            {copied ? (
                              <>
                                <Check className="h-4 w-4" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                Copiar
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                    {result.success && (
                      <p className="mt-2 text-sm text-muted-foreground">Redirecionando para a lista de usuários...</p>
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
