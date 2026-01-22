import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, FileText, Plus } from "lucide-react"
import Link from "next/link"
import { AddQuestionToBookForm } from "@/components/templates/add-question-to-book-form"
import { DeleteQuestionButton } from "@/components/templates/delete-question-button"

export default async function BookDetailPage({ params }: { params: { bookId: string } }) {
  const supabase = createClient()

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    redirect("/auth/login")
  }

  // Get book details
  const { data: book, error: bookError } = await supabase
    .from("question_notebooks")
    .select("*")
    .eq("id", params.bookId)
    .single()

  if (bookError || !book) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Erro</CardTitle>
            <CardDescription>Caderno não encontrado</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // Get questions for this book
  const { data: questions, error: questionsError } = await supabase
    .from("questions")
    .select("*")
    .eq("caderno_id", params.bookId)
    .order("order_index", { ascending: true })

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="mb-2">
              <Link href={`/admin/templates/${book.company_id}`}>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para Template
                </Button>
              </Link>
            </div>
            <h1 className="text-3xl font-bold">{book.title}</h1>
            <p className="text-muted-foreground">{book.description || "Sem descrição"}</p>
          </div>
        </div>

        {/* Add Question Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Nova Pergunta
            </CardTitle>
            <CardDescription>Adicione perguntas que serão respondidas pelas empresas</CardDescription>
          </CardHeader>
          <CardContent>
            <AddQuestionToBookForm bookId={params.bookId} nextOrderIndex={(questions?.length || 0) + 1} />
          </CardContent>
        </Card>

        {/* Questions List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Perguntas do Caderno
            </CardTitle>
            <CardDescription>{questions?.length || 0} pergunta(s) cadastrada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            {!questions || questions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg font-medium">Nenhuma pergunta cadastrada</p>
                <p className="text-sm text-muted-foreground">Adicione perguntas usando o formulário acima</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Ordem</TableHead>
                    <TableHead>Pergunta</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="w-20 text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell className="text-center font-medium">{question.order_index}</TableCell>
                      <TableCell>{question.label}</TableCell>
                      <TableCell className="text-center">
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                          {question.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DeleteQuestionButton questionId={question.id} bookId={params.bookId} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
