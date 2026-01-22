"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Trash2, AlertTriangle } from "lucide-react"
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
import { Input } from "@/components/ui/input"

interface DeleteHoldingButtonProps {
  holdingId: string
  holdingName: string
  companyCount: number
}

export function DeleteHoldingButton({ holdingId, holdingName, companyCount }: DeleteHoldingButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [confirmText, setConfirmText] = useState("")
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const isConfirmValid = confirmText.toLowerCase() === "deletar tudo"

  async function handleDelete() {
    if (!isConfirmValid) return

    setIsDeleting(true)
    console.log("[v0] Deleting holding:", holdingId)

    try {
      const response = await fetch(`/api/holdings/${holdingId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete holding")
      }

      toast({
        title: "🗑️ Holding deletada com sucesso",
        description: `A holding "${holdingName}" e todas as suas ${companyCount} empresas foram removidas.`,
        duration: 5000,
      })

      console.log("[v0] Holding deleted successfully")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error deleting holding:", error)
      toast({
        variant: "destructive",
        title: "❌ Erro ao deletar holding",
        description: "Não foi possível deletar a holding. Tente novamente.",
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
          variant="outline"
          size="sm"
          className="gap-2 rounded-lg border-red-200 bg-transparent text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30 dark:hover:border-red-800 dark:hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/50">
              <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-500" />
            </div>
            <AlertDialogTitle className="text-2xl text-red-600 dark:text-red-500">
              ⚠️ ATENÇÃO: Ação Irreversível
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Você está prestes a deletar permanentemente a holding e todas as empresas vinculadas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4 px-6 text-base">
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
            <div className="font-semibold text-red-900 dark:text-red-300 mb-2">
              Você está prestes a deletar a holding:
            </div>
            <div className="text-lg font-bold text-red-700 dark:text-red-400">"{holdingName}"</div>
          </div>

          <div className="rounded-lg border-2 border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
            <div className="font-semibold text-orange-900 dark:text-orange-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              TODAS as {companyCount} empresas vinculadas serão DELETADAS permanentemente:
            </div>
            <ul className="list-disc list-inside text-orange-800 dark:text-orange-400 space-y-1 ml-2">
              <li>Todos os dados das empresas</li>
              <li>Todos os templates atribuídos</li>
              <li>Todas as respostas e históricos</li>
              <li>Todos os usuários vinculados às empresas</li>
            </ul>
          </div>

          <div className="text-destructive font-semibold">
            Esta ação NÃO PODE ser desfeita. Todos os dados serão perdidos permanentemente.
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">
              Para confirmar, digite{" "}
              <span className="font-mono font-bold text-red-600 dark:text-red-400">DELETAR TUDO</span> abaixo:
            </div>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite: DELETAR TUDO"
              className="border-2 border-red-200 focus:border-red-500 dark:border-red-900 dark:focus:border-red-700"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={!isConfirmValid || isDeleting}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 disabled:opacity-50"
          >
            {isDeleting ? "Deletando..." : "Deletar Holding e Todas as Empresas"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
