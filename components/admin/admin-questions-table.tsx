"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { EditQuestionWithTemplatesButton } from "@/components/questions/edit-question-with-templates-button"
import { DeleteQuestionButton } from "@/components/questions/delete-question-button"
import { Search, X, ArrowUp, ArrowDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface Question {
  id: string
  label: string
  type: string
  metadata: any
  book_question_junction?: any[]
  created_at?: string
}

interface AdminQuestionsTableProps {
  questions: Question[]
  allTemplates: any[]
}

const ITEMS_PER_PAGE = 20

const colorClasses = [
  "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800",
  "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800",
  "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 border-pink-200 dark:border-pink-800",
]

export function AdminQuestionsTable({ questions, allTemplates }: AdminQuestionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  useEffect(() => {
    const savedSort = localStorage.getItem("questions-sort-order")
    if (savedSort === "asc" || savedSort === "desc") {
      setSortOrder(savedSort)
    }
  }, [])

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "desc" ? "asc" : "desc"
    setSortOrder(newOrder)
    localStorage.setItem("questions-sort-order", newOrder)
    setCurrentPage(1)
  }

  const sortedQuestions = [...questions].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB
  })

  const filteredQuestions = sortedQuestions.filter((question) => {
    const label = question.label?.toLowerCase() || ""
    const metadataV2 = (question as any).metadata_v2 || {}
    const meta = metadataV2.disclosure ? metadataV2 : (question.metadata || {})
    const disclosure = (meta.disclosure || meta.framework_1 || meta.sub_framework_1 || "").toLowerCase()
    const search = searchTerm.toLowerCase()
    return label.includes(search) || disclosure.includes(search)
  })

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por nome da questão ou disclosure..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 bg-background"
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange("")}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={toggleSortOrder} className="gap-2 min-w-[140px] bg-transparent">
            {sortOrder === "desc" ? (
              <>
                <ArrowDown className="h-4 w-4" />
                Mais recentes
              </>
            ) : (
              <>
                <ArrowUp className="h-4 w-4" />
                Mais antigos
              </>
            )}
          </Button>
        </div>

        <div className="text-sm text-muted-foreground">
          {searchTerm ? (
            <span>
              Encontradas <strong>{filteredQuestions.length}</strong> questões para "{searchTerm}"
            </span>
          ) : (
            <span>
              Total de <strong>{questions.length}</strong> questões
            </span>
          )}
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-foreground">Nenhuma questão encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              {searchTerm ? `Nenhum resultado para "${searchTerm}"` : "Não há questões cadastradas ainda"}
            </p>
            {searchTerm && (
              <Button variant="outline" size="sm" onClick={() => handleSearchChange("")} className="mt-4">
                Limpar busca
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border/50 bg-muted/30">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Linha de Coleta</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Tipo</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Disclosure</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">Frameworks</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-muted-foreground">
                      Cadernos Atribuídos
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-muted-foreground">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {paginatedQuestions.map((question) => {
                    const metadata = question.metadata || {}
                    // Prioritize metadata_v2 if available (casted to any since not in interface yet)
                    const metadataV2 = (question as any).metadata_v2 || {}
                    const meta = metadataV2.disclosure ? metadataV2 : (question.metadata || {})

                    const disclosure = meta.disclosure || meta.framework_1 || meta.sub_framework_1 || ""
                    const evidencias = meta.evidencias || meta.evidencia || ""
                    const obs = meta.obs || meta.obs_nao_aplicavel || ""

                    // Robust sub_frameworks extraction for the edit dialog
                    let sub_frameworks = meta.sub_frameworks || meta.legacy_sub_frameworks || []
                    if (!Array.isArray(sub_frameworks)) {
                      sub_frameworks = []
                    }
                    if (sub_frameworks.length === 0 && (meta.framework_1 || meta.sub_framework_1)) {
                      sub_frameworks = [
                        { framework: meta.framework_1 || "", subFramework: meta.sub_framework_1 || "" },
                        ...(meta.framework_2 || meta.sub_framework_2 ? [{ framework: meta.framework_2 || "", subFramework: meta.sub_framework_2 || "" }] : [])
                      ]
                    }

                    // Map English types to Portuguese labels
                    const typeMapping: { [key: string]: string } = {
                      text: "texto",
                      string: "texto",
                      number: "numero",
                      percentage: "porcentagem",
                      date: "data",
                      file: "arquivo",
                      multiple_choice: "multipla_escolha",
                      yes_no: "sim_nao",
                    }
                    const displayType = typeMapping[question.type] || question.type || "texto"

                    // Frameworks for display
                    const f1 = meta.framework_1 || ""
                    const sf1 = meta.sub_framework_1 || ""
                    const f2 = meta.framework_2 || ""
                    const sf2 = meta.sub_framework_2 || ""

                    return (
                      <tr key={question.id} className="group hover:bg-muted/20">
                        <td className="px-6 py-4">
                          <div className="max-w-md">
                            <p className="text-sm font-medium text-foreground line-clamp-2">
                              {question.label || "Sem título"}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline" className="capitalize">
                            {displayType}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-muted-foreground">{disclosure || "-"}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            {f1 && (
                              <Badge variant="secondary" className="text-xs w-fit">
                                {f1} {sf1 ? `- ${sf1}` : ""}
                              </Badge>
                            )}
                            {f2 && (
                              <Badge variant="secondary" className="text-xs w-fit">
                                {f2} {sf2 ? `- ${sf2}` : ""}
                              </Badge>
                            )}
                            {!f1 && !f2 && <span className="text-xs text-muted-foreground">-</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {question.book_question_junction && question.book_question_junction.length > 0 ? (
                              question.book_question_junction.map((junction: any, idx: number) => {
                                const templateName = junction.book_templates?.name || "Caderno"
                                const colorClass = colorClasses[idx % colorClasses.length]
                                const subCategories = metadata.sub_frameworks?.[junction.book_template_id] || []
                                const hasSubCategories = Array.isArray(subCategories) && subCategories.length > 0
                                const subCategoryText = hasSubCategories ? subCategories.join(" > ") : ""

                                return (
                                  <Tooltip key={`${junction.book_template_id}-${idx}`}>
                                    <TooltipTrigger asChild>
                                      <Badge
                                        variant="outline"
                                        className={`text-xs px-2 py-1 border cursor-help ${colorClass}`}
                                      >
                                        <span className="font-semibold">{templateName}</span>
                                        {hasSubCategories && (
                                          <span className="ml-1 opacity-80">: {subCategoryText}</span>
                                        )}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="font-medium">{templateName}</p>
                                      {hasSubCategories && <p className="text-xs">Sub-categoria: {subCategoryText}</p>}
                                      {disclosure && <p className="text-xs">Referência: {disclosure}</p>}
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              })
                            ) : (
                              <span className="text-xs text-muted-foreground italic">Nenhum caderno</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-1">
                            <EditQuestionWithTemplatesButton
                              question={{
                                id: question.id,
                                linha_coleta: question.label || "",
                                disclosure: disclosure,
                                tipo_resposta: displayType, // Pass normalized type
                                evidencias: evidencias,
                                obs_nao_aplicavel: obs,
                                sub_frameworks: sub_frameworks,
                              }}
                              currentTemplates={
                                question.book_question_junction?.map((j: any) => j.book_template_id) || []
                              }
                              allTemplates={allTemplates || []}
                            />
                            <DeleteQuestionButton
                              questionId={question.id}
                              questionTitle={question.label || "Questão"}
                            />
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-border/50 pt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredQuestions.length)} de{" "}
                  {filteredQuestions.length} questões
                </p>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => goToPage(currentPage - 1)}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number
                      if (totalPages <= 5) {
                        pageNum = i + 1
                      } else if (currentPage <= 3) {
                        pageNum = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i
                      } else {
                        pageNum = currentPage - 2 + i
                      }

                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => goToPage(pageNum)}
                            isActive={currentPage === pageNum}
                            className="cursor-pointer"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    })}

                    <PaginationItem>
                      <PaginationNext
                        onClick={() => goToPage(currentPage + 1)}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </TooltipProvider>
  )
}
