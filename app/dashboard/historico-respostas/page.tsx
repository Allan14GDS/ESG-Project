import { Suspense } from "react"
import { redirect } from "next/navigation"
import { Trash2, Clock, User, FileText, Calendar } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getCurrentUserProfile } from "@/lib/auth-utils"
import { createAdminClient } from "@/lib/supabase/admin"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

async function DeletedAnswersHistoryContent() {
  const profile = await getCurrentUserProfile()

  if (!profile) {
    redirect("/auth/login")
  }

  // Apenas gestores e holding_admin podem acessar
  if (profile.role !== "gestor" && profile.role !== "holding_admin") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Apenas gestores podem visualizar o histórico de respostas deletadas.
        </AlertDescription>
      </Alert>
    )
  }

  // Buscar histórico diretamente (sem join com questions pois não há FK)
  const adminClient = createAdminClient()
  const { data: history, error } = await adminClient
    .from("audit_logs")
    .select(
      `
      *,
      user:profiles!audit_logs_user_id_fkey(full_name, email),
      template:book_templates(name)
    `
    )
    .eq("action", "delete_answer")
    .eq("entity_type", "book_answer")
    .order("occurred_at", { ascending: false })

  if (error) {
    console.error("[v0] Error fetching history:", error)
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>Erro ao carregar histórico: {error.message}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-balance">Histórico de Respostas Deletadas</h1>
          <p className="text-muted-foreground text-pretty mt-2">
            Visualize todas as respostas que foram deletadas pelos gestores
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {history?.length || 0} {history?.length === 1 ? "resposta" : "respostas"} deletadas
        </Badge>
      </div>

      {!history || history.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center text-center">
              <Trash2 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma resposta deletada</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Quando respostas forem deletadas pelos gestores, elas aparecerão aqui no histórico.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico Completo
            </CardTitle>
            <CardDescription>
              Registro de todas as respostas deletadas com informações detalhadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data de Exclusão</TableHead>
                    <TableHead>Caderno</TableHead>
                    <TableHead>Questão</TableHead>
                    <TableHead>Usuário Original</TableHead>
                    <TableHead>Resposta</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Deletado Por</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(item.occurred_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{item.template?.name || "N/A"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="text-sm font-medium truncate">
                            {item.question?.unique_identifier || "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.question?.label || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {item.old_value?.user_name || "Usuário desconhecido"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.old_value?.user_email || ""}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p
                            className="text-sm truncate"
                            title={item.old_value?.value || "N/A"}
                          >
                            {item.old_value?.value || "N/A"}
                          </p>
                          {item.old_value?.value_jsonb?.justification && (
                            <p className="text-xs text-muted-foreground truncate mt-1">
                              Justificativa: {item.old_value.value_jsonb.justification}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.old_value?.status === "aprovado"
                              ? "default"
                              : item.old_value?.status === "corrigido"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            item.old_value?.status === "aprovado"
                              ? "bg-emerald-100 text-emerald-700"
                              : item.old_value?.status === "corrigido"
                                ? "bg-blue-100 text-blue-700"
                                : ""
                          }
                        >
                          {item.old_value?.status === "aprovado"
                            ? "Aprovado"
                            : item.old_value?.status === "corrigido"
                              ? "Corrigido"
                              : item.old_value?.status || "Rascunho"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {item.user?.full_name || "Gestor"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.user?.email || ""}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground max-w-xs truncate">
                          {item.answer_text || "Sem motivo especificado"}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-8 w-32" />
      </div>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function DeletedAnswersHistoryPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <DeletedAnswersHistoryContent />
    </Suspense>
  )
}
