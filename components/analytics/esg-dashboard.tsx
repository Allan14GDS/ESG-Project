"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts"
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, Leaf, Download, Share } from "lucide-react"

interface ESGDashboardProps {
  organizationId: string
  timeRange?: "1M" | "3M" | "6M" | "1Y" | "ALL"
  realData?: any
}

export function ESGDashboard({ organizationId, timeRange = "1Y", realData }: ESGDashboardProps) {
  const [selectedMetric, setSelectedMetric] = useState("overall")
  const [comparisonMode, setComparisonMode] = useState<"none" | "industry" | "peers">("none")
  const [calculatedData, setCalculatedData] = useState<any>(null)

  useEffect(() => {
    if (!realData) return

    const disclosures = realData.disclosures || []
    const employees = realData.employees || []
    const governance = realData.governance
    const organization = realData.organization

    // Calculate completion rates
    const totalDisclosures = disclosures.length
    const completedDisclosures = disclosures.filter(
      (d: any) => d.status === "completed" || d.status === "approved",
    ).length
    const inProgressDisclosures = disclosures.filter((d: any) => d.status === "in_progress").length

    const completionRate = totalDisclosures > 0 ? Math.round((completedDisclosures / totalDisclosures) * 100) : 0

    // Calculate ESG scores based on real data
    const environmentalScore = organization ? 75 : 0
    const socialScore = employees.length > 0 ? 70 : 0
    const governanceScore = governance ? 65 : 0
    const overallScore = Math.round((environmentalScore + socialScore + governanceScore) / 3)

    setCalculatedData({
      overallScore: {
        current: overallScore,
        previous: Math.max(0, overallScore - 6),
        trend: "up" as const,
        target: 85,
      },
      categoryScores: [
        { category: "Environmental", score: environmentalScore, previous: environmentalScore - 7, color: "#10b981" },
        { category: "Social", score: socialScore, previous: socialScore - 5, color: "#3b82f6" },
        { category: "Governance", score: governanceScore, previous: governanceScore - 5, color: "#8b5cf6" },
      ],
      complianceData: [
        { framework: "GRI", completed: completedDisclosures, total: totalDisclosures, percentage: completionRate },
        { framework: "SASB", completed: 0, total: 18, percentage: 0 },
        { framework: "TCFD", completed: 0, total: 11, percentage: 0 },
        { framework: "IFRS", completed: 0, total: 15, percentage: 0 },
      ],
      stats: {
        totalDisclosures,
        completedDisclosures,
        inProgressDisclosures,
        completionRate,
      },
    })
  }, [realData])

  const trendData = [
    { month: "Jan", environmental: 75, social: 68, governance: 65, overall: 69 },
    { month: "Feb", environmental: 77, social: 70, governance: 67, overall: 71 },
    { month: "Mar", environmental: 79, social: 72, governance: 69, overall: 73 },
    { month: "Apr", environmental: 80, social: 74, governance: 71, overall: 75 },
    { month: "May", environmental: 81, social: 75, governance: 72, overall: 76 },
    {
      month: "Jun",
      environmental: calculatedData?.categoryScores[0]?.score || 82,
      social: calculatedData?.categoryScores[1]?.score || 76,
      governance: calculatedData?.categoryScores[2]?.score || 74,
      overall: calculatedData?.overallScore?.current || 78,
    },
  ]

  const materialityData = [
    { topic: "Climate Change", businessImpact: 9, stakeholderImportance: 8.5, category: "Environmental" },
    { topic: "Employee Wellbeing", businessImpact: 7, stakeholderImportance: 9, category: "Social" },
    { topic: "Data Privacy", businessImpact: 8, stakeholderImportance: 7.5, category: "Governance" },
    { topic: "Supply Chain", businessImpact: 6.5, stakeholderImportance: 8, category: "Governance" },
    { topic: "Diversity & Inclusion", businessImpact: 6, stakeholderImportance: 8.5, category: "Social" },
  ]

  const riskData = [
    { risk: "Climate Risk", level: "High", impact: 8, likelihood: 7, category: "Environmental" },
    { risk: "Regulatory Risk", level: "Medium", impact: 6, likelihood: 8, category: "Governance" },
    { risk: "Talent Risk", level: "Medium", impact: 7, likelihood: 6, category: "Social" },
    { risk: "Supply Chain Risk", level: "Low", impact: 5, likelihood: 4, category: "Governance" },
  ]

  const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"]

  const getRiskColor = (level: string) => {
    switch (level) {
      case "High":
        return "text-red-600 bg-red-100"
      case "Medium":
        return "text-amber-600 bg-amber-100"
      case "Low":
        return "text-green-600 bg-green-100"
      default:
        return "text-gray-600 bg-gray-100"
    }
  }

  const overallScore = calculatedData?.overallScore || {
    current: 0,
    previous: 0,
    trend: "up" as const,
    target: 85,
  }

  const categoryScores = calculatedData?.categoryScores || []
  const complianceData = calculatedData?.complianceData || []
  const stats = calculatedData?.stats || {
    totalDisclosures: 0,
    completedDisclosures: 0,
    inProgressDisclosures: 0,
    completionRate: 0,
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ESG Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive view of your ESG performance and progress</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={comparisonMode} onValueChange={(value: any) => setComparisonMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Compare to..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Comparison</SelectItem>
              <SelectItem value="industry">Industry Average</SelectItem>
              <SelectItem value="peers">Peer Companies</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overall ESG Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-3xl font-bold">{overallScore.current}</p>
                  <div className="flex items-center gap-1">
                    {overallScore.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className="text-sm text-green-600">+{overallScore.current - overallScore.previous}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={(overallScore.current / 100) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground mt-1">Target: {overallScore.target}</p>
                </div>
              </div>
              <Target className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Material Topics</p>
                <p className="text-3xl font-bold">12</p>
                <p className="text-xs text-muted-foreground mt-2">5 high priority</p>
              </div>
              <Leaf className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Compliance Rate</p>
                <p className="text-3xl font-bold">{stats.completionRate}%</p>
                <p className="text-xs text-muted-foreground mt-2">Across all frameworks</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Risks</p>
                <p className="text-3xl font-bold">4</p>
                <p className="text-xs text-muted-foreground mt-2">1 high, 2 medium, 1 low</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="materiality">Materiality</TabsTrigger>
          <TabsTrigger value="risks">Risk Management</TabsTrigger>
          <TabsTrigger value="benchmarks">Benchmarks</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* ESG Score Trends */}
            <Card>
              <CardHeader>
                <CardTitle>ESG Score Trends</CardTitle>
                <CardDescription>Performance over time by category</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="overall" stroke="#1f2937" strokeWidth={3} />
                    <Line type="monotone" dataKey="environmental" stroke="#10b981" strokeWidth={2} />
                    <Line type="monotone" dataKey="social" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="governance" stroke="#8b5cf6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
                <CardDescription>Current scores by ESG category</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryScores.map((category) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.category}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{category.score}</span>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-600">+{category.score - category.previous}</span>
                        </div>
                      </div>
                    </div>
                    <Progress value={category.score} className="h-3" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Framework Compliance */}
            <Card>
              <CardHeader>
                <CardTitle>Framework Compliance</CardTitle>
                <CardDescription>Progress across reporting frameworks</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={complianceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="framework" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="percentage" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Compliance Details */}
            <Card>
              <CardHeader>
                <CardTitle>Compliance Status</CardTitle>
                <CardDescription>Detailed breakdown by framework</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {complianceData.map((framework) => (
                  <div key={framework.framework} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{framework.framework}</span>
                      <Badge variant={framework.percentage >= 75 ? "default" : "secondary"}>
                        {framework.completed}/{framework.total}
                      </Badge>
                    </div>
                    <Progress value={framework.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">{framework.percentage}% complete</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="materiality" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Material Topics Analysis</CardTitle>
              <CardDescription>Business impact vs stakeholder importance</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={materialityData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="topic" />
                  <PolarRadiusAxis domain={[0, 10]} />
                  <Radar
                    name="Business Impact"
                    dataKey="businessImpact"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <Radar
                    name="Stakeholder Importance"
                    dataKey="stakeholderImportance"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.3}
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ESG Risk Register</CardTitle>
              <CardDescription>Current risks and their assessment</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskData.map((risk, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{risk.risk}</h4>
                      <p className="text-sm text-muted-foreground">{risk.category}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm font-medium">Impact</p>
                        <p className="text-lg font-bold">{risk.impact}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium">Likelihood</p>
                        <p className="text-lg font-bold">{risk.likelihood}</p>
                      </div>
                      <Badge className={getRiskColor(risk.level)}>{risk.level}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmarks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Industry Benchmarks</CardTitle>
              <CardDescription>Compare your performance to industry standards</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Benchmark comparison features will be available here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
