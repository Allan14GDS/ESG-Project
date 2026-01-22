"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { ArrowLeft, FileText, Loader2, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { addBookToCompany, getTemplates } from "@/app/actions/book-actions"

export default function AddBookPage({ params }: { params: { companyId: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [loadingTemplates, setLoadingTemplates] = useState(true)

  useEffect(() => {
    async function fetchTemplates() {
      const result = await getTemplates()
      if (result.data) {
        setTemplates(result.data)
      }
      setLoadingTemplates(false)
    }
    fetchTemplates()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTemplate) return

    setLoading(true)
    setError(null)

    const result = await addBookToCompany({
      companyId: params.companyId,
      templateId: selectedTemplate,
    })

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      router.push(`/company/${params.companyId}/dashboard`)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl border-border/50 bg-card">
        <CardHeader className="border-b border-border/50 px-8 py-6">
          <div className="mb-4">
            <Link href={`/company/${params.companyId}/dashboard`}>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-foreground">Vincular Caderno</CardTitle>
              <CardDescription className="text-muted-foreground">
                Selecione um template para criar um novo caderno
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          {loadingTemplates ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                <FileText className="h-10 w-10 text-primary" />
              </div>
              <p className="text-xl font-semibold text-foreground">Nenhum template disponível</p>
              <p className="mt-2 text-muted-foreground">Entre em contato com o administrador para criar templates</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <Label className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                  Selecione um Template *
                </Label>
                <div className="grid gap-3">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer border-border/50 transition-all ${
                        selectedTemplate === template.id
                          ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                          : "hover:border-primary/50 hover:bg-secondary/30"
                      }`}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-base font-semibold text-foreground">{template.name}</CardTitle>
                            <CardDescription className="mt-1 text-muted-foreground">
                              {template.description || "Sem descrição"}
                            </CardDescription>
                          </div>
                          {selectedTemplate === template.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
                  <p className="font-medium">Erro ao vincular caderno:</p>
                  <p>{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
                disabled={loading || !selectedTemplate}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Vinculando caderno...
                  </>
                ) : (
                  "Vincular Caderno"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
