"use server"

import { createAdminClient } from "@/lib/supabase/admin"

export async function getTemplates() {
  try {
    const adminClient = createAdminClient()

    const { data: templates, error } = await adminClient
      .from("book_templates") // Changed from form_templates to book_templates
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch templates: ${error.message}`)
    }

    return { data: templates }
  } catch (error: any) {
    console.error("[v0] Error in getTemplates:", error)
    return { error: error.message || "Unknown error occurred" }
  }
}

export async function addBookToCompany({
  companyId,
  templateId,
}: {
  companyId: string
  templateId: string
}) {
  console.log("[v0] Adding book to company:", companyId, "with template:", templateId)

  try {
    const adminClient = createAdminClient()

    // First, get the company details
    const { data: company, error: companyError } = await adminClient
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .single()

    if (companyError || !company) {
      throw new Error(`Company not found: ${companyError?.message}`)
    }

    console.log("[v0] Found company:", company.name)

    // Check if an organization exists for this company (by CNPJ or name)
    let organizationId: string

    const { data: existingOrg } = await adminClient.from("organizations").select("id").eq("cnpj", company.cnpj).single()

    if (existingOrg) {
      organizationId = existingOrg.id
      console.log("[v0] Found existing organization:", organizationId)
    } else {
      // The organizations.holding_id references organizations table, not holdings table
      console.log("[v0] Creating organization for company...")
      const { data: newOrg, error: orgError } = await adminClient
        .from("organizations")
        .insert({
          name: company.name,
          cnpj: company.cnpj,
          type: "company",
        })
        .select()
        .single()

      if (orgError) {
        throw new Error(`Failed to create organization: ${orgError.message}`)
      }

      organizationId = newOrg.id
      console.log("[v0] Created organization:", organizationId)
    }

    // Now create the book with the valid organization_id
    console.log("[v0] Creating book with organization_id:", organizationId)
    const { data: book, error: bookError } = await adminClient
      .from("books")
      .insert({
        organization_id: organizationId,
        template_id: templateId,
      })
      .select()
      .single()

    if (bookError) {
      console.error("[v0] Book creation error:", bookError)
      throw new Error(`Failed to create book: ${bookError.message}`)
    }

    console.log("[v0] Book created successfully:", book.id)

    return { data: book }
  } catch (error: any) {
    console.error("[v0] Error in addBookToCompany:", error)
    return { error: error.message || "Unknown error occurred" }
  }
}
