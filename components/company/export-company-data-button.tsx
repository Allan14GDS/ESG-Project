"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Download, Loader2 } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Caderno {
  id: string
  name: string
}

interface User {
  id: string
  full_name: string
  email: string
}

interface ExportCompanyDataButtonProps {
  companyId: string
  companyName: string
  cadernos: Caderno[]
}

export function ExportCompanyDataButton({ companyId, companyName, cadernos }: ExportCompanyDataButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filterType, setFilterType] = useState<"cadernos" | "users">("cadernos")
  const [selectedCadernos, setSelectedCadernos] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<string>("")
  const [includeAllHoldingCompanies, setIncludeAllHoldingCompanies] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx")
  const [isExporting, setIsExporting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")

  // Fetch users when dialog opens
  useEffect(() => {
    if (isOpen && users.length === 0) {
      fetchUsers()
    }
  }, [isOpen])

  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const response = await fetch(`/api/company-users?companyId=${companyId}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const handleToggleCaderno = (cadernoId: string) => {
    setSelectedCadernos((prev) =>
      prev.includes(cadernoId) ? prev.filter((id) => id !== cadernoId) : [...prev, cadernoId]
    )
  }

  const handleSelectAll = () => {
    if (selectedCadernos.length === cadernos.length) {
      setSelectedCadernos([])
    } else {
      setSelectedCadernos(cadernos.map((c) => c.id))
    }
  }

  const handleExport = async () => {
    if (filterType === "cadernos" && selectedCadernos.length === 0) return
    if (filterType === "users" && !selectedUser) return

    setIsExporting(true)
    setErrorMessage("")

    try {
      const response = await fetch("/api/export-company-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          cadernoIds: filterType === "cadernos" ? selectedCadernos : undefined,
          userId: filterType === "users" ? selectedUser : undefined,
          includeAllHoldingCompanies: filterType === "users" ? includeAllHoldingCompanies : false,
          format,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to export data")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${companyName.replace(/\s+/g, "_")}_export_${new Date().toISOString().split("T")[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Only close and reset on success
      setIsOpen(false)
      setSelectedCadernos([])
      setSelectedUser("")
      setIncludeAllHoldingCompanies(false)
      setErrorMessage("")
    } catch (error) {
      console.error("Export error:", error)
      setErrorMessage(error instanceof Error ? error.message : "Erro ao exportar dados. Por favor, tente novamente.")
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg border-border/50 bg-transparent text-foreground hover:bg-secondary hover:text-foreground"
        onClick={() => setIsOpen(true)}
      >
        <Download className="mr-2 h-4 w-4" />
        Exportar
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Exportar Dados da Empresa</DialogTitle>
            <DialogDescription>
              Selecione como deseja filtrar a exportação para {companyName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Formato de Exportação</Label>
              <RadioGroup value={format} onValueChange={(value) => setFormat(value as "xlsx" | "csv")}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="xlsx" id="xlsx" />
                  <Label htmlFor="xlsx" className="cursor-pointer">
                    XLSX (Excel)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="csv" id="csv" />
                  <Label htmlFor="csv" className="cursor-pointer">
                    CSV
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Filter Type Tabs */}
            <Tabs value={filterType} onValueChange={(value) => setFilterType(value as "cadernos" | "users")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="cadernos">Por Cadernos</TabsTrigger>
                <TabsTrigger value="users">Por Usuário</TabsTrigger>
              </TabsList>

              <TabsContent value="cadernos" className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Cadernos</Label>
                  <Button variant="ghost" size="sm" onClick={handleSelectAll} type="button">
                    {selectedCadernos.length === cadernos.length ? "Desmarcar Todos" : "Selecionar Todos"}
                  </Button>
                </div>

                {cadernos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum caderno disponível para exportação</p>
                ) : (
                  <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border border-border/50 p-4">
                    {cadernos.map((caderno) => (
                      <div key={caderno.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={caderno.id}
                          checked={selectedCadernos.includes(caderno.id)}
                          onCheckedChange={() => handleToggleCaderno(caderno.id)}
                        />
                        <Label htmlFor={caderno.id} className="cursor-pointer text-sm font-normal">
                          {caderno.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {selectedCadernos.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {selectedCadernos.length} caderno(s) selecionado(s)
                  </p>
                )}
              </TabsContent>

              <TabsContent value="users" className="space-y-3 mt-4">
                <Label className="text-sm font-medium">Usuários Atribuídos</Label>

                {isLoadingUsers ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : users.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum usuário atribuído a esta empresa</p>
                ) : (
                  <RadioGroup value={selectedUser} onValueChange={setSelectedUser}>
                    <div className="max-h-[300px] space-y-2 overflow-y-auto rounded-lg border border-border/50 p-4">
                      {users.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <RadioGroupItem value={user.id} id={user.id} />
                          <Label htmlFor={user.id} className="cursor-pointer text-sm font-normal flex-1">
                            <div className="flex flex-col">
                              <span className="font-medium">{user.full_name}</span>
                              <span className="text-xs text-muted-foreground">{user.email}</span>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                )}

                {selectedUser && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 rounded-lg border border-border/50 p-3">
                      <Checkbox
                        id="includeAllHolding"
                        checked={includeAllHoldingCompanies}
                        onCheckedChange={(checked) => setIncludeAllHoldingCompanies(checked as boolean)}
                      />
                      <Label htmlFor="includeAllHolding" className="cursor-pointer text-sm font-normal flex-1">
                        Incluir respostas de todas as empresas da holding
                      </Label>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {includeAllHoldingCompanies
                        ? `Exportará todos os cadernos respondidos por ${users.find((u) => u.id === selectedUser)?.full_name} em todas as empresas da holding`
                        : `Exportará apenas os cadernos de ${companyName} respondidos por ${users.find((u) => u.id === selectedUser)?.full_name}`}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {errorMessage && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {errorMessage}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={
                (filterType === "cadernos" && selectedCadernos.length === 0) ||
                (filterType === "users" && !selectedUser) ||
                isExporting
              }
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
