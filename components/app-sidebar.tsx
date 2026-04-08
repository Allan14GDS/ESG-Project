"use client"

import {
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
  ChevronDown,
  LayoutGrid,
} from "lucide-react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import * as Collapsible from "@radix-ui/react-collapsible"
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { ThemeToggle } from "@/components/theme-toggle"


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

const commandCenterSubItems = [
  { title: "Holdings", url: "/admin/holdings", icon: Building2 },
  { title: "Cadernos", url: "/admin/templates", icon: BookOpen },
  { title: "Questões", url: "/admin/questions", icon: HelpCircle },
  { title: "Usuários", url: "/admin/users", icon: UserPlus },
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
  overallProgress: number
}

export function AppSidebar({ userEmail, userName, userRole, overallProgress }: AppSidebarProps) {
  const { toast } = useToast()
  const router = useRouter()
  const pathname = usePathname()
  const { open } = useSidebar()

  const [commandCenterOpen, setCommandCenterOpen] = useState(true)

  const isAdminOnly = userRole === "admin_main"

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
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
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
          {/* Collapsed: show symbol only; expanded: show horizontal lockup */}
          {open ? (
            <>
              <Image
                src="/assets/logo-light.png"
                alt="B.Kick"
                width={120}
                height={32}
                className="h-8 w-auto object-contain dark:hidden"
                priority
              />
              <Image
                src="/assets/logo-dark.png"
                alt="B.Kick"
                width={120}
                height={32}
                className="h-8 w-auto object-contain hidden dark:block"
                priority
              />
            </>
          ) : (
            <Image
              src="/logo-symbol.png"
              alt="B.Kick"
              width={32}
              height={32}
              className="h-8 w-8 object-contain shrink-0"
              priority
            />
          )}
          {!open && <ThemeToggle />}
        </div>

        <div className="px-3 pb-3 md:px-4 md:pb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="font-medium text-xs md:text-sm">Progresso Geral</span>
            <span className="font-bold text-primary text-sm md:text-base">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-2 md:h-2.5" />
        </div>

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
        {navigationToShow.map((section, sectionIndex) => {
          const isFirstSection = sectionIndex === 0
          const showCommandCenter = isFirstSection && isAdminOnly

          return (
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

              {/* Central de Comando collapsible section - inserted after first group for admin/gestor */}
              {showCommandCenter && (
                <>
                  <SidebarSeparator className="my-4" />
                  <SidebarGroup className="py-2">
                    <SidebarGroupContent className="mt-1">
                      <SidebarMenu className="gap-1">
                        <Collapsible.Root open={commandCenterOpen} onOpenChange={setCommandCenterOpen}>
                          <SidebarMenuItem>
                            <SidebarMenuButton
                              asChild
                              className={`relative cursor-pointer transition-colors rounded-md h-auto ${
                                pathname === "/admin/command-center"
                                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                  : "hover:bg-muted text-foreground"
                              }`}
                            >
                              <a href="/admin/command-center" className="flex items-center gap-3 px-3 py-2.5 w-full min-h-[40px]">
                                <LayoutGrid className="h-[17px] w-[17px] shrink-0" />
                                {open && (
                                  <span className="text-[13.5px] font-medium leading-none flex-1 text-left">
                                    Central de Comando
                                  </span>
                                )}
                              </a>
                            </SidebarMenuButton>
                            {open && (
                              <Collapsible.Trigger asChild>
                                <button
                                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-muted/80 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                  }}
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                                      commandCenterOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>
                              </Collapsible.Trigger>
                            )}
                          </SidebarMenuItem>
                          <Collapsible.Content>
                            <SidebarMenuSub>
                              {commandCenterSubItems.map((subItem) => {
                                const SubIcon = subItem.icon
                                const isSubActive = pathname === subItem.url
                                return (
                                  <SidebarMenuSubItem key={subItem.title}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                    >
                                      <a href={subItem.url} className="flex items-center gap-2">
                                        <SubIcon className="h-4 w-4" />
                                        <span>{subItem.title}</span>
                                      </a>
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                )
                              })}
                            </SidebarMenuSub>
                          </Collapsible.Content>
                        </Collapsible.Root>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </SidebarGroup>
                </>
              )}

              {sectionIndex < navigationToShow.length - 1 && <SidebarSeparator className="my-4" />}
            </div>
          )
        })}
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

          <div className="flex items-center justify-end">
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
