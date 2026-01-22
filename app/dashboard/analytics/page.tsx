"use client"

import { useState, useEffect } from "react"
import { organizationService } from "@/lib/organization"
import { ESGDashboard } from "@/components/analytics/esg-dashboard"
import { ESGInsights } from "@/components/ai/esg-insights"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, Brain } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function AnalyticsPage() {
  const [organization, setOrganization] = useState<any>(null)
  const [realData, setRealData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    const org = organizationService.getOrganization()
    if (!org) {
      window.location.href = "/dashboard"
      return
    }

    setOrganization(org)
    loadRealData()

    // Recarregar quando houver mudanças
    const handleStorageChange = () => loadRealData()
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("esg-data-updated", handleStorageChange)

    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("esg-data-updated", handleStorageChange)
    }
  }, [])

  const loadRealData = async () => {
    if (typeof window === "undefined") return

    setIsLoadingData(true)

    try {
      const supabase = createClient()

      // Fetch disclosures from Supabase
      const { data: supabaseDisclosures, error: disclosuresError } = await supabase.from("gri_disclosures").select("*")

      if (disclosuresError) {
        console.error("[v0] Error fetching disclosures:", disclosuresError)
      }

      // Fetch responses from Supabase
      const { data: supabaseResponses, error: responsesError } = await supabase.from("gri_responses").select("*")

      if (responsesError) {
        console.error("[v0] Error fetching responses:", responsesError)
      }

      // Also load localStorage data for backward compatibility
      const disclosuresData = localStorage.getItem("esg-disclosures")
      const employeeData = localStorage.getItem("esg-employee-matrices")
      const governanceData = localStorage.getItem("esg-governance-data")
      const organizationData = localStorage.getItem("esg-organization")

      // Merge Supabase and localStorage data
      const localDisclosures = disclosuresData ? JSON.parse(disclosuresData) : []
      const allDisclosures = supabaseDisclosures || localDisclosures

      setRealData({
        disclosures: allDisclosures,
        responses: supabaseResponses || [],
        employees: employeeData ? JSON.parse(employeeData) : [],
        governance: governanceData ? JSON.parse(governanceData) : null,
        organization: organizationData ? JSON.parse(organizationData) : null,
      })

      console.log("[v0] Loaded analytics data:", {
        disclosuresCount: allDisclosures.length,
        responsesCount: supabaseResponses?.length || 0,
      })
    } catch (error) {
      console.error("[v0] Error loading analytics data:", error)

      // Fallback to localStorage only
      const disclosuresData = localStorage.getItem("esg-disclosures")
      const employeeData = localStorage.getItem("esg-employee-matrices")
      const governanceData = localStorage.getItem("esg-governance-data")
      const organizationData = localStorage.getItem("esg-organization")

      setRealData({
        disclosures: disclosuresData ? JSON.parse(disclosuresData) : [],
        responses: [],
        employees: employeeData ? JSON.parse(employeeData) : [],
        governance: governanceData ? JSON.parse(governanceData) : null,
        organization: organizationData ? JSON.parse(organizationData) : null,
      })
    } finally {
      setIsLoadingData(false)
    }
  }

  if (!organization || isLoadingData) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{!organization ? "Loading analytics..." : "Carregando dados..."}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ESG Analytics & Insights</h1>
          <p className="text-muted-foreground">
            Comprehensive analytics and AI-powered insights for your ESG performance
          </p>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Performance Dashboard
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ESGDashboard organizationId={organization.id} realData={realData} />
          </TabsContent>

          <TabsContent value="insights">
            <ESGInsights organizationId={organization.id} realData={realData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
