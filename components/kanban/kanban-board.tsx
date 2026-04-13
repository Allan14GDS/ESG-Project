"use client";

import type React from "react";

import { useState } from "react";

import { Card } from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import { Progress } from "@/components/ui/progress";

import { Clock, AlertTriangle } from "lucide-react";

import {
  kanbanSyncService,
  type KanbanCard,
  type KanbanStatus,
} from "@/lib/kanban-sync";

import { KanbanCardDrawer } from "./kanban-card-drawer";

interface KanbanBoardProps {
  cards: KanbanCard[];

  onCardMove: (cardId: string, newStatus: KanbanStatus) => void;
}

const COLUMNS = [
  {
    status: "not-started" as KanbanStatus,

    title: "Não Iniciado",

    color: "bg-slate-200 dark:bg-slate-800",
  },

  {
    status: "draft" as KanbanStatus,

    title: "Rascunho",

    color: "bg-amber-200 dark:bg-amber-900/40",
  },

  {
    status: "submitted" as KanbanStatus,

    title: "Submetido",

    color: "bg-sky-200 dark:bg-sky-900/40",
  },

  {
    status: "returned" as KanbanStatus,

    title: "Devolvido",

    color: "bg-rose-200 dark:bg-rose-900/40",
  },

  {
    status: "validated" as KanbanStatus,

    title: "Validado",

    color: "bg-emerald-300 dark:bg-emerald-900/40",
  },
];

export function KanbanBoard({ cards, onCardMove }: KanbanBoardProps) {
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);

  const [draggingCard, setDraggingCard] = useState<string | null>(null);

  const groupedCards = kanbanSyncService.groupCardsByStatus(cards);

  const handleDragStart = (cardId: string) => {
    setDraggingCard(cardId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (status: KanbanStatus) => {
    if (draggingCard) {
      onCardMove(draggingCard, status);

      setDraggingCard(null);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";

      case "medium":
        return "bg-yellow-500";

      default:
        return "bg-green-500";
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 min-h-[600px]">
        {COLUMNS.map((column) => (
          <div
            key={column.status}
            className={`${column.color} rounded-lg p-4`}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.status)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl dark:text-gray-100">{column.title}</h3>

              <Badge
                variant="secondary"
                className="text-base font-bold px-3 py-1"
              >
                {groupedCards[column.status].length}
              </Badge>
            </div>

            <div className="space-y-3">
              {groupedCards[column.status].map((card) => (
                <Card
                  key={card.id}
                  draggable
                  onDragStart={() => handleDragStart(card.id)}
                  onClick={() => setSelectedCard(card)}
                  className="p-3 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-all cursor-move hover:scale-[1.02]"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs shrink-0">
                            {card.griCode}
                          </Badge>

                          <div
                            className={`w-2 h-2 rounded-full shrink-0 ${getPriorityColor(card.priority)}`}
                          />
                        </div>

                        <h4 className="text-sm font-medium leading-tight line-clamp-2 dark:text-gray-100">
                          {card.title}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">👤 {card.owner}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3 shrink-0" />

                      <span>{card.deadline}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">Progresso</span>

                        <span className="text-muted-foreground">
                          {card.progress}%
                        </span>
                      </div>

                      <Progress value={card.progress} className="h-2" />

                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Questões respondidas</span>

                        <span>
                          {Math.round(
                            (card.progress / 100) *
                              parseInt(
                                card.tags

                                  .find((t) => t.includes("questões"))

                                  ?.split(" ")[0] || "0",
                              ),
                          )}{" "}
                          de{" "}
                          {card.tags

                            .find((t) => t.includes("questões"))

                            ?.split(" ")[0] || "0"}
                        </span>
                      </div>
                    </div>

                    {card.feedback && (
                        <div className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 p-2 rounded flex items-start gap-1">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />

                        <span className="line-clamp-2">{card.feedback}</span>
                      </div>
                    )}

                    {card.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {card.tags.slice(0, 2).map((tag, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {selectedCard && (
        <KanbanCardDrawer
          card={selectedCard}
          open={!!selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </>
  );
}
