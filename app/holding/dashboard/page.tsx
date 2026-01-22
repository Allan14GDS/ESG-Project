import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, Calendar, FileText } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function HoldingDashboardPage() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return <div>Loading...</div>
  }

  const supabase = await createClient()

  if (!supabase) {
    redirect("/auth/login")
    return null
  }

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // Get user's profile to find their organization and role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*, organization_id, role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Perfil não encontrado</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Check if user is a holding_admin
  if (profile.role !== "holding_admin") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>Você não tem permissão para acessar esta página</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Get the holding organization
  const { data: holding, error: holdingError } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", profile.organization_id)
    .single()

  if (holdingError || !holding) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Holding não encontrada</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Count companies linked to this holding
  const { count: companiesCount } = await supabase
    .from("organizations")
    .select("*", { count: "exact", head: true })
    .eq("holding_id", holding.id)

  const totalCompanies = companiesCount || 0

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard da Holding</h1>
        </div>

        {/* Holding Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informações da Holding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Nome</p>
                <p className="text-lg font-semibold">{holding.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="text-lg font-semibold">{holding.cnpj || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Criação</p>
                <p className="flex items-center gap-2 text-lg font-semibold">
                  <Calendar className="h-4 w-4" />
                  {new Date(holding.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Setor</p>
                <p className="text-lg font-semibold">{holding.industry || "Não informado"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Companies Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Empresas Vinculadas
            </CardTitle>
            <CardDescription>Empresas cadastradas sob esta holding</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Empresas</p>
                <p className="text-3xl font-bold">{totalCompanies}</p>
              </div>
              <Button size="lg">Criar Empresa</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
