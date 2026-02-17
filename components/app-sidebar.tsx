"use client"

import {
  Hourglass,
  User,
  Settings,
  HelpCircle,
  BookOpen,
  UserPlus,
  LogOut,
  BookCopy,
  BarChart3,
  Kanban,
  Building2,
  Download,
  History,
  Trash2,
} from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { employeeDataService } from "@/lib/employee-data"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"

const progressService = {
  calculateEmployeeDataProgress(): number {
    const matrices = employeeDataService.getEmployeeMatrices()
    const nonEmployeeWorkers = employeeDataService.getNonEmployeeWorkers()

    let completedSections = 0
    const totalSections = 2

    if (matrices && matrices.length > 0) {
      const hasData = matrices.some((matrix) => matrix.data.some((cell) => cell.count > 0))
      if (hasData) completedSections++
    }

    if (
      nonEmployeeWorkers &&
      (nonEmployeeWorkers.contractors > 0 ||
        nonEmployeeWorkers.freelancers > 0 ||
        nonEmployeeWorkers.temporaryWorkers > 0)
    ) {
      completedSections++
    }

    return Math.round((completedSections / totalSections) * 100)
  },

  calculateOrganizationProgress(): number {
    const orgData = typeof window !== "undefined" ? localStorage.getItem("esg-organization") : null

    if (orgData) {
      const parsed = JSON.parse(orgData)
      if (parsed.legalName && parsed.cnpj) return 100
      if (parsed.legalName || parsed.cnpj) return 50
    }
    return 0
  },

  calculateReportingPeriodProgress(): number {
    const periodData = typeof window !== "undefined" ? localStorage.getItem("esg-reporting-period") : null

    if (periodData) {
      const parsed = JSON.parse(periodData)
      if (parsed.startDate && parsed.endDate) return 100
      if (parsed.startDate || parsed.endDate) return 50
    }
    return 0
  },

  calculateDisclosuresProgress(): number {
    if (typeof window === "undefined") return 0

    let totalQuestions = 0
    let answeredQuestions = 0

    for (let i = 1; i <= 30; i++) {
      const disclosureId = `2-${i}`
      const answersKey = `gri-answers-${disclosureId}`
      const answersData = localStorage.getItem(answersKey)

      if (answersData) {
        try {
          const answers = JSON.parse(answersData)
          const questionKeys = Object.keys(answers)
          totalQuestions += questionKeys.length

          answeredQuestions += questionKeys.filter((key) => {
            const value = answers[key]
            return value !== null && value !== undefined && value !== ""
          }).length
        } catch (e) {
          console.error("[v0] Error parsing answers for", disclosureId, e)
        }
      }
    }

    if (totalQuestions === 0) return 0
    return Math.round((answeredQuestions / totalQuestions) * 100)
  },

  calculateGovernanceProgress(): number {
    if (typeof window === "undefined") return 0

    const govData = localStorage.getItem("esg-governance-data")
    if (!govData) return 0

    try {
      const parsed = JSON.parse(govData)
      let completedSections = 0
      const totalSections = 4 // composition, policies, oversight, compensation

      if (parsed.composition && parsed.composition.totalMembers > 0) completedSections++
      if (parsed.policies && parsed.policies.length > 0) completedSections++
      if (parsed.oversight && parsed.oversight.length > 0) completedSections++
      if (parsed.compensation && parsed.compensation.hasPolicy) completedSections++

      return Math.round((completedSections / totalSections) * 100)
    } catch (e) {
      return 0
    }
  },

  calculateOverallProgress(): number {
    const employeeProgress = this.calculateEmployeeDataProgress()
    const orgProgress = this.calculateOrganizationProgress()
    const periodProgress = this.calculateReportingPeriodProgress()
    const disclosuresProgress = this.calculateDisclosuresProgress()
    const governanceProgress = this.calculateGovernanceProgress()

    const weightedProgress =
      orgProgress * 0.15 +
      periodProgress * 0.15 +
      employeeProgress * 0.2 +
      governanceProgress * 0.2 +
      disclosuresProgress * 0.3

    return Math.round(weightedProgress)
  },
}

const defaultUserNavigation = [
  {
    title: "Cadernos",
    description: "Cadernos atribuídos para você",
    items: [
      {
        title: "Meus Cadernos",
        url: "/dashboard/meus-cadernos",
        icon: BookOpen,
        description: "Cadernos atribuídos para preenchimento",
        progress: 0,
        status: "active",
      },
      {
        title: "Histórico",
        url: "/dashboard/historico",
        icon: History,
        description: "Histórico de revisões e comentários",
        progress: 0,
        status: "active",
      },
    ],
  },
]

const gestorNavigation = [
  {
    title: "Cadernos",
    description: "Gestão de cadernos e questões",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: BarChart3,
        description: "Visão geral de empresas e usuários",
        progress: 0,
        status: "active",
      },
      {
        title: "Meus Cadernos",
        url: "/dashboard/meus-cadernos",
        icon: BookOpen,
        description: "Cadernos atribuídos para preenchimento",
        progress: 0,
        status: "active",
      },
      {
        title: "Gerenciar Cadernos",
        url: "/dashboard/cadernos-gestao",
        icon: BookCopy,
        description: "Atribuir cadernos aos responsáveis",
        progress: 0,
        status: "active",
      },
      {
        title: "Gerenciar Questões",
        url: "/dashboard/questions",
        icon: HelpCircle,
        description: "Visualizar e gerenciar todas as questões",
        progress: 0,
        status: "active",
      },
      {
        title: "Gerenciar Usuários",
        url: "/dashboard/users",
        icon: UserPlus,
        description: "Adicionar revisores e usuários",
        progress: 0,
        status: "active",
      },
      {
        title: "Histórico de Revisões",
        url: "/dashboard/historico",
        icon: History,
        description: "Log de auditoria das questões",
        progress: 0,
        status: "active",
      },
      {
        title: "Respostas Deletadas",
        url: "/dashboard/historico-respostas",
        icon: Trash2,
        description: "Histórico de respostas deletadas",
        progress: 0,
        status: "active",
      },
    ],
  },
]

const adminNavigation = [
  {
    title: "Dashboard",
    description: "Métricas e visão geral",
    items: [
      {
        title: "Dashboard",
        url: "/admin",
        icon: BarChart3,
        description: "Métricas e indicadores do sistema",
        progress: 0,
        status: "active",
      },
    ],
  },
  {
    title: "Central de Comando",
    description: "Acesso administrativo completo",
    items: [
      {
        title: "Holdings",
        url: "/admin/holdings",
        icon: Building2,
        description: "Gerenciar holdings e empresas",
        progress: 0,
        status: "active",
      },
      {
        title: "Templates",
        url: "/admin/templates",
        icon: BookOpen,
        description: "Gerenciar templates de cadernos",
        progress: 0,
        status: "active",
      },
      {
        title: "Questões Admin",
        url: "/admin/questions",
        icon: HelpCircle,
        description: "Biblioteca de questões do sistema",
        progress: 0,
        status: "active",
      },
      {
        title: "Usuários Admin",
        url: "/admin/users",
        icon: UserPlus,
        description: "Gerenciar todos os usuários",
        progress: 0,
        status: "active",
      },
    ],
  },
  {
    title: "Visão e Acompanhamento",
    description: "Dashboards e relatórios",
    items: [
      {
        title: "Kanban",
        url: "/dashboard/status",
        icon: Kanban,
        description: "Visão kanban dos cadernos",
        progress: 0,
        status: "active",
      },
      {
        title: "Analytics",
        url: "/dashboard/analytics",
        icon: BarChart3,
        description: "Análises e métricas",
        progress: 0,
        status: "active",
      },
      {
        title: "Exportação",
        url: "/dashboard/export",
        icon: Download,
        description: "Exportar relatórios",
        progress: 0,
        status: "active",
      },
      {
        title: "Histórico de Revisões",
        url: "/dashboard/historico",
        icon: History,
        description: "Log de auditoria das questões",
        progress: 0,
        status: "active",
      },
    ],
  },
  {
    title: "Cadernos",
    description: "Gestão completa de cadernos",
    items: [
      {
        title: "Meus Cadernos",
        url: "/dashboard/meus-cadernos",
        icon: BookOpen,
        description: "Cadernos atribuídos para preenchimento",
        progress: 0,
        status: "active",
      },
      {
        title: "Gerenciar Cadernos",
        url: "/dashboard/cadernos-gestao",
        icon: BookCopy,
        description: "Atribuir cadernos aos responsáveis",
        progress: 0,
        status: "active",
      },
      {
        title: "Gerenciar Questões",
        url: "/dashboard/questions",
        icon: HelpCircle,
        description: "Visualizar e gerenciar todas as questões",
        progress: 0,
        status: "active",
      },
      {
        title: "Gerenciar Usuários",
        url: "/dashboard/users",
        icon: UserPlus,
        description: "Adicionar revisores e usuários",
        progress: 0,
        status: "active",
      },
    ],
  },
]

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "text-green-600"
    case "active":
      return "text-blue-600"
    case "pending":
      return "text-yellow-600"
    case "not-started":
      return "text-gray-400"
    default:
      return "text-gray-400"
  }
}

interface AppSidebarProps {
  userEmail: string
  userName: string
  userRole: string
}

export function AppSidebar({ userEmail, userName, userRole }: AppSidebarProps) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const { open } = useSidebar()

  console.log("[v0] AppSidebar props:", { userEmail, userName, userRole })

  const [realProgress, setRealProgress] = useState({
    overall: 0,
    employeeData: 0,
    organization: 0,
    reportingPeriod: 0,
    disclosures: 0,
    governance: 0,
  })

  useEffect(() => {
    const calculateProgress = () => {
      const overall = progressService.calculateOverallProgress()
      const employeeData = progressService.calculateEmployeeDataProgress()
      const organization = progressService.calculateOrganizationProgress()
      const reportingPeriod = progressService.calculateReportingPeriodProgress()
      const disclosures = progressService.calculateDisclosuresProgress()
      const governance = progressService.calculateGovernanceProgress()

      setRealProgress({
        overall,
        employeeData,
        organization,
        reportingPeriod,
        disclosures,
        governance,
      })
    }

    calculateProgress()

    const handleStorageChange = () => {
      calculateProgress()
    }
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("esg-data-updated", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("esg-data-updated", handleStorageChange)
    }
  }, [])

  const navigationToShow =
    userRole === "admin_main"
      ? adminNavigation
      : userRole === "holding_admin"
        ? gestorNavigation
        : defaultUserNavigation

  const handleLogout = async () => {
    console.log("[v0] Logout button clicked")
    try {
      const supabase = createClient()
      console.log("[v0] Supabase client created, attempting signOut...")

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session) {
        // Only try to signOut if we have an active session
        const { error } = await supabase.auth.signOut()

        if (error && error.message !== "Auth session missing!") {
          // Only throw if it's not a "session missing" error
          console.error("[v0] Supabase signOut error:", error)
          throw error
        }
      }

      console.log("[v0] SignOut completed (or no session to clear)")

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })

      // Clear any local storage
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }

      console.log("[v0] Redirecting to login page...")
      router.push("/auth/login")
      router.refresh()
    } catch (error: any) {
      if (error?.message === "Auth session missing!") {
        console.log("[v0] Session already cleared, proceeding with logout")

        // Clear storage and redirect
        if (typeof window !== "undefined") {
          localStorage.clear()
          sessionStorage.clear()
        }

        router.push("/auth/login")
        router.refresh()
        return
      }

      // For other errors, show toast
      console.error("[v0] Erro ao fazer logout:", error)
      toast({
        title: "Erro no logout",
        description: "Houve um problema ao sair. Tentando forçar logout...",
        variant: "destructive",
      })

      // Force clear everything and redirect
      if (typeof window !== "undefined") {
        localStorage.clear()
        sessionStorage.clear()
      }

      // Force redirect even if logout fails
      setTimeout(() => {
        router.push("/auth/login")
        router.refresh()
      }, 500)
    }
  }

  const roleLabels: Record<string, string> = {
    admin_main: "Admin",
    holding_admin: "Gestor",
    revisor: "Revisor",
    user: "Usuário",
    respondedor: "Respondedor",
  }
  const roleLabel = roleLabels[userRole] || "Usuário"

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-3 py-3 md:gap-3 md:px-4 md:py-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <Hourglass className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base md:text-lg font-bold truncate">b.kick</h2>
            {!open && <p className="text-xs text-muted-foreground truncate">Plataforma de Materialidade ESG</p>}
          </div>
          {!open && <ThemeToggle />}
        </div>

        {userRole !== "holding_admin" && (
          <div className="px-3 pb-3 md:px-4 md:pb-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-medium text-xs md:text-sm">Progresso Geral</span>
              <span className="font-bold text-primary text-sm md:text-base">{realProgress.overall}%</span>
            </div>
            <Progress value={realProgress.overall} className="h-2 md:h-2.5" />
          </div>
        )}

        <div className="px-3 pb-3 md:px-4 md:pb-4">
          <Card className="p-3 md:p-4 bg-muted/50">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs md:text-sm font-semibold text-foreground">Usuário Conectado</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
                <Badge variant="secondary" className="mt-1 md:mt-2 text-xs">
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        {navigationToShow.map((section, sectionIndex) => (
          <div key={section.title}>
            <SidebarGroup className="py-2">
              <SidebarGroupLabel className="px-3 py-2 text-[10px] md:text-xs font-semibold uppercase tracking-wide text-muted-foreground/70">
                {section.title}
              </SidebarGroupLabel>
              <SidebarGroupContent className="mt-1">
                <SidebarMenu className="gap-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.url
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          className={`relative cursor-pointer transition-colors rounded-md h-auto ${
                            isActive
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "hover:bg-muted text-foreground"
                          }`}
                        >
                          <a href={item.url} className="flex items-center gap-3 px-3 py-2.5 w-full min-h-[40px]">
                            <Icon className="h-[17px] w-[17px] shrink-0" />
                            {open && (
                              <span className="text-[13.5px] font-medium leading-none flex-1 text-left">
                                {item.title}
                              </span>
                            )}
                            {item.progress > 0 && open && (
                              <span className="text-xs font-semibold whitespace-nowrap shrink-0 ml-auto">
                                {item.progress}%
                              </span>
                            )}
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {sectionIndex < navigationToShow.length - 1 && <SidebarSeparator className="my-4" />}
          </div>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t p-3 md:p-4">
        <div className="flex flex-col gap-3 w-full">
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="w-full text-xs md:text-sm justify-start bg-transparent"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-medium whitespace-nowrap">
                Demo Platform
              </Badge>
              <Badge className="text-xs font-medium bg-primary text-primary-foreground whitespace-nowrap">
                GRI 2021
              </Badge>
            </div>
            {open && <ThemeToggle />}
          </div>

          {!open && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              Sistema simplificado de reporte ESG com 40 disclosures GRI
            </p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
