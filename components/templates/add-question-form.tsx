"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addQuestionToTemplate } from "@/app/actions/template-actions"

interface AddQuestionFormProps {
  templateId: string
  nextSortOrder: number
}

export function AddQuestionForm({ templateId, nextSortOrder }: AddQuestionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    disclosure: "",
    linha_coleta: "",
    tipo_resposta: "text",
    evidencia: "",
    obs: "",
    framework_1: "",
    sub_framework_1: "",
    framework_2: "",
    sub_framework_2: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.linha_coleta.trim()) {
      setError("Por favor, preencha a linha de coleta (pergunta)")
      return
    }

    setLoading(true)
    setError(null)

    const result = await addQuestionToTemplate({
      templateId,
      questionText: formData.linha_coleta,
      questionType: formData.tipo_resposta,
      sortOrder: nextSortOrder,
      metadata: {
        disclosure: formData.disclosure,
        evidencia: formData.evidencia,
        obs: formData.obs,
        framework_1: formData.framework_1,
        sub_framework_1: formData.sub_framework_1,
        framework_2: formData.framework_2,
        sub_framework_2: formData.sub_framework_2,
      },
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      setFormData({
        disclosure: "",
        linha_coleta: "",
        tipo_resposta: "text",
        evidencia: "",
        obs: "",
        framework_1: "",
        sub_framework_1: "",
        framework_2: "",
        sub_framework_2: "",
      })
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="disclosure">Disclosure</Label>
          <Input
            id="disclosure"
            placeholder="Ex: 2-1 Detalhes organizacionais"
            value={formData.disclosure}
            onChange={(e) => setFormData({ ...formData, disclosure: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Detalhamento da pergunta</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="framework_1">Framework 1</Label>
            <Input
              id="framework_1"
              placeholder="Ex: GRI"
              value={formData.framework_1}
              onChange={(e) => setFormData({ ...formData, framework_1: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub_framework_1">Sub-framework 1</Label>
            <Input
              id="sub_framework_1"
              placeholder="Ex: 301"
              value={formData.sub_framework_1}
              onChange={(e) => setFormData({ ...formData, sub_framework_1: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="framework_2">Framework 2</Label>
            <Input
              id="framework_2"
              placeholder="Ex: SASB"
              value={formData.framework_2}
              onChange={(e) => setFormData({ ...formData, framework_2: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sub_framework_2">Sub-framework 2</Label>
            <Input
              id="sub_framework_2"
              placeholder="Ex: IF-EU-110a.1"
              value={formData.sub_framework_2}
              onChange={(e) => setFormData({ ...formData, sub_framework_2: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="linha_coleta">Linha de Coleta (Atomizada) *</Label>
          <Textarea
            id="linha_coleta"
            placeholder="Ex: Informe a razão social da organização"
            value={formData.linha_coleta}
            onChange={(e) => setFormData({ ...formData, linha_coleta: e.target.value })}
            rows={3}
            required
          />
          <p className="text-xs text-muted-foreground">A pergunta em si</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="tipo_resposta">Tipo de Resposta *</Label>
          <Select
            value={formData.tipo_resposta}
            onValueChange={(value) => setFormData({ ...formData, tipo_resposta: value })}
          >
            <SelectTrigger id="tipo_resposta">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Texto</SelectItem>
              <SelectItem value="number">Número</SelectItem>
              <SelectItem value="percentage">Porcentagem</SelectItem>
              <SelectItem value="date">Data</SelectItem>
              <SelectItem value="boolean">Sim/Não</SelectItem>
              <SelectItem value="currency">Moeda</SelectItem>
              <SelectItem value="file">Arquivo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="evidencia">Evidência</Label>
          <Input
            id="evidencia"
            placeholder="Ex: Contrato social, Estatuto"
            value={formData.evidencia}
            onChange={(e) => setFormData({ ...formData, evidencia: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Tipo de documento que será anexado</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="obs">Observação</Label>
          <Textarea
            id="obs"
            placeholder="Ex: Campo obrigatório para empresas S.A."
            value={formData.obs}
            onChange={(e) => setFormData({ ...formData, obs: e.target.value })}
            rows={2}
          />
          <p className="text-xs text-muted-foreground">Texto de observação para a pergunta</p>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <p>{error}</p>
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Adicionando..." : "Adicionar Pergunta"}
      </Button>
    </form>
  )
}
