"use client";

export const dynamic = "force-dynamic";

import type React from "react";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Moon, Sun } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const initialTheme = savedTheme || "light";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      console.log("[v0] Login attempt with email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("[v0] Login response - Error:", error, "Data:", data);

      if (error) {
        if (error.message === "Invalid login credentials") {
          throw new Error(
            "Credenciais inválidas. Se você acabou de ser convidado, solicite ao administrador que redefina sua senha primeiro.",
          );
        }
        throw error;
      }

      if (data.user?.email) {
        localStorage.setItem("user-email", data.user.email);
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error: unknown) {
      console.error("Login error:", error);
      setError(error instanceof Error ? error.message : "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Image
          src="/logo-symbol.png"
          alt="B.Kick"
          width={40}
          height={40}
          className="h-10 w-10 animate-pulse"
          priority
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <div
        className="hidden lg:flex lg:flex-1 flex-col justify-between p-12 xl:p-16"
        style={{ background: "#161d3c" }}
      >
        <div className="flex items-center">
          {/* Alteração: Envolvendo o logo com Link para retornar à Landing Page */}
          <Link href="/">
            <Image
              src="/assets/logo-dark.png"
              alt="B.Kick"
              width={140}
              height={40}
              className="h-10 w-auto object-contain cursor-pointer hover:opacity-80 transition-opacity"
              priority
            />
          </Link>
        </div>

        <div className="max-w-lg">
          <h1 className="text-5xl font-bold leading-tight text-white mb-6">
            O futuro da gestão{" "}
            <span style={{ color: "#00d67d" }}>ESG inteligente</span>
          </h1>
          <p
            className="text-lg leading-relaxed"
            style={{ color: "rgba(255,255,255,0.65)" }}
          >
            Centralize dados, automatize relatórios e transforme seus processos
            de sustentabilidade com o poder da gestão integrada.
          </p>

          <div className="mt-12 flex items-center gap-3">
            <div className="flex -space-x-3">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-10 w-10 rounded-full border-2 text-sm font-semibold flex items-center justify-center"
                  style={{
                    borderColor: "#00d67d",
                    background: "#00d67d",
                    color: "#161d3c",
                  }}
                >
                  {i}
                </div>
              ))}
            </div>
            <div className="text-sm">
              <div className="font-semibold text-white">+50 Organizações</div>
              <div style={{ color: "rgba(255,255,255,0.55)" }}>
                confiam na plataforma
              </div>
            </div>
          </div>
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
            <Image
              src="/assets/logo-light.png"
              alt="B.Kick"
              width={120}
              height={40}
              className="h-10 w-auto object-contain dark:hidden"
              priority
            />
            <Image
              src="/assets/logo-dark.png"
              alt="B.Kick"
              width={120}
              height={40}
              className="h-10 w-auto object-contain hidden dark:block"
              priority
            />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Bem-vindo
            </h2>
            <p className="text-muted-foreground">
              Acesse o painel de controle da sua organização.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-foreground uppercase tracking-wider"
                >
                  Email Corporativo
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 border-border bg-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground uppercase tracking-wider"
                  >
                    Senha
                  </Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 border-border bg-input text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary pr-10"
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
                {isLoading ? "Entrando..." : "Entrar na Plataforma"}
                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </form>
          </div>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Ainda não é parceiro?{" "}
            <Link
              href="/auth/signup"
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Solicitar acesso
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
