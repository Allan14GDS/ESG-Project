"use client"

import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
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
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"

interface DeleteCompanyButtonProps {
  companyId: string
  companyName: string
  holdingId: string
}

export function DeleteCompanyButton({ companyId, companyName, holdingId }: DeleteCompanyButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    console.log("[v0] Deleting company:", companyId)

    try {
      const response = await fetch(`/api/companies/${companyId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao deletar empresa")
      }

      console.log("[v0] Company deleted successfully")

      toast({
        title: "✅ Empresa excluída",
        description: `${companyName} foi removida com sucesso.`,
        duration: 5000,
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting company:", error)
      toast({
        title: "❌ Erro ao excluir",
        description: error instanceof Error ? error.message : "Não foi possível excluir a empresa.",
        variant: "destructive",
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
      >
        <Trash2 className="h-4 w-4" />
        Excluir
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a empresa <strong>{companyName}</strong>? Esta ação não pode ser desfeita e
              todos os dados associados serão permanentemente removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
            >
              {isDeleting ? "Excluindo..." : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
