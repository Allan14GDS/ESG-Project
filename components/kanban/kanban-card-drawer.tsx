"use client"

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Clock, User, FileText, Tag, AlertCircle } from 'lucide-react'
import type { KanbanCard } from "@/lib/kanban-sync"
import { useRouter } from 'next/navigation'

interface KanbanCardDrawerProps {
  card: KanbanCard
  open: boolean
  onClose: () => void
}

export function KanbanCardDrawer({ card, open, onClose }: KanbanCardDrawerProps) {
  const router = useRouter()

  const handleGoToDisclosure = () => {
    const cadernoId = card.id
    
    console.log("[v0] Navigating to caderno:", cadernoId)
    
    // Navega diretamente para o caderno usando o ID
    router.push(`/dashboard/cadernos/${cadernoId}`)
    onClose()
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "high":
        return { label: "Alta", color: "bg-red-500" }
      case "medium":
        return { label: "Média", color: "bg-yellow-500" }
      default:
        return { label: "Baixa", color: "bg-green-500" }
    }
  }

  const priorityInfo = getPriorityLabel(card.priority)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-xl">{card.title}</SheetTitle>
              <SheetDescription className="mt-2">
                <Badge variant="outline" className="mr-2">
                  {card.griCode}
                </Badge>
                <Badge variant="secondary">{card.category}</Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status e Progresso */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Progresso</span>
              <span className="text-sm text-muted-foreground">{card.progress}%</span>
            </div>
            <Progress value={card.progress} className="h-2" />
          </div>

          <Separator />

          {/* Informações principais */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Responsável</p>
                <p className="text-sm text-muted-foreground">{card.owner}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Prazo</p>
                <p className="text-sm text-muted-foreground">{card.deadline}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Prioridade</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${priorityInfo.color}`} />
                  <span className="text-sm text-muted-foreground">{priorityInfo.label}</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Tags */}
          {card.tags.length > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Tags</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {card.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Feedback */}
          {card.feedback && (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Feedback do Revisor</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-900">{card.feedback}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Ações */}
          <div className="space-y-2">
            <Button onClick={handleGoToDisclosure} className="w-full" size="lg">
              <ExternalLink className="h-4 w-4 mr-2" />
              Ir para o Caderno GRI
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Visualize e edite os detalhes completos do disclosure
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
