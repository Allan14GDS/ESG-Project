"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { resetUserPassword } from "@/app/actions/user-actions"
import { Key, Eye, EyeOff, Copy, Check } from "lucide-react"
import { toast } from "sonner"

interface ResetPasswordDialogProps {
  userId: string
  userEmail: string
  userName: string
}

export function ResetPasswordDialog({ userId, userEmail, userName }: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  function generateRandomPassword() {
    const length = 12
    const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%"
    let password = ""
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }

  function handleGeneratePassword() {
    setNewPassword(generateRandomPassword())
  }

  async function handleResetPassword() {
    if (!newPassword.trim()) {
      toast.error("Por favor, insira uma senha")
      return
    }

    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres")
      return
    }

    setLoading(true)
    try {
      const result = await resetUserPassword(userId, newPassword)

      if (result.success) {
        toast.success(`Senha atualizada com sucesso para ${userName}`)
        setOpen(false)
        setNewPassword("")
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      toast.error("Erro ao atualizar senha")
    } finally {
      setLoading(false)
    }
  }

  function handleCopyPassword() {
    navigator.clipboard.writeText(newPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2 rounded-lg border-border/50 bg-transparent text-foreground hover:bg-secondary hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Key className="h-3.5 w-3.5" />
        Resetar Senha
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resetar Senha de {userName}</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para {userEmail}. A senha será atualizada imediatamente.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password" className="text-foreground">
                Nova Senha
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite ou gere uma senha"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {newPassword && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPassword}
                    className="border-border/50 bg-transparent"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
            </div>

            {/* Generate password button */}
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleGeneratePassword}
              disabled={loading}
            >
              Gerar Senha Aleatória
            </Button>

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading} className="flex-1">
                Cancelar
              </Button>
              <Button
                onClick={handleResetPassword}
                disabled={loading || !newPassword.trim()}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
              >
                {loading ? "Atualizando..." : "Atualizar Senha"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
