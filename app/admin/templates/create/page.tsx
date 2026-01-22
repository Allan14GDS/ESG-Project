"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, FileText, Loader2, Plus, Users, Check } from "lucide-react"
import Link from "next/link"
import { createBookTemplate } from "@/app/actions/template-actions"

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
}

export default function CreateTemplatePage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "gri",
  })

  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await fetch("/api/profiles")
        if (response.ok) {
          const data = await response.json()
          setProfiles(data)
        }
      } catch (error) {
        console.error("Error fetching profiles:", error)
      }
    }
    fetchProfiles()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const responsableNames = profiles
        .filter((p) => selectedResponsibles.includes(p.id))
        .map((p) => p.full_name)
        .join(", ")

      const result = await createBookTemplate({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        responsable_name: responsableNames,
        responsable_id: selectedResponsibles[0] || undefined,
      })

      if (result.success) {
        router.push("/admin/templates")
      } else {
        alert(result.error || "Erro ao criar caderno")
      }
    } catch (error) {
      console.error("Error creating template:", error)
      alert("Erro ao criar caderno")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleResponsible = useCallback((profileId: string) => {
    setSelectedResponsibles((prev) => {
      if (prev.includes(profileId)) {
        return prev.filter((id) => id !== profileId)
      }
      return [...prev, profileId]
    })
  }, [])

  const templateTypes = [
    { value: "gri", label: "GRI", color: "bg-emerald-100 text-emerald-700" },
    { value: "aneel", label: "ANEEL", color: "bg-amber-100 text-amber-700" },
    { value: "ifrs", label: "IFRS", color: "bg-cyan-100 text-cyan-700" },
    { value: "governanca", label: "Governança", color: "bg-purple-100 text-purple-700" },
    { value: "organizacional", label: "Organizacional", color: "bg-blue-100 text-blue-700" },
    { value: "ambiental", label: "Ambiental", color: "bg-teal-100 text-teal-700" },
    { value: "social", label: "Social", color: "bg-pink-100 text-pink-700" },
    { value: "custom", label: "Customizado", color: "bg-gray-100 text-gray-700" },
  ]

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-3xl space-y-6">
        {/* Back Button */}
        <Link href="/admin/templates">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Cadernos
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 border border-emerald-200">
            <FileText className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Novo Caderno</h1>
            <p className="text-muted-foreground">Crie um novo caderno de coleta ESG</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Caderno</CardTitle>
              <CardDescription>Preencha os dados básicos do caderno</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Caderno *</Label>
                <Input
                  id="name"
                  placeholder="Ex: GRI 2 + Aneel - Governança"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  placeholder="Descreva o objetivo e escopo deste caderno..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Tipo / Categoria *</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${type.color}`}>{type.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <Label>Responsáveis (selecione um ou mais)</Label>
                </div>
                <Card className="border-dashed">
                  <CardContent className="p-4">
                    {profiles.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">Carregando usuários...</p>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-2">
                        {profiles.map((profile) => {
                          const isSelected = selectedResponsibles.includes(profile.id)
                          return (
                            <button
                              type="button"
                              key={profile.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left w-full ${
                                isSelected ? "border-emerald-500 bg-emerald-50" : "border-border hover:bg-muted/50"
                              }`}
                              onClick={() => toggleResponsible(profile.id)}
                            >
                              {/* Custom checkbox visual */}
                              <div
                                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
                                  isSelected ? "bg-emerald-600 border-emerald-600" : "border-muted-foreground/30"
                                }`}
                              >
                                {isSelected && <Check className="h-3.5 w-3.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{profile.full_name || "Sem nome"}</p>
                                <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 mt-6">
            <Link href="/admin/templates">
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </Link>
            <Button type="submit" disabled={isLoading || !formData.name} className="gap-2">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Criar Caderno
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
