import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, BookOpen, HelpCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { QuestionnaireForm } from "@/components/questionnaire/questionnaire-form"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{ templateId: string }>
  searchParams: Promise<{ company?: string; page?: string }>
}

export default async function QuestionnairePage({ params, searchParams }: PageProps) {
  const { templateId } = await params
  const { company: companyId, page } = await searchParams

  const currentPage = Number.parseInt(page || "1", 10)
  const ITEMS_PER_PAGE = 10

  const supabase = await createClient()
  const adminClient = createAdminClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    console.error("[v0] Auth error in questionnaire page:", userError?.message)
    redirect("/auth/login")
  }

  const { data: userProfile } = await adminClient.from("profiles").select("role").eq("id", user.id).single()

  const userRole = userProfile?.role || "user"
  const isGestor = ["admin_main", "holding_admin", "revisor"].includes(userRole)

  // Get template details
  const { data: template, error: templateError } = await adminClient
    .from("book_templates")
    .select("id, name, description, type")
    .eq("id", templateId)
    .single()

  if (templateError || !template) {
    redirect("/dashboard/questions")
  }

  let companyIdForSave: string | null = null
  let holdingIdForSave: string | null = null
  let company: any = null

  if (companyId) {
    // First try to find in companies table (real companies)
    const { data: companyData } = await adminClient
      .from("companies")
      .select("id, name, cnpj, holding_id")
      .eq("id", companyId)
      .maybeSingle()

    if (companyData) {
      // This is a COMPANY - save both company_id and holding_id
      company = companyData
      companyIdForSave = companyData.id
      holdingIdForSave = companyData.holding_id || null
    } else {
      // Not in companies table, check if it's an organization (holding)
      const { data: organizationData } = await adminClient
        .from("organizations")
        .select("id, name, cnpj, holding_id, type")
        .eq("id", companyId)
        .maybeSingle()

      if (organizationData) {
        // This is a HOLDING/ORGANIZATION - only save holding_id, NOT company_id
        company = organizationData
        companyIdForSave = null // Don't save company_id for holdings
        holdingIdForSave = organizationData.id // Use org ID as holding_id
      }
    }
  }

  // Fallback: try from user's profile organization (only if no company was found)
  if (!companyIdForSave && !holdingIdForSave) {
    const { data: userProfile } = await adminClient
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .maybeSingle()

    if (userProfile?.organization_id) {
      const { data: orgData } = await adminClient
        .from("organizations")
        .select("id, name, holding_id, type")
        .eq("id", userProfile.organization_id)
        .maybeSingle()

      if (orgData) {
        company = orgData
        // If it's a holding, don't set company_id
        if (orgData.type === "holding") {
          companyIdForSave = null
          holdingIdForSave = orgData.id
        } else {
          companyIdForSave = orgData.id
          holdingIdForSave = orgData.holding_id || null
        }
      }
    }
  }

  console.log("[v0] Questionnaire IDs:", {
    companyId,
    companyIdForSave,
    holdingIdForSave,
    userId: user.id,
  })

  const { data: questionLinks, error: questionsError } = await adminClient
    .from("book_question_junction")
    .select(`
      id, 
      question_template_id, 
      position, 
      comment,
      question_templates:question_template_id (
        id,
        label,
        type,
        unique_identifier,
        metadata
      )
    `)
    .eq("book_template_id", templateId)
    .order("position", { ascending: true })

  if (questionsError) {
    console.error("[v0] Error loading questions:", questionsError)
  }

  const { data: commentHistory } = await adminClient
    .from("comment_history")
    .select("question_template_id, user_id, comment, created_at")
    .eq("book_template_id", templateId)
    .order("created_at", { ascending: false })

  // Criar um mapa de question_id -> último comentário com autor
  const commentAuthors: Record<string, { user_id: string; comment: string }> = {}
  if (commentHistory) {
    for (const record of commentHistory) {
      if (!commentAuthors[record.question_template_id] && record.comment) {
        commentAuthors[record.question_template_id] = {
          user_id: record.user_id,
          comment: record.comment,
        }
      }
    }
  }

  // Buscar nomes dos autores dos comentários
  const authorIds = Object.values(commentAuthors).map((c) => c.user_id)
  const { data: authorProfiles } = await adminClient.from("profiles").select("id, full_name, role").in("id", authorIds)

  const authorMap: Record<string, { full_name: string; role: string }> = {}
  if (authorProfiles) {
    for (const profile of authorProfiles) {
      authorMap[profile.id] = {
        full_name: profile.full_name || "Gestor",
        role: profile.role || "",
      }
    }
  }

  const allQuestions =
    questionLinks?.map((link) => {
      const commentAuthor = commentAuthors[link.question_template_id]
      const authorInfo = commentAuthor ? authorMap[commentAuthor.user_id] : null

      return {
        id: link.question_template_id,
        label: link.question_templates?.label || "",
        type: link.question_templates?.type || "texto",
        unique_identifier: link.question_templates?.unique_identifier || "",
        metadata: link.question_templates?.metadata || {},
        junction_id: link.id,
        comment: link.comment,
        comment_author_name: authorInfo?.full_name || null,
        comment_author_role: authorInfo?.role || null,
      }
    }) || []

  // Buscar respostas existentes separadamente
  // CORREÇÃO: Remover JOIN problemático que causa erro "more than one relationship"
  let answersQuery = adminClient
    .from("book_answers")
    .select("question_id, value, value_jsonb, evidence_url, status, user_id, company_id, holding_id")
    .eq("template_id", templateId)

  console.log("[v0] ===== DIAGNÓSTICO COMPLETO =====")
  console.log("[v0] User ID:", user.id)
  console.log("[v0] User Role:", userRole)
  console.log("[v0] Is Gestor:", isGestor)
  console.log("[v0] Company ID for save:", companyIdForSave)
  console.log("[v0] Holding ID for save:", holdingIdForSave)
  console.log("[v0] Template ID:", templateId)

  if (!isGestor) {
    // Usuários regulares só veem suas próprias respostas PARA A EMPRESA ESPECÍFICA
    answersQuery = answersQuery.eq("user_id", user.id)
    
    // IMPORTANTE: Filtrar por company_id para separar respostas de empresas diferentes
    if (companyIdForSave) {
      answersQuery = answersQuery.eq("company_id", companyIdForSave)
      console.log("[v0] FILTRO: Usuário regular - filtrando por user_id E company_id:", companyIdForSave)
    } else {
      // Se não tiver company_id, filtrar por respostas sem company_id (legado)
      answersQuery = answersQuery.is("company_id", null)
      console.log("[v0] FILTRO: Usuário regular - filtrando por user_id e company_id IS NULL")
    }
  } else {
    // GESTOR: Filtrar por company_id se estiver visualizando uma empresa específica
    if (companyIdForSave) {
      // Gestor visualizando uma EMPRESA específica - filtrar por company_id OU respostas legadas sem company_id
      answersQuery = answersQuery.or(`company_id.eq.${companyIdForSave},and(company_id.is.null,holding_id.eq.${holdingIdForSave})`)
      console.log("[v0] FILTRO: Gestor - filtrando por company_id:", companyIdForSave, "OU (company_id IS NULL AND holding_id:", holdingIdForSave, ")")
    } else if (holdingIdForSave) {
      // Gestor visualizando apenas HOLDING (sem empresa) - filtrar por holding_id
      answersQuery = answersQuery.eq("holding_id", holdingIdForSave).is("company_id", null)
      console.log("[v0] FILTRO: Gestor - filtrando por holding_id:", holdingIdForSave, "e company_id IS NULL")
    } else {
      // Gestor sem contexto específico - buscar todas
      console.log("[v0] FILTRO: Gestor - SEM FILTROS, buscando TODAS as respostas do template")
    }
  }

  const { data: existingAnswers, error: answersError } = await answersQuery

  console.log("[v0] ===== RESULTADO DA QUERY =====")
  console.log("[v0] Answers count:", existingAnswers?.length || 0)
  console.log("[v0] Query error:", answersError?.message || "none")
  
  // Buscar perfis dos usuários separadamente para evitar erro de JOIN ambíguo
  if (existingAnswers && existingAnswers.length > 0) {
    const uniqueUserIds = [...new Set(existingAnswers.map(a => a.user_id))]
    console.log("[v0] Buscando perfis para user_ids:", uniqueUserIds)
    
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name, email")
      .in("id", uniqueUserIds)
    
    // Criar mapa de perfis
    const profilesMap: Record<string, any> = {}
    if (profiles) {
      for (const profile of profiles) {
        profilesMap[profile.id] = profile
      }
      console.log("[v0] Perfis carregados:", profiles.length)
    }
    
    // Adicionar perfil a cada resposta
    for (const answer of existingAnswers) {
      answer.profiles = profilesMap[answer.user_id] || null
    }
    
    console.log("[v0] Primeira resposta (sample):", JSON.stringify(existingAnswers[0], null, 2))
    console.log("[v0] IDs de questões respondidas:", existingAnswers.map(a => a.question_id))
    console.log("[v0] User IDs que responderam:", uniqueUserIds)
    console.log("[v0] Company IDs nas respostas:", [...new Set(existingAnswers.map(a => a.company_id))])
    console.log("[v0] Holding IDs nas respostas:", [...new Set(existingAnswers.map(a => a.holding_id))])
  } else {
    console.log("[v0] ⚠️ NENHUMA RESPOSTA ENCONTRADA!")
  }

  const answersByQuestion: Record<string, any[]> = {}
  const responsesMap: Record<string, { value: string; evidence_url?: string; status?: string }> = {}

  if (existingAnswers) {
    for (const answer of existingAnswers) {
      // Agrupar por questão para gestores
      if (!answersByQuestion[answer.question_id]) {
        answersByQuestion[answer.question_id] = []
      }
      answersByQuestion[answer.question_id].push(answer)

      // GESTOR: Preencher campos com a primeira resposta disponível de qualquer usuário
      // USUÁRIO: Preencher apenas com suas próprias respostas
      const shouldMapResponse = isGestor 
        ? !responsesMap[answer.question_id] // Gestor: pega primeira resposta disponível
        : answer.user_id === user.id // Usuário: só suas respostas

      if (shouldMapResponse) {
        let displayValue = answer.value || ""
        if (answer.value_jsonb) {
          if (typeof answer.value_jsonb === "object" && answer.value_jsonb.value !== undefined) {
            displayValue = String(answer.value_jsonb.value)
          }
        }

        responsesMap[answer.question_id] = {
          value: displayValue,
          evidence_url: answer.evidence_url || "",
          status: answer.status || "rascunho",
        }
        
        console.log("[v0] Mapeando resposta:", {
          question_id: answer.question_id,
          user_id: answer.user_id,
          is_gestor: isGestor,
          value: displayValue
        })
      }
    }
  }

  console.log("[v0] Respostas mapeadas (responsesMap):", Object.keys(responsesMap).length)
  console.log("[v0] Questões com respostas agrupadas (answersByQuestion):", Object.keys(answersByQuestion).length)

  const totalQuestions = allQuestions.length
  const totalPages = Math.ceil(totalQuestions / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const questions = allQuestions.slice(startIndex, endIndex)

  // Count only answers that match questions in this template
  const questionIdsInTemplate = new Set(allQuestions.map(q => q.id))
  const answeredCount = Object.keys(responsesMap).filter(questionId => 
    questionIdsInTemplate.has(questionId)
  ).length
  const progress = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/meus-cadernos">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="h-4 w-4" />
              Voltar aos Cadernos
            </Button>
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="h-6 w-6 text-primary" />
                <h1 className="text-3xl font-bold">{template.name}</h1>
              </div>
              {template.description && <p className="text-muted-foreground mb-2">{template.description}</p>}
              {company && (
                <p className="text-sm text-muted-foreground">
                  Empresa: <span className="font-medium">{company.name}</span> ({company.cnpj})
                </p>
              )}
            </div>
            {template.type && (
              <Badge variant="outline" className="text-sm">
                {template.type}
              </Badge>
            )}
          </div>
        </div>

        {/* Progress Card */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="font-medium">Progresso do Questionário</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {answeredCount} de {totalQuestions} questões respondidas
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-sm text-muted-foreground mt-2 text-right">{progress}% completo</p>
          </CardContent>
        </Card>

        {totalQuestions > ITEMS_PER_PAGE && (
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando questões {startIndex + 1} a {Math.min(endIndex, totalQuestions)} de {totalQuestions}
            </p>
            <p className="text-sm font-medium text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
          </div>
        )}

        {/* Questions */}
        {totalQuestions === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma questão cadastrada</h3>
              <p className="text-muted-foreground">
                Este caderno ainda não possui questões. Entre em contato com o administrador.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <QuestionnaireForm
              questions={questions}
              templateId={templateId}
              userId={user.id}
              companyId={companyIdForSave}
              holdingId={holdingIdForSave || null}
              userRole={userRole}
              isGestor={isGestor}
              existingAnswers={responsesMap}
              answersByQuestion={answersByQuestion}
            />

            {totalPages > 1 && (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/questionnaire/${templateId}?page=1${companyId ? `&company=${companyId}` : ""}`}
                      >
                        <Button variant="outline" size="sm" disabled={currentPage === 1}>
                          Primeira
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/questionnaire/${templateId}?page=${currentPage - 1}${companyId ? `&company=${companyId}` : ""}`}
                      >
                        <Button variant="outline" size="sm" disabled={currentPage === 1}>
                          Anterior
                        </Button>
                      </Link>
                      <span className="mx-2 text-sm font-medium">
                        {currentPage} / {totalPages}
                      </span>
                      <Link
                        href={`/dashboard/questionnaire/${templateId}?page=${currentPage + 1}${companyId ? `&company=${companyId}` : ""}`}
                      >
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages}>
                          Próxima
                        </Button>
                      </Link>
                      <Link
                        href={`/dashboard/questionnaire/${templateId}?page=${totalPages}${companyId ? `&company=${companyId}` : ""}`}
                      >
                        <Button variant="outline" size="sm" disabled={currentPage === totalPages}>
                          Última
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
