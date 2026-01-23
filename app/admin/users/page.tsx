import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Users, ArrowLeft, Search, UserPlus, Shield } from "lucide-react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { requireGestor } from "@/lib/auth-utils"
import { CommandCenterButton } from "@/components/command-center-button"
import { UsersSearchTable } from "@/components/admin/users-search-table"

const roleLabels = {
  revisor: { label: "Revisor", variant: "default" },
  user: { label: "Usuário", variant: "default" },
  responder: { label: "Respondente", variant: "default" },
  holding_admin: { label: "Gestor", variant: "default" },
}

export default async function AdminUsersPage() {
  const profile = await requireGestor()
  const isGestor = profile.role === "holding_admin"

  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  const adminClient = createAdminClient()

  let query = adminClient.from("profiles").select("*")

  if (isGestor) {
    query = query.in("role", ["revisor", "user", "responder"])
  }

  const { data: profiles, error: profilesError } = await query.order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8">
        {/* Back Button */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Link href={isGestor ? "/dashboard" : "/admin"}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                {isGestor ? "Voltar ao Dashboard" : "Voltar ao Painel"}
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
