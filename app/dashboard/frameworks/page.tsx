"use client"

import { useState, useEffect } from "react"
import { organizationService } from "@/lib/organization"
import { FrameworkSelector } from "@/components/frameworks/framework-selector"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, Settings, BarChart3, CheckCircle, AlertTriangle, Plus } from "lucide-react"

export default function FrameworksPage() {
  const [organization, setOrganization] = useState<any>(null)
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("selection")

  useEffect(() => {
    const org = organizationService.getOrganization()
    if (!org) {
      window.location.href = "/dashboard"
      return
    }

    setOrganization(org)
  }, [])

  if (!organization) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading frameworks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reporting Frameworks</h1>
            <p className="text-muted-foreground">Manage your ESG reporting frameworks and compliance standards</p>
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Custom Framework
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="selection" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Framework Selection
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Compliance Overview
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="selection">
            <FrameworkSelector
              organizationId={organization.id}
              sector={organization.sector}
              region={organization.region}
              onSelectionChange={setSelectedFrameworks}
            />
          </TabsContent>

          <TabsContent value="compliance" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">GRI Standards</CardTitle>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">12/25</span>
                    </div>
                    <Progress value={48} className="h-2" />
                    <p className="text-xs text-muted-foreground">48% complete</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm text-amber-600">13 disclosures pending</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">IFRS S1 & S2</CardTitle>
                    <Badge variant="outline">Inactive</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">0/18</span>
                    </div>
                    <Progress value={0} className="h-2" />
                    <p className="text-xs text-muted-foreground">Not started</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full bg-transparent">
                    Activate Framework
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">TCFD</CardTitle>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                      Active
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">8/11</span>
                    </div>
                    <Progress value={73} className="h-2" />
                    <p className="text-xs text-muted-foreground">73% complete</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">On track</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Overall Compliance Status</CardTitle>
                <CardDescription>
                  Summary of your organization's compliance across all active frameworks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Total Progress</span>
                        <span className="text-sm text-muted-foreground">20/36</span>
                      </div>
                      <Progress value={56} className="h-3" />
                      <p className="text-xs text-muted-foreground mt-1">56% of all required disclosures</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">20</div>
                        <div className="text-xs text-green-600">Completed</div>
                      </div>
                      <div className="text-center p-3 bg-amber-50 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">16</div>
                        <div className="text-xs text-amber-600">Pending</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium">Next Actions</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span className="text-sm">Complete GRI 2-9 (Governance structure)</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                        <span className="text-sm">Update GRI 2-7 (Employee data)</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Review TCFD climate metrics</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Framework Settings</CardTitle>
                <CardDescription>Configure reporting periods, customizations, and preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Framework settings will be available here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
