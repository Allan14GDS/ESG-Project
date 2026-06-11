import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Building2 } from "lucide-react"
import Link from "next/link"
import { AssignTemplateForm } from "@/components/company/assign-template-form"

export default async function AssignTemplatePage({ params }: { params: Promise<{ companyId: string }> }) {
  const adminClient = createAdminClient()
  const { companyId } = await params

  const { data: company } = await adminClient.from("companies").select("*").eq("id", companyId).single()

  if (!company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-border/50 bg-card">
          <CardContent className="p-8 text-center">
            <p className="text-xl font-semibold text-foreground">Empresa não encontrada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { data: templates, error: templatesError } = await adminClient
    .from("book_templates")
    .select("*")
    .order("name", { ascending: true })

  console.log("[assign-template] book_templates query:", {
    count: templates?.length ?? 0,
    error: templatesError?.message ?? null,
    ids: templates?.map((t) => t.id),
  })

  // company_templates: só considera active = true para templates já atribuídos.
  // Não filtra book_templates por active — templates inseridos via SQL com active null/false também aparecem.
  const { data: assignedTemplates, error: assignedError } = await adminClient
    .from("company_templates")
    .select("template_id")
    .eq("company_id", companyId)
    .eq("active", true)

  console.log("[assign-template] company_templates (assigned) query:", {
    companyId,
    count: assignedTemplates?.length ?? 0,
    error: assignedError?.message ?? null,
    assignedIds: assignedTemplates?.map((at) => at.template_id),
  })

  const assignedIds = assignedTemplates?.map((at) => at.template_id) || []
  const availableTemplates = templates?.filter((t) => !assignedIds.includes(t.id)) || []

  console.log("[assign-template] result:", {
    totalTemplates: templates?.length ?? 0,
    assignedCount: assignedIds.length,
    availableCount: availableTemplates.length,
  })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
        <div className="mb-8">
          <Link href={`/company/${company.id}/dashboard`}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Atribuir Templates
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{company.name}</h1>
          <p className="mt-3 text-muted-foreground">Selecione os templates para atribuir à empresa</p>
        </div>

        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 px-8 py-6">
            <CardTitle className="text-lg font-semibold text-foreground">Templates Disponíveis</CardTitle>
            <CardDescription>Escolha os questionários que a empresa deve responder</CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <AssignTemplateForm companyId={company.id} templates={availableTemplates} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
