"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination"
import {
  ArrowLeft,
  Save,
  Loader2,
  Users,
  Trash2,
  Pencil,
  Plus,
  List,
  FileText,
  X,
  GripVertical,
  Search,
  ClipboardCheck,
  Info,
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { updateBookTemplate, deleteBookTemplate } from "@/app/actions/template-actions"
import { ImportCsvButton } from "@/components/questions/import-csv-button"
import { Badge } from "@/components/ui/badge"

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
}

interface Question {
  id: string
  label: string
  type: string
  order_index: number
  caderno_id: string | null
  metadata: any
  metadata_v2?: any
  created_at: string
  updated_at: string
  unique_identifier: string
}

interface Template {
  id: string
  name: string
  description: string
  type: string
  responsable_name: string
  responsable_id: string
  template_questions: Question[]
}

function SortableQuestionItem({
  question,
  index,
  startIndex,
  onDelete,
  onEdit,
  templateId,
}: {
  question: Question
  index: number
  startIndex: number
  onDelete: (q: Question) => void
  onEdit: (q: Question) => void
  templateId: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
        {startIndex + index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm lg:text-base leading-snug">{question.label}</p>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
            {question.type}
          </span>
          {question.metadata?.disclosure && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              Disclosure: {question.metadata.disclosure}
            </span>
          )}
          {(question.metadata?.evidencia || question.metadata?.evidencias) && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <ClipboardCheck className="h-3 w-3" />
              Evidência: {question.metadata.evidencia || question.metadata.evidencias}
            </span>
          )}
          {(question.metadata?.obs || question.metadata?.obs_nao_aplicavel) && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Obs: {question.metadata.obs || question.metadata.obs_nao_aplicavel}
            </span>
          )}
        </div>
        {/* Render sub-frameworks if they exist for this template */}
        {question.metadata?.sub_frameworks?.[templateId] &&
          Array.isArray(question.metadata.sub_frameworks[templateId]) &&
          question.metadata.sub_frameworks[templateId].length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {question.metadata.sub_frameworks[templateId]
                .filter((sf: string) => sf.trim() !== "")
                .map((sf: string, i: number) => (
                  <span
                    key={i}
                    className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded-sm"
                  >
                    {sf}
                  </span>
                ))}
            </div>
          )}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => onEdit(question)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onDelete(question)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function EditTemplatePage({ params }: { params: Promise<{ templateId: string }> }) {
  const router = useRouter()
  const { templateId } = React.use(params)
  const [isLoading, setIsLoading] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [template, setTemplate] = useState<Template | null>(null)
  const [allTemplates, setAllTemplates] = useState<Array<{ id: string; name: string }>>([])
  const [selectedResponsibles, setSelectedResponsibles] = useState<string[]>([])
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "gri",
  })

  const [questions, setQuestions] = useState<Question[]>([])
  const [allQuestions, setAllQuestions] = useState<Question[]>([])
  const [questionTemplateMap, setQuestionTemplateMap] = useState<Record<string, string[]>>({})
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [showNewDialog, setShowNewDialog] = useState(false)
  const [showExistingDialog, setShowExistingDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showClearAllDialog, setShowClearAllDialog] = useState(false)
  const [isClearingAll, setIsClearingAll] = useState(false)
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)
  const [isEditingQuestion, setIsEditingQuestion] = useState(false)
  const [questionError, setQuestionError] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState<{
    label: string
    type: string
    metadata: {
      disclosure: string
      evidencia: string
      obs: string
      sub_frameworks: Array<{ framework: string; subFramework: string }>
    }
  }>({
    label: "",
    type: "texto",
    metadata: {
      disclosure: "",
      evidencia: "",
      obs: "",
      sub_frameworks: [{ framework: "", subFramework: "" }],
    },
  })

  const [currentPage, setCurrentPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const [searchQuery, setSearchQuery] = useState("")

  const [sortedQuestions, setSortedQuestions] = useState<Question[]>([])
  const [isSavingOrder, setIsSavingOrder] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => {
    setSortedQuestions(questions)
  }, [questions])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = sortedQuestions.findIndex((q) => q.id === active.id)
      const newIndex = sortedQuestions.findIndex((q) => q.id === over.id)

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(sortedQuestions, oldIndex, newIndex)
        setSortedQuestions(newOrder)

        setIsSavingOrder(true)
        try {
          const { updateQuestionOrder } = await import("@/app/actions/template-actions")
          const orderUpdate = newOrder.map((q, index) => ({
            questionId: q.id,
            sortOrder: index + 1,
          }))

          const result = await updateQuestionOrder({
            bookTemplateId: templateId,
            questionOrders: orderUpdate,
          })

          if (!result.success) {
            toast.error("Erro ao salvar ordem das questões")
            setSortedQuestions(questions)
          } else {
            toast.success("Ordem das questões atualizada!")
          }
        } catch (error) {
          console.error("[v0] Error saving question order:", error)
          toast.error("Erro ao salvar ordem")
          setSortedQuestions(questions)
        } finally {
          setIsSavingOrder(false)
        }
      }
    }
  }

  const supabase = useMemo(
    () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!),
    [],
  )

  const loadQuestions = useCallback(async () => {
    if (!templateId) return

    try {
      setLoadingQuestions(true)

      const { data: questionLinks, error: linksError } = await supabase
        .from("book_question_junction")
        .select("question_template_id, position")
        .eq("book_template_id", templateId)

      if (linksError) {
        console.error("[v0] Error fetching question links:", linksError.message, linksError)
        setQuestions([])
        setLoadingQuestions(false)
        return
      }

      // Create a map of question IDs to their positions
      const positionMap: Record<string, number> = {}
      questionLinks?.forEach((link) => {
        if (link.position !== null && link.position !== undefined) {
          positionMap[link.question_template_id] = link.position
        }
      })

      const questionIds = questionLinks?.map((link) => link.question_template_id) || []
      console.log("[v0] Found", questionIds.length, "question IDs for template")

      if (questionIds.length === 0) {
        setQuestions([])
      } else {
        const BATCH_SIZE = 100
        const batches = []

        for (let i = 0; i < questionIds.length; i += BATCH_SIZE) {
          batches.push(questionIds.slice(i, i + BATCH_SIZE))
        }

        console.log("[v0] Fetching questions in", batches.length, "batch(es)")

        const allQuestionsData = []
        for (const batch of batches) {
          const { data: batchData, error: batchError } = await supabase
            .from("book_questions")
            .select("*")
            .in("id", batch)

          if (batchError) {
            console.error("[v0] Error fetching questions batch:", batchError.message, batchError.details)
            continue
          }

          if (batchData) {
            allQuestionsData.push(...batchData)
          }
        }

        allQuestionsData.sort((a, b) => {
          const posA = positionMap[a.id]
          const posB = positionMap[b.id]

          // If both have positions, sort by position
          if (posA !== undefined && posB !== undefined) {
            return posA - posB
          }

          // If only A has position, it comes first
          if (posA !== undefined) return -1

          // If only B has position, it comes first
          if (posB !== undefined) return 1

          // If neither has position, sort by created_at as fallback
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })

        setQuestions(allQuestionsData)
        console.log("[v0] Successfully loaded", allQuestionsData.length, "questions")
      }

      const { data: allJunctions, error: junctionsError } = await supabase
        .from("book_question_junction")
        .select("question_template_id, book_template_id")

      if (junctionsError) {
        console.error("[v0] Error fetching all junctions:", junctionsError)
      } else {
        const templateMap: Record<string, string[]> = {}
        allJunctions?.forEach((junction) => {
          if (!templateMap[junction.question_template_id]) {
            templateMap[junction.question_template_id] = []
          }
          templateMap[junction.question_template_id].push(junction.book_template_id)
        })
        setQuestionTemplateMap(templateMap)
      }

      const { data: availableQuestionsData, error: availableQuestionsError } = await supabase
        .from("book_questions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      if (availableQuestionsError) {
        console.error(
          "[v0] Error fetching all questions:",
          availableQuestionsError.message,
          availableQuestionsError.details,
        )
        setAllQuestions([])
      } else {
        setAllQuestions(availableQuestionsData || [])
      }

      setLoadingQuestions(false)
    } catch (error) {
      console.error("[v0] Error loading questions:", error)
      setLoadingQuestions(false)
      setQuestions([])
      setAllQuestions([])
    }
  }, [templateId, supabase])

  useEffect(() => {
    async function fetchData() {
      try {
        const profilesResponse = await fetch("/api/profiles")
        if (profilesResponse.ok) {
          const profilesData = await profilesResponse.json()
          setProfiles(profilesData)
        } else {
          console.error("[v0] Error fetching profiles - status:", profilesResponse.status)
          setProfiles([])
        }

        const templatesResponse = await fetch("/api/templates")
        if (templatesResponse.ok) {
          const templatesData = await templatesResponse.json()
          setAllTemplates(templatesData.map((t: any) => ({ id: t.id, name: t.name })))
        } else {
          console.error("[v0] Error fetching templates - status:", templatesResponse.status)
          setAllTemplates([])
        }

        const { data: templateData, error: templateError } = await supabase
          .from("book_templates")
          .select("*")
          .eq("id", templateId)
          .single()

        if (templateError) {
          console.error("[v0] Error fetching template from Supabase:", templateError)
        } else if (templateData) {
          setTemplate(templateData as Template)
          setFormData({
            name: templateData.name || "",
            description: templateData.description || "",
            type: templateData.type || "gri",
          })

          if (templateData.responsable_id) {
            const responsableIds = templateData.responsable_id.split(",").map((id: string) => id.trim())
            setSelectedResponsibles(responsableIds)
          }
        }

        await loadQuestions()
      } catch (error) {
        console.error("[v0] Error fetching data:", error)
        setProfiles([])
        setAllTemplates([])
      }
    }
    fetchData()
  }, [templateId, loadQuestions, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateId) return
    setIsLoading(true)

    try {
      const responsableNames = profiles
        .filter((p) => selectedResponsibles.includes(p.id))
        .map((p) => p.full_name)
        .join(", ")

      const result = await (updateBookTemplate as any)(templateId, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        responsable_name: responsableNames,
        responsable_id: selectedResponsibles[0] || null,
      })

      if (result.success) {
        router.push("/admin/templates")
      } else {
        alert(result.error || "Erro ao atualizar caderno")
      }
    } catch (error) {
      console.error("Error updating template:", error)
      alert("Erro ao atualizar caderno")
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!templateId) return
    if (!confirm("Tem certeza que deseja excluir este caderno? Esta ação não pode ser desfeita.")) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteBookTemplate(templateId)
      if (result.success) {
        router.push("/admin/templates")
      } else {
        alert(result.error || "Erro ao excluir caderno")
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      alert("Erro ao excluir caderno")
    } finally {
      setIsDeleting(false)
    }
  }

  const toggleResponsible = (profileId: string) => {
    setSelectedResponsibles((prev) =>
      prev.includes(profileId) ? prev.filter((id) => id !== profileId) : [...prev, profileId],
    )
  }

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

  const resetNewQuestion = () => {
    setNewQuestion({
      label: "",
      type: "texto",
      metadata: {
        disclosure: "",
        evidencia: "",
        obs: "",
        sub_frameworks: [{ framework: "", subFramework: "" }],
      },
    })
    setIsEditingQuestion(false)
    setSelectedQuestion(null)
  }

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question)

    // Use metadata_v2 if available, otherwise fallback to metadata
    const meta = question.metadata_v2 || question.metadata || {}

    // Build framework pairs from metadata
    let frameworkPairs: Array<{ framework: string; subFramework: string }> = []

    // 1. Try legacy_sub_frameworks (array of objects from previous edits)
    if (Array.isArray(meta.legacy_sub_frameworks) && meta.legacy_sub_frameworks.length > 0) {
      frameworkPairs = meta.legacy_sub_frameworks
        .filter((sf: any) => typeof sf === 'object' && (sf.framework || sf.subFramework || sf.sub_framework))
        .map((sf: any) => ({
          framework: sf.framework || "",
          subFramework: sf.subFramework || sf.sub_framework || "",
        }))
    }

    // 2. Try sub_frameworks as array of objects
    if (frameworkPairs.length === 0 && Array.isArray(meta.sub_frameworks)) {
      frameworkPairs = meta.sub_frameworks
        .filter((sf: any) => typeof sf === 'object' && (sf.framework || sf.subFramework || sf.sub_framework))
        .map((sf: any) => ({
          framework: sf.framework || "",
          subFramework: sf.subFramework || sf.sub_framework || "",
        }))
    }

    // 3. Try named framework fields (framework_gri, framework_aneel, framework_ifrs)
    if (frameworkPairs.length === 0) {
      const namedFields = [
        { fw: "framework_gri", sub: "sub_framework_gri" },
        { fw: "framework_aneel", sub: "sub_framework_aneel" },
        { fw: "framework_ifrs", sub: "sub_framework_ifrs" },
      ]
      for (const nf of namedFields) {
        if (meta[nf.fw]) {
          frameworkPairs.push({
            framework: meta[nf.fw],
            subFramework: meta[nf.sub] || "",
          })
        }
      }
    }

    // 4. Try generic framework_1/framework_2 + sub_framework_1/sub_framework_2
    if (frameworkPairs.length === 0) {
      for (let i = 1; i <= 2; i++) {
        const fw = meta[`framework_${i}`]
        const sub = meta[`sub_framework_${i}`]
        if (fw) {
          frameworkPairs.push({ framework: fw, subFramework: sub || "" })
        }
      }
    }

    // 5. Fallback: if sub_frameworks is a template-keyed object { [templateId]: string[] }
    if (frameworkPairs.length === 0 && meta.sub_frameworks && !Array.isArray(meta.sub_frameworks) && typeof meta.sub_frameworks === 'object') {
      const templateSubs = meta.sub_frameworks[templateId]
      if (Array.isArray(templateSubs)) {
        templateSubs.forEach((sub: string) => {
          if (sub) frameworkPairs.push({ framework: "", subFramework: sub })
        })
      }
    }

    // Ensure at least one empty pair for the UI
    if (frameworkPairs.length === 0) frameworkPairs = [{ framework: "", subFramework: "" }]

    // Also merge named frameworks that aren't already in the array
    const namedFws = [
      { fw: "framework_gri", sub: "sub_framework_gri" },
      { fw: "framework_aneel", sub: "sub_framework_aneel" },
      { fw: "framework_ifrs", sub: "sub_framework_ifrs" },
    ]
    for (const nf of namedFws) {
      const fw = meta[nf.fw]
      const sfv = meta[nf.sub]
      if (fw && !frameworkPairs.some(p => p.framework === fw && p.subFramework === (sfv || ""))) {
        frameworkPairs.push({ framework: fw, subFramework: sfv || "" })
      }
    }


    // Map database types (English) back to frontend types (Portuguese)
    const typeMapping: { [key: string]: string } = {
      text: "texto",
      string: "texto",
      number: "numero",
      percentage: "porcentagem",
      date: "data",
      file: "arquivo",
      multiple_choice: "multipla_escolha",
      yes_no: "sim_nao",
    }

    const normalizedType = typeMapping[question.type] || question.type

    // Disclosure fallback: check disclosure -> framework_1 -> sub_framework_1
    const disclosureValue = meta.disclosure || meta.framework_1 || meta.sub_framework_1 || ""

    setNewQuestion({
      label: question.label,
      type: normalizedType,
      metadata: {
        disclosure: disclosureValue,
        evidencia: meta.evidencia || meta.evidencias || "",
        obs: meta.obs || meta.obs_nao_aplicavel || "",
        sub_frameworks: frameworkPairs,
      },
    })
    setIsEditingQuestion(true)
    setShowNewDialog(true)
  }

  const handleCreateQuestion = async () => {
    setQuestionError(null)
    if (!newQuestion.label.trim()) {
      setQuestionError("Por favor, preencha a linha de coleta (pergunta)")
      return
    }

    setSavingQuestion(true)
    try {
      const uniqueIdentifier = newQuestion.label
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "_")
        .substring(0, 100)

      // Map frontend types (Portuguese) back to database types (English)
      const saveTypeMapping: { [key: string]: string } = {
        texto: "text",
        numero: "number",
        porcentagem: "percentage",
        data: "date",
        arquivo: "file",
        multipla_escolha: "multiple_choice",
        sim_nao: "yes_no",
      }

      const dbType = saveTypeMapping[newQuestion.type] || newQuestion.type

      // Filter out empty framework pairs
      const filteredPairs = newQuestion.metadata.sub_frameworks.filter(
        (p) => p.framework.trim() !== "" || p.subFramework.trim() !== ""
      )
      const frameworkPairsToSave = filteredPairs.length > 0 ? filteredPairs : []

      // Build named framework fields for export compatibility
      const namedFrameworkFields: Record<string, string> = {
        framework_gri: "", sub_framework_gri: "",
        framework_aneel: "", sub_framework_aneel: "",
        framework_ifrs: "", sub_framework_ifrs: "",
      }
      frameworkPairsToSave.forEach((pair) => {
        const name = (pair.framework || "").toUpperCase().trim()
        const sub = pair.subFramework || ""
        if (name.includes("GRI")) {
          namedFrameworkFields.framework_gri = pair.framework || ""
          namedFrameworkFields.sub_framework_gri = sub
        } else if (name.includes("ANEEL")) {
          namedFrameworkFields.framework_aneel = pair.framework || ""
          namedFrameworkFields.sub_framework_aneel = sub
        } else if (name.includes("IFRS")) {
          namedFrameworkFields.framework_ifrs = pair.framework || ""
          namedFrameworkFields.sub_framework_ifrs = sub
        }
      })

      // Build generic framework_1/framework_2 fields
      const genericFrameworkFields: Record<string, string> = {}
      frameworkPairsToSave.forEach((pair, index) => {
        const num = index + 1
        if (num <= 2) {
          genericFrameworkFields[`framework_${num}`] = pair.framework || ""
          genericFrameworkFields[`sub_framework_${num}`] = pair.subFramework || ""
        }
      })
      // Clear unused slots
      if (!genericFrameworkFields.framework_1) genericFrameworkFields.framework_1 = ""
      if (!genericFrameworkFields.sub_framework_1) genericFrameworkFields.sub_framework_1 = ""
      if (!genericFrameworkFields.framework_2) genericFrameworkFields.framework_2 = ""
      if (!genericFrameworkFields.sub_framework_2) genericFrameworkFields.sub_framework_2 = ""

      if (isEditingQuestion && selectedQuestion) {
        // Prepare merged metadata to avoid losing data for other templates
        const currentMetadata = selectedQuestion.metadata || {}
        const currentMetadataV2 = selectedQuestion.metadata_v2 || {}

        // For template-keyed sub_frameworks, convert pairs to string[] of subFramework values
        const subFrameworkStrings = frameworkPairsToSave.map(p => p.subFramework).filter(Boolean)
        const existingSubFrameworks = currentMetadata.sub_frameworks || {}

        const updatedSubFrameworks =
          typeof existingSubFrameworks === "object" && !Array.isArray(existingSubFrameworks)
            ? { ...existingSubFrameworks, [templateId]: subFrameworkStrings }
            : { [templateId]: subFrameworkStrings }

        const existingSubFrameworksV2 = currentMetadataV2.sub_frameworks || {}
        const updatedSubFrameworksV2 =
          typeof existingSubFrameworksV2 === "object" && !Array.isArray(existingSubFrameworksV2)
            ? { ...existingSubFrameworksV2, [templateId]: subFrameworkStrings }
            : { [templateId]: subFrameworkStrings }

        // Standardize on plural 'evidencias' for consistent saving
        const mergedMetadata = {
          ...currentMetadata,
          disclosure: newQuestion.metadata.disclosure,
          evidencias: newQuestion.metadata.evidencia,
          obs_nao_aplicavel: newQuestion.metadata.obs,
          sub_frameworks: updatedSubFrameworks,
          ...namedFrameworkFields,
          ...genericFrameworkFields,
        }

        const mergedMetadataV2 = {
          ...currentMetadataV2,
          disclosure: newQuestion.metadata.disclosure,
          evidencias: newQuestion.metadata.evidencia,
          obs_nao_aplicavel: newQuestion.metadata.obs,
          sub_frameworks: updatedSubFrameworksV2,
          legacy_sub_frameworks: frameworkPairsToSave, // Store full framework pairs
          ...namedFrameworkFields,
          ...genericFrameworkFields,
        }

        // Update existing question
        const { error: updateError } = await supabase
          .from("book_questions")
          .update({
            label: newQuestion.label,
            type: dbType,
            metadata: mergedMetadata,
            metadata_v2: mergedMetadataV2,
            unique_identifier: uniqueIdentifier,
          })
          .eq("id", selectedQuestion.id)

        if (updateError) throw updateError

        await loadQuestions()
        resetNewQuestion()
        setShowNewDialog(false)
        toast.success("Questão atualizada com sucesso!")
        return
      }

      // Step 1: Create the question in book_questions
      const subFrameworkStrings = frameworkPairsToSave.map(p => p.subFramework).filter(Boolean)

      const initialMetadata = {
        disclosure: newQuestion.metadata.disclosure,
        evidencias: newQuestion.metadata.evidencia,
        obs_nao_aplicavel: newQuestion.metadata.obs,
        sub_frameworks: { [templateId]: subFrameworkStrings },
        ...namedFrameworkFields,
        ...genericFrameworkFields,
      }

      const initialMetadataV2 = {
        disclosure: newQuestion.metadata.disclosure,
        evidencias: newQuestion.metadata.evidencia,
        obs_nao_aplicavel: newQuestion.metadata.obs,
        sub_frameworks: { [templateId]: subFrameworkStrings },
        legacy_sub_frameworks: frameworkPairsToSave,
        ...namedFrameworkFields,
        ...genericFrameworkFields,
      }

      const { data: createdQuestion, error: insertError } = await supabase
        .from("book_questions")
        .insert({
          label: newQuestion.label,
          type: dbType,
          metadata: initialMetadata,
          metadata_v2: initialMetadataV2,
          unique_identifier: uniqueIdentifier,
        })
        .select("id")
        .single()

      if (insertError) throw insertError

      // Step 2: Link the question to the template via junction table
      const { error: linkError } = await supabase.from("book_question_junction").insert({
        book_template_id: templateId,
        question_template_id: createdQuestion.id,
        sort_order: questions.length + 1,
      })

      if (linkError) throw linkError

      await loadQuestions()
      resetNewQuestion()
      setShowNewDialog(false)
      toast.success("Questão criada com sucesso!")
    } catch (err: any) {
      console.error("[v0] Error saving question:", err)
      setQuestionError(err.message)
      toast.error("Erro ao salvar questão")
    } finally {
      setSavingQuestion(false)
    }
  }

  const handleLinkExistingQuestion = async (questionId: string) => {
    if (!templateId) return

    try {
      const { error } = await supabase.from("book_question_junction").insert({
        book_template_id: templateId,
        question_template_id: questionId,
        sort_order: questions.length + 1,
      })

      if (error) throw error

      toast.success("Questão vinculada ao caderno!")
      setShowExistingDialog(false)
      loadQuestions()
    } catch (error: any) {
      console.error("[v0] Error linking question:", error.message)
      toast.error("Erro ao vincular questão: " + error.message)
    }
  }

  const handleUnlinkQuestion = async () => {
    if (!selectedQuestion || !templateId) return

    try {
      const { error } = await supabase
        .from("book_question_junction")
        .delete()
        .eq("book_template_id", templateId)
        .eq("question_template_id", selectedQuestion.id)

      if (error) throw error

      toast.success("Questão desvinculada do caderno!")
      setShowDeleteDialog(false)
      setSelectedQuestion(null)
      loadQuestions()
    } catch (error) {
      console.error("[v0] Error unlinking question:", error)
      toast.error("Erro ao desvincular questão")
    }
  }

  const openDeleteDialog = (question: Question) => {
    setSelectedQuestion(question)
    setShowDeleteDialog(true)
  }

  const handleClearAllQuestions = async () => {
    if (!templateId) return

    setIsClearingAll(true)
    try {
      const { error } = await supabase.from("book_question_junction").delete().eq("book_template_id", templateId)

      if (error) throw error

      toast.success(`${questions.length} questões foram removidas do caderno!`)
      setShowClearAllDialog(false)
      await loadQuestions()
    } catch (error) {
      console.error("[v0] Error clearing all questions:", error)
      toast.error("Erro ao limpar questões do caderno")
    } finally {
      setIsClearingAll(false)
    }
  }

  const availableQuestions = allQuestions.filter((q) => !questions.some((linkedQ) => linkedQ.id === q.id))

  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return sortedQuestions

    const query = searchQuery.toLowerCase()
    return sortedQuestions.filter(
      (q) =>
        q.label.toLowerCase().includes(query) ||
        q.metadata?.disclosure?.toLowerCase().includes(query) ||
        q.type.toLowerCase().includes(query),
    )
  }, [sortedQuestions, searchQuery])

  const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const addNewQuestionSubFramework = () => {
    setNewQuestion({
      ...newQuestion,
      metadata: {
        ...newQuestion.metadata,
        sub_frameworks: [...newQuestion.metadata.sub_frameworks, { framework: "", subFramework: "" }],
      },
    })
  }

  const removeNewQuestionSubFramework = (index: number) => {
    if (newQuestion.metadata.sub_frameworks.length > 1) {
      setNewQuestion({
        ...newQuestion,
        metadata: {
          ...newQuestion.metadata,
          sub_frameworks: newQuestion.metadata.sub_frameworks.filter((_, i) => i !== index),
        },
      })
    }
  }

  const updateNewQuestionSubFrameworkField = (index: number, field: 'framework' | 'subFramework', value: string) => {
    const updated = [...newQuestion.metadata.sub_frameworks]
    updated[index] = { ...updated[index], [field]: value }
    setNewQuestion({
      ...newQuestion,
      metadata: {
        ...newQuestion.metadata,
        sub_frameworks: updated,
      },
    })
  }

  if (!templateId || !template) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:p-6 pb-32">
      <div className="container mx-auto max-w-7xl space-y-4 sm:space-y-6">
        <Link href="/admin/templates">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Voltar aos Cadernos</span>
            <span className="sm:hidden">Voltar</span>
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-blue-100 border border-blue-200">
              <Pencil className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Editar Caderno</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Atualize as informações e gerencie as questões
              </p>
            </div>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2 w-full sm:w-auto"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Excluir Caderno
          </Button>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Informações do Caderno</CardTitle>
              <CardDescription>Atualize os dados básicos do caderno</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
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
                        {profiles.map((profile) => (
                          <div
                            key={profile.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${selectedResponsibles.includes(profile.id)
                              ? "border-emerald-500 bg-emerald-50"
                              : "border-border hover:bg-muted/50"
                              }`}
                            onClick={() => toggleResponsible(profile.id)}
                          >
                            <Checkbox
                              checked={selectedResponsibles.includes(profile.id)}
                              onCheckedChange={() => toggleResponsible(profile.id)}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{profile.full_name}</p>
                              <p className="text-xs text-muted-foreground truncate">{profile.email}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading} className="gap-2">
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Questions Section */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-lg sm:text-xl">Questões do Caderno</CardTitle>
                <CardDescription className="text-sm">
                  {questions.length} questões vinculadas • {filteredQuestions.length} após filtros
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                {questions.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearAllDialog(true)}
                    className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 w-full sm:w-auto"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:inline">Limpar Caderno</span>
                    <span className="sm:hidden">Limpar</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExistingDialog(true)}
                  className="gap-2 w-full sm:w-auto"
                >
                  <List className="h-4 w-4" />
                  <span className="hidden sm:inline">Vincular Existente</span>
                  <span className="sm:hidden">Vincular</span>
                </Button>
                <ImportCsvButton allTemplates={allTemplates} templateId={templateId} onImportComplete={loadQuestions} />
                <Button onClick={() => setShowNewDialog(true)} size="sm" className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Nova Questão</span>
                  <span className="sm:hidden">Nova</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingQuestions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : sortedQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Nenhuma questão vinculada</p>
                <p className="text-sm text-muted-foreground mt-1">Crie uma nova questão ou vincule uma existente</p>
              </div>
            ) : (
              <>
                <div className="border-b p-4 bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por título, disclosure ou tipo..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setCurrentPage(1)
                      }}
                      className="flex-1 bg-background"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSearchQuery("")
                          setCurrentPage(1)
                        }}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {searchQuery && (
                    <p className="text-xs text-muted-foreground mt-2">
                      {filteredQuestions.length} questão(ões) encontrada(s)
                    </p>
                  )}
                </div>

                {filteredQuestions.length === 0 && searchQuery ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Nenhuma questão encontrada</p>
                    <p className="text-sm text-muted-foreground mt-1">Tente alterar os termos de pesquisa</p>
                  </div>
                ) : (
                  <>
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <div className="divide-y">
                        <SortableContext
                          items={paginatedQuestions.map((q) => q.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {paginatedQuestions.map((question, index) => (
                            <SortableQuestionItem
                              key={question.id}
                              question={question}
                              index={index}
                              startIndex={startIndex}
                              onDelete={openDeleteDialog}
                              onEdit={handleEditQuestion}
                              templateId={templateId}
                            />
                          ))}
                        </SortableContext>
                      </div>
                    </DndContext>

                    {totalPages > 1 && (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t p-4">
                        <p className="text-sm text-muted-foreground text-center sm:text-left">
                          Mostrando {startIndex + 1} a {Math.min(endIndex, filteredQuestions.length)} de{" "}
                          {filteredQuestions.length}
                        </p>
                        <Pagination>
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => goToPage(currentPage - 1)}
                                className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number
                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentPage <= 3) {
                                pageNum = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }
                              return (
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    onClick={() => goToPage(pageNum)}
                                    isActive={currentPage === pageNum}
                                    className="cursor-pointer"
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              )
                            })}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() => goToPage(currentPage + 1)}
                                className={
                                  currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* New Question Dialog */}
        <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>{isEditingQuestion ? "Editar Questão" : "Nova Questão"}</DialogTitle>
              <DialogDescription>
                {isEditingQuestion ? "Atualize os dados da questão" : "Crie uma nova questão para este caderno"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {questionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {questionError}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new_linha_coleta">Linha de Coleta (Atomizada) *</Label>
                <Textarea
                  id="new_linha_coleta"
                  value={newQuestion.label}
                  onChange={(e) => setNewQuestion({ ...newQuestion, label: e.target.value })}
                  placeholder="Digite a pergunta principal..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Esta é a pergunta em si que aparecerá no formulário</p>
              </div>

              <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="new_disclosure">Disclosure</Label>
                  <Input
                    id="new_disclosure"
                    value={newQuestion.metadata.disclosure}
                    onChange={(e) =>
                      setNewQuestion({
                        ...newQuestion,
                        metadata: { ...newQuestion.metadata, disclosure: e.target.value },
                      })
                    }
                    placeholder="Ex: GRI 2-1, GRI 2-2"
                  />
                  <p className="text-xs text-muted-foreground">Detalhamento ou código da pergunta</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new_tipo_resposta">Tipo da Resposta *</Label>
                  <Select
                    value={newQuestion.type}
                    onValueChange={(value) => setNewQuestion({ ...newQuestion, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="texto">Texto</SelectItem>
                      <SelectItem value="numero">Número</SelectItem>
                      <SelectItem value="porcentagem">Porcentagem</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                      <SelectItem value="arquivo">Arquivo</SelectItem>
                      <SelectItem value="multipla_escolha">Múltipla Escolha</SelectItem>
                      <SelectItem value="sim_nao">Sim/Não</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_evidencias">Evidência</Label>
                <Textarea
                  id="new_evidencias"
                  value={newQuestion.metadata.evidencia}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      metadata: { ...newQuestion.metadata, evidencia: e.target.value },
                    })
                  }
                  placeholder="Tipo de documento que será anexado..."
                  rows={2}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Descreva o tipo de documento ou evidência esperada</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_obs">Observação</Label>
                <Textarea
                  id="new_obs"
                  value={newQuestion.metadata.obs}
                  onChange={(e) =>
                    setNewQuestion({
                      ...newQuestion,
                      metadata: { ...newQuestion.metadata, obs: e.target.value },
                    })
                  }
                  placeholder="Observações gerais sobre a questão..."
                  rows={2}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">Texto de observação para a pergunta</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Frameworks e Sub-frameworks</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addNewQuestionSubFramework}
                    className="h-8 gap-1 text-xs bg-transparent"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar Framework
                  </Button>
                </div>
                <div className="space-y-4">
                  {newQuestion.metadata.sub_frameworks.map((pair, index) => (
                    <Card key={index} className="border-primary/20 bg-primary/5">
                      <CardContent className="p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <Badge variant="outline" className="text-xs">
                            Framework {index + 1}
                          </Badge>
                          {newQuestion.metadata.sub_frameworks.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => removeNewQuestionSubFramework(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Nome do Framework</Label>
                            <Input
                              value={pair.framework}
                              onChange={(e) => updateNewQuestionSubFrameworkField(index, 'framework', e.target.value)}
                              placeholder="Ex: GRI, ANEEL, IFRS"
                              className="h-9 text-sm focus-visible:ring-primary"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Sub-framework</Label>
                            <Input
                              value={pair.subFramework}
                              onChange={(e) => updateNewQuestionSubFrameworkField(index, 'subFramework', e.target.value)}
                              placeholder="Ex: 202, 301, Gestão de Materiais"
                              className="h-9 text-sm focus-visible:ring-primary"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cada framework é composto por um nome (ex: GRI, ANEEL) e um sub-framework (ex: 202, 301).
                </p>
              </div>
            </div>
            <DialogFooter>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 w-full sm:w-auto">
                <Button variant="outline" onClick={() => setShowNewDialog(false)} className="w-full sm:w-auto">
                  Cancelar
                </Button>
                <Button onClick={handleCreateQuestion} disabled={savingQuestion} className="w-full sm:w-auto">
                  {savingQuestion ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : isEditingQuestion ? (
                    "Salvar Alterações"
                  ) : (
                    "Criar Questão"
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Link Existing Dialog */}
        <Dialog open={showExistingDialog} onOpenChange={setShowExistingDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
            <DialogHeader>
              <DialogTitle>Vincular Questão Existente</DialogTitle>
              <DialogDescription>Selecione uma questão do banco para vincular</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              {availableQuestions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Todas as questões já estão vinculadas</p>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {availableQuestions.map((question) => (
                    <div
                      key={question.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted cursor-pointer"
                      onClick={() => handleLinkExistingQuestion(question.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{question.label}</p>
                        <p className="text-xs text-muted-foreground">Tipo: {question.type}</p>
                      </div>
                      <Button size="sm" variant="ghost">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Question Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Desvincular Questão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja desvincular esta questão do caderno?
                {selectedQuestion && questionTemplateMap[selectedQuestion.id]?.length > 1 && (
                  <span className="block mt-2 text-sm text-muted-foreground">
                    Esta questão está vinculada a {questionTemplateMap[selectedQuestion.id].length} cadernos. Ela será
                    desvinculada apenas deste caderno.
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleUnlinkQuestion}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                Desvincular
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar Todas as Questões</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover TODAS as {questions.length} questões deste caderno?
                <span className="block mt-2 font-medium text-foreground">Esta ação não pode ser desfeita.</span>
                <span className="block mt-1 text-sm text-muted-foreground">
                  As questões não serão deletadas permanentemente, apenas desvinculadas deste caderno.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto" disabled={isClearingAll}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleClearAllQuestions}
                disabled={isClearingAll}
                className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
              >
                {isClearingAll ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Limpando...
                  </>
                ) : (
                  "Limpar Caderno"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
