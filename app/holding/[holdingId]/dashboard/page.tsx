import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, Calendar, Plus, BookOpen } from "lucide-react"
import Link from "next/link"

export default async function HoldingDashboardPage({ params }: { params: { holdingId: string } }) {
  const supabase = createClient()

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const adminClient = createAdminClient()

  const { data: holding, error: holdingError } = await adminClient
    .from("holdings")
    .select("*")
    .eq("id", params.holdingId)
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

  const { data: companies, error: companiesError } = await adminClient
    .from("companies")
    .select("*")
    .eq("holding_id", holding.id)
    .order("created_at", { ascending: false })

  if (companiesError) {
    console.error("Error fetching companies:", companiesError)
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{holding.name}</h1>
            <p className="text-muted-foreground">Dashboard da Holding</p>
          </div>
          <Link href="/admin/holdings">
            <Button variant="outline">Voltar para Holdings</Button>
          </Link>
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
            <div className="grid gap-4 md:grid-cols-3">
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
            </div>
          </CardContent>
        </Card>

        {/* Companies Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Empresas Vinculadas
                </CardTitle>
                <CardDescription>
                  {companies?.length || 0} empresa{companies?.length !== 1 ? "s" : ""} cadastrada
                  {companies?.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <Link href={`/holding/${holding.id}/create-company`}>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Criar Empresa
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!companies || companies.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">Nenhuma empresa cadastrada</p>
                <p className="text-sm text-muted-foreground">Clique em "Criar Empresa" para começar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome da Empresa</TableHead>
                    <TableHead>CNPJ</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id}>
                      <TableCell className="font-medium">{company.name}</TableCell>
                      <TableCell>{company.cnpj || "Não informado"}</TableCell>
                      <TableCell>
                        {new Date(company.created_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/company/${company.id}/dashboard`}>
                          <Button variant="outline" size="sm">
                            Abrir Dashboard
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
