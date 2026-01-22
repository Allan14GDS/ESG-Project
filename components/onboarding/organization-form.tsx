"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Plus, Trash2, Building2 } from "lucide-react"
import type { Organization, Branch } from "@/lib/organization"

interface OrganizationFormProps {
  initialData?: Organization
  onSubmit: (data: Organization) => void
  onBack?: () => void
}

export function OrganizationForm({ initialData, onSubmit, onBack }: OrganizationFormProps) {
  const [legalName, setLegalName] = useState(initialData?.legalName || "")
  const [legalForm, setLegalForm] = useState(initialData?.legalForm || "")
  const [address, setAddress] = useState(initialData?.address || "")
  const [cnpj, setCnpj] = useState(initialData?.cnpj || "")
  const [branches, setBranches] = useState<Branch[]>(initialData?.branches || [])
  const [error, setError] = useState("")

  const addBranch = () => {
    const newBranch: Branch = {
      id: Date.now().toString(),
      name: "",
      address: "",
      cnpj: "",
    }
    setBranches([...branches, newBranch])
  }

  const removeBranch = (id: string) => {
    setBranches(branches.filter((branch) => branch.id !== id))
  }

  const updateBranch = (id: string, field: keyof Branch, value: string) => {
    setBranches(branches.map((branch) => (branch.id === id ? { ...branch, [field]: value } : branch)))
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!legalName || !legalForm || !address || !cnpj) {
      setError("Por favor, preencha todos os campos obrigatórios")
      return
    }

    // Validate branches if any exist
    for (const branch of branches) {
      if (!branch.name || !branch.address || !branch.cnpj) {
        setError("Por favor, complete todas as informações das filiais ou remova filiais incompletas")
        return
      }
    }

    const organizationData: Organization = {
      id: initialData?.id || Date.now().toString(),
      legalName,
      legalForm,
      address,
      cnpj,
      branches,
    }

    onSubmit(organizationData)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle>Informações da Organização</CardTitle>
            <CardDescription>Insira as informações básicas da sua organização e subsidiárias</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Main Organization Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legalName">Razão Social *</Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                placeholder="Empresa Ltda."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="legalForm">Forma Jurídica *</Label>
              <Input
                id="legalForm"
                value={legalForm}
                onChange={(e) => setLegalForm(e.target.value)}
                placeholder="Ltda., S.A., etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Endereço da Matriz *</Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua Principal, 123, Cidade, Estado, País"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ *</Label>
            <Input
              id="cnpj"
              value={cnpj}
              onChange={(e) => setCnpj(formatCNPJ(e.target.value))}
              placeholder="00.000.000/0000-00"
              maxLength={18}
            />
          </div>

          {/* Branches Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">Subsidiárias / Filiais</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione quaisquer subsidiárias ou filiais incluídas no seu relatório ESG
                </p>
              </div>
              <Button type="button" variant="outline" onClick={addBranch}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Filial
              </Button>
            </div>

            {branches.map((branch, index) => (
              <Card key={branch.id} className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Filial {index + 1}</h4>
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeBranch(branch.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Nome da Filial</Label>
                    <Input
                      value={branch.name}
                      onChange={(e) => updateBranch(branch.id, "name", e.target.value)}
                      placeholder="Nome da filial"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Endereço</Label>
                    <Input
                      value={branch.address}
                      onChange={(e) => updateBranch(branch.id, "address", e.target.value)}
                      placeholder="Endereço da filial"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>CNPJ</Label>
                    <Input
                      value={branch.cnpj}
                      onChange={(e) => updateBranch(branch.id, "cnpj", formatCNPJ(e.target.value))}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex justify-between pt-6">
            {onBack && (
              <Button type="button" variant="outline" onClick={onBack}>
                Voltar
              </Button>
            )}
            <Button type="submit" className="ml-auto">
              Continuar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
