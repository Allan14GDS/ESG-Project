"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { TrendingUp, Users, Shield, AlertTriangle, CheckCircle, Clock, Download, RefreshCw } from "lucide-react"
import { useEffect, useState } from "react"
import { governanceDataService } from "@/lib/governance-data"
import { employeeDataService } from "@/lib/employee-data"

export default function GovernancePanelPage() {
  const [governanceData, setGovernanceData] = useState<any>(null)
  const [employeeData, setEmployeeData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    setLoading(true)
    const govData = governanceDataService.getGovernanceData()
    const empMatrices = employeeDataService.getEmployeeMatrices()

    setGovernanceData(govData)
    setEmployeeData(empMatrices)
    setLoading(false)
  }

  const totalEmployees =
    employeeData?.reduce((sum: number, matrix: any) => {
      return sum + matrix.data.reduce((s: number, cell: any) => s + cell.count, 0)
    }, 0) || 0

  const governanceMembers = governanceData?.composition?.totalMembers || 0
  const independentMembers = governanceData?.composition?.independentMembers || 0
  const esgExperienceMembers = governanceData?.composition?.esgExperienceMembers || 0

  const independentPercentage = governanceMembers > 0 ? Math.round((independentMembers / governanceMembers) * 100) : 0

  const esgExperiencePercentage =
    governanceMembers > 0 ? Math.round((esgExperienceMembers / governanceMembers) * 100) : 0

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Governança</h1>
          <p className="text-muted-foreground">Visão consolidada em tempo real do andamento dos ciclos de relato ESG</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar dados
          </Button>
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar Painel
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validado</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">64%</div>
            <p className="text-xs text-muted-foreground">Disclosures aprovados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rascunho</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">22%</div>
            <p className="text-xs text-muted-foreground">Em andamento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reprovado</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">10%</div>
            <p className="text-xs text-muted-foreground">Precisa revisão</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Não Aplicável</CardTitle>
            <Shield className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">4%</div>
            <p className="text-xs text-muted-foreground">Não se aplica</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Indicadores de Diversidade
            </CardTitle>
            <CardDescription>Dados demográficos dos colaboradores (GRI 2-7)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Total de colaboradores</span>
              <span className="text-2xl font-bold">{totalEmployees.toLocaleString()}</span>
            </div>

            {totalEmployees > 0 ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Dados preenchidos</span>
                    <span>Sim</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Análises detalhadas de diversidade disponíveis após preenchimento completo da matriz demográfica
                </p>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Nenhum dado de funcionários preenchido ainda</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 bg-transparent"
                  onClick={() => (window.location.href = "/dashboard/employees")}
                >
                  Preencher dados de funcionários
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Indicadores de Governança
            </CardTitle>
            <CardDescription>Composição e experiência do colegiado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Membros de governança</span>
              <span className="text-2xl font-bold">{governanceMembers}</span>
            </div>

            {governanceMembers > 0 ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Com experiência ESG</span>
                    <span>{esgExperiencePercentage}%</span>
                  </div>
                  <Progress value={esgExperiencePercentage} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Membros independentes</span>
                    <span>{independentPercentage}%</span>
                  </div>
                  <Progress value={independentPercentage} className="h-2" />
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">Nenhum dado de governança preenchido ainda</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 bg-transparent"
                  onClick={() => (window.location.href = "/dashboard/governance")}
                >
                  Preencher dados de governança
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Engajamento por Unidade
          </CardTitle>
          <CardDescription>Atividade dos responsáveis por unidade organizacional</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Unidade</th>
                  <th className="text-left py-2">Contributors</th>
                  <th className="text-left py-2">Reviewers</th>
                  <th className="text-left py-2">Readers</th>
                  <th className="text-left py-2">% Preenchimento</th>
                  <th className="text-left py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 font-medium">Matriz</td>
                  <td className="py-2">3 ativos</td>
                  <td className="py-2">2 ativos</td>
                  <td className="py-2">1</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Progress value={83} className="h-2 w-16" />
                      <span>83%</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <Badge variant="default">Ativo</Badge>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 font-medium">Filial 1</td>
                  <td className="py-2">1 ativo</td>
                  <td className="py-2">1</td>
                  <td className="py-2">0</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Progress value={54} className="h-2 w-16" />
                      <span>54%</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <Badge variant="secondary">Pendente</Badge>
                  </td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Filial 2</td>
                  <td className="py-2">2 ativos</td>
                  <td className="py-2">1 ativo</td>
                  <td className="py-2">1</td>
                  <td className="py-2">
                    <div className="flex items-center gap-2">
                      <Progress value={71} className="h-2 w-16" />
                      <span>71%</span>
                    </div>
                  </td>
                  <td className="py-2">
                    <Badge variant="default">Ativo</Badge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas e Pendências
          </CardTitle>
          <CardDescription>Sinalizações abertas que requerem atenção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Tipo de Alerta</th>
                  <th className="text-left py-2">Unidade</th>
                  <th className="text-left py-2">Disclosure</th>
                  <th className="text-left py-2">Data</th>
                  <th className="text-left py-2">Responsável</th>
                  <th className="text-left py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2">
                    <Badge variant="destructive">Informação incompleta</Badge>
                  </td>
                  <td className="py-2">Filial 1</td>
                  <td className="py-2">GRI 2-3</td>
                  <td className="py-2">08/09/2025</td>
                  <td className="py-2">juliana@x.com</td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        Ver detalhes
                      </Button>
                      <Button variant="outline" size="sm">
                        Reatribuir
                      </Button>
                    </div>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="py-2">
                    <Badge variant="secondary">Prazo próximo</Badge>
                  </td>
                  <td className="py-2">Matriz</td>
                  <td className="py-2">GRI 3-1</td>
                  <td className="py-2">15/09/2025</td>
                  <td className="py-2">carlos@x.com</td>
                  <td className="py-2">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm">
                        Notificar
                      </Button>
                      <Button variant="outline" size="sm">
                        Estender prazo
                      </Button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
