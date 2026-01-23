import { createAdminClient } from "@/lib/supabase/admin"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"
import { ManageUserAccessForm } from "@/components/admin/manage-user-access-form"

export default async function ManageUserAccessPage({ params }: { params: { userId: string } }) {
  const adminClient = createAdminClient()

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", params.userId)
    .single()

  if (profileError || !profile) {
    notFound()
  }

  const { data: holdings } = await adminClient
    .from("organizations")
    .select("*")
    .eq("type", "holding")
    .order("name")

  const { data: companies } = await adminClient.from("companies").select("*").order("name")

  const { data: memberships } = await adminClient.from("organization_members").select("*").eq("user_id", params.userId)

  const { data: templates } = await adminClient.from("book_templates").select("*").order("name")

  const { data: assignments } = await adminClient
    .from("book_assignments")
    .select("caderno_id, organization_id, company_id, role")
    .eq("user_id", params.userId)

  const { data: companyTemplates } = await adminClient
    .from("company_templates")
    .select("*")
    .eq("active", true)

  const enrichedCompanies =
    companies?.map((company) => ({
      ...company,
      holding: holdings?.find((h) => h.id === company.holding_id),
    })) || []

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              Voltar aos Usuários
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-12">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
              Gerenciar Acesso
            </span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground">{profile.full_name || profile.email}</h1>
          <p className="mt-3 text-muted-foreground">{profile.email}</p>
        </div>

        {/* Access Management Form */}
        <ManageUserAccessForm
          userId={params.userId}
          userRole={profile.role}
          holdings={holdings || []}
          companies={enrichedCompanies}
          currentMemberships={memberships || []}
          templates={templates || []}
          currentAssignments={assignments || []}
          companyTemplates={companyTemplates || []}
        />
      </div>
    </div>
  )
}
