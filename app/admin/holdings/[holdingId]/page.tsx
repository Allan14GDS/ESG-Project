import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, ArrowLeft, BookOpen, Calendar } from "lucide-react"
import Link from "next/link"
import { DeleteCompanyButton } from "@/components/company/delete-company-button"
import { requireAdmin } from "@/lib/auth-utils"
import { CreateCompanyButton } from "@/components/company/create-company-button"
import { ExportCompanyDataButton } from "@/components/company/export-company-data-button"

export default async function AdminHoldingDetailPage({ params }: { params: Promise<{ holdingId: string }> }) {
  await requireAdmin()
  const { holdingId } = await params

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const adminClient = createAdminClient()

  const { data: holding, error: holdingError } = await adminClient
    .from("organizations")
    .select("*")
    .eq("id", holdingId)
    .single()

  if (holdingError || !holding) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-border/50 bg-card">
          <CardContent className="p-8 text-center">
            <p className="text-xl font-semibold text-foreground">Holding não encontrada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: companies, error: companiesError } = await adminClient
    .from("companies")
    .select("*")
    .eq("holding_id", holdingId)
    .order("created_at", { ascending: false })

  if (companiesError || !companies) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-border/50 bg-card">
          <CardContent className="p-8 text-center">
            <p className="text-xl font-semibold text-foreground">Holding não encontrada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Fetch cadernos assigned to each company via company_templates
  const companyIds = companies.map((c) => c.id)
  const { data: companyTemplates } = await adminClient
    .from("company_templates")
    .select("company_id, template_id, active, book_templates(id, name)")
    .in("company_id", companyIds.length > 0 ? companyIds : ["__none__"])
    .eq("active", true)

  // Build a map of company_id -> unique cadernos assigned to that company
  const companyCadernosMap: Record<string, { id: string; name: string }[]> = {}
  for (const ct of companyTemplates || []) {
    const compId = ct.company_id
    if (!compId) continue
    const template = ct.book_templates as any
    if (!template?.id) continue
    if (!companyCadernosMap[compId]) {
      companyCadernosMap[compId] = []
    }
    if (!companyCadernosMap[compId].some((c) => c.id === template.id)) {
      companyCadernosMap[compId].push({ id: template.id, name: template.name })
    }
  }
  // Sort cadernos by name for each company
  for (const compId of Object.keys(companyCadernosMap)) {
    companyCadernosMap[compId].sort((a, b) => a.name.localeCompare(b.name))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" asChild>
            <Link href="/admin/holdings">
              <ArrowLeft className="h-4 w-4" />
              Voltar às Holdings
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card">
              <Building2 className="h-6 w-6 text-foreground" />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Gestão Interna</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{holding.name}</h1>
          <p className="mt-3 text-muted-foreground">
            Total de Empresas: {companies.length} · Criada em {new Date(holding.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* Stats */}
        <div className="mb-12 grid gap-4 md:grid-cols-2">
          <Card className="border-border/50 bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Empresas Vinculadas
                  </p>
                  <p className="mt-2 text-4xl font-bold text-foreground">{companies.length}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/30 bg-secondary/50">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Holding ID</p>
                  <p className="mt-2 text-sm font-mono text-foreground break-all">{holdingId}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/30 bg-secondary/50">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 flex flex-wrap gap-4">
          <CreateCompanyButton holdingId={holdingId} />
        </div>

        {/* Companies List */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 p-8">
            <CardTitle className="flex items-center gap-3 text-2xl font-bold text-foreground">
              <BookOpen className="h-6 w-6" />
              Empresas Vinculadas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {companies.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-secondary/50">
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-xl font-semibold text-foreground">Nenhuma empresa cadastrada</p>
                <p className="mt-2 text-muted-foreground">Clique em "Nova Empresa" para adicionar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="h-14 px-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Nome da Empresa
                    </TableHead>
                    <TableHead className="h-14 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      CNPJ
                    </TableHead>
                    <TableHead className="h-14 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Criado em
                    </TableHead>
                    <TableHead className="h-14 px-8 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((company) => (
                    <TableRow key={company.id} className="border-border/50 hover:bg-secondary/30">
                      <TableCell className="px-8 py-5 font-medium text-foreground">{company.name}</TableCell>
                      <TableCell className="py-5 font-mono text-sm text-muted-foreground">
                        {company.cnpj || "—"}
                      </TableCell>
                      <TableCell className="py-5 text-muted-foreground">
                        {new Date(company.created_at).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-border/50 bg-transparent text-foreground hover:bg-secondary hover:text-foreground"
                            asChild
                          >
                            <Link href={`/company/${company.id}/dashboard`}>Abrir Dashboard</Link>
                          </Button>
                          <ExportCompanyDataButton
                            companyId={company.id}
                            companyName={company.name}
                            cadernos={companyCadernosMap[company.id] || []}
                          />
                          <DeleteCompanyButton
                            companyId={company.id}
                            companyName={company.name}
                            holdingId={holdingId}
                          />
                        </div>
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
