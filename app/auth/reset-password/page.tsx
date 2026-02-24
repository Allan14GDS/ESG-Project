"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Eye,
  EyeOff,
  Hourglass,
  Lock,
  Moon,
  Sun,
  CheckCircle,
  AlertCircle,
} from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null
    const initialTheme = savedTheme || "light"
    setTheme(initialTheme)
    document.documentElement.classList.toggle("dark", initialTheme === "dark")

    // Check if user has a valid recovery session
    const checkSession = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // The user should have a session after clicking the recovery link
      setIsValidSession(!!user)
    }

    checkSession()
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light"
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) {
      return "A senha deve ter pelo menos 8 caracteres"
    }
    if (!/[A-Z]/.test(pwd)) {
      return "A senha deve conter pelo menos uma letra maiuscula"
    }
    if (!/[a-z]/.test(pwd)) {
      return "A senha deve conter pelo menos uma letra minuscula"
    }
    if (!/[0-9]/.test(pwd)) {
      return "A senha deve conter pelo menos um numero"
    }
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("As senhas nao coincidem")
      return
    }

    // Validate password strength
    const validationError = validatePassword(password)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) {
        throw error
      }

      setIsSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/auth/login")
      }, 3000)
    } catch (error: unknown) {
      console.error("Password update error:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao redefinir senha. Tente novamente."
      )
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Hourglass className="h-6 w-6 animate-spin text-primary" />
          <span className="text-foreground">Carregando...</span>
        </div>
      </div>
    )
  }

  // Show error if no valid session
  if (isValidSession === false) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-primary/10 via-background to-accent/5">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Hourglass className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">b.kick</span>
          </div>

          <div className="max-w-lg">
            <h1 className="text-5xl font-bold leading-tight text-foreground mb-6">
              Link{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                expirado ou invalido.
              </span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              O link de recuperacao pode ter expirado. Solicite um novo link para redefinir sua senha.
            </p>
          </div>

          <div className="text-sm text-muted-foreground">
            © 2025 GRI ESG Platform. Todos os direitos reservados.
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
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-8">
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  Link Invalido
                </h3>
                <p className="text-muted-foreground">
                  O link de recuperacao expirou ou e invalido. Por favor,
                  solicite um novo link.
                </p>
                <div className="pt-4 space-y-3">
                  <Link href="/auth/forgot-password">
                    <Button className="w-full">Solicitar Novo Link</Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" className="w-full">
                      Voltar para Login
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading while checking session
  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2">
          <Hourglass className="h-6 w-6 animate-spin text-primary" />
          <span className="text-foreground">Verificando link...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 xl:p-16 bg-gradient-to-br from-primary/10 via-background to-accent/5">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Hourglass className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">b.kick</span>
        </div>

        <div className="max-w-lg">
          <h1 className="text-5xl font-bold leading-tight text-foreground mb-6">
            Crie sua{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              nova senha segura.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Escolha uma senha forte com pelo menos 8 caracteres, incluindo
            letras maiusculas, minusculas e numeros.
          </p>
        </div>

        <div className="text-sm text-muted-foreground">
          © 2025 GRI ESG Platform. Todos os direitos reservados.
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
          <div className="lg:hidden mb-8 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Hourglass className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">
              GRI ESG Platform
            </span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Redefinir Senha
            </h2>
            <p className="text-muted-foreground">
              Crie uma nova senha para sua conta.
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
                  Senha Redefinida!
                </h3>
                <p className="text-muted-foreground">
                  Sua senha foi alterada com sucesso. Voce sera redirecionado
                  para a pagina de login em instantes...
                </p>
                <div className="pt-4">
                  <Link href="/auth/login">
                    <Button className="w-full">Ir para Login</Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground uppercase tracking-wider"
                  >
                    Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pl-10 pr-10 border-border bg-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                      placeholder="Minimo 8 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-foreground uppercase tracking-wider"
                  >
                    Confirmar Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 pl-10 pr-10 border-border bg-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                      placeholder="Repita a senha"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password requirements hint */}
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium">A senha deve conter:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    <li
                      className={
                        password.length >= 8 ? "text-green-600" : ""
                      }
                    >
                      Pelo menos 8 caracteres
                    </li>
                    <li
                      className={
                        /[A-Z]/.test(password) ? "text-green-600" : ""
                      }
                    >
                      Uma letra maiuscula
                    </li>
                    <li
                      className={
                        /[a-z]/.test(password) ? "text-green-600" : ""
                      }
                    >
                      Uma letra minuscula
                    </li>
                    <li
                      className={
                        /[0-9]/.test(password) ? "text-green-600" : ""
                      }
                    >
                      Um numero
                    </li>
                  </ul>
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
                  {isLoading ? "Redefinindo..." : "Redefinir Senha"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
