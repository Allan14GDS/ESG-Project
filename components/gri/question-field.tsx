"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Button } from "@/components/ui/button"
import { Upload, FileText } from "lucide-react"
import type { GRIQuestion } from "@/lib/gri-questions"

interface QuestionFieldProps {
  question: GRIQuestion
  value: string
  onChange: (value: string) => void
  questionIndex: number
}

export function QuestionField({ question, value, onChange, questionIndex }: QuestionFieldProps) {
  const renderField = () => {
    const tipo = question.tipoResposta.toLowerCase()

    if (tipo.includes("sim") || tipo.includes("não")) {
      return (
        <RadioGroup value={value} onValueChange={onChange}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="sim" id={`q${questionIndex}-sim`} />
              <Label htmlFor={`q${questionIndex}-sim`}>Sim</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nao" id={`q${questionIndex}-nao`} />
              <Label htmlFor={`q${questionIndex}-nao`}>Não</Label>
            </div>
          </div>
        </RadioGroup>
      )
    }

    if (tipo.includes("data")) {
      return <Input type="date" value={value} onChange={(e) => onChange(e.target.value)} className="max-w-xs" />
    }

    if (tipo.includes("número") || tipo.includes("numero")) {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite o número"
          className="max-w-xs"
        />
      )
    }

    if (tipo.includes("%")) {
      return (
        <div className="flex items-center gap-2 max-w-xs">
          <Input
            type="number"
            min="0"
            max="100"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0"
          />
          <span className="text-muted-foreground">%</span>
        </div>
      )
    }

    if (tipo.includes("upload")) {
      return (
        <div className="space-y-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Fazer Upload
          </Button>
          {value && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{value}</span>
            </div>
          )}
        </div>
      )
    }

    // Texto longo
    if (question.pergunta.length > 100 || tipo.includes("descreva") || tipo.includes("liste")) {
      return (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder="Digite sua resposta" rows={4} />
      )
    }

    // Texto curto (padrão)
    return (
      <Input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Digite sua resposta" />
    )
  }

  return <div className="space-y-3">{renderField()}</div>
}
