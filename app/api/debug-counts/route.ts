import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const adminClient = createAdminClient()
  
  // GRI 204 template ID
  const templateId = '6bdbbebc-910f-4a07-a5e1-7fbca3e98792'
  
  // GRANDE SERTAO I and II company IDs - find them
  const { data: gsCompanies } = await adminClient
    .from("companies")
    .select("id, name")
    .or("name.ilike.%GRANDE SERTAO I TRANS%,name.ilike.%GRANDE SERTAO II TRANS%")
  
  // Count questions for GRI 204
  const { count: questionCount } = await adminClient
    .from("book_question_junction")
    .select("*", { count: "exact", head: true })
    .eq("book_template_id", templateId)
  
  // Fetch ALL answers for GRI 204 with company_id filter
  const companyIds = (gsCompanies || []).map((c: any) => c.id)
  
  const { data: answersByCompany, error: companyError } = await adminClient
    .from("book_answers")
    .select("template_id, question_id, company_id, holding_id, user_id")
    .eq("template_id", templateId)
    .in("company_id", companyIds)
    .limit(100000)
  
  const { data: answersByHolding, error: holdingError } = await adminClient
    .from("book_answers")
    .select("template_id, question_id, company_id, holding_id, user_id")
    .eq("template_id", templateId)
    .in("holding_id", ['ed95fcfb-47b3-4ebd-bdcd-a17773a50a31'])
    .limit(100000)
  
  // Count unique questions per company
  const countsByCompany: Record<string, { total: number, uniqueQuestions: number, questionIds: string[] }> = {}
  
  for (const company of (gsCompanies || [])) {
    const answersForCompany = (answersByCompany || []).filter((a: any) => a.company_id === company.id)
    const uniqueQs = new Set(answersForCompany.map((a: any) => a.question_id))
    countsByCompany[company.name] = {
      total: answersForCompany.length,
      uniqueQuestions: uniqueQs.size,
      questionIds: Array.from(uniqueQs) as string[]
    }
  }
  
  return NextResponse.json({
    templateId,
    questionCount,
    companies: gsCompanies,
    answersByCompanyCount: answersByCompany?.length || 0,
    answersByHoldingCount: answersByHolding?.length || 0,
    companyError,
    holdingError,
    countsByCompany
  })
}
