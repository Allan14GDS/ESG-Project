"use client"

import { useState } from "react"
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

interface Caderno {
  id: string
  name: string
}

interface ExportCompanyDataButtonProps {
  companyId: string
  companyName: string
  cadernos: Caderno[]
}

export function ExportCompanyDataButton({ companyId, companyName, cadernos }: ExportCompanyDataButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCadernos, setSelectedCadernos] = useState<string[]>([])
  const [format, setFormat] = useState<"xlsx" | "csv">("xlsx")
  const [isExporting, setIsExporting] = useState(false)

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
    if (selectedCadernos.length === 0) return

    setIsExporting(true)

    try {
      const response = await fetch("/api/export-company-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          cadernoIds: selectedCadernos,
          format,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to export data")
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

      setIsOpen(false)
      setSelectedCadernos([])
    } catch (error) {
      console.error("Export error:", error)
      alert("Erro ao exportar dados. Por favor, tente novamente.")
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
              Selecione os cadernos que deseja exportar para {companyName}
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

            {/* Cadernos Selection */}
            <div className="space-y-3">
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
            </div>

            {selectedCadernos.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedCadernos.length} caderno(s) selecionado(s)
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isExporting}>
              Cancelar
            </Button>
            <Button onClick={handleExport} disabled={selectedCadernos.length === 0 || isExporting}>
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
