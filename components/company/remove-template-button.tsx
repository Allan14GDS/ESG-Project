"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
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

export function RemoveTemplateButton({
  companyId,
  companyTemplateId,
}: {
  companyId: string
  companyTemplateId: string
}) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const handleRemove = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/company-templates/${companyTemplateId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to remove template")
      }

      toast({
        title: "Template removido",
        description: "O template foi removido com sucesso da empresa.",
        variant: "default",
      })

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error removing template:", error)
      toast({
        title: "Erro ao remover template",
        description: "Ocorreu um erro ao remover o template. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10 rounded-xl border-red-500/20 text-red-500 hover:bg-red-500/10 hover:text-red-600 bg-transparent"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover template?</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja remover este template da empresa? Esta ação não pode ser desfeita e todas as
            respostas associadas serão mantidas mas o template não estará mais ativo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleRemove()
            }}
            disabled={loading}
            className="bg-red-500 hover:bg-red-600"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Remover
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
