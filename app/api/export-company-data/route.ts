import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { companyId, cadernoIds, userId, format } = body

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    if (!cadernoIds && !userId) {
      return NextResponse.json({ error: "Either cadernoIds or userId must be provided" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Fetch company info
    const { data: company } = await adminClient
      .from("companies")
      .select("name")
      .eq("id", companyId)
      .single()

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Determine which cadernos to fetch
    let finalCadernoIds = cadernoIds

    if (userId && !cadernoIds) {
      // If filtering by user, get all cadernos they have answered
      const { data: userAssignments } = await adminClient
        .from("book_assignments")
        .select("caderno_id")
        .eq("company_id", companyId)
        .eq("user_id", userId)

      finalCadernoIds = userAssignments?.map((a: any) => a.caderno_id) || []

      if (finalCadernoIds.length === 0) {
        return NextResponse.json({ error: "User has no cadernos assigned" }, { status: 404 })
      }
    }

    // Fetch all data needed for export
    const { data: questions } = await adminClient
      .from("book_question_junction")
      .select(`
        question_template_id,
        book_template_id,
        sort_order,
        question:book_questions!book_question_junction_question_template_id_fkey (
          id,
          label,
          type,
          unique_identifier,
          metadata
        ),
        template:book_templates!book_question_junction_book_template_id_fkey (
          id,
          name,
          description
        )
      `)
      .in("book_template_id", finalCadernoIds)
      .order("book_template_id")
      .order("sort_order")

    if (!questions) {
      return NextResponse.json({ error: "Questions not found" }, { status: 404 })
    }

    // Fetch answers for this company
    let answersQuery = adminClient
      .from("book_answers")
      .select(`
        question_id,
        template_id,
        value,
        status,
        evidence_url,
        value_jsonb,
        created_at,
        user:profiles!book_answers_user_id_fkey (
          full_name,
          email
        )
      `)
      .eq("company_id", companyId)
      .in("template_id", finalCadernoIds)

    // If filtering by user, only get their answers
    if (userId) {
      answersQuery = answersQuery.eq("user_id", userId)
    }

    const { data: answers } = await answersQuery

    // Build export data
    const exportData: any[] = []

    for (const junction of questions) {
      const question = junction.question
      const template = junction.template
      const answer = answers?.find(
        (a: any) => a.question_id === junction.question_template_id && a.template_id === junction.book_template_id
      )

      const metadata = question?.metadata as any
      const framework = metadata?.framework || metadata?.Framework || ""
      const category = metadata?.category || metadata?.Category || ""
      const topic = metadata?.topic || metadata?.Topic || ""

      const valueJsonb = answer?.value_jsonb as any
      const notApplicable = valueJsonb?.notApplicable || false
      const reviewObservation = valueJsonb?.reviewObservation || ""

      exportData.push({
        Caderno: template?.name || "",
        Framework: framework,
        Categoria: category,
        Tópico: topic,
        "Identificador Único": question?.unique_identifier || "",
        "Nome da Questão": question?.label || "",
        "Tipo de Questão": question?.type || "",
        "Resposta do Usuário": answer?.value || "",
        Status: answer?.status || "não respondido",
        "Não Aplicável": notApplicable ? "Sim" : "Não",
        "Observação de Revisão": reviewObservation,
        "URL da Evidência": answer?.evidence_url || "",
        "Usuário que Respondeu": answer?.user?.full_name || "",
        "Email do Usuário": answer?.user?.email || "",
        "Data da Resposta": answer?.created_at ? new Date(answer.created_at).toLocaleString("pt-BR") : "",
      })
    }

    // Generate file based on format
    if (format === "csv") {
      const headers = Object.keys(exportData[0] || {})
      const csvRows = [
        headers.join(","),
        ...exportData.map((row) =>
          headers
            .map((header) => {
              const value = row[header]?.toString() || ""
              // Escape quotes and wrap in quotes if contains comma or quote
              if (value.includes(",") || value.includes('"') || value.includes("\n")) {
                return `"${value.replace(/"/g, '""')}"`
              }
              return value
            })
            .join(",")
        ),
      ]

      const csvContent = csvRows.join("\n")
      const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" })

      return new NextResponse(blob, {
        headers: {
          "Content-Type": "text/csv;charset=utf-8;",
          "Content-Disposition": `attachment; filename="${company.name.replace(/\s+/g, "_")}_export_${new Date().toISOString().split("T")[0]}.csv"`,
        },
      })
    } else {
      // XLSX format
      const worksheet = XLSX.utils.json_to_sheet(exportData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Export")

      // Auto-size columns
      const maxWidth = 50
      const colWidths = Object.keys(exportData[0] || {}).map((key) => {
        const maxLength = Math.max(
          key.length,
          ...exportData.map((row) => (row[key]?.toString() || "").length)
        )
        return { wch: Math.min(maxLength + 2, maxWidth) }
      })
      worksheet["!cols"] = colWidths

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" })

      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${company.name.replace(/\s+/g, "_")}_export_${new Date().toISOString().split("T")[0]}.xlsx"`,
        },
      })
    }
  } catch (error) {
    console.error("Export error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
