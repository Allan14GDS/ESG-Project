import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { UserPlus, Users } from "lucide-react"
import { GestorUsersClient } from "@/components/users/gestor-users-client"

export default async function GestorUsersPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile with role
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    console.error("[v0] Error fetching profile:", profileError)
  }

  if (!profile || (profile.role !== "holding_admin" && profile.role !== "admin_main")) {
    redirect("/dashboard")
  }

  // Get all users (only revisor, user, respondedor for gestors)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["revisor", "user", "respondedor"])
    .order("created_at", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <button className="mb-4 text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar ao Dashboard
            </button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Gerenciar Usuários</h1>
              <p className="text-muted-foreground">Adicione e gerencie revisores e usuários</p>
            </div>
            <Link href="/admin/users/invite">
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Convidar Usuário
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <Card className="mb-8 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total de Usuários</p>
                <p className="text-3xl font-bold">{profiles?.length || 0}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <GestorUsersClient profiles={profiles || []} />
      </div>
    </div>
  )
}
