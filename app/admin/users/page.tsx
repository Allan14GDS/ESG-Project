import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, ArrowLeft, UserPlus } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { requireGestor } from "@/lib/auth-utils"
import { CommandCenterButton } from "@/components/command-center-button"
import { UsersSearchTable } from "@/components/admin/users-search-table"

export default async function AdminUsersPage() {
  const profile = await requireGestor()
  const isGestor = profile.role === "holding_admin"

  const adminClient = createAdminClient()

  let profiles: any[] = []

  if (isGestor) {
    // Scope users to gestor's organizations
    // 1. Get gestor's holdings
    const { data: memberships } = await adminClient
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", profile.id)
    const holdingIds = [...new Set((memberships || []).map((m) => m.organization_id).filter(Boolean))]

    if (holdingIds.length > 0) {
      // 2. Get companies under those holdings
      const { data: companiesData } = await adminClient
        .from("companies")
        .select("id")
        .in("holding_id", holdingIds)
      const companyIds = (companiesData || []).map((c) => c.id)

      if (companyIds.length > 0) {
        // 3. Get distinct user IDs assigned to those companies
        const { data: assignments } = await adminClient
          .from("book_assignments")
          .select("user_id")
          .in("company_id", companyIds)
          .limit(10000)
        const userIds = [...new Set((assignments || []).map((a: any) => a.user_id).filter(Boolean))]

        if (userIds.length > 0) {
          // 4. Fetch profiles for those users (only basic roles)
          const { data: scopedProfiles } = await adminClient
            .from("profiles")
            .select("*")
            .in("id", userIds)
            .in("role", ["revisor", "user", "responder"])
            .order("created_at", { ascending: false })
          profiles = scopedProfiles || []
        }
      }
    }
  } else {
    // Admin: see all users
    const { data: allProfiles } = await adminClient
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
    profiles = allProfiles || []
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Voltar ao Painel
              </Button>
            </Link>
            <CommandCenterButton userRole={profile.role} />
          </div>
        </div>

        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card">
                <Users className="h-6 w-6 text-foreground" />
              </div>
              <span className="text-sm font-medium uppercase tracking-widest text-muted-foreground">Governança</span>
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground">Controle de Usuários</h1>
            <p className="mt-3 text-muted-foreground">
              {profiles?.length || 0} usuário{profiles?.length !== 1 ? "s" : ""} cadastrado
              {profiles?.length !== 1 ? "s" : ""}
            </p>
            {isGestor && (
              <p className="mt-2 text-sm text-muted-foreground">
                Como gestor, você pode adicionar revisores e usuários
              </p>
            )}
          </div>
          <Link href="/admin/users/invite">
            <Button size="lg" className="gap-2 rounded-xl bg-foreground px-6 text-background hover:bg-foreground/90">
              <UserPlus className="h-5 w-5" />
              Convidar Usuário
            </Button>
          </Link>
        </div>

        {/* Search and Users Table */}
        <UsersSearchTable profiles={profiles || []} isGestor={isGestor} />
      </div>
    </div>
  )
}
