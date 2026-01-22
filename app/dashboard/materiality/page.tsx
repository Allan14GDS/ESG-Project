"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { organizationService } from "@/lib/organization"
import { materialityService, type MaterialityAssessment } from "@/lib/materiality"
import { MaterialityMatrix } from "@/components/materiality/materiality-matrix"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, BarChart3, Users, FileText, Target, TrendingUp } from "lucide-react"

export default function MaterialityPage() {
  const router = useRouter()
  const [organization, setOrganization] = useState<any>(null)
  const [assessments, setAssessments] = useState<MaterialityAssessment[]>([])
  const [currentAssessment, setCurrentAssessment] = useState<MaterialityAssessment | null>(null)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    const org = organizationService.getOrganization()
    if (!org) {
      window.location.href = "/dashboard"
      return
    }

    setOrganization(org)

    // Load assessments
    const orgAssessments = materialityService.getAssessments(org.id)
    setAssessments(orgAssessments)

    if (orgAssessments.length > 0) {
      setCurrentAssessment(orgAssessments[0])
      const assessmentStats = materialityService.getAssessmentStats(orgAssessments[0].id)
      setStats(assessmentStats)
    }
  }, [])

  const handleCreateAssessment = () => {
    window.location.href = "/dashboard/materiality/new"
  }

  const handleTopicSelect = (topicId: string) => {
    if (currentAssessment) {
      window.location.href = `/dashboard/materiality/${currentAssessment.id}/topics/${topicId}`
    }
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading materiality assessment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4">
      <div className="container mx-auto max-w-7xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Materiality Assessment</h1>
            <p className="text-muted-foreground">Identify and prioritize your most material ESG topics</p>
          </div>
          <Button onClick={handleCreateAssessment} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Assessment
          </Button>
        </div>

        {assessments.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Materiality Assessments</h3>
              <p className="text-muted-foreground mb-4">
                Create your first materiality assessment to identify your most important ESG topics.
              </p>
              <Button onClick={handleCreateAssessment}>Create Assessment</Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="matrix" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="matrix" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Matrix View
              </TabsTrigger>
              <TabsTrigger value="topics" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Topics
              </TabsTrigger>
              <TabsTrigger value="stakeholders" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Stakeholders
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Reports
              </TabsTrigger>
            </TabsList>

            {/* Stats Overview */}
            {stats && (
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Total Topics</p>
                        <p className="text-2xl font-bold">{stats.totalTopics}</p>
                      </div>
                      <Target className="w-8 h-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Material Topics</p>
                        <p className="text-2xl font-bold">{stats.materialTopics}</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Priority Topics</p>
                        <p className="text-2xl font-bold">{stats.priorityTopics}</p>
                      </div>
                      <Target className="w-8 h-8 text-red-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Completion</p>
                        <p className="text-2xl font-bold">{stats.completionRate}%</p>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center">
                        <Progress value={stats.completionRate} className="w-6 h-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <TabsContent value="matrix">
              {currentAssessment ? (
                <MaterialityMatrix assessment={currentAssessment} onTopicSelect={handleTopicSelect} />
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No assessment selected</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="topics">
              <Card>
                <CardHeader>
                  <CardTitle>Topic Assessment</CardTitle>
                  <CardDescription>Assess the business impact and stakeholder importance of each topic</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Topic assessment interface will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stakeholders">
              <Card>
                <CardHeader>
                  <CardTitle>Stakeholder Engagement</CardTitle>
                  <CardDescription>Track stakeholder engagement activities and feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Stakeholder engagement interface will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Materiality Reports</CardTitle>
                  <CardDescription>Generate and publish materiality assessment reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Report generation interface will be available here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
}
