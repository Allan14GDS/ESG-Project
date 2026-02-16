"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, UserPlus } from "lucide-react"
import { DeleteUserDialog } from "@/components/users/delete-user-dialog"
import Link from "next/link"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  role: string
  is_active: boolean
}

interface GestorUsersClientProps {
  profiles: UserProfile[]
}

const roleLabels: Record<string, string> = {
  revisor: "Revisor",
  user: "Usuário",
  respondedor: "Respondedor",
}

const roleColors: Record<string, string> = {
  revisor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  user: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  respondedor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
}

export function GestorUsersClient({ profiles }: GestorUsersClientProps) {
  if (!profiles || profiles.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum usuário cadastrado</h3>
          <p className="text-muted-foreground mb-4">Comece convidando usuários para sua equipe</p>
          <Link href="/admin/users/invite">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Convidar Primeiro Usuário
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {profiles.map((userProfile) => (
        <Card key={userProfile.id}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{userProfile.full_name || "Sem nome"}</h3>
                  <p className="text-sm text-muted-foreground">{userProfile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={roleColors[userProfile.role] || "bg-gray-100 text-gray-800"}>
                  {roleLabels[userProfile.role] || userProfile.role}
                </Badge>
                <Badge variant={userProfile.is_active ? "default" : "secondary"}>
                  {userProfile.is_active ? "Ativo" : "Inativo"}
                </Badge>
                <DeleteUserDialog
                  userId={userProfile.id}
                  userEmail={userProfile.email}
                  userName={userProfile.full_name || userProfile.email}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
