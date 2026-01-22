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
import { ArrowLeft, Loader2, HelpCircle, Plus, Check, BookOpen } from "lucide-react"
import Link from "next/link"
import { createTemplateQuestion } from "@/app/actions/template-actions"

interface BookTemplate {
  id: string
  name: string
  type: string
}

export default function CreateQuestionPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [templates, setTemplates] = useState<BookTemplate[]>([])
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([])
  const [formData, setFormData] = useState({
    // Framework fields
    framework_aneel: "",
    sub_framework_aneel: "",
    framework_ifrs: "",
    sub_framework_ifrs: "",
    framework_gri: "",
    sub_framework_gri_1: "",
    sub_framework_gri_2: "",
    sub_framework_gri_3: "",
    // Question fields
    disclosure: "",
    linha_coleta: "",
    question_type: "text",
    evidencias: "",
    obs_nao_aplicavel: "",
    justificativa: "",
  })

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await fetch("/api/templates")
        if (response.ok) {
          const data = await response.json()
          setTemplates(data)
        }
      } catch (error) {
        console.error("Error fetching templates:", error)
      }
    }
    fetchTemplates()
  }, [])

  const toggleTemplate = useCallback((templateId: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(templateId) ? prev.filter((id) => id !== templateId) : [...prev, templateId],
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedTemplates.length === 0) {
      alert("Selecione pelo menos um caderno")
      return
    }
    setIsLoading(true)

    try {
      // Create question for each selected template
      for (const templateId of selectedTemplates) {
        const result = await createTemplateQuestion({
          template_id: templateId,
          question_text: formData.linha_coleta,
          question_type: formData.question_type,
          framework_aneel: formData.framework_aneel,
          sub_framework_aneel: formData.sub_framework_aneel,
          framework_ifrs: formData.framework_ifrs,
          sub_framework_ifrs: formData.sub_framework_ifrs,
          framework_gri: formData.framework_gri,
          sub_framework_gri_1: formData.sub_framework_gri_1,
          sub_framework_gri_2: formData.sub_framework_gri_2,
          sub_framework_gri_3: formData.sub_framework_gri_3,
          disclosure: formData.disclosure,
          linha_coleta: formData.linha_coleta,
          evidencias: formData.evidencias,
          obs_nao_aplicavel: formData.obs_nao_aplicavel,
          justificativa: formData.justificativa,
        })

        if (!result.success) {
          alert(result.error || "Erro ao criar questão")
          setIsLoading(false)
          return
        }
      }

      router.push("/admin/templates")
    } catch (error) {
      console.error("Error creating question:", error)
      alert("Erro ao criar questão")
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryColor = (type: string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      governance: { bg: "bg-purple-100", border: "border-purple-300", text: "text-purple-700" },
      environmental: { bg: "bg-teal-100", border: "border-teal-300", text: "text-teal-700" },
      social: { bg: "bg-pink-100", border: "border-pink-300", text: "text-pink-700" },
      organizational: { bg: "bg-blue-100", border: "border-blue-300", text: "text-blue-700" },
    }
    return colors[type?.toLowerCase()] || { bg: "bg-gray-100", border: "border-gray-300", text: "text-gray-700" }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Back Button */}
        <Link href="/admin/templates">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar aos Cadernos
          </Button>
        </Link>

        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <HelpCircle className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Nova Questão</h1>
            <p className="text-muted-foreground">Adicione uma nova questão aos cadernos selecionados</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Select Multiple Templates */}
          <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/50 to-white">
            <CardHeader>
              <CardTitle className="text-indigo-700 flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Cadernos de Destino
              </CardTitle>
              <CardDescription>Selecione um ou mais cadernos onde esta questão será adicionada</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {templates.map((template) => {
                  const isSelected = selectedTemplates.includes(template.id)
                  const colors = getCategoryColor(template.type)
                  return (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => toggleTemplate(template.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                        isSelected
                          ? `${colors.border} ${colors.bg} shadow-md`
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`flex h-6 w-6 items-center justify-center rounded-md border-2 ${
                          isSelected ? `${colors.border} ${colors.bg}` : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className={`h-4 w-4 ${colors.text}`} />}
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${isSelected ? colors.text : "text-foreground"}`}>{template.name}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                          {template.type || "Geral"}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
              {selectedTemplates.length > 0 && (
                <p className="mt-3 text-sm text-indigo-600 font-medium">
                  {selectedTemplates.length} caderno(s) selecionado(s)
                </p>
              )}
            </CardContent>
          </Card>

          {/* Framework ANEEL */}
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50/50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-amber-700 flex items-center gap-2">
                <span className="px-3 py-1 bg-amber-100 rounded-lg text-sm font-bold">ANEEL</span>
                Framework ANEEL
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="framework_aneel">Framework ANEEL</Label>
                <Input
                  id="framework_aneel"
                  placeholder="Ex: Cadastro de agentes / Outorgas"
                  value={formData.framework_aneel}
                  onChange={(e) => setFormData({ ...formData, framework_aneel: e.target.value })}
                  className="border-amber-200 focus:border-amber-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub_framework_aneel">Sub-framework ANEEL</Label>
                <Input
                  id="sub_framework_aneel"
                  placeholder="Ex: Siga-ANEEL; Res. ANEEL nº 1.000/2021"
                  value={formData.sub_framework_aneel}
                  onChange={(e) => setFormData({ ...formData, sub_framework_aneel: e.target.value })}
                  className="border-amber-200 focus:border-amber-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Framework IFRS */}
          <Card className="border-2 border-cyan-200 bg-gradient-to-br from-cyan-50/50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-cyan-700 flex items-center gap-2">
                <span className="px-3 py-1 bg-cyan-100 rounded-lg text-sm font-bold">IFRS</span>
                Framework IFRS
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="framework_ifrs">Framework IFRS</Label>
                <Input
                  id="framework_ifrs"
                  placeholder="Ex: IFRS S1"
                  value={formData.framework_ifrs}
                  onChange={(e) => setFormData({ ...formData, framework_ifrs: e.target.value })}
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sub_framework_ifrs">Sub-framework IFRS</Label>
                <Input
                  id="sub_framework_ifrs"
                  placeholder="Ex: Disclosure 27(a)"
                  value={formData.sub_framework_ifrs}
                  onChange={(e) => setFormData({ ...formData, sub_framework_ifrs: e.target.value })}
                  className="border-cyan-200 focus:border-cyan-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Framework GRI */}
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-emerald-700 flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 rounded-lg text-sm font-bold">GRI</span>
                Framework GRI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="framework_gri">Framework GRI</Label>
                  <Input
                    id="framework_gri"
                    placeholder="Ex: GRI 2"
                    value={formData.framework_gri}
                    onChange={(e) => setFormData({ ...formData, framework_gri: e.target.value })}
                    className="border-emerald-200 focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub_framework_gri_1">Sub-framework GRI 1</Label>
                  <Input
                    id="sub_framework_gri_1"
                    placeholder="Ex: GRI 2"
                    value={formData.sub_framework_gri_1}
                    onChange={(e) => setFormData({ ...formData, sub_framework_gri_1: e.target.value })}
                    className="border-emerald-200 focus:border-emerald-400"
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="sub_framework_gri_2">Sub-framework GRI 2</Label>
                  <Input
                    id="sub_framework_gri_2"
                    placeholder="Ex: 2-1"
                    value={formData.sub_framework_gri_2}
                    onChange={(e) => setFormData({ ...formData, sub_framework_gri_2: e.target.value })}
                    className="border-emerald-200 focus:border-emerald-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub_framework_gri_3">Sub-framework GRI 3</Label>
                  <Input
                    id="sub_framework_gri_3"
                    placeholder="Ex: Detalhes organizacionais"
                    value={formData.sub_framework_gri_3}
                    onChange={(e) => setFormData({ ...formData, sub_framework_gri_3: e.target.value })}
                    className="border-emerald-200 focus:border-emerald-400"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Question Details */}
          <Card className="border-2 border-purple-200 bg-gradient-to-br from-purple-50/50 to-white">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-700">Detalhes da Questão</CardTitle>
              <CardDescription>Informações específicas da linha de coleta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="disclosure">Disclosure *</Label>
                  <Input
                    id="disclosure"
                    placeholder="Ex: 2-1 Detalhes organizacionais"
                    value={formData.disclosure}
                    onChange={(e) => setFormData({ ...formData, disclosure: e.target.value })}
                    required
                    className="border-purple-200 focus:border-purple-400"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question_type">Tipo de Resposta *</Label>
                  <Select
                    value={formData.question_type}
                    onValueChange={(value) => setFormData({ ...formData, question_type: value })}
                  >
                    <SelectTrigger className="border-purple-200 focus:border-purple-400">
                      <SelectValue placeholder="Selecione o tipo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Texto</SelectItem>
                      <SelectItem value="number">Número</SelectItem>
                      <SelectItem value="date">Data</SelectItem>
                      <SelectItem value="select">Seleção</SelectItem>
                      <SelectItem value="multi_select">Múltipla Seleção</SelectItem>
                      <SelectItem value="file">Arquivo</SelectItem>
                      <SelectItem value="boolean">Sim/Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="linha_coleta">Linha de Coleta (atomizada) *</Label>
                <Textarea
                  id="linha_coleta"
                  placeholder="Ex: Informe a razão social"
                  value={formData.linha_coleta}
                  onChange={(e) => setFormData({ ...formData, linha_coleta: e.target.value })}
                  required
                  rows={2}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="evidencias">Evidências (por disclosure)</Label>
                <Textarea
                  id="evidencias"
                  placeholder="Ex: Contrato social, Estatuto"
                  value={formData.evidencias}
                  onChange={(e) => setFormData({ ...formData, evidencias: e.target.value })}
                  rows={2}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="obs_nao_aplicavel">OBS de Não Aplicável</Label>
                <Textarea
                  id="obs_nao_aplicavel"
                  placeholder="Ex: Os disclosures do GRI 2 não admitem a classificação 'não aplicável'"
                  value={formData.obs_nao_aplicavel}
                  onChange={(e) => setFormData({ ...formData, obs_nao_aplicavel: e.target.value })}
                  rows={2}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="justificativa">Justificativa (opcional)</Label>
                <Input
                  id="justificativa"
                  placeholder="Justificativa adicional..."
                  value={formData.justificativa}
                  onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                  className="border-purple-200 focus:border-purple-400"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Link href="/admin/templates">
              <Button type="button" variant="outline" size="lg">
                Cancelar
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isLoading || selectedTemplates.length === 0 || !formData.disclosure || !formData.linha_coleta}
              size="lg"
              className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Criar Questão
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
