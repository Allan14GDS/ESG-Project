import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building2, ArrowLeft, Search, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { requireAdmin } from "@/lib/auth-utils"
import { CreateHoldingButton } from "@/components/admin/create-holding-button"
import { DeleteHoldingButton } from "@/components/admin/delete-holding-button"
import { EditHoldingButton } from "@/components/admin/edit-holding-button"

type OrganizationWithCompanyCount = {
  id: string
  name: string
  holding_id: string | null
  cnpj: string | null
  company_count: number
  created_at: string
}

export default async function AdminHoldingsListPage() {
  await requireAdmin()

  const adminClient = createAdminClient()

  const { data: organizations, error: orgsError } = await adminClient
    .from("organizations")
    .select("id, name, holding_id, cnpj, created_at")
    .order("created_at", { ascending: false })

  const { data: companies, error: companiesError } = await adminClient.from("companies").select("holding_id")

  console.log("[v0] Organizations:", organizations)
  console.log("[v0] Companies:", companies)

  const holdingCompanyCountMap = new Map<string | null, number>()
  if (companies) {
    for (const company of companies) {
      const holdingId = company.holding_id
      holdingCompanyCountMap.set(holdingId, (holdingCompanyCountMap.get(holdingId) || 0) + 1)
    }
  }

  console.log("[v0] Holding company count map:", Object.fromEntries(holdingCompanyCountMap))

  const organizationsWithCounts: OrganizationWithCompanyCount[] = (organizations || []).map((org) => ({
    ...org,
    company_count: holdingCompanyCountMap.get(org.id) || 0,
  }))

  console.log("[v0] Organizations with counts:", organizationsWithCounts)

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8">
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Painel
            </Button>
          </Link>
        </div>

        <div className="mb-12 flex items-start justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <span className="text-sm font-medium uppercase tracking-widest text-primary">Organizações</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Holdings Registradas</h1>
            <p className="mt-3 text-muted-foreground">
              {organizationsWithCounts.length} organização
              {organizationsWithCounts.length !== 1 ? "s" : ""} cadastrada
              {organizationsWithCounts.length !== 1 ? "s" : ""}
            </p>
          </div>
          <CreateHoldingButton />
        </div>

        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar holdings..."
              className="h-12 rounded-xl border-border/50 bg-card pl-12 text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>

        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 px-8 py-6">
            <CardTitle className="text-lg font-semibold text-foreground">Lista de Holdings</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {organizationsWithCounts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
                  <Building2 className="h-10 w-10 text-primary" />
                </div>
                <p className="text-xl font-semibold text-foreground">Nenhuma holding cadastrada</p>
                <p className="mt-2 text-muted-foreground">Crie uma empresa para começar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="h-14 px-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Nome da Holding
                    </TableHead>
                    <TableHead className="h-14 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Empresas
                    </TableHead>
                    <TableHead className="h-14 px-8 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizationsWithCounts.map((org) => (
                    <TableRow key={org.id} className="border-border/50 hover:bg-primary/5">
                      <TableCell className="px-8 py-5 font-semibold text-foreground">{org.name}</TableCell>
                      <TableCell className="py-5 text-center">
                        <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-sm font-medium text-primary">
                          {org.company_count}
                        </span>
                      </TableCell>
                      <TableCell className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <EditHoldingButton holdingId={org.id} currentName={org.name} currentCnpj={org.cnpj} />
                          <Link href={`/admin/holdings/${org.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 rounded-lg border-border/50 bg-transparent text-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary"
                            >
                              Acessar
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                          <DeleteHoldingButton holdingId={org.id} holdingName={org.name} />
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
