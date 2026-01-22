"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Filter, Download } from 'lucide-react'
import { CADERNOS_HIERARCHY, calculateCadernoProgress } from "@/lib/cadernos-data"
import { KanbanBoard } from "@/components/kanban/kanban-board"
import type { KanbanCard, KanbanStatus } from "@/lib/kanban-sync"

export default function StatusPage() {
  const [cards, setCards] = useState<KanbanCard[]>([])
  const [filteredCards, setFilteredCards] = useState<KanbanCard[]>([])
  const [filters, setFilters] = useState({
    category: "all",
    responsible: "",
    search: "",
  })
  const [progressData, setProgressData] = useState<Record<string, number>>({})

  useEffect(() => {
    const mainCadernos = CADERNOS_HIERARCHY.filter((c) => !c.parentId)
    
    const savedStatuses = localStorage.getItem("caderno-statuses")
    let statuses: Record<string, KanbanStatus> = {}
    
    if (savedStatuses) {
      try {
        statuses = JSON.parse(savedStatuses)
      } catch (e) {
        console.error("Error loading statuses:", e)
      }
    }

    const kanbanCards: KanbanCard[] = mainCadernos.map((caderno) => {
      const progress = calculateCadernoProgress(caderno.id)
      
      let status: KanbanStatus = statuses[caderno.id] || "not-started"
      if (!statuses[caderno.id]) {
        if (progress === 0) status = "not-started"
        else if (progress < 50) status = "draft"
        else if (progress < 100) status = "submitted"
        else status = "validated"
      }

      return {
        id: caderno.id,
        griCode: caderno.id.toUpperCase(),
        title: caderno.title,
        description: caderno.description || "",
        status,
        priority: progress > 50 ? "high" : "medium",
        owner: caderno.responsible || "Não atribuído",
        deadline: "31/12/2025",
        progress,
        tags: [
          caderno.category === "organizational"
            ? "Organizacional"
            : caderno.category === "economic"
              ? "Econômico"
              : caderno.category === "environmental"
                ? "Ambiental"
                : "Social",
          `${caderno.questions.length} questões`,
        ],
        feedback: "",
        lastUpdated: new Date().toISOString(),
        comments: [],
      }
    })

    setCards(kanbanCards)
    setFilteredCards(kanbanCards)

    const progress: Record<string, number> = {}
    mainCadernos.forEach((caderno) => {
      progress[caderno.id] = calculateCadernoProgress(caderno.id)
    })
    setProgressData(progress)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [cards, filters])

  const applyFilters = () => {
    let filtered = [...cards]

    if (filters.category !== "all") {
      filtered = filtered.filter((c) => {
        const caderno = CADERNOS_HIERARCHY.find((h) => h.id === c.id)
        return caderno?.category === filters.category
      })
    }

    if (filters.responsible) {
      filtered = filtered.filter((c) => c.owner.toLowerCase().includes(filters.responsible.toLowerCase()))
    }

    if (filters.search) {
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          c.description.toLowerCase().includes(filters.search.toLowerCase()),
      )
    }

    setFilteredCards(filtered)
  }

  const handleCardMove = (cardId: string, newStatus: KanbanStatus) => {
    setCards((prev) => {
      const updated = prev.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c))
      
      const statuses: Record<string, KanbanStatus> = {}
      updated.forEach((c) => {
        statuses[c.id] = c.status
      })
      localStorage.setItem("caderno-statuses", JSON.stringify(statuses))
      
      return updated
    })
  }

  const mainCadernos = CADERNOS_HIERARCHY.filter((c) => !c.parentId)
  const totalQuestions = mainCadernos.reduce((sum, c) => sum + c.questions.length, 0)
  const answeredQuestions = mainCadernos.reduce((sum, c) => {
    const progress = progressData[c.id] || 0
    return sum + Math.round((progress / 100) * c.questions.length)
  }, 0)
  const overallProgress = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0

  const stats = {
    notStarted: cards.filter((c) => c.status === "not-started").length,
    draft: cards.filter((c) => c.status === "draft").length,
    submitted: cards.filter((c) => c.status === "submitted").length,
    returned: cards.filter((c) => c.status === "returned").length,
    validated: cards.filter((c) => c.status === "validated").length,
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel de Status Operacional</h1>
          <p className="text-muted-foreground">Quadro Kanban de Cadernos GRI</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Progresso da Rodada 2025</CardTitle>
          <CardDescription>Todas as questões de todos os cadernos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Taxa de Conclusão Geral</span>
              <span className="text-sm text-muted-foreground">
                {overallProgress}% ({answeredQuestions} de {totalQuestions} questões)
              </span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            
            <div className="grid grid-cols-5 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-700">{stats.notStarted}</div>
                <div className="text-xs text-muted-foreground">Não Iniciado</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-700">{stats.draft}</div>
                <div className="text-xs text-muted-foreground">Rascunho</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-700">{stats.submitted}</div>
                <div className="text-xs text-muted-foreground">Submetido</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-700">{stats.returned}</div>
                <div className="text-xs text-muted-foreground">Devolvido</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-700">{stats.validated}</div>
                <div className="text-xs text-muted-foreground">Validado</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros Avançados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria</label>
              <Select value={filters.category} onValueChange={(value) => setFilters({ ...filters, category: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="organizational">Organizacional</SelectItem>
                  <SelectItem value="economic">Econômico</SelectItem>
                  <SelectItem value="environmental">Ambiental</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Responsável</label>
              <Input
                placeholder="Filtrar por responsável..."
                value={filters.responsible}
                onChange={(e) => setFilters({ ...filters, responsible: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <Input
                placeholder="Buscar por título..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <Badge variant="secondary">
              {filteredCards.length} de {cards.length} cadernos
            </Badge>
            {(filters.category !== "all" || filters.responsible || filters.search) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ category: "all", responsible: "", search: "" })}
              >
                Limpar filtros
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quadro Kanban de Disclosures GRI</CardTitle>
          <CardDescription>
            Arraste e solte cards para atualizar status. Clique em um card para ver detalhes e acessar o caderno GRI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <KanbanBoard cards={filteredCards} onCardMove={handleCardMove} />
        </CardContent>
      </Card>
    </div>
  )
}
