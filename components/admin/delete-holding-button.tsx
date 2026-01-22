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
} from "@/components/ui/alert-dialog"
import { deleteHolding } from "@/app/actions/delete-holding"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DeleteHoldingButtonProps {
  holdingId: string
  holdingName: string
}

export function DeleteHoldingButton({ holdingId, holdingName }: DeleteHoldingButtonProps) {
  const [open, setOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deleteHolding(holdingId)

      if (result.success) {
        toast.success("Holding excluída com sucesso!")
        setOpen(false)
        router.refresh()
      } else {
        toast.error(result.error || "Erro ao excluir holding")
      }
    } catch (error) {
      console.error("[v0] Error deleting holding:", error)
      toast.error("Erro ao excluir holding")
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
        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a holding <strong>{holdingName}</strong>? Esta ação não pode ser desfeita e
              todas as empresas vinculadas também serão desvinculadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
