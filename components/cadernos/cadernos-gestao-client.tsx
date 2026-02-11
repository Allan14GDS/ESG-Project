"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  BookOpen,
  Users,
  UserPlus,
  Search,
  ArrowLeft,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  User,
  BookMarked,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { removeAssignment, assignUserToMultipleTemplates } from "@/app/actions/assignment-actions"

interface Template {
  id: string
  name: string
  description: string | null
  type: string | null
  created_at: string
}

interface Assignment {
  id: string
  caderno_id: string
  user_id: string
  role: string | null
  organization_id: string | null
  company_id?: string | null
  created_at: string
  profiles: {
    id: string
    email: string
    full_name: string | null
    role: string
  } | null
}

interface ProgressEntry {
  questionsCount: number
  answeredCount: number
  status: "pending" | "in_progress" | "completed"
}

interface CadernosGestaoClientProps {
  templates: Template[]
  users: any[]
  assignments: Assignment[]
  currentUserId: string
  holdingId: string | null
  organizations: any[]
  companies: any[]
  companyTemplates: any[]
  progressMap: Record<string, ProgressEntry>
}

export function CadernosGestaoClient({
  templates,
  users,
  assignments: initialAssignments,
  currentUserId,
  holdingId,
  organizations,
  companies,
  companyTemplates,
  progressMap,
}: CadernosGestaoClientProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [userSearchTerm, setUserSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("")
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([])
  const [assignmentRole, setAssignmentRole] = useState<string>("contributor")
  const [isAssigning, setIsAssigning] = useState(false)
  const [isRemoving, setIsRemoving] = useState<string | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>(initialAssignments)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<"usuarios" | "cadernos">("usuarios")

  // Filter users by search
  const filteredUsers = useMemo(() => {
    return users.filter(
      (user) =>
        (user.full_name?.toLowerCase() || "").includes(userSearchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(userSearchTerm.toLowerCase()),
    )
  }, [users, userSearchTerm])

  // Filter templates by search
  const filteredTemplates = useMemo(() => {
    return templates.filter(
      (template) =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())),
    )
  }, [templates, searchTerm])

  // Get assignments for a specific user
  const getUserAssignments = (userId: string) => {
    return assignments.filter((a) => a.user_id === userId)
  }

  // Get assignments for a specific template
  const getTemplateAssignments = (templateId: string) => {
    return assignments.filter((a) => a.caderno_id === templateId)
  }

  // Get templates not assigned to a user
  const getUnassignedTemplates = (userId: string) => {
    const assignedTemplateIds = getUserAssignments(userId).map((a) => a.caderno_id)
    return templates.filter((t) => !assignedTemplateIds.includes(t.id))
  }

  // Get templates available for a specific company (based on company_templates)
  const getCompanyTemplates = (companyId: string) => {
    const templateIds = companyTemplates
      .filter((ct) => ct.company_id === companyId)
      .map((ct) => ct.template_id)
    
    return templates.filter((t) => templateIds.includes(t.id))
  }

  // Get available templates for user assignment (filtered by company)
  const getAvailableTemplatesForUser = (userId: string, companyId: string) => {
    if (!companyId) return []
    
    const companyAvailableTemplates = getCompanyTemplates(companyId)
    const assignedTemplateIds = getUserAssignments(userId)
      .filter((a) => a.organization_id === companyId) // Only templates assigned for this company
      .map((a) => a.caderno_id)
    
    return companyAvailableTemplates.filter((t) => !assignedTemplateIds.includes(t.id))
  }

  // Handle assigning multiple templates to a user
  const handleAssignMultiple = async () => {
    if (!selectedUser || selectedTemplateIds.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um caderno para atribuir.",
        variant: "destructive",
      })
      return
    }

    if (!selectedCompanyId) {
      toast({
        title: "Erro",
        description: "Selecione uma empresa para atribuir os cadernos.",
        variant: "destructive",
      })
      return
    }

    setIsAssigning(true)
    try {
      // Find the selected company and use its holding_id (which exists in organizations table)
      const selectedCompany = companies.find((c) => c.id === selectedCompanyId)
      const organizationIdForAssignment = selectedCompany?.holding_id || holdingId
      
      if (!organizationIdForAssignment) {
        toast({
          title: "Erro",
          description: "Não foi possível identificar a holding da empresa selecionada.",
          variant: "destructive",
        })
        setIsAssigning(false)
        return
      }

      const result = await assignUserToMultipleTemplates({
        userId: selectedUser.id,
        templateIds: selectedTemplateIds,
        role: assignmentRole,
        createdBy: currentUserId,
        organizationId: organizationIdForAssignment, // Use holding_id which exists in organizations
        companyId: selectedCompanyId, // Store the actual company ID
      })

      if (result.success && result.data) {
        // Add all new assignments to local state
        const newAssignments: Assignment[] = result.data.map((item: any) => ({
          id: item.id,
          caderno_id: item.caderno_id,
          user_id: selectedUser.id,
          role: assignmentRole,
          organization_id: organizationIdForAssignment,
          created_at: new Date().toISOString(),
          profiles: {
            id: selectedUser.id,
            email: selectedUser.email,
            full_name: selectedUser.full_name,
            role: selectedUser.role,
          },
          company_id: selectedCompanyId, // Add company_id to match what was saved
        } as any))

        setAssignments((prev) => [...prev, ...newAssignments])

        const assignedCount = result.data.length
        const skippedCount = result.skipped || 0

        if (skippedCount > 0) {
          toast({
            title: "Parcialmente atribuído",
            description: `${assignedCount} caderno(s) atribuído(s). ${skippedCount} caderno(s) já estava(m) atribuído(s) a esta empresa e foi(ram) ignorado(s).`,
          })
        } else {
          toast({
            title: "Sucesso",
            description: `${assignedCount} caderno(s) atribuído(s) a ${selectedUser.full_name || selectedUser.email}.`,
          })
        }

        setSelectedTemplateIds([])
        setDialogOpen(false)
      } else {
        throw new Error(result.error || "Erro ao atribuir cadernos")
      }
    } catch (error) {
      console.error("[v0] Error assigning templates:", error)
      toast({
        title: "Erro",
        description: "Não foi possível atribuir os cadernos. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemoveAssignment = async (assignmentId: string, userName: string, templateName: string) => {
    setIsRemoving(assignmentId)
    try {
      const result = await removeAssignment(assignmentId)

      if (result.success) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentId))
        toast({
          title: "Sucesso",
          description: `Atribuição de "${templateName}" removida de ${userName}.`,
        })
      } else {
        throw new Error(result.error || "Erro ao remover atribuição")
      }
    } catch (error) {
      console.error("[v0] Error removing assignment:", error)
      toast({
        title: "Erro",
        description: "Não foi possível remover a atribuição. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsRemoving(null)
    }
  }

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case "contributor":
        return (
          <Badge variant="default" className="bg-blue-600">
            Respondedor
          </Badge>
        )
      case "reviewer":
        return (
          <Badge variant="secondary" className="bg-amber-600 text-white">
            Revisor
          </Badge>
        )
      case "approver":
        return <Badge className="bg-green-600">Aprovador</Badge>
      default:
        return <Badge variant="outline">{role || "Sem função"}</Badge>
    }
  }

  const getUserRoleBadge = (role: string) => {
    switch (role) {
      case "holding_admin":
        return <Badge variant="secondary">Gestor</Badge>
      case "revisor":
        return <Badge className="bg-amber-600 text-white">Revisor</Badge>
      case "user":
        return <Badge variant="outline">Usuário</Badge>
      default:
        return <Badge variant="outline">{role}</Badge>
    }
  }

  // Get progress for a specific assignment (template + company)
  const getAssignmentProgress = (cadernoId: string, companyId: string | null | undefined) => {
    if (!companyId) return null
    const key = `${cadernoId}_${companyId}`
    return progressMap[key] || null
  }

  const getStatusBadge = (status: "pending" | "in_progress" | "completed") => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400">
            Concluído
          </Badge>
        )
      case "in_progress":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400">
            Em Progresso
          </Badge>
        )
      case "pending":
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Pendente
          </Badge>
        )
    }
  }

  const openAssignDialog = (user: any) => {
    setSelectedUser(user)
    setSelectedTemplateIds([])
    setAssignmentRole("contributor")
    setSelectedCompanyId("") // Reset company selection
    setDialogOpen(true)
  }

  const toggleTemplateSelection = (templateId: string) => {
    setSelectedTemplateIds((prev) =>
      prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId],
    )
  }

  const selectAllUnassigned = () => {
    if (selectedUser && selectedCompanyId) {
      const availableIds = getAvailableTemplatesForUser(selectedUser.id, selectedCompanyId).map((t) => t.id)
      setSelectedTemplateIds(availableIds)
    }
  }

  const deselectAll = () => {
    setSelectedTemplateIds([])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mb-2 gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Gerenciar Cadernos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Atribua cadernos aos usuários da sua holding</p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Users className="h-3 w-3" />
            {users.length} usuários
          </Badge>
          <Badge variant="outline" className="gap-1">
            <BookOpen className="h-3 w-3" />
            {templates.length} cadernos
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "usuarios" | "cadernos")}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="usuarios" className="gap-2">
            <User className="h-4 w-4" />
            Por Usuário
          </TabsTrigger>
          <TabsTrigger value="cadernos" className="gap-2">
            <BookMarked className="h-4 w-4" />
            Por Caderno
          </TabsTrigger>
        </TabsList>

        {/* View by User */}
        <TabsContent value="usuarios" className="space-y-4">
          {/* User Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários por nome ou email..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <div className="grid gap-4">
            {filteredUsers.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium text-muted-foreground">
                    {userSearchTerm ? "Nenhum usuário encontrado" : "Nenhum usuário cadastrado"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredUsers.map((user) => {
                const userAssignments = getUserAssignments(user.id)
                const unassignedCount = templates.length - userAssignments.length

                return (
                  <Card key={user.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <User className="h-5 w-5 text-primary" />
                            {user.full_name || user.email}
                          </CardTitle>
                          <CardDescription className="mt-1">{user.email}</CardDescription>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            {getUserRoleBadge(user.role)}
                            <Badge variant={userAssignments.length > 0 ? "default" : "secondary"} className="gap-1">
                              <BookOpen className="h-3 w-3" />
                              {userAssignments.length} caderno(s)
                            </Badge>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="gap-2"
                          onClick={() => openAssignDialog(user)}
                          disabled={unassignedCount === 0}
                        >
                          <UserPlus className="h-4 w-4" />
                          Atribuir Cadernos ({unassignedCount})
                        </Button>
                      </div>
                    </CardHeader>

                    {userAssignments.length > 0 && (
                      <CardContent className="p-0">
                        {(() => {
                          // Group assignments by company
                          const groupedByCompany: Record<string, { company: any; holding: any; assignments: typeof userAssignments }> = {}
                          for (const assignment of userAssignments) {
                            const companyKey = assignment.company_id || "_no_company"
                            if (!groupedByCompany[companyKey]) {
                              const company = companies.find((c: any) => c.id === assignment.company_id)
                              const holding = organizations.find((o: any) => o.id === assignment.organization_id)
                              groupedByCompany[companyKey] = { company, holding, assignments: [] }
                            }
                            groupedByCompany[companyKey].assignments.push(assignment)
                          }

                          return Object.entries(groupedByCompany).map(([companyKey, group], groupIndex) => {
                            // Compute company-level summary
                            const totalCadernos = group.assignments.length
                            const completedCadernos = group.assignments.filter((a) => {
                              const progress = getAssignmentProgress(a.caderno_id, a.company_id)
                              return progress?.status === "completed"
                            }).length

                            return (
                              <div key={companyKey}>
                                {/* Company sub-header */}
                                <div className={`flex items-center justify-between border-b bg-muted/40 px-4 py-3 ${groupIndex > 0 ? "border-t" : ""}`}>
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                                      <BookMarked className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-semibold text-foreground">
                                        {group.company?.name || "Empresa não especificada"}
                                      </p>
                                      {group.holding?.name && (
                                        <p className="text-xs text-muted-foreground">{group.holding.name}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs">
                                      {totalCadernos} caderno{totalCadernos !== 1 ? "s" : ""}
                                    </Badge>
                                    {completedCadernos > 0 && (
                                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs dark:bg-emerald-900/30 dark:text-emerald-400">
                                        {completedCadernos} concluído{completedCadernos !== 1 ? "s" : ""}
                                      </Badge>
                                    )}
                                  </div>
                                </div>

                                {/* Cadernos table for this company */}
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-muted/10">
                                      <TableHead className="min-w-[240px]">Caderno</TableHead>
                                      <TableHead className="w-[180px]">Progresso</TableHead>
                                      <TableHead className="w-[140px]">Função</TableHead>
                                      <TableHead className="w-[140px]">Atribuído em</TableHead>
                                      <TableHead className="w-[80px]">Ações</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {group.assignments.map((assignment) => {
                                      const template = templates.find((t) => t.id === assignment.caderno_id)
                                      return (
                                        <TableRow key={assignment.id}>
                                          <TableCell className="font-medium">
                                            {template?.name || assignment.caderno_id}
                                          </TableCell>
                                          <TableCell>
                                            {(() => {
                                              const progress = getAssignmentProgress(assignment.caderno_id, assignment.company_id)
                                              if (!progress) {
                                                return <span className="text-xs text-muted-foreground/60">-</span>
                                              }
                                              return (
                                                <div className="flex flex-col gap-1.5">
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-foreground tabular-nums">
                                                      {progress.answeredCount}/{progress.questionsCount}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">questões</span>
                                                  </div>
                                                  <div>{getStatusBadge(progress.status)}</div>
                                                </div>
                                              )
                                            })()}
                                          </TableCell>
                                          <TableCell>{getRoleBadge(assignment.role)}</TableCell>
                                          <TableCell className="text-muted-foreground">
                                            {new Date(assignment.created_at).toLocaleDateString("pt-BR")}
                                          </TableCell>
                                          <TableCell>
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-destructive hover:text-destructive"
                                                  disabled={isRemoving === assignment.id}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>Remover Atribuição</AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    Tem certeza que deseja remover o caderno <strong>{`"${template?.name}"`}</strong>{" "}
                                                    de <strong>{user.full_name || user.email}</strong>?
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() =>
                                                      handleRemoveAssignment(
                                                        assignment.id,
                                                        user.full_name || user.email,
                                                        template?.name || "Caderno",
                                                      )
                                                    }
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                  >
                                                    Remover
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </TableCell>
                                        </TableRow>
                                      )
                                    })}
                                  </TableBody>
                                </Table>
                              </div>
                            )
                          })
                        })()}
                      </CardContent>
                    )}

                    {userAssignments.length === 0 && (
                      <CardContent>
                        <div className="flex items-center justify-center py-8 text-center">
                          <div>
                            <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/50" />
                            <p className="mt-2 text-sm text-muted-foreground">Nenhum caderno atribuído</p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        {/* View by Template */}
        <TabsContent value="cadernos" className="space-y-4">
          {/* Template Search */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar cadernos por nome ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Templates List */}
          <div className="grid gap-4">
            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-4 text-lg font-medium text-muted-foreground">
                    {searchTerm ? "Nenhum caderno encontrado" : "Nenhum caderno cadastrado"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredTemplates.map((template) => {
                const templateAssignments = getTemplateAssignments(template.id)

                return (
                  <Card key={template.id} className="overflow-hidden">
                    <CardHeader className="bg-muted/30">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <BookOpen className="h-5 w-5 text-primary" />
                          {template.name}
                        </CardTitle>
                        {template.description && (
                          <CardDescription className="mt-1 line-clamp-2">{template.description}</CardDescription>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {template.type && (
                            <Badge variant="outline" className="text-xs">
                              {template.type}
                            </Badge>
                          )}
                          <Badge variant={templateAssignments.length > 0 ? "default" : "secondary"} className="gap-1">
                            <Users className="h-3 w-3" />
                            {templateAssignments.length} atribuído(s)
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    {templateAssignments.length > 0 && (
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/20">
                              <TableHead className="w-[160px]">Usuário</TableHead>
                              <TableHead className="min-w-[200px]">Email</TableHead>
                              <TableHead className="w-[240px]">Empresa</TableHead>
                              <TableHead className="w-[180px]">Progresso</TableHead>
                              <TableHead className="w-[140px]">Função</TableHead>
                              <TableHead className="w-[140px]">Atribuído em</TableHead>
                              <TableHead className="w-[80px]">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {templateAssignments.map((assignment) => {
                              const company = companies.find((c: any) => c.id === assignment.company_id)
                              const progress = getAssignmentProgress(assignment.caderno_id, assignment.company_id)
                              return (
                              <TableRow key={assignment.id}>
                                <TableCell className="font-medium">{assignment.profiles?.full_name || "—"}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {assignment.profiles?.email || "—"}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {company?.name || <span className="italic text-muted-foreground/60">N/A</span>}
                                </TableCell>
                                <TableCell>
                                  {progress ? (
                                    <div className="flex flex-col gap-1.5">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold text-foreground tabular-nums">
                                          {progress.answeredCount}/{progress.questionsCount}
                                        </span>
                                        <span className="text-xs text-muted-foreground">questões</span>
                                      </div>
                                      <div>{getStatusBadge(progress.status)}</div>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground/60">-</span>
                                  )}
                                </TableCell>
                                <TableCell>{getRoleBadge(assignment.role)}</TableCell>
                                <TableCell className="text-muted-foreground">
                                  {new Date(assignment.created_at).toLocaleDateString("pt-BR")}
                                </TableCell>
                                <TableCell>
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        disabled={isRemoving === assignment.id}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Remover Atribuição</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Tem certeza que deseja remover{" "}
                                          <strong>
                                            {assignment.profiles?.full_name || assignment.profiles?.email}
                                          </strong>{" "}
                                          do caderno <strong>"{template.name}"</strong>?
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() =>
                                            handleRemoveAssignment(
                                              assignment.id,
                                              assignment.profiles?.full_name || assignment.profiles?.email || "Usuário",
                                              template.name,
                                            )
                                          }
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Remover
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </TableCell>
                              </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </CardContent>
                    )}

                    {templateAssignments.length === 0 && (
                      <CardContent>
                        <div className="flex items-center justify-center py-8 text-center">
                          <div>
                            <Users className="mx-auto h-8 w-8 text-muted-foreground/50" />
                            <p className="mt-2 text-sm text-muted-foreground">Nenhum usuário atribuído</p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Assign Multiple Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Atribuir Cadernos - {selectedUser?.full_name || selectedUser?.email}
            </DialogTitle>
            <DialogDescription>Selecione os cadernos e a função para atribuir ao usuário.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={assignmentRole} onValueChange={setAssignmentRole}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contributor">Respondedor</SelectItem>
                  <SelectItem value="reviewer">Revisor</SelectItem>
                  <SelectItem value="approver">Aprovador</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Company Selection */}
            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger id="company">
                  <SelectValue placeholder="Selecione a empresa" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name} {company.cnpj ? `(${company.cnpj})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Selecione a empresa na qual o usuário responderá os cadernos
              </p>
            </div>

            {/* Template Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Cadernos Disponíveis</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllUnassigned}
                    disabled={!selectedUser || !selectedCompanyId || getAvailableTemplatesForUser(selectedUser.id, selectedCompanyId).length === 0}
                  >
                    Selecionar Todos
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAll}
                    disabled={selectedTemplateIds.length === 0}
                  >
                    Desmarcar Todos
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[300px] rounded-md border p-4">
                {!selectedCompanyId ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">Selecione uma empresa para ver os cadernos disponíveis</p>
                  </div>
                ) : selectedUser && getAvailableTemplatesForUser(selectedUser.id, selectedCompanyId).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <CheckCircle2 className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-sm text-muted-foreground">Todos os cadernos desta empresa já foram atribuídos</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedUser &&
                      getAvailableTemplatesForUser(selectedUser.id, selectedCompanyId).map((template) => (
                        <div key={template.id} className="flex items-start space-x-3 rounded-lg border p-3">
                          <Checkbox
                            id={template.id}
                            checked={selectedTemplateIds.includes(template.id)}
                            onCheckedChange={() => toggleTemplateSelection(template.id)}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={template.id}
                              className="cursor-pointer text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {template.name}
                            </label>
                            {template.description && (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </ScrollArea>

              <p className="text-sm text-muted-foreground">{selectedTemplateIds.length} caderno(s) selecionado(s)</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={isAssigning}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignMultiple}
              disabled={isAssigning || selectedTemplateIds.length === 0}
              className="gap-2"
            >
              {isAssigning ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  Atribuindo...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Atribuir {selectedTemplateIds.length > 0 && `(${selectedTemplateIds.length})`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
