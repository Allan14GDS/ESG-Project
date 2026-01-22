"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, Pencil, Search, X, ArrowUp, ArrowDown } from "lucide-react"
import Link from "next/link"
import { DeleteTemplateButton } from "@/components/templates/delete-template-button"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"

interface Template {
  id: string
  name: string
  description?: string
  type?: string
  created_at?: string
  book_question_junction?: any[]
  company_templates?: any[]
}

interface AdminTemplatesListProps {
  templates: Template[]
  userRole: string
}

const ITEMS_PER_PAGE = 10

const getCategoryBadge = (type: string) => {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    governanca: { bg: "bg-purple-100", text: "text-purple-700", label: "Governança" },
    organizacional: { bg: "bg-blue-100", text: "text-blue-700", label: "Organizacional" },
    ambiental: { bg: "bg-teal-100", text: "text-teal-700", label: "Ambiental" },
    social: { bg: "bg-pink-100", text: "text-pink-700", label: "Social" },
    gri: { bg: "bg-emerald-100", text: "text-emerald-700", label: "GRI" },
    aneel: { bg: "bg-amber-100", text: "text-amber-700", label: "ANEEL" },
    ifrs: { bg: "bg-cyan-100", text: "text-cyan-700", label: "IFRS" },
    custom: { bg: "bg-gray-100", text: "text-gray-700", label: "Customizado" },
  }

  const style = config[type?.toLowerCase()] || config.custom

  return (
    <Badge className={`${style.bg} ${style.text} border-0 font-medium`} variant="secondary">
      {style.label}
    </Badge>
  )
}

export function AdminTemplatesList({ templates, userRole }: AdminTemplatesListProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc")

  useEffect(() => {
    const savedSort = localStorage.getItem("templates-sort-order")
    if (savedSort === "asc" || savedSort === "desc") {
      setSortOrder(savedSort)
    }
  }, [])

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "desc" ? "asc" : "desc"
    setSortOrder(newOrder)
    localStorage.setItem("templates-sort-order", newOrder)
    setCurrentPage(1)
  }

  const sortedTemplates = [...templates].sort((a, b) => {
    const dateA = new Date(a.created_at || 0).getTime()
    const dateB = new Date(b.created_at || 0).getTime()
    return sortOrder === "desc" ? dateB - dateA : dateA - dateB
  })

  const filteredTemplates = sortedTemplates.filter((template) => {
    const name = template.name?.toLowerCase() || ""
    const description = template.description?.toLowerCase() || ""
    const type = template.type?.toLowerCase() || ""
    const search = searchTerm.toLowerCase()
    return name.includes(search) || description.includes(search) || type.includes(search)
  })

  const totalPages = Math.ceil(filteredTemplates.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex)

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
  }

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const borderColors: Record<string, string> = {
    governanca: "border-l-purple-500",
    organizacional: "border-l-blue-500",
    ambiental: "border-l-teal-500",
    social: "border-l-pink-500",
    gri: "border-l-emerald-500",
    aneel: "border-l-amber-500",
    ifrs: "border-l-cyan-500",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por nome do caderno, descrição ou categoria..."
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
            Encontrados <strong>{filteredTemplates.length}</strong> cadernos para "{searchTerm}"
          </span>
        ) : (
          <span>
            Total de <strong>{templates.length}</strong> cadernos
          </span>
        )}
      </div>

      {filteredTemplates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium text-foreground">Nenhum caderno encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchTerm ? `Nenhum resultado para "${searchTerm}"` : "Não há cadernos cadastrados ainda"}
          </p>
          {searchTerm && (
            <Button variant="outline" size="sm" onClick={() => handleSearchChange("")} className="mt-4">
              Limpar busca
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Templates */}
          <div className="space-y-3">
            {paginatedTemplates.map((template) => {
              const questionsCount = template.book_question_junction?.length || 0
              const assignmentsCount = template.company_templates?.length || 0
              const progress = 0

              const borderColor = borderColors[template.type?.toLowerCase()] || "border-l-gray-400"

              return (
                <Card
                  key={template.id}
                  className={`border-l-4 ${borderColor} hover:shadow-md transition-all duration-200 hover:bg-muted/30`}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {getCategoryBadge(template.type || "custom")}
                            <h3 className="font-semibold text-lg">{template.name}</h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {template.description || "Sem descrição"} ({questionsCount} questões)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 min-w-[200px]">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">Progresso</span>
                            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-300">
                              {progress}%
                            </span>
                          </div>
                          <Progress value={progress} className="h-2 bg-emerald-100 dark:bg-emerald-900/50" />
                          <p className="text-xs text-muted-foreground mt-1">0 de {questionsCount} questões</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {userRole === "admin_main" && (
                          <>
                            <Link href={`/admin/templates/${template.id}/edit`}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </Link>
                            <DeleteTemplateButton templateId={template.id} templateName={template.name} />
                          </>
                        )}
                        <Link href={`/admin/templates/${template.id}/questions`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20"
                          >
                            <ArrowRight className="w-5 h-5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border/50 pt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredTemplates.length)} de{" "}
                {filteredTemplates.length} cadernos
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
  )
}
