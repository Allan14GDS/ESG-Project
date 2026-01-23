import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { HelpCircle, Building2 } from "lucide-react"
import Link from "next/link"
import { QuestionsPageClient } from "@/components/questions/questions-page-client"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function GestorQuestionsPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await adminClient
    .from("profiles")
    .select("role, email, id")
    .eq("email", user.email)
    .maybeSingle()

  if (!profile) {
    redirect("/dashboard")
  }

  try {

    const { data: orgMemberships, error: orgError } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", profile.id)

    if (orgError) {
      console.error("[v0] Organization members error:", orgError)
    }

    const holdingIds = orgMemberships?.map((m) => m.organization_id).filter(Boolean) || []

    if (holdingIds.length === 0) {
      return (
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
            <div className="mb-8">
              <Link href="/dashboard">
                <button className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Voltar ao Dashboard
                </button>
              </Link>
              <h1 className="text-4xl font-bold mb-2">Meus Cadernos</h1>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Sem acesso a holdings</h3>
                <p className="text-muted-foreground">
                  Você não tem acesso a nenhuma holding. Entre em contato com o administrador.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    const { data: companies } = await adminClient
      .from("companies")
      .select("id, name, cnpj, holding_id")
      .in("holding_id", holdingIds)
      .order("name")

    if (!companies || companies.length === 0) {
      return (
        <div className="min-h-screen bg-background">
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
            <div className="mb-8">
              <Link href="/dashboard">
                <button className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  ← Voltar ao Dashboard
                </button>
              </Link>
              <h1 className="text-4xl font-bold mb-2">Meus Cadernos</h1>
            </div>
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma empresa atribuída</h3>
                <p className="text-muted-foreground">
                  Não há empresas vinculadas às suas holdings. Entre em contato com o administrador.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    const companyIds = companies.map((c) => c.id)
    const { data: companyTemplates } = await adminClient
      .from("company_templates")
      .select(`
        company_id,
        template_id,
        active,
        template:book_templates!company_templates_template_id_fkey(id, name, description, type)
      `)
      .in("company_id", companyIds)
      .eq("active", true)

    console.log("[v0] Companies found:", companies?.length || 0)
    companies?.forEach((company) => {
      console.log(`[v0] - ${company.name} (${company.cnpj})`)
    })

    const companiesWithTemplates = companies.map((company) => {
      const templates =
        companyTemplates
          ?.filter((ct) => ct.company_id === company.id)
          .map((ct) => ct.template)
          .filter(Boolean) || []

      return {
        ...company,
        templates,
      }
    })

    const templateIds = companyTemplates?.map((ct) => ct.template_id).filter(Boolean) || []
    const { data: questionJunctions } = await adminClient
      .from("book_question_junction")
      .select("book_template_id, question_template_id")
      .in("book_template_id", templateIds)

    const questionCountByTemplate: Record<string, number> = {}
    questionJunctions?.forEach((j) => {
      questionCountByTemplate[j.book_template_id] = (questionCountByTemplate[j.book_template_id] || 0) + 1
    })

    const totalCompanies = companies.length
    const totalTemplates = new Set(templateIds).size
    const totalQuestions = new Set(questionJunctions?.map((j) => j.question_template_id) || []).size

    return (
      <QuestionsPageClient
        companiesWithTemplates={companiesWithTemplates}
        questionCountByTemplate={questionCountByTemplate}
        totalCompanies={totalCompanies}
        totalTemplates={totalTemplates}
        totalQuestions={totalQuestions}
      />
    )
  } catch (error) {
    console.error("[v0] Page error:", error)
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <Card>
            <CardContent className="p-12 text-center">
              <h3 className="text-lg font-semibold mb-2 text-red-600">Erro ao carregar cadernos</h3>
              <p className="text-muted-foreground mb-4">
                Ocorreu um erro ao carregar seus cadernos. Tente recarregar a página.
              </p>
              <Link href="/dashboard">
                <Button variant="outline">Voltar ao Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}
