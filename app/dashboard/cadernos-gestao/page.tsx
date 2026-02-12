import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { CadernosGestaoClient } from "@/components/cadernos/cadernos-gestao-client"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function CadernosGestaoPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  let user
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch (error: any) {
    // Ignore AbortError - this happens when navigation is cancelled
    if (error?.name === "AbortError") {
      console.log("[v0] Auth request aborted (navigation cancelled)")
      return null
    }
    throw error
  }

  if (!user) {
    redirect("/auth/login")
  }

  let profile
  try {
    const { data } = await adminClient.from("profiles").select("*").eq("id", user.id).single()
    profile = data
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.log("[v0] Profile fetch aborted (navigation cancelled)")
      return null
    }
    console.error("[v0] Error fetching profile:", error)
  }

  console.log("[v0] Cadernos Gestao - User profile:", {
    userId: user.id,
    role: profile?.role,
    orgId: profile?.organization_id,
  })

  // Qualquer usuário autenticado pode acessar esta página para gerenciar seus cadernos
  if (!profile) {
    redirect("/dashboard")
  }

  let userHoldingIds: string[] = []
  const allowedOrgIds: string[] = []

  // Se for user/revisor, buscar as organizations que ele pertence
  if (profile.role === "holding_admin" || profile.role === "user" || profile.role === "revisor") {
    if (profile.role === "holding_admin") {
      let memberships
      try {
        const { data } = await adminClient.from("organization_members").select("organization_id").eq("user_id", user.id)
        memberships = data
      } catch (error: any) {
        if (error?.name === "AbortError") {
          console.log("[v0] Memberships fetch aborted (navigation cancelled)")
          return null
        }
        console.error("[v0] Error fetching memberships:", error)
      }

      if (!memberships || memberships.length === 0) {
        console.error("[v0] Holding admin user has no holdings assigned via organization_members")
        return (
          <div className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-2xl">
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-8">
                <div className="flex items-start gap-4">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-foreground">Configuração Incompleta</h2>
                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                      Seu usuário é um <strong className="text-foreground">Gestor de Holding</strong>, mas ainda não
                      está associado a nenhuma holding específica.
                    </p>
                    <div className="mt-4 rounded-md bg-background/50 p-4 border border-border">
                      <p className="text-sm font-medium text-foreground mb-2">Para resolver este problema:</p>
                      <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Entre em contato com o administrador principal</li>
                        <li>Solicite que ele associe seu usuário a uma holding</li>
                        <li>O administrador pode fazer isso na página de gerenciamento de acesso do usuário</li>
                      </ol>
                    </div>
                    <div className="mt-6 flex gap-3">
                      <Link href="/dashboard">
                        <Button variant="outline">Voltar ao Dashboard</Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      userHoldingIds = memberships.map((m) => m.organization_id)
      console.log("[v0] Cadernos Gestao - User holding IDs from organization_members:", userHoldingIds)

      for (const holdingId of userHoldingIds) {
        try {
          const { data: holdingOrgs } = await adminClient
            .from("organizations")
            .select("id")
            .or(`id.eq.${holdingId},holding_id.eq.${holdingId}`)

          if (holdingOrgs && holdingOrgs.length > 0) {
            allowedOrgIds.push(...holdingOrgs.map((org) => org.id))
          }
        } catch (error: any) {
          if (error?.name === "AbortError") {
            console.log("[v0] Organizations fetch aborted (navigation cancelled)")
            return null
          }
          console.error("[v0] Error fetching organizations:", error)
        }
      }

      console.log("[v0] Cadernos Gestao - Allowed org IDs (holdings + companies):", allowedOrgIds)
    } else {
      // User or Revisor role
      allowedOrgIds.push(profile.organization_id)
    }
  }

  const templatesQuery = adminClient.from("book_templates").select("*").order("created_at", { ascending: false })

  let templates
  try {
    const { data, error: templatesError } = await templatesQuery
    if (templatesError) {
      console.error("[v0] Error fetching templates:", templatesError)
    }
    templates = data
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.log("[v0] Templates fetch aborted (navigation cancelled)")
      return null
    }
    console.error("[v0] Error fetching templates:", error)
  }

  console.log("[v0] Cadernos Gestao - Templates count:", templates?.length || 0)

  let usersQuery = adminClient
    .from("profiles")
    .select("id, email, full_name, role, organization_id")
    .in("role", ["user", "revisor", "holding_admin"])
    .eq("is_active", true)
    .order("full_name", { ascending: true })

  if (allowedOrgIds.length > 0) {
    try {
      const { data: userMemberships } = await adminClient
        .from("organization_members")
        .select("user_id")
        .in("organization_id", allowedOrgIds)

      if (userMemberships && userMemberships.length > 0) {
        const userIds = [...new Set(userMemberships.map((m) => m.user_id))]
        usersQuery = usersQuery.in("id", userIds)
        console.log("[v0] Cadernos Gestao - Filtering users by IDs from organization_members:", userIds.length)
      }
    } catch (error: any) {
      if (error?.name === "AbortError") {
        console.log("[v0] User memberships fetch aborted (navigation cancelled)")
        return null
      }
      console.error("[v0] Error fetching user memberships:", error)
    }
  }

  let users
  try {
    const { data, error: usersError } = await usersQuery
    if (usersError) {
      console.error("[v0] Error fetching users:", usersError)
    }
    users = data
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.log("[v0] Users fetch aborted (navigation cancelled)")
      return null
    }
    console.error("[v0] Error fetching users:", error)
  }

  console.log("[v0] Cadernos Gestao - Users count:", users?.length || 0)

  let assignmentsQuery = adminClient.from("book_assignments").select(`
      id,
      caderno_id,
      user_id,
      role,
      organization_id,
      company_id,
      created_at,
      profiles:user_id (
        id,
        email,
        full_name,
        role
      )
    `)

  if (allowedOrgIds.length > 0) {
    assignmentsQuery = assignmentsQuery.in("organization_id", allowedOrgIds)
  }

  let assignments
  try {
    const { data, error: assignmentsError } = await assignmentsQuery
    if (assignmentsError) {
      console.error("[v0] Error fetching assignments:", assignmentsError)
    }
    assignments = data
  } catch (error: any) {
    if (error?.name === "AbortError") {
      console.log("[v0] Assignments fetch aborted (navigation cancelled)")
      return null
    }
    console.error("[v0] Error fetching assignments:", error)
  }

  console.log("[v0] Cadernos Gestao - Assignments count:", assignments?.length || 0)

  // Fetch organizations (holdings) and companies
  let organizations
  try {
    const { data } = await adminClient
      .from("organizations")
      .select("*")
      .in("id", allowedOrgIds)
      .order("name")
    organizations = data
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return null
    }
    console.error("[v0] Error fetching organizations:", error)
  }

  let companies
  try {
    const { data } = await adminClient
      .from("companies")
      .select("*")
      .in("holding_id", userHoldingIds)
      .order("name")
    companies = data
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return null
    }
    console.error("[v0] Error fetching companies:", error)
  }

  // Fetch company_templates to know which templates are assigned to which companies
  let companyTemplates
  try {
    const { data } = await adminClient
      .from("company_templates")
      .select("*")
      .eq("active", true)
    companyTemplates = data
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return null
    }
    console.error("[v0] Error fetching company_templates:", error)
  }

  console.log("[v0] Cadernos Gestao - Organizations count:", organizations?.length || 0)
  console.log("[v0] Cadernos Gestao - Companies count:", companies?.length || 0)
  console.log("[v0] Cadernos Gestao - Company templates count:", companyTemplates?.length || 0)

  // --- Fetch question counts per template (replicating meus-cadernos logic) ---
  const uniqueTemplateIds = [...new Set((templates || []).map((t: any) => t.id))]
  const questionCountMap: Record<string, number> = {}

  if (uniqueTemplateIds.length > 0) {
    try {
      const questionCountPromises = uniqueTemplateIds.map(async (templateId: string) => {
        try {
          const { count, error } = await adminClient
            .from("book_question_junction")
            .select("*", { count: "exact", head: true })
            .eq("book_template_id", templateId)

          if (error) {
            console.error(`[v0] Error counting questions for template ${templateId}:`, error)
            return { templateId, count: 0 }
          }

          return { templateId, count: count || 0 }
        } catch (error) {
          console.error(`[v0] Exception counting questions for template ${templateId}:`, error)
          return { templateId, count: 0 }
        }
      })

      const questionCounts = await Promise.all(questionCountPromises)
      for (const { templateId, count } of questionCounts) {
        questionCountMap[templateId] = count
      }
    } catch (error) {
      console.error("[v0] Exception fetching question counts:", error)
    }
  }

  // --- Use RPC to get answer counts (bypasses PostgREST 1000-row limit) ---
  let answerCountsMap = new Map<string, number>() // key: `${template_id}_${company_id}` -> count
  try {
    if (allowedOrgIds.length > 0) {
      const companyIds = (companies || []).map((c: any) => c.id)
      
      if (companyIds.length > 0) {
        const { data: counts, error: countsError } = await adminClient
          .rpc("get_gestor_answer_counts", {
            p_company_ids: companyIds,
            p_org_ids: allowedOrgIds
          })
        
        if (countsError) {
          console.error("Error fetching answer counts via RPC:", countsError)
        } else if (counts) {
          for (const row of counts) {
            const key = `${row.template_id}_${row.company_id}`
            answerCountsMap.set(key, row.answered_count)
          }
        }
      }
    }
  } catch (error) {
    console.error("Exception fetching answer counts:", error)
  }

  // --- Build progress map using RPC counts ---
  const progressMap: Record<string, { questionsCount: number; answeredCount: number; status: "pending" | "in_progress" | "completed" }> = {}

  if (assignments && assignments.length > 0) {
    const uniquePairs = new Set<string>()
    for (const assignment of assignments) {
      const companyId = (assignment as any).company_id
      if (companyId) {
        uniquePairs.add(`${assignment.caderno_id}_${companyId}`)
      }
    }

    for (const pairKey of uniquePairs) {
      const splitIndex = pairKey.indexOf("_")
      const templateId = pairKey.substring(0, splitIndex)
      const companyId = pairKey.substring(splitIndex + 1)
      const questionsCount = questionCountMap[templateId] || 0

      // Get count from RPC result
      const answeredCount = answerCountsMap.get(pairKey) || 0

      let status: "pending" | "in_progress" | "completed" = "pending"
      if (answeredCount === 0) {
        status = "pending"
      } else if (answeredCount >= questionsCount && questionsCount > 0) {
        status = "completed"
      } else {
        status = "in_progress"
      }

      progressMap[pairKey] = { questionsCount, answeredCount, status }
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CadernosGestaoClient
          templates={templates || []}
          users={users || []}
          assignments={assignments || []}
          currentUserId={user.id}
          holdingId={userHoldingIds[0] || null}
          organizations={organizations || []}
          companies={companies || []}
          companyTemplates={companyTemplates || []}
          progressMap={progressMap}
        />
      </div>
    </div>
  )
}
