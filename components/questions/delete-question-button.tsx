"use client"

import { useState, memo } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"

interface DeleteQuestionButtonProps {
  questionId: string
  questionTitle: string
}

export const DeleteQuestionButton = memo(function DeleteQuestionButton({
  questionId,
  questionTitle,
}: DeleteQuestionButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Erro ao deletar questão")
      }

      toast({
        title: "✅ Questão Deletada",
        description: "A questão foi removida com sucesso do banco master.",
        duration: 3000,
      })

      setOpen(false)
      setTimeout(() => window.location.reload(), 500)
    } catch (error) {
      console.error("[v0] Error deleting question:", error)
      toast({
        title: "❌ Erro",
        description: error instanceof Error ? error.message : "Erro ao deletar questão",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Esta ação não pode ser desfeita. A questão <strong>{questionTitle}</strong> será removida permanentemente
              do banco master.
            </p>
            <p className="text-amber-600 dark:text-amber-400">
              ⚠️ Todas as atribuições desta questão a cadernos também serão removidas.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deletando...
              </>
            ) : (
              "Deletar Questão"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
})
