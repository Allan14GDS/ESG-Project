"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Users,
  FileCheck,
  Activity,
  Settings,
  Search,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  Shield,
  AlertTriangle,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("users")
  const [disclosures, setDisclosures] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Fetch disclosures
      const { data: disclosuresData, error: disclosuresError } = await supabase
        .from("gri_disclosures")
        .select("*")
        .order("created_at", { ascending: false })

      if (disclosuresError) {
        console.error("[v0] Error fetching disclosures:", disclosuresError)
      } else {
        setDisclosures(disclosuresData || [])
      }

      // Fetch responses
      const { data: responsesData, error: responsesError } = await supabase
        .from("gri_responses")
        .select("*")
        .order("created_at", { ascending: false })

      if (responsesError) {
        console.error("[v0] Error fetching responses:", responsesError)
      } else {
        setResponses(responsesData || [])
      }

      console.log("[v0] Loaded admin data:", {
        disclosures: disclosuresData?.length || 0,
        responses: responsesData?.length || 0,
      })
    } catch (error) {
      console.error("[v0] Error loading admin data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveDisclosure = async (disclosureId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("gri_disclosures")
        .update({ status: "completed", progress: 100 })
        .eq("id", disclosureId)

      if (error) throw error

      toast({
        title: "Disclosure aprovado",
        description: "O disclosure foi aprovado com sucesso.",
      })

      loadData()
    } catch (error) {
      console.error("[v0] Error approving disclosure:", error)
      toast({
        title: "Erro ao aprovar",
        description: "Não foi possível aprovar o disclosure.",
        variant: "destructive",
      })
    }
  }

  const handleRejectDisclosure = async (disclosureId: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from("gri_disclosures").update({ status: "not_started" }).eq("id", disclosureId)

      if (error) throw error

      toast({
        title: "Disclosure rejeitado",
        description: "O disclosure foi marcado para revisão.",
      })

      loadData()
    } catch (error) {
      console.error("[v0] Error rejecting disclosure:", error)
      toast({
        title: "Erro ao rejeitar",
        description: "Não foi possível rejeitar o disclosure.",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Completo</Badge>
      case "in_progress":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Em Progresso</Badge>
      case "not_started":
        return <Badge variant="outline">Não Iniciado</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const filteredDisclosures = disclosures.filter(
    (d) =>
      d.disclosure_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.title?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    totalDisclosures: disclosures.length,
    completedDisclosures: disclosures.filter((d) => d.status === "completed" || d.progress === 100).length,
    inProgressDisclosures: disclosures.filter((d) => d.status === "in_progress" || (d.progress > 0 && d.progress < 100))
      .length,
    pendingApproval: disclosures.filter((d) => d.progress === 100 && d.status !== "completed").length,
    totalResponses: responses.length,
  }

  if (loading) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando painel administrativo...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
        <p className="text-muted-foreground">Gerencie usuários, aprove disclosures e monitore atividades do sistema</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Disclosures</CardTitle>
            <FileCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDisclosures}</div>
            <p className="text-xs text-muted-foreground">Cadastrados no sistema</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completos</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedDisclosures}</div>
            <p className="text-xs text-muted-foreground">Aprovados e finalizados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Progresso</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgressDisclosures}</div>
            <p className="text-xs text-muted-foreground">Sendo preenchidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Aprovação</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pendingApproval}</div>
            <p className="text-xs text-muted-foreground">Requerem revisão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Respostas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalResponses}</div>
            <p className="text-xs text-muted-foreground">Registradas</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="approvals" className="flex items-center gap-2">
            <FileCheck className="w-4 h-4" />
            Aprovações
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Atividades
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <CardDescription>Gerencie permissões e acesso dos usuários</CardDescription>
                </div>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Buscar usuários..." className="max-w-sm" />
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Último Acesso</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Admin User</TableCell>
                      <TableCell>admin@example.com</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          <Shield className="w-3 h-3 mr-1" />
                          Administrador
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
                      </TableCell>
                      <TableCell>Hoje, 14:32</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Maria Silva</TableCell>
                      <TableCell>maria@example.com</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Contributor</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
                      </TableCell>
                      <TableCell>Ontem, 16:45</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">João Santos</TableCell>
                      <TableCell>joao@example.com</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Reviewer</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-green-100 text-green-800 border-green-200">Ativo</Badge>
                      </TableCell>
                      <TableCell>Hoje, 09:15</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approvals Tab */}
        <TabsContent value="approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Aprovação de Disclosures</CardTitle>
                  <CardDescription>Revise e aprove disclosures submetidos</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar disclosures..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Disclosure</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Progresso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Última Atualização</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDisclosures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum disclosure encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDisclosures.slice(0, 10).map((disclosure) => (
                      <TableRow key={disclosure.id}>
                        <TableCell className="font-medium">{disclosure.disclosure_number}</TableCell>
                        <TableCell>{disclosure.title || "Sem título"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-muted rounded-full h-2">
                              <div
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${disclosure.progress || 0}%` }}
                              />
                            </div>
                            <span className="text-sm">{disclosure.progress || 0}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(disclosure.status)}</TableCell>
                        <TableCell>
                          {disclosure.updated_at ? new Date(disclosure.updated_at).toLocaleDateString("pt-BR") : "N/A"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveDisclosure(disclosure.id)}
                              disabled={disclosure.status === "completed"}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Aprovar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectDisclosure(disclosure.id)}
                              disabled={disclosure.status === "not_started"}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Rejeitar
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividades Recentes</CardTitle>
              <CardDescription>Monitore ações e mudanças no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {responses.slice(0, 10).map((response, index) => (
                  <div key={response.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">Resposta adicionada ao disclosure {response.disclosure_id}</p>
                      <p className="text-xs text-muted-foreground">
                        {response.created_at
                          ? new Date(response.created_at).toLocaleString("pt-BR")
                          : "Data desconhecida"}
                      </p>
                    </div>
                  </div>
                ))}
                {responses.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">Nenhuma atividade registrada ainda</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>Gerencie configurações globais da organização</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Nome da Organização</Label>
                <Input placeholder="Nome da sua organização" />
              </div>

              <div className="space-y-2">
                <Label>Período de Relatório Padrão</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Anual</SelectItem>
                    <SelectItem value="biannual">Semestral</SelectItem>
                    <SelectItem value="quarterly">Trimestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Framework Padrão</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o framework" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gri">GRI 2021</SelectItem>
                    <SelectItem value="sasb">SASB</SelectItem>
                    <SelectItem value="tcfd">TCFD</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Notificações por Email</p>
                  <p className="text-sm text-muted-foreground">Enviar notificações sobre atualizações importantes</p>
                </div>
                <Button variant="outline">Configurar</Button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Workflow de Aprovação</p>
                  <p className="text-sm text-muted-foreground">Configurar níveis de aprovação para disclosures</p>
                </div>
                <Button variant="outline">Configurar</Button>
              </div>

              <div className="pt-4">
                <Button>Salvar Configurações</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
