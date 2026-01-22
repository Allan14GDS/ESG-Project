"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
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
import { useRouter } from "next/navigation"

interface DeleteTemplateButtonProps {
  templateId: string
  templateName: string
}

export function DeleteTemplateButton({ templateId, templateName }: DeleteTemplateButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Falha ao deletar caderno")
      }

      toast({
        title: "✅ Caderno deletado",
        description: `${templateName} foi removido com sucesso.`,
        duration: 4000,
      })

      // Refresh the page to show updated list
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting template:", error)
      toast({
        title: "❌ Erro ao deletar",
        description: "Não foi possível deletar o caderno. Tente novamente.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja deletar o caderno <strong>{templateName}</strong>?
            <br />
            <br />
            Esta ação é permanente e irá remover todas as questões associadas e atribuições a empresas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
          >
            {isDeleting ? "Deletando..." : "Deletar Caderno"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
