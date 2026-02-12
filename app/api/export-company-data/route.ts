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
    const { companyId, cadernoIds, userId, includeAllHoldingCompanies, format } = body

    if (!companyId) {
      return NextResponse.json({ error: "Company ID is required" }, { status: 400 })
    }

    if (!cadernoIds && !userId) {
      return NextResponse.json({ error: "Either cadernoIds or userId must be provided" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Fetch company and holding info
    const { data: company } = await adminClient
      .from("companies")
      .select("name, holding_id")
      .eq("id", companyId)
      .single()

    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 })
    }

    // Fetch holding info and all companies in holding if needed
    let holdingName = ""
    let companyIdsToExport = [companyId]
    
    if (company.holding_id) {
      const { data: holding } = await adminClient
        .from("organizations")
        .select("name")
        .eq("id", company.holding_id)
        .single()
      holdingName = holding?.name || ""

      // If includeAllHoldingCompanies is true, get all companies in this holding
      if (includeAllHoldingCompanies && userId) {
        const { data: holdingCompanies } = await adminClient
          .from("companies")
          .select("id")
          .eq("holding_id", company.holding_id)
        
        if (holdingCompanies && holdingCompanies.length > 0) {
          companyIdsToExport = holdingCompanies.map((c: any) => c.id)
        }
      }
    }

    // Determine which cadernos to fetch
    let finalCadernoIds = cadernoIds

    if (userId && !cadernoIds) {
      // If filtering by user, get all cadernos they have answered across selected companies
      const { data: userAssignments } = await adminClient
        .from("book_assignments")
        .select("caderno_id")
        .in("company_id", companyIdsToExport)
        .eq("user_id", userId)

      finalCadernoIds = [...new Set(userAssignments?.map((a: any) => a.caderno_id) || [])]

      if (finalCadernoIds.length === 0) {
        return NextResponse.json({ error: "User has no cadernos assigned" }, { status: 404 })
      }
    }

    // Fetch all data needed for export
    const { data: questions, error: questionsError } = await adminClient
      .from("book_question_junction")
      .select("question_template_id, book_template_id, sort_order")
      .in("book_template_id", finalCadernoIds)
      .order("book_template_id")
      .order("sort_order")

    if (questionsError) {
      console.error("Error fetching questions:", questionsError)
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
    }

    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: "No questions found for selected cadernos" }, { status: 404 })
    }

    // Fetch question details
    const questionIds = [...new Set(questions.map((q: any) => q.question_template_id))]
    const { data: questionDetails } = await adminClient
      .from("book_questions")
      .select("id, label, type, unique_identifier, metadata")
      .in("id", questionIds)

    // Fetch template details
    const { data: templateDetails } = await adminClient
      .from("book_templates")
      .select("id, name, description")
      .in("id", finalCadernoIds)

    // Fetch answers for selected companies
    let answersQuery = adminClient
      .from("book_answers")
      .select("question_id, template_id, value, status, evidence_url, value_jsonb, created_at, user_id, company_id")
      .in("company_id", companyIdsToExport)
      .in("template_id", finalCadernoIds)

    // If filtering by user, only get their answers
    if (userId) {
      answersQuery = answersQuery.eq("user_id", userId)
    }

    const { data: answers, error: answersError } = await answersQuery

    if (answersError) {
      console.error("Error fetching answers:", answersError)
      return NextResponse.json({ error: "Failed to fetch answers" }, { status: 500 })
    }

    // Fetch user profiles for answers
    const userIds = [...new Set(answers?.map((a: any) => a.user_id).filter(Boolean) || [])]
    let userProfiles: any[] = []
    if (userIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds)
      userProfiles = profiles || []
    }

    // Fetch company names if exporting from multiple companies
    let companyNamesMap = new Map([[companyId, company.name]])
    if (companyIdsToExport.length > 1) {
      const { data: companiesData } = await adminClient
        .from("companies")
        .select("id, name")
        .in("id", companyIdsToExport)
      
      if (companiesData) {
        companiesData.forEach((c: any) => companyNamesMap.set(c.id, c.name))
      }
    }

    // Build export data
    const exportData: any[] = []

    for (const junction of questions) {
      const question = questionDetails?.find((q: any) => q.id === junction.question_template_id)
      const template = templateDetails?.find((t: any) => t.id === junction.book_template_id)
      
      // Find answers for this question across all companies
      const answersForQuestion = answers?.filter(
        (a: any) => a.question_id === junction.question_template_id && a.template_id === junction.book_template_id
      ) || []

      // If no answers for this question, still add a row with empty values
      if (answersForQuestion.length === 0) {
        exportData.push({
          Holding: holdingName,
          Empresa: company.name,
          Caderno: template?.name || "",
          "Nome da Questão": question?.label || "",
          "Tipo de Questão": question?.type || "",
          "Resposta do Usuário": "",
          "Não Aplicável": "Não",
          "Observação de Revisão": "",
          "URL da Evidência": "",
          "Usuário que Respondeu": "",
          "Email do Usuário": "",
          "Data da Resposta": "",
        })
      } else {
        // Add a row for each answer (handles multiple companies)
        for (const answer of answersForQuestion) {
          const userProfile = answer?.user_id ? userProfiles.find((u: any) => u.id === answer.user_id) : null
          const companyName = companyNamesMap.get(answer.company_id) || company.name

          const valueJsonb = answer?.value_jsonb as any
          const notApplicable = valueJsonb?.notApplicable || false
          const reviewObservation = valueJsonb?.reviewObservation || ""

          exportData.push({
            Holding: holdingName,
            Empresa: companyName,
            Caderno: template?.name || "",
            "Nome da Questão": question?.label || "",
            "Tipo de Questão": question?.type || "",
            "Resposta do Usuário": answer?.value || "",
            "Não Aplicável": notApplicable ? "Sim" : "Não",
            "Observação de Revisão": reviewObservation,
            "URL da Evidência": answer?.evidence_url || "",
            "Usuário que Respondeu": userProfile?.full_name || "",
            "Email do Usuário": userProfile?.email || "",
            "Data da Resposta": answer?.created_at ? new Date(answer.created_at).toLocaleString("pt-BR") : "",
          })
        }
      }
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
