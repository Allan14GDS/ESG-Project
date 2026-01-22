"use client"

import { useState } from "react"
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
import { deleteUser } from "@/app/actions/user-actions"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

interface DeleteUserDialogProps {
  userId: string
  userEmail: string
  userName: string
}

export function DeleteUserDialog({ userId, userEmail, userName }: DeleteUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDeleteUser() {
    setLoading(true)
    try {
      const result = await deleteUser(userId)

      if (result.success) {
        toast.success(`Usuário ${userName} removido com sucesso`)
        setOpen(false)
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Erro ao remover usuário")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 rounded-lg border-red-500/50 bg-transparent text-red-500 hover:bg-red-500/10 hover:text-red-500"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
        Remover
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você tem certeza que deseja remover <span className="font-semibold text-foreground">{userName}</span> (
                {userEmail})?
              </p>
              <p className="text-red-500">
                Esta ação é irreversível e o usuário será completamente removido do sistema.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteUser()
              }}
              disabled={loading}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {loading ? "Removendo..." : "Sim, Remover"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
