"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ArrowLeft, Mail, Moon, Sun, CheckCircle } from "lucide-react"
import Image from "next/image"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const initialTheme = savedTheme || "light"
    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)
    } catch (error: unknown) {
      console.error("Password reset error:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao enviar email de recuperação. Tente novamente."
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Image src="/logo-symbol.png" alt="B.Kick" width={40} height={40} className="h-10 w-10 animate-pulse" priority />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 xl:p-16" style={{ background: "#161d3c" }}>
        <div className="flex items-center">
          <Image src="/logo-horizontal-navy.png" alt="B.Kick" width={140} height={40} className="h-10 w-auto object-contain invert" priority />
        </div>

        <div className="max-w-lg">
          <h1 className="text-5xl font-bold leading-tight text-white mb-6">
            Recupere seu{" "}
            <span style={{ color: "#00d67d" }}>acesso com segurança.</span>
          </h1>
          <p className="text-lg leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Enviaremos um link de recuperação para o seu email cadastrado. Siga as instruções para redefinir sua senha.
          </p>
        </div>

        <div className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
          © 2025 B.Kick. Todos os direitos reservados.
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-8 lg:p-12 relative">
        <div className="absolute top-8 right-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-full"
            aria-label="Alternar tema"
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Image src="/logo-vertical-navy.png" alt="B.Kick" width={100} height={100} className="h-16 w-auto object-contain dark:invert" priority />
          </div>

          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para o login
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Recuperar Senha
            </h2>
            <p className="text-muted-foreground">
              Informe seu email para receber o link de recuperacao.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-8">
            {isSuccess ? (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Email Enviado!
                </h3>
                <p className="text-muted-foreground">
                  Enviamos um link de recuperacao para{" "}
                  <span className="font-medium text-foreground">{email}</span>.
                  Verifique sua caixa de entrada e spam.
                </p>
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsSuccess(false)}
                    className="w-full"
                  >
                    Enviar novamente
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground uppercase tracking-wider"
                  >
                    Email Corporativo
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-12 pl-10 border-border bg-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                    />
                  </div>
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/20 transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? "Enviando..." : "Enviar Link de Recuperacao"}
                </Button>
              </form>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Lembrou a senha?{" "}
            <Link
              href="/auth/login"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Fazer login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
