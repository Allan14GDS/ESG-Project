import { type NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function DELETE(request: NextRequest, { params }: { params: { companyId: string } }) {
  try {
    const { companyId } = params

    if (!companyId) {
      return NextResponse.json({ error: "Company ID é obrigatório" }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { error: deleteError } = await adminClient.from("companies").delete().eq("id", companyId)

    if (deleteError) {
      console.error("[v0] Error deleting company:", deleteError)
      return NextResponse.json({ error: "Erro ao excluir empresa", details: deleteError }, { status: 500 })
    }

    console.log("[v0] Company deleted successfully:", companyId)

    return NextResponse.json({ success: true, message: "Empresa excluída com sucesso" })
  } catch (error) {
    console.error("[v0] Error in DELETE /api/companies/[companyId]:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
