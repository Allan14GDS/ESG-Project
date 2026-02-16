"use client"

import React, { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  X,
  FileWarning,
  Sparkles,
  Lightbulb,
  Table,
  Plus,
  Trash2,
  BookOpen,
  AlertTriangle,
  ClipboardCheck,
  Info,
} from "lucide-react"
import Papa from "papaparse"
import * as XLSX from "xlsx"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Template {
  id: string
  name: string
}

interface ImportCsvButtonProps {
  allTemplates: Template[]
  templateId?: string // Changed from preSelectedTemplateId to templateId to match usage
  onImportComplete?: () => void
}

type QuestionFieldMappings = {
  linha_coleta: string
  tipo_resposta: string
  evidencia: string
  observacao: string
  position: string // Nova coluna para ordem/posição
}

interface CadernoBinding {
  id: string
  frameworkColumn: string
  cadernoId: string
  subFrameworkColumns: string[]
}

interface ParsedQuestion {
  id: string
  linha_coleta: string
  disclosure: string
  tipo_resposta: string
  evidencias: string
  obs: string
  bindings: {
    templateId: string
    templateName: string
    subCategory: string
    reference: string
  }[]
  selectedTemplates: string[]
  hasConflict?: boolean
  isDuplicate?: boolean
  existingTemplates?: string[]
  duplicateQuestionId?: string
  shouldAddToCurrentTemplates?: boolean
  position?: number // Changed to number for sorting
}

const RESPONSE_TYPE_MAP: { [key: string]: string } = {
  texto: "text",
  text: "text",
  string: "text",
  número: "number",
  numero: "number",
  number: "number",
  decimal: "number",
  percentual: "percentage",
  porcentagem: "percentage",
  percent: "percentage",
  "%": "percentage",
  moeda: "currency",
  currency: "currency",
  monetário: "currency",
  monetario: "currency",
  data: "date",
  date: "date",
  sim_nao: "yes_no",
  simnao: "yes_no",
  yes_no: "yes_no",
  boolean: "yes_no",
}

function normalizeResponseType(value: string): string {
  if (!value) return "text"
  const normalized = value.toLowerCase().trim()
  return RESPONSE_TYPE_MAP[normalized] || "text"
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15)
}

export const ImportCsvButton = React.memo(function ImportCsvButton({
  allTemplates,
  templateId, // Changed from preSelectedTemplateId to templateId
  onImportComplete,
}: ImportCsvButtonProps) {
  const [open, setOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [file, setFile] = useState<File | null>(null)
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvData, setCsvData] = useState<any[]>([])
  const [parseError, setParseError] = useState<string | null>(null)

  // Initialize position in questionMappings
  const [questionMappings, setQuestionMappings] = useState<QuestionFieldMappings>({
    linha_coleta: "",
    tipo_resposta: "",
    evidencia: "",
    observacao: "",
    position: "", // Adiciona campo position
  })
  const [cadernoBindings, setCadernoBindings] = useState<CadernoBinding[]>([])

  const [processedQuestions, setProcessedQuestions] = useState<ParsedQuestion[]>([])
  const [showOnlyWarnings, setShowOnlyWarnings] = useState(false)

  const [newQuestions, setNewQuestions] = useState<ParsedQuestion[]>([])
  const [duplicateQuestions, setDuplicateQuestions] = useState<ParsedQuestion[]>([])

  const [importResults, setImportResults] = useState<{
    created: number
    linkedUpdated: number
    errors: number
    errorMessages: string[]
    technicalErrors: Array<{ question: string; error: string; details: any }>
  } | null>(null)

  const [technicalErrorLog, setTechnicalErrorLog] = useState<string>("")

  const resetState = () => {
    setCurrentStep(1)
    setFile(null)
    setCsvHeaders([])
    setCsvData([])
    setParseError(null)
    setQuestionMappings({
      linha_coleta: "",
      tipo_resposta: "",
      evidencia: "",
      observacao: "",
      position: "", // Reset position
    })
    setCadernoBindings([]) // Reset bindings when closing dialog
    setProcessedQuestions([])
    setDuplicateQuestions([])
    setNewQuestions([])
    setImportResults(null)
    setTechnicalErrorLog("")
  }

  React.useEffect(() => {
    if (open && templateId && cadernoBindings.length === 0 && allTemplates && Array.isArray(allTemplates)) {
      const currentTemplate = allTemplates.find((t) => t.id === templateId)
      if (currentTemplate) {
        console.log("[v0] Auto-selecting current template:", currentTemplate.name)
        setCadernoBindings([
          {
            id: generateId(),
            frameworkColumn: "",
            cadernoId: templateId,
            subFrameworkColumns: [],
          },
        ])
      }
    }
  }, [open, templateId, cadernoBindings.length, allTemplates])

  const handleFileUpload = useCallback((uploadedFile: File) => {
    setIsLoading(true)
    setParseError(null)

    const isExcel = uploadedFile.name.endsWith(".xlsx") || uploadedFile.name.endsWith(".xls")

    if (isExcel) {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: "binary" })

          // Get first sheet
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]

          // Convert to CSV string
          const csvString = XLSX.utils.sheet_to_csv(worksheet)

          // Now parse the CSV string using Papa Parse (same flow as CSV files)
          Papa.parse(csvString, {
            header: true,
            skipEmptyLines: true,
            encoding: "UTF-8",
            dynamicTyping: false,
            transform: (value) => (typeof value === "string" ? value.trim() : value),
            complete: (results) => {
              if (results.errors.length > 0) {
                console.error("[v0] Excel parsing errors:", results.errors)
                setParseError(`Erro ao processar Excel: ${results.errors[0].message}`)
                setIsLoading(false)
                return
              }

              const headers = results.meta.fields || []
              const parsedData = results.data

              if (headers.length === 0 || parsedData.length === 0) {
                setParseError("Arquivo Excel vazio ou sem cabeçalhos válidos.")
                setIsLoading(false)
                return
              }

              setCsvHeaders(headers)
              setCsvData(parsedData)
              setFile(uploadedFile)

              // Auto-map common columns (same logic as CSV)
              autoMapColumns(headers)

              setIsLoading(false)
              setCurrentStep(2)
            },
          })
        } catch (error) {
          console.error("[v0] Error reading Excel file:", error)
          setParseError(`Erro ao ler arquivo Excel: ${error instanceof Error ? error.message : "Erro desconhecido"}`)
          setIsLoading(false)
        }
      }

      reader.onerror = () => {
        setParseError("Erro ao ler o arquivo Excel.")
        setIsLoading(false)
      }

      reader.readAsBinaryString(uploadedFile)
    } else {
      // CSV file - existing flow
      Papa.parse(uploadedFile, {
        header: true,
        skipEmptyLines: true,
        encoding: "UTF-8",
        dynamicTyping: false,
        transform: (value) => (typeof value === "string" ? value.trim() : value),
        delimitersToGuess: [",", ";", "\t", "|"],
        complete: (results) => {
          if (results.errors.length > 0) {
            console.error("[v0] CSV parsing errors:", results.errors)
            setParseError(`Erro ao processar CSV: ${results.errors[0].message}`)
            setIsLoading(false)
            return
          }

          const headers = results.meta.fields || []
          const parsedData = results.data

          if (headers.length === 0 || parsedData.length === 0) {
            setParseError("Arquivo CSV vazio ou sem cabeçalhos válidos.")
            setIsLoading(false)
            return
          }

          setCsvHeaders(headers)
          setCsvData(parsedData)
          setFile(uploadedFile)

          // Auto-map common columns
          autoMapColumns(headers)

          setIsLoading(false)
          setCurrentStep(2)
        },
        error: (error) => {
          console.error("[v0] Papa Parse error:", error)
          setParseError(`Erro ao processar arquivo: ${error.message}`)
          setIsLoading(false)
        },
      })
    }
  }, [])

  const autoMapColumns = (headers: string[]) => {
    const newMappings: QuestionFieldMappings = {
      linha_coleta: "",
      tipo_resposta: "",
      evidencia: "",
      observacao: "",
      position: "", // Initialize position mapping
      framework_1: "",
      sub_framework_1: "",
      framework_2: "",
      sub_framework_2: "",
    }

    headers.forEach((header) => {
      const lower = header.toLowerCase()
      if (
        lower.includes("linha") ||
        lower.includes("coleta") ||
        lower.includes("atomizada") ||
        lower.includes("pergunta") ||
        lower.includes("métrica") ||
        lower.includes("metrica")
      ) {
        if (!newMappings.linha_coleta) newMappings.linha_coleta = header
      } else if (
        lower.includes("tipo") ||
        lower.includes("resposta") ||
        lower.includes("type") ||
        lower.includes("input")
      ) {
        if (!newMappings.tipo_resposta) newMappings.tipo_resposta = header
      } else if (lower.includes("evidencia") || lower.includes("evidências") || lower.includes("documento")) {
        if (!newMappings.evidencia) newMappings.evidencia = header
      } else if (
        lower.includes("obs") ||
        lower.includes("não aplicável") ||
        lower.includes("nao aplicavel") ||
        lower.includes("justificativa")
      ) {
        if (!newMappings.observacao) newMappings.observacao = header
      } else if (
        lower.includes("ordem") ||
        lower.includes("posição") ||
        lower.includes("posicao") ||
        lower.includes("position") ||
        lower.includes("número") ||
        lower.includes("numero") ||
        lower === "#"
      ) {
        if (!newMappings.position) newMappings.position = header
      } else if (lower.includes("framework") && (lower.includes("1") || lower.includes("one")) && !lower.includes("sub")) {
        if (!newMappings.framework_1) newMappings.framework_1 = header
      } else if (lower.includes("sub") && lower.includes("framework") && (lower.includes("1") || lower.includes("one"))) {
        if (!newMappings.sub_framework_1) newMappings.sub_framework_1 = header
      } else if (lower.includes("framework") && (lower.includes("2") || lower.includes("two")) && !lower.includes("sub")) {
        if (!newMappings.framework_2) newMappings.framework_2 = header
      } else if (lower.includes("sub") && lower.includes("framework") && (lower.includes("2") || lower.includes("two"))) {
        if (!newMappings.sub_framework_2) newMappings.sub_framework_2 = header
      }
    })

    setQuestionMappings(newMappings)

    // Auto-add binding if preSelectedTemplateId exists
    if (templateId && cadernoBindings.length === 0) {
      const disclosureColumn = headers.find(
        (h) =>
          h.toLowerCase().includes("disclosure") ||
          h.toLowerCase().includes("gri") ||
          h.toLowerCase().includes("referência") ||
          h.toLowerCase().includes("referencia"),
      )

      if (disclosureColumn) {
        setCadernoBindings([
          {
            id: generateId(),
            frameworkColumn: disclosureColumn,
            cadernoId: templateId,
            subFrameworkColumns: [],
          },
        ])
      }
    }
  }

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const droppedFile = e.dataTransfer.files[0]
      if (
        droppedFile &&
        (droppedFile.type === "text/csv" ||
          droppedFile.name.endsWith(".csv") ||
          droppedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
          droppedFile.type === "application/vnd.ms-excel" ||
          droppedFile.name.endsWith(".xlsx") ||
          droppedFile.name.endsWith(".xls"))
      ) {
        handleFileUpload(droppedFile)
      } else {
        setParseError("Por favor, envie um arquivo CSV ou Excel (.xlsx, .xls) válido.")
      }
    },
    [handleFileUpload],
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        handleFileUpload(selectedFile)
      }
    },
    [handleFileUpload],
  )

  const addCadernoBinding = () => {
    setCadernoBindings((prev) => [
      ...prev,
      {
        id: generateId(),
        frameworkColumn: "",
        cadernoId: templateId || "",
        subFrameworkColumns: [],
      },
    ])
  }

  const removeCadernoBinding = (bindingId: string) => {
    setCadernoBindings((prev) => prev.filter((b) => b.id !== bindingId))
  }

  const updateCadernoBinding = (bindingId: string, field: keyof CadernoBinding, value: any) => {
    setCadernoBindings((prev) => prev.map((b) => (b.id === bindingId ? { ...b, [field]: value } : b)))
  }

  const addSubFrameworkColumn = (bindingId: string) => {
    setCadernoBindings((prev) =>
      prev.map((b) => (b.id === bindingId ? { ...b, subFrameworkColumns: [...b.subFrameworkColumns, ""] } : b)),
    )
  }

  const updateSubFrameworkColumn = (bindingId: string, index: number, value: string) => {
    setCadernoBindings((prev) =>
      prev.map((b) => {
        if (b.id !== bindingId) return b
        const newSubs = [...b.subFrameworkColumns]
        newSubs[index] = value
        return { ...b, subFrameworkColumns: newSubs }
      }),
    )
  }

  const removeSubFrameworkColumn = (bindingId: string, index: number) => {
    setCadernoBindings((prev) =>
      prev.map((b) => {
        if (b.id !== bindingId) return b
        const newSubs = b.subFrameworkColumns.filter((_, i) => i !== index)
        return { ...b, subFrameworkColumns: newSubs }
      }),
    )
  }

  const processQuestions = useCallback(() => {
    setIsLoading(true)
    const processed: ParsedQuestion[] = []
    const seen = new Map<string, ParsedQuestion>()

    console.log("[v0] processQuestions - allTemplates:", allTemplates)
    console.log("[v0] processQuestions - allTemplates type:", typeof allTemplates)
    console.log("[v0] processQuestions - allTemplates isArray:", Array.isArray(allTemplates))

    if (!allTemplates || !Array.isArray(allTemplates) || allTemplates.length === 0) {
      console.error("[v0] processQuestions - No templates available!")
      setParseError("Nenhum caderno disponível. Por favor, crie um caderno primeiro.")
      setIsLoading(false)
      return
    }

    const templates = [...allTemplates]
    console.log("[v0] processQuestions - Using templates:", templates.length)

    csvData.forEach((row: any, index) => {
      const linhaColeta = questionMappings.linha_coleta ? row[questionMappings.linha_coleta]?.trim() : ""
      if (!linhaColeta) return

      const tipoResposta = normalizeResponseType(
        questionMappings.tipo_resposta ? row[questionMappings.tipo_resposta]?.trim() : "text",
      )
      const evidencias = questionMappings.evidencia ? row[questionMappings.evidencia]?.trim() : ""
      const obs = questionMappings.observacao ? row[questionMappings.observacao]?.trim() : ""

      let position: number | undefined
      if (questionMappings.position && row[questionMappings.position]) {
        const posValue = String(row[questionMappings.position]).trim()
        // Remove # and any non-numeric characters, then parse
        const numericValue = posValue.replace(/[^0-9]/g, "")
        if (numericValue) {
          position = Number.parseInt(numericValue, 10)
        }
      }

      const bindings: ParsedQuestion["bindings"] = []
      let disclosure = ""

      cadernoBindings.forEach((binding) => {
        if (!binding.cadernoId) return

        const template = templates.find((t) => t.id === binding.cadernoId)
        if (!template) {
          console.warn("[v0] processQuestions - Template not found for binding:", binding.cadernoId)
          return
        }

        const frameworkValue = binding.frameworkColumn ? row[binding.frameworkColumn]?.toString().trim() || "" : ""
        if (!disclosure && frameworkValue) {
          disclosure = frameworkValue
        }

        const subCategoryParts: string[] = []
        binding.subFrameworkColumns.forEach((subCol) => {
          if (subCol && row[subCol]) {
            subCategoryParts.push(row[subCol].toString().trim())
          }
        })
        const subCategory = subCategoryParts.join(" > ")

        bindings.push({
          templateId: binding.cadernoId,
          templateName: template.name,
          subCategory,
          reference: frameworkValue,
        })
      })

      const key = linhaColeta.toLowerCase().trim()

      if (seen.has(key)) {
        const existing = seen.get(key)!
        bindings.forEach((b) => {
          if (!existing.bindings.find((eb) => eb.templateId === b.templateId)) {
            existing.bindings.push(b)
          }
        })
        const uniqueTemplateIds = Array.from(new Set(existing.bindings.map((b) => b.templateId)))
        existing.selectedTemplates = uniqueTemplateIds
        // Preserve position if already set, otherwise use new one
        if (existing.position === undefined && position !== undefined) {
          existing.position = position
        }
      } else {
        const question: ParsedQuestion = {
          id: generateId(),
          linha_coleta: linhaColeta,
          disclosure,
          tipo_resposta: tipoResposta,
          evidencias,
          obs,
          bindings,
          selectedTemplates: Array.from(new Set(bindings.map((b) => b.templateId))),
          // Add position to new questions
          position,
        }
        seen.set(key, question)
        processed.push(question)
      }
    })

    // Sort questions by position if available
    processed.sort((a, b) => {
      const posA = a.position
      const posB = b.position

      if (posA !== undefined && posB !== undefined) {
        return posA - posB
      }
      // If positions are not numbers or missing, maintain original order or sort by linha_coleta
      if (posA !== undefined && posB === undefined) return -1
      if (posA === undefined && posB !== undefined) return 1
      return a.linha_coleta.localeCompare(b.linha_coleta)
    })

    console.log("[v0] processQuestions - Processed questions:", processed.length)
    setProcessedQuestions(processed)
    setIsLoading(false)
    setCurrentStep(3)
  }, [csvData, questionMappings, cadernoBindings, allTemplates])

  const updateQuestion = (questionId: string, field: keyof ParsedQuestion, value: any) => {
    setProcessedQuestions((prev) => prev.map((q) => (q.id === questionId ? { ...q, [field]: value } : q)))
  }

  const checkForDuplicates = async () => {
    setIsSaving(true)
    setParseError(null)

    const duplicates: ParsedQuestion[] = []
    const newOnes: ParsedQuestion[] = []

    try {
      const generateUniqueIdentifier = (text: string): string => {
        return text
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "")
      }

      // 1. Generate all identifiers and create a lookup
      const idToQuestionMap = new Map<string, ParsedQuestion>()
      const allIdentifiers: string[] = []

      processedQuestions.forEach((question) => {
        const uid = generateUniqueIdentifier(question.linha_coleta)
        idToQuestionMap.set(uid, question)
        allIdentifiers.push(uid)
      })

      // 2. Bulk check (chunked to avoid huge payloads)
      const chunkSize = 500
      const allDuplicateResults: Record<string, any> = {}

      for (let i = 0; i < allIdentifiers.length; i += chunkSize) {
        const chunk = allIdentifiers.slice(i, i + chunkSize)
        console.log(`[v0] Checking duplicates bulk: chunk ${i / chunkSize + 1} of ${Math.ceil(allIdentifiers.length / chunkSize)}`)

        const response = await fetch("/api/questions/check-duplicate-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unique_identifiers: chunk }),
        })

        if (response.ok) {
          const data = await response.json()
          Object.assign(allDuplicateResults, data.duplicates || {})
        } else {
          console.error("[v0] Bulk check failed for chunk starting at", i)
          // On failure of a chunk, those will be treated as non-duplicates (safer than crashing)
        }
      }

      // 3. Process results into separate lists
      processedQuestions.forEach((question) => {
        const uid = generateUniqueIdentifier(question.linha_coleta)
        const dupData = allDuplicateResults[uid]

        if (dupData && dupData.isDuplicate) {
          duplicates.push({
            ...question,
            isDuplicate: true,
            existingTemplates: dupData.existingTemplates,
            duplicateQuestionId: dupData.questionId,
            shouldAddToCurrentTemplates: true,
          })
        } else {
          newOnes.push({
            ...question,
            isDuplicate: false,
            shouldAddToCurrentTemplates: true,
          })
        }
      })

      setNewQuestions(newOnes)
      setDuplicateQuestions(duplicates)
      setCurrentStep(4)
    } catch (error) {
      console.error("[v0] Error in checkForDuplicates:", error)
      setParseError("Erro ao verificar questões duplicadas. Tente novamente.")
    } finally {
      setIsSaving(false)
    }
  }

  const toggleDuplicateSelection = (questionId: string, checked: boolean) => {
    setDuplicateQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, shouldAddToCurrentTemplates: checked } : q)),
    )
  }

  const toggleAllDuplicates = (checked: boolean) => {
    setDuplicateQuestions((prev) =>
      prev.map((q) => ({
        ...q,
        shouldAddToCurrentTemplates: checked,
      })),
    )
  }

  const handleImport = async () => {
    setIsSaving(true)
    const results = {
      created: 0,
      linkedUpdated: 0,
      errors: 0,
      errorMessages: [] as string[],
      technicalErrors: [] as Array<{ question: string; error: string; details: any }>,
    }

    const basePositions: Record<string, number> = {}

    // 1. Get max position for each template that will receive questions
    const allTemplateIds = new Set<string>()
    newQuestions.forEach((q) => q.selectedTemplates.forEach((t) => allTemplateIds.add(t)))
    duplicateQuestions
      .filter((q) => q.shouldAddToCurrentTemplates)
      .forEach((q) => q.selectedTemplates.forEach((t) => allTemplateIds.add(t)))

    console.log("[v0] handleImport - Fetching max positions for templates:", Array.from(allTemplateIds))

    for (const templateId of Array.from(allTemplateIds)) {
      try {
        const response = await fetch(`/api/templates/${templateId}/max-position`)
        if (response.ok) {
          const data = await response.json()
          basePositions[templateId] = data.maxPosition || 0
        } else {
          basePositions[templateId] = 0
        }
      } catch (error) {
        console.error("[v0] Error fetching max position for template:", templateId)
        basePositions[templateId] = 0
      }
    }

    // 2. Combine all questions to be imported
    const questionsToCreate = newQuestions.map(q => ({ ...q, is_new: true }))
    const duplicatesToLink = duplicateQuestions.filter(q => q.shouldAddToCurrentTemplates).map(q => ({ ...q, is_new: false }))
    const allToImport = [...questionsToCreate, ...duplicatesToLink]

    console.log(`[v0] handleImport - Starting bulk import of ${allToImport.length} questions`)

    // 3. Process in chunks
    const chunkSize = 200
    for (let i = 0; i < allToImport.length; i += chunkSize) {
      const chunk = allToImport.slice(i, i + chunkSize)
      console.log(`[v0] handleImport - Processing chunk ${Math.floor(i / chunkSize) + 1} of ${Math.ceil(allToImport.length / chunkSize)}`)

      const payload = chunk.map(q => {
        const subFrameworks: { [templateId: string]: string[] } = {}
        const frameworkData: { framework: string; sub: string }[] = []

        q.bindings.forEach((binding) => {
          if (binding.subCategory) {
            const subs = binding.subCategory.split(" > ").filter((s) => s.trim())
            if (subs.length > 0) {
              subFrameworks[binding.templateId] = subs
            }
          }

          const templateName = allTemplates.find((t) => t.id === binding.templateId)?.name || ""
          const subValue = binding.subCategory || ""

          if (templateName) {
            frameworkData.push({
              framework: templateName,
              sub: subValue
            })
          }
        })

        const adjustedPosition = q.position || 0
        const positionsByTemplate: Record<string, number> = {}
        q.selectedTemplates.forEach((templateId) => {
          positionsByTemplate[templateId] = basePositions[templateId] + adjustedPosition
        })

        return {
          linha_coleta: q.linha_coleta,
          tipo_resposta: q.tipo_resposta,
          evidencias: q.evidencias || "",
          obs: q.obs || "",
          framework_1: frameworkData[0]?.framework || "",
          sub_framework_1: frameworkData[0]?.sub || "",
          framework_2: frameworkData[1]?.framework || "",
          sub_framework_2: frameworkData[1]?.sub || "",
          templateIds: q.selectedTemplates,
          subFrameworks,
          position: adjustedPosition,
          positionsByTemplate,
        }
      })

      try {
        const response = await fetch("/api/questions/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ questions: payload }),
        })

        if (response.ok) {
          const data = await response.json()
          // We count new vs linked separately based on our chunk composition
          const newInChunk = chunk.filter(q => q.is_new).length
          const dupsInChunk = chunk.filter(q => !q.is_new).length
          results.created += newInChunk
          results.linkedUpdated += dupsInChunk
        } else {
          const errorData = await response.json().catch(() => ({}))
          results.errors += chunk.length
          results.errorMessages.push(`Erro no lote ${Math.floor(i / chunkSize) + 1}: ${errorData.error || "Erro desconhecido"}`)
          results.technicalErrors.push({
            question: `Lote ${Math.floor(i / chunkSize) + 1}`,
            error: errorData.error || "Batch failed",
            details: errorData,
          })
        }
      } catch (error) {
        results.errors += chunk.length
        results.errorMessages.push(`Erro de conexão no lote ${Math.floor(i / chunkSize) + 1}`)
      }
    }

    if (results.technicalErrors.length > 0) {
      const logEntries = results.technicalErrors.map(
        (err, idx) => `
Batch Error ${idx + 1}:
Info: ${err.question}
Error: ${err.error}
Details: ${JSON.stringify(err.details, null, 2)}
`,
      )
      setTechnicalErrorLog(logEntries.join("\n---\n"))
    }

    setImportResults(results)
    setCurrentStep(5)
    setIsSaving(false)

    if (onImportComplete && (results.created > 0 || results.linkedUpdated > 0)) {
      setTimeout(() => {
        onImportComplete()
      }, 1500)
    }
  }

  const resetForm = useCallback(() => {
    resetState()
    if (onImportComplete) {
      onImportComplete()
    }
    setOpen(false)
  }, [onImportComplete])

  const canProceedToStep3 = questionMappings.linha_coleta !== ""

  const steps = [
    { id: 1, label: "Upload", icon: Upload },
    { id: 2, label: "Mapeamento", icon: Table },
    { id: 3, label: "Revisão", icon: CheckCircle2 },
    { id: 4, label: "Conferência", icon: ClipboardCheck },
    { id: 5, label: "Resultado", icon: Sparkles },
  ]

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        setOpen(newOpen)
        if (!newOpen) resetState()
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <Upload className="h-4 w-4" />
          Importar CSV/Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Matriz CSV/Excel
          </DialogTitle>
          <DialogDescription>
            {templateId // Changed from preSelectedTemplateId to templateId
              ? "Importe questões de uma planilha CSV ou Excel para este caderno"
              : "Importe questões de uma planilha CSV ou Excel e mapeie para os cadernos do sistema"}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-0 px-6 pb-6 border-b">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${currentStep >= step.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                >
                  <step.icon className="h-5 w-5" />
                </div>
                <span
                  className={`text-xs font-medium ${currentStep >= step.id ? "text-primary" : "text-muted-foreground"}`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${currentStep > step.id ? "bg-primary" : "bg-muted-foreground/30"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <Card>
              <CardContent className="pt-6">
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => document.getElementById("file-input")?.click()}
                >
                  <input
                    id="file-input"
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  {isLoading ? (
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-sm text-muted-foreground">Processando arquivo...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      <FileSpreadsheet className="h-12 w-12 text-muted-foreground" />
                      <div>
                        <p className="text-lg font-medium">Arraste um arquivo CSV ou Excel aqui</p>
                        <p className="text-sm text-muted-foreground mt-1">ou clique para selecionar</p>
                        <p className="text-xs text-muted-foreground mt-2">Formatos aceitos: .csv, .xlsx, .xls</p>
                      </div>
                    </div>
                  )}

                  {parseError && (
                    <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {parseError}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Mapping */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {(questionMappings.linha_coleta || questionMappings.tipo_resposta) && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Detectamos alguns campos automaticamente</p>
                    <p className="text-xs text-muted-foreground">Verifique as atribuições e ajuste se necessário</p>
                  </div>
                </div>
              )}

              {/* Block A: Question Field Mappings */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Table className="h-4 w-4" />
                    A. Mapeamento dos Campos da Questão
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Vincule as colunas do CSV/Excel aos campos de questões da plataforma
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Linha de Coleta (Pergunta) <span className="text-destructive">*</span>
                      </Label>
                      <Select
                        value={questionMappings.linha_coleta || "none"}
                        onValueChange={(v) =>
                          setQuestionMappings((prev) => ({ ...prev, linha_coleta: v === "none" ? "" : v }))
                        }
                      >
                        <SelectTrigger className={!questionMappings.linha_coleta ? "border-destructive" : ""}>
                          <SelectValue placeholder="Selecione a coluna..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Selecione...</SelectItem>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Tipo de Resposta</Label>
                      <Select
                        value={questionMappings.tipo_resposta || "none"}
                        onValueChange={(v) =>
                          setQuestionMappings((prev) => ({ ...prev, tipo_resposta: v === "none" ? "" : v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a coluna..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum (usar Texto padrão)</SelectItem>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Evidência</Label>
                      <Select
                        value={questionMappings.evidencia || "none"}
                        onValueChange={(v) =>
                          setQuestionMappings((prev) => ({ ...prev, evidencia: v === "none" ? "" : v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a coluna..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Observação (Justificativa N.A.)</Label>
                      <Select
                        value={questionMappings.observacao || "none"}
                        onValueChange={(v) =>
                          setQuestionMappings((prev) => ({ ...prev, observacao: v === "none" ? "" : v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a coluna..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Add input for "position" column mapping */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Ordem/Posição</Label>
                      <Select
                        value={questionMappings.position || "none"}
                        onValueChange={(v) =>
                          setQuestionMappings((prev) => ({ ...prev, position: v === "none" ? "" : v }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a coluna..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {csvHeaders.map((header) => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Block B: Caderno Bindings */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-4 w-4" />
                        B. Vínculos com Cadernos (Frameworks)
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {templateId // Changed from preSelectedTemplateId to templateId
                          ? "Vincule múltiplas colunas do CSV/Excel (frameworks) ao caderno atual"
                          : "Adicione blocos para vincular colunas do CSV/Excel aos cadernos da plataforma"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addCadernoBinding} className="gap-1 bg-transparent">
                      <Plus className="h-4 w-4" />
                      {templateId // Changed from preSelectedTemplateId to templateId
                        ? "Adicionar Framework do CSV/Excel"
                        : "Adicionar Caderno"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cadernoBindings.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum caderno vinculado</p>
                      <p className="text-xs">
                        {templateId // Changed from preSelectedTemplateId to templateId
                          ? 'Clique em "Adicionar Framework do CSV/Excel" para vincular colunas do arquivo'
                          : 'Clique em "Adicionar Caderno" para criar um vínculo'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cadernoBindings.map((binding, index) => {
                        const selectedTemplate =
                          allTemplates && Array.isArray(allTemplates)
                            ? allTemplates.find((t) => t.id === binding.cadernoId)
                            : null

                        return (
                          <Card key={binding.id} className="border-primary/20 bg-primary/5">
                            <CardContent className="p-4 space-y-4">
                              <div className="flex items-start justify-between">
                                <Badge variant="outline" className="text-xs">
                                  {templateId // Changed from preSelectedTemplateId to templateId
                                    ? `Framework ${index + 1}`
                                    : `Caderno ${index + 1}`}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive hover:text-destructive"
                                  onClick={() => removeCadernoBinding(binding.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Coluna do Framework (Referência/Disclosure)
                                  </Label>
                                  <Select
                                    value={binding.frameworkColumn || "none"}
                                    onValueChange={(v) =>
                                      updateCadernoBinding(binding.id, "frameworkColumn", v === "none" ? "" : v)
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione a coluna..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Selecione...</SelectItem>
                                      {csvHeaders.map((header) => (
                                        <SelectItem key={header} value={header}>
                                          {header}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">Caderno da Plataforma</Label>
                                  {templateId ? ( // Changed from preSelectedTemplateId to templateId
                                    <div className="flex items-center gap-2 h-10 px-3 py-2 border rounded-md bg-muted">
                                      <BookOpen className="h-4 w-4 text-primary" />
                                      <span className="text-sm font-medium">
                                        {selectedTemplate?.name || "Caderno Atual"}
                                      </span>
                                      <Badge variant="secondary" className="ml-auto text-xs">
                                        Fixado
                                      </Badge>
                                    </div>
                                  ) : (
                                    <Select
                                      value={binding.cadernoId || "none"}
                                      onValueChange={(v) =>
                                        updateCadernoBinding(binding.id, "cadernoId", v === "none" ? "" : v)
                                      }
                                    >
                                      <SelectTrigger
                                        className={
                                          !binding.cadernoId && binding.frameworkColumn ? "border-amber-400" : ""
                                        }
                                      >
                                        <SelectValue placeholder="Selecione o caderno..." />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">Selecione...</SelectItem>
                                        {allTemplates &&
                                          Array.isArray(allTemplates) &&
                                          allTemplates.map((template) => (
                                            <SelectItem key={template.id} value={template.id}>
                                              {template.name}
                                            </SelectItem>
                                          ))}
                                      </SelectContent>
                                    </Select>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-muted-foreground">
                                    Sub-categorias / Sub-frameworks (opcional)
                                  </Label>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => addSubFrameworkColumn(binding.id)}
                                  >
                                    <Plus className="h-3 w-3" />
                                    Adicionar Sub-categoria
                                  </Button>
                                </div>

                                {binding.subFrameworkColumns.length > 0 && (
                                  <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                                    {binding.subFrameworkColumns.map((subCol, subIndex) => (
                                      <div key={subIndex} className="flex items-center gap-2">
                                        <Select
                                          value={subCol || "none"}
                                          onValueChange={(v) =>
                                            updateSubFrameworkColumn(binding.id, subIndex, v === "none" ? "" : v)
                                          }
                                        >
                                          <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Coluna sub-categoria..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">Selecione...</SelectItem>
                                            {csvHeaders.map((header) => (
                                              <SelectItem key={header} value={header}>
                                                {header}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                          onClick={() => removeSubFrameworkColumn(binding.id, subIndex)}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {selectedTemplate && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                                  Vinculado ao caderno: <strong>{selectedTemplate.name}</strong>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {!canProceedToStep3 && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">Selecione a coluna para &quot;Linha de Coleta (Pergunta)&quot;</span>
                </div>
              )}

              {parseError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{parseError}</span>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <Button onClick={processQuestions} disabled={!canProceedToStep3 || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Processar e Revisar
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-card border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-foreground">{processedQuestions.length}</p>
                    <p className="text-sm text-muted-foreground">Questões Únicas</p>
                  </CardContent>
                </Card>

                <Card
                  className={`${processedQuestions.filter((q) => q.hasConflict || q.bindings.some((b) => !b.subCategory)).length > 0 ? "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800" : "bg-card border-border"}`}
                >
                  <CardContent className="p-4 text-center">
                    <p
                      className={`text-3xl font-bold ${processedQuestions.filter((q) => q.hasConflict || q.bindings.some((b) => !b.subCategory)).length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}
                    >
                      {processedQuestions.filter((q) => q.hasConflict || q.bindings.some((b) => !b.subCategory)).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Conflitos/Avisos</p>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {processedQuestions.reduce((acc, q) => acc + q.selectedTemplates.length, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Vínculos a Criar</p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Revisão de Questões</h3>
                  <p className="text-sm text-muted-foreground">Verifique os dados e edite se necessário</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showOnlyWarnings ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowOnlyWarnings(!showOnlyWarnings)}
                    className="gap-2"
                  >
                    <FileWarning className="h-4 w-4" />
                    {showOnlyWarnings ? "Mostrando avisos" : "Mostrar apenas avisos"}
                  </Button>
                </div>
              </div>

              <TooltipProvider>
                <div className="border rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Questão (Métrica)</th>
                        <th className="px-4 py-3 text-left font-medium w-36">Tipo de Resposta</th>
                        <th className="px-4 py-3 text-left font-medium">Cadernos Vinculados</th>
                        <th className="px-4 py-3 text-center font-medium w-24">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {processedQuestions
                        .filter((q) => !showOnlyWarnings || q.hasConflict || q.bindings.some((b) => !b.subCategory))
                        .map((question) => {
                          const hasWarning = question.hasConflict || question.bindings.some((b) => !b.subCategory)
                          const hasNoBindings = question.selectedTemplates.length === 0

                          return (
                            <tr
                              key={question.id}
                              className={`
                              ${question.hasConflict ? "bg-red-50 dark:bg-red-950/20" : ""}
                              ${hasWarning && !question.hasConflict ? "bg-amber-50 dark:bg-amber-950/20" : ""}
                              hover:bg-muted/50 transition-colors
                            `}
                            >
                              <td className="px-4 py-3">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <p className="text-sm text-foreground line-clamp-2 cursor-help">
                                      {question.linha_coleta.length > 80
                                        ? `${question.linha_coleta.substring(0, 80)}...`
                                        : question.linha_coleta}
                                    </p>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-md">
                                    <p>{question.linha_coleta}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </td>

                              <td className="px-4 py-3">
                                <Select
                                  value={question.tipo_resposta}
                                  onValueChange={(value) => updateQuestion(question.id, "tipo_resposta", value)}
                                >
                                  <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Texto</SelectItem>
                                    <SelectItem value="number">Número</SelectItem>
                                    <SelectItem value="percentage">Percentual</SelectItem>
                                    <SelectItem value="currency">Moeda</SelectItem>
                                    <SelectItem value="date">Data</SelectItem>
                                    <SelectItem value="yes_no">Sim/Não</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-1.5">
                                  {question.bindings.length > 0 ? (
                                    question.bindings.map((binding, idx) => {
                                      const colorClasses = [
                                        "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800",
                                        "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800",
                                        "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 border-purple-200 dark:border-purple-800",
                                        "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300 border-orange-200 dark:border-orange-800",
                                        "bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300 border-pink-200 dark:border-pink-800",
                                      ]
                                      const colorClass = colorClasses[idx % colorClasses.length]
                                      const hasEmptySubCategory = !binding.subCategory

                                      return (
                                        <Tooltip key={`${binding.templateId}-${idx}`}>
                                          <TooltipTrigger asChild>
                                            <Badge
                                              variant="outline"
                                              className={`text-xs px-2 py-1 border cursor-help ${hasEmptySubCategory ? "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300 dark:border-amber-700" : colorClass}`}
                                            >
                                              <span className="font-semibold">{binding.templateName}</span>
                                              {binding.subCategory || binding.reference ? (
                                                <span className="ml-1 opacity-80">
                                                  :{" "}
                                                  {binding.subCategory && binding.reference
                                                    ? `${binding.subCategory} > ${binding.reference}`
                                                    : binding.subCategory || binding.reference}
                                                </span>
                                              ) : (
                                                <span className="ml-1 text-amber-600 dark:text-amber-400">⚠</span>
                                              )}
                                            </Badge>
                                          </TooltipTrigger>
                                          <TooltipContent>
                                            <p className="font-medium">{binding.templateName}</p>
                                            {binding.subCategory && <p>Sub-categoria: {binding.subCategory}</p>}
                                            {binding.reference && <p>Referência: {binding.reference}</p>}
                                            {hasEmptySubCategory && (
                                              <p className="text-amber-500">Sem sub-categoria definida</p>
                                            )}
                                          </TooltipContent>
                                        </Tooltip>
                                      )
                                    })
                                  ) : hasNoBindings ? (
                                    <span className="text-xs text-muted-foreground italic">Nenhum caderno vinculado</span>
                                  ) : null}
                                </div>
                              </td>

                              <td className="px-4 py-3 text-center">
                                {question.hasConflict ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300 border-red-300 dark:border-red-700"
                                  >
                                    Conflito
                                  </Badge>
                                ) : hasWarning ? (
                                  <Badge
                                    variant="outline"
                                    className="bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300 dark:border-amber-700"
                                  >
                                    Revisar
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 border-green-300 dark:border-green-700"
                                  >
                                    OK
                                  </Badge>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                    </tbody>
                  </table>
                </div>
              </TooltipProvider>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(2)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <Button onClick={checkForDuplicates} disabled={isSaving || processedQuestions.length === 0}>
                  {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Continuar para Conferência
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Conference */}
          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{newQuestions.length}</p>
                    <p className="text-sm text-muted-foreground">Questões Novas</p>
                    <p className="text-xs text-green-600">Serão criadas</p>
                  </CardContent>
                </Card>

                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">{duplicateQuestions.length}</p>
                    <p className="text-sm text-muted-foreground">Questões Existentes</p>
                    <p className="text-xs text-amber-600">Já estão no sistema</p>
                  </CardContent>
                </Card>

                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {newQuestions.length + duplicateQuestions.filter((q) => q.shouldAddToCurrentTemplates).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Total a Importar</p>
                  </CardContent>
                </Card>
              </div>

              {newQuestions.length > 0 && (
                <Card className="border-green-200 dark:border-green-800">
                  <CardHeader className="pb-3 bg-green-50 dark:bg-green-950/30">
                    <CardTitle className="text-base flex items-center gap-2 text-green-700 dark:text-green-400">
                      <Plus className="h-4 w-4" />
                      {newQuestions.length} Questões Novas
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Essas questões serão criadas no sistema e vinculadas aos cadernos selecionados
                    </p>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[200px] overflow-y-auto">
                    <div className="divide-y">
                      {newQuestions.map((question) => (
                        <div key={question.id} className="p-3 flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{question.linha_coleta}</p>
                            <div className="flex gap-1 mt-1">
                              {question.bindings.map((b, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs bg-green-100 dark:bg-green-900/30">
                                  {b.templateName}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {duplicateQuestions.length > 0 && (
                <Card className="border-amber-200 dark:border-amber-800">
                  <CardHeader className="pb-3 bg-amber-50 dark:bg-amber-950/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4" />
                          {duplicateQuestions.length} Questões Existentes
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Essas questões já existem. Selecione as que deseja também vincular a este caderno.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          toggleAllDuplicates(!duplicateQuestions.every((q) => q.shouldAddToCurrentTemplates))
                        }
                      >
                        {duplicateQuestions.every((q) => q.shouldAddToCurrentTemplates) ? (
                          <>
                            <X className="h-4 w-4 mr-1" />
                            Desmarcar Todas
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Marcar Todas
                          </>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {duplicateQuestions.filter((q) => q.shouldAddToCurrentTemplates).length} de{" "}
                      {duplicateQuestions.length} selecionadas
                    </p>
                  </CardHeader>
                  <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                    <div className="divide-y">
                      {duplicateQuestions.map((question) => (
                        <div
                          key={question.id}
                          className={`p-3 flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${question.shouldAddToCurrentTemplates ? "bg-amber-50/50 dark:bg-amber-950/20" : ""
                            }`}
                          onClick={() => toggleDuplicateSelection(question.id, !question.shouldAddToCurrentTemplates)}
                        >
                          <Checkbox
                            checked={question.shouldAddToCurrentTemplates}
                            onCheckedChange={(checked) => toggleDuplicateSelection(question.id, !!checked)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{question.linha_coleta}</p>
                            <div className="flex flex-col gap-1 mt-2 text-xs">
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <span>Já existe em:</span>
                                {question.existingTemplates?.map((t, idx) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">Adicionar a:</span>
                                {question.bindings.map((b, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs bg-green-100 dark:bg-green-900/30 border-green-300"
                                  >
                                    {b.templateName}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {newQuestions.length === 0 && duplicateQuestions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Nenhuma questão para importar</p>
                  <p className="text-sm">Verifique o mapeamento de colunas e tente novamente</p>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentStep(3)}>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={
                    isSaving ||
                    (newQuestions.length === 0 &&
                      duplicateQuestions.filter((q) => q.shouldAddToCurrentTemplates).length === 0)
                  }
                >
                  {isSaving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                  Importar
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 5: Results */}
          {currentStep === 5 && importResults && (
            <div className="space-y-6">
              <div className="space-y-4">
                {importResults.created > 0 && (
                  <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                    <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-900 dark:text-green-100">
                        {importResults.created} questão(ões) criada(s) com sucesso
                      </p>
                    </div>
                  </div>
                )}

                {importResults.linkedUpdated > 0 && (
                  <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                    <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">
                        {importResults.linkedUpdated} questão(ões) duplicada(s) vinculada(s) aos cadernos
                      </p>
                    </div>
                  </div>
                )}

                {importResults.errors > 0 && (
                  <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950/30">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900 dark:text-red-100 mb-2">
                        {importResults.errors} erro(s) ao importar questões
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">Detalhes dos erros:</p>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside">
                        {importResults.errorMessages.slice(0, 5).map((msg, i) => (
                          <li key={i}>{msg}</li>
                        ))}
                        {importResults.errorMessages.length > 5 && (
                          <li>... e mais {importResults.errorMessages.length - 5} erro(s)</li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {duplicateQuestions.filter(
                  (q) => !q.shouldAddToCurrentTemplates || !q.selectedTemplates || q.selectedTemplates.length === 0,
                ).length > 0 && (
                    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/30">
                      <Info className="h-5 w-5 text-gray-600 dark:text-gray-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {
                            duplicateQuestions.filter(
                              (q) =>
                                !q.shouldAddToCurrentTemplates || !q.selectedTemplates || q.selectedTemplates.length === 0,
                            ).length
                          }{" "}
                          questão(ões) duplicada(s) não foi(ram) vinculada(s) (não selecionada(s) ou sem cadernos para
                          vincular)
                        </p>
                      </div>
                    </div>
                  )}

                {technicalErrorLog && (
                  <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 dark:border-orange-800 dark:bg-orange-950/30">
                    <div className="flex items-start gap-3 mb-3">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-orange-900 dark:text-orange-100">
                          Logs Técnicos (para desenvolvedores)
                        </p>
                        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                          Copie estes logs e envie para a equipe técnica para análise:
                        </p>
                      </div>
                    </div>
                    <div className="relative">
                      <pre className="text-xs bg-orange-100 dark:bg-orange-900/50 p-3 rounded border border-orange-300 dark:border-orange-700 overflow-x-auto max-h-64 overflow-y-auto">
                        <code>{technicalErrorLog}</code>
                      </pre>
                      <Button
                        size="sm"
                        variant="outline"
                        className="absolute top-2 right-2 bg-transparent"
                        onClick={() => {
                          navigator.clipboard.writeText(technicalErrorLog)
                          alert("Logs copiados para a área de transferência!")
                        }}
                      >
                        Copiar Logs
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <Button onClick={resetForm} variant="outline" className="flex-1 bg-transparent">
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Novo Arquivo
                </Button>
                <Button onClick={() => setOpen(false)} className="flex-1">
                  Concluir
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
})
