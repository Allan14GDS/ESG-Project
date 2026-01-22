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
import { ResetPasswordDialog } from "@/components/users/reset-password-dialog"
import { DeleteUserDialog } from "@/components/users/delete-user-dialog"

const roleLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  admin_main: { label: "Admin", variant: "default" },
  holding_admin: { label: "Gestor", variant: "secondary" },
  company_admin: { label: "Admin Empresa", variant: "secondary" },
  revisor: { label: "Revisor", variant: "outline" },
  user: { label: "Usuário", variant: "outline" },
  responder: { label: "Respondedor", variant: "outline" },
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

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar usuários..."
              className="h-12 rounded-xl border-border/50 bg-card pl-12 text-foreground placeholder:text-muted-foreground focus:border-foreground/30 focus:ring-foreground/20"
            />
          </div>
        </div>

        {/* Users Table */}
        <Card className="border-border/50 bg-card">
          <CardHeader className="border-b border-border/50 px-8 py-6">
            <CardTitle className="text-lg font-semibold text-foreground">Lista de Usuários</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {!profiles || profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-border/50 bg-secondary/50">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-xl font-semibold text-foreground">Nenhum usuário cadastrado</p>
                <p className="mt-2 text-muted-foreground">Clique em "Convidar Usuário" para começar</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="h-14 px-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Nome / Email
                    </TableHead>
                    <TableHead className="h-14 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Perfil
                    </TableHead>
                    <TableHead className="h-14 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Status
                    </TableHead>
                    <TableHead className="h-14 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Cadastro
                    </TableHead>
                    <TableHead className="h-14 px-8 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Ações
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.map((profile) => {
                    const roleInfo = roleLabels[profile.role] || { label: profile.role, variant: "outline" as const }
                    return (
                      <TableRow key={profile.id} className="border-border/50 hover:bg-secondary/30">
                        <TableCell className="px-8 py-5">
                          <div>
                            <p className="font-medium text-foreground">{profile.full_name || "Sem nome"}</p>
                            <p className="text-sm text-muted-foreground">{profile.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-5">
                          <Badge variant={roleInfo.variant} className="gap-1.5 rounded-md border-border/50 font-medium">
                            <Shield className="h-3 w-3" />
                            {roleInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-5 text-center">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                              profile.is_active
                                ? "border border-green-500/30 bg-green-500/10 text-green-400"
                                : "border border-border/50 bg-secondary/50 text-muted-foreground"
                            }`}
                          >
                            {profile.is_active ? "Ativo" : "Inativo"}
                          </span>
                        </TableCell>
                        <TableCell className="py-5 text-muted-foreground">
                          {new Date(profile.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <ResetPasswordDialog
                              userId={profile.id}
                              userEmail={profile.email}
                              userName={profile.full_name || profile.email}
                            />
                            <DeleteUserDialog
                              userId={profile.id}
                              userEmail={profile.email}
                              userName={profile.full_name || profile.email}
                            />
                            {!isGestor && (
                              <Link href={`/admin/users/${profile.id}/access`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 rounded-lg border-border/50 bg-transparent text-foreground hover:bg-secondary hover:text-foreground"
                                >
                                  <Shield className="h-3.5 w-3.5" />
                                  Gerenciar Acesso
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
