import { createAdminClient } from "@/lib/supabase/admin"
import { requireGestor } from "@/lib/auth-utils"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Database } from "lucide-react"
import Link from "next/link"
import { MigrationDashboard } from "@/components/migration/migration-dashboard"
import { isQuestionEnriched } from "@/lib/migration/metadata-builder"
import type { TemplateEnrichmentStatus } from "@/lib/migration/types"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function MigrationPage() {
  const profile = await requireGestor()

  if (profile.role !== "admin_main") {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    )
  }

  const adminClient = createAdminClient()

  // Fetch all templates
  const { data: templates } = await adminClient
    .from("book_templates")
    .select("id, name, type")
    .order("name")

  // Fetch ALL junctions with pagination (Supabase default limit is 1000)
  const allJunctions: { book_template_id: string; question_template_id: string }[] = []
  const PAGE_SIZE = 1000
  let junctionOffset = 0
  let hasMore = true

  while (hasMore) {
    const { data: batch } = await adminClient
      .from("book_question_junction")
      .select("book_template_id, question_template_id")
      .range(junctionOffset, junctionOffset + PAGE_SIZE - 1)

    if (batch && batch.length > 0) {
      allJunctions.push(...batch)
      junctionOffset += batch.length
      hasMore = batch.length === PAGE_SIZE
    } else {
      hasMore = false
    }
  }

  const junctions = allJunctions

  // Build question ID set
  const allQuestionIds = [...new Set(junctions.map((j) => j.question_template_id))]

  // Fetch ALL questions metadata by paginating through book_questions
  // (Using .in() with large ID sets can hit URL length limits)
  const questionsMap: Record<string, any> = {}
  let qOffset = 0
  let qHasMore = true
  while (qHasMore) {
    const { data: qBatch } = await adminClient
      .from("book_questions")
      .select("id, metadata, metadata_v2")
      .range(qOffset, qOffset + PAGE_SIZE - 1)

    if (qBatch && qBatch.length > 0) {
      for (const q of qBatch) {
        questionsMap[q.id] = q
      }
      qOffset += qBatch.length
      qHasMore = qBatch.length === PAGE_SIZE
    } else {
      qHasMore = false
    }
  }

  // Build template → question IDs map
  const templateQuestionMap: Record<string, string[]> = {}
  for (const j of junctions || []) {
    if (!templateQuestionMap[j.book_template_id]) {
      templateQuestionMap[j.book_template_id] = []
    }
    templateQuestionMap[j.book_template_id].push(j.question_template_id)
  }

  // Fetch last migration per template (resilient if table doesn't exist)
  let logs: any[] | null = null
  try {
    const { data: logsData } = await adminClient
      .from("migration_logs")
      .select("template_id, executed_at")
      .order("executed_at", { ascending: false })
    logs = logsData
  } catch {
    // Table may not exist yet — continue without logs
  }

  const lastMigrationMap: Record<string, string> = {}
  for (const log of logs || []) {
    if (!lastMigrationMap[log.template_id]) {
      lastMigrationMap[log.template_id] = log.executed_at
    }
  }

  // Compute statuses
  const statuses: TemplateEnrichmentStatus[] = (templates || []).map((template) => {
    const questionIds = templateQuestionMap[template.id] || []
    let enrichedCount = 0

    for (const qId of questionIds) {
      const q = questionsMap[qId]
      if (q) {
        const meta = q.metadata_v2 || q.metadata
        if (isQuestionEnriched(meta)) {
          enrichedCount++
        }
      }
    }

    const total = questionIds.length
    return {
      templateId: template.id,
      templateName: template.name,
      templateType: template.type || "",
      totalQuestions: total,
      enrichedCount,
      unenrichedCount: total - enrichedCount,
      enrichmentPercent: total > 0 ? Math.round((enrichedCount / total) * 100) : 0,
      lastMigration: lastMigrationMap[template.id],
    }
  })

  // Sort: unenriched first, then by name
  statuses.sort((a, b) => {
    if (a.enrichmentPercent !== b.enrichmentPercent) {
      return a.enrichmentPercent - b.enrichmentPercent
    }
    return a.templateName.localeCompare(b.templateName)
  })

  return (
    <div className="min-h-screen bg-background px-4 py-6 sm:p-6 pb-32">
      <div className="container mx-auto max-w-7xl space-y-6">
        <Link href="/admin/command-center">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 border border-emerald-200">
            <Database className="h-7 w-7 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Migracao de Metadados</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Enriquecer questoes existentes com dados de frameworks dos Excels
            </p>
          </div>
        </div>

        <MigrationDashboard initialStatuses={statuses} />
      </div>
    </div>
  )
}
