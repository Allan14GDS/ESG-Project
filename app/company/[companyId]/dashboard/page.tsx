import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Building2,
  FileText,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertCircle,
  Link2,
} from "lucide-react"
import Link from "next/link"
import { RemoveTemplateButton } from "@/components/company/remove-template-button"

export default async function CompanyDashboardPage({ params }: { params: { companyId: string } }) {
  const adminClient = createAdminClient()

  const { data: company, error: companyError } = await adminClient
    .from("companies")
    .select("*")
    .eq("id", params.companyId)
    .single()

  if (companyError || !company) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md border-border/50 bg-card">
          <CardContent className="p-8 text-center">
            <p className="text-xl font-semibold text-foreground">Empresa não encontrada</p>
            <p className="mt-2 text-muted-foreground">Verifique se o ID da empresa está correto</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  let holding = null
  if (company.holding_id) {
    const { data: holdingData } = await adminClient
      .from("organizations")
      .select("*")
      .eq("holding_id", company.holding_id)
      .maybeSingle()
    holding = holdingData
  }

  const { data: companyTemplates } = await adminClient
    .from("company_templates")
    .select("*, book_templates(id, name, description)")
    .eq("company_id", params.companyId)
    .eq("active", true)
    .order("assigned_at", { ascending: false })

  const { data: allResponses } = await adminClient.from("book_answers").select("*").eq("company_id", params.companyId)

  const totalTemplates = companyTemplates?.length || 0
  const completedResponses = allResponses?.filter((r) => r.status === "submitted")?.length || 0
  const draftResponses = allResponses?.filter((r) => r.status === "draft")?.length || 0
  const completionRate = totalTemplates > 0 ? Math.round((completedResponses / totalTemplates) * 100) : 0

  const responsesByTemplate =
    allResponses?.reduce((acc: any, response) => {
      if (!acc[response.template_id]) {
        acc[response.template_id] = []
      }
      acc[response.template_id].push(response)
      return acc
    }, {}) || {}

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link href={holding ? `/admin/holdings/${holding.id}` : "/admin/holdings"}>
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar para Holding
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Dashboard Executivo
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{company.name}</h1>
          <p className="mt-3 text-muted-foreground">
            CNPJ: {company.cnpj || "Não informado"} · Holding: {holding?.name || "Não informado"}
          </p>
        </div>

        {/* Executive Stats */}
        <div className="mb-12 grid gap-4 md:grid-cols-4">
          <Card className="border-border/50 bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Templates Atribuídos
                  </p>
                  <p className="mt-2 text-4xl font-bold text-primary">{totalTemplates}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Completas</p>
                  <p className="mt-2 text-4xl font-bold text-green-500">{completedResponses}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 ring-1 ring-green-500/20">
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Em Rascunho</p>
                  <p className="mt-2 text-4xl font-bold text-yellow-500">{draftResponses}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 ring-1 ring-yellow-500/20">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Taxa de Conclusão
                  </p>
                  <p className="mt-2 text-4xl font-bold text-foreground">{completionRate}%</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mb-8">
          <Link href={`/company/${company.id}/assign-template`}>
            <Button size="lg" className="gap-2 rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90">
              <Link2 className="h-5 w-5" />
              Atribuir Templates
            </Button>
          </Link>
        </div>

        {/* Templates List */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 px-8 py-6">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <FileText className="h-5 w-5 text-primary" />
              Templates Atribuídos
            </CardTitle>
            <CardDescription>Responda aos questionários atribuídos à sua empresa</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!companyTemplates || companyTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                  <AlertCircle className="h-10 w-10 text-primary" />
                </div>
                <p className="text-xl font-semibold text-foreground">Nenhum template atribuído</p>
                <p className="mt-2 text-muted-foreground">
                  Entre em contato com o administrador para atribuir templates
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {companyTemplates.map((ct) => {
                  const template = ct.book_templates
                  const responses = responsesByTemplate[template?.id] || []
                  const hasSubmitted = responses.some((r: any) => r.status === "submitted")
                  const hasDraft = responses.some((r: any) => r.status === "draft")

                  return (
                    <div key={ct.id} className="flex items-center justify-between p-8 hover:bg-secondary/30">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-foreground">{template?.name || "Sem nome"}</h3>
                          {hasSubmitted && (
                            <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Completo
                            </Badge>
                          )}
                          {!hasSubmitted && hasDraft && (
                            <Badge className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">
                              <Clock className="mr-1 h-3 w-3" />
                              Rascunho
                            </Badge>
                          )}
                          {!hasSubmitted && !hasDraft && (
                            <Badge variant="outline" className="border-border/50">
                              Pendente
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">{template?.description || "Sem descrição"}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Atribuído em {new Date(ct.assigned_at).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                      <div className="ml-6 flex gap-2">
                        <RemoveTemplateButton companyId={company.id} companyTemplateId={ct.id} />
                        <Link href={`/admin/templates/${template?.id}/questions`}>
                          <Button className="rounded-xl bg-primary px-6 text-primary-foreground hover:bg-primary/90">
                            {hasSubmitted ? "Ver Respostas" : hasDraft ? "Continuar Respondendo" : "Acessar Questões"}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
