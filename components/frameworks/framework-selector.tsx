"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BookOpen, CheckCircle, Clock, Globe, Building, Leaf, TrendingUp, AlertCircle, Info } from "lucide-react"
import { frameworkService, type Framework, type OrganizationFramework } from "@/lib/frameworks"

interface FrameworkSelectorProps {
  organizationId: string
  sector?: string
  region?: string
  onSelectionChange?: (selectedFrameworks: string[]) => void
}

export function FrameworkSelector({ organizationId, sector, region, onSelectionChange }: FrameworkSelectorProps) {
  const [availableFrameworks, setAvailableFrameworks] = useState<Framework[]>([])
  const [selectedFrameworks, setSelectedFrameworks] = useState<string[]>([])
  const [organizationFrameworks, setOrganizationFrameworks] = useState<OrganizationFramework[]>([])
  const [activeTab, setActiveTab] = useState("recommended")

  useEffect(() => {
    const frameworks = frameworkService.getAvailableFrameworks()
    const recommended = frameworkService.getRecommendedFrameworks(sector, region)
    const orgFrameworks = frameworkService.getOrganizationFrameworks(organizationId)

    setAvailableFrameworks(frameworks)
    setOrganizationFrameworks(orgFrameworks)
    setSelectedFrameworks(orgFrameworks.filter((of) => of.isActive).map((of) => of.frameworkId))
  }, [organizationId, sector, region])

  const handleFrameworkToggle = (frameworkId: string, checked: boolean) => {
    let newSelection: string[]

    if (checked) {
      newSelection = [...selectedFrameworks, frameworkId]
    } else {
      newSelection = selectedFrameworks.filter((id) => id !== frameworkId)
    }

    setSelectedFrameworks(newSelection)
    onSelectionChange?.(newSelection)
  }

  const getFrameworkIcon = (type: string) => {
    switch (type) {
      case "GRI":
        return <Globe className="w-5 h-5" />
      case "IFRS":
        return <Building className="w-5 h-5" />
      case "SASB":
        return <TrendingUp className="w-5 h-5" />
      case "TCFD":
        return <Leaf className="w-5 h-5" />
      default:
        return <BookOpen className="w-5 h-5" />
    }
  }

  const getFrameworkColor = (type: string) => {
    switch (type) {
      case "GRI":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "IFRS":
        return "bg-green-100 text-green-700 border-green-200"
      case "SASB":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "TCFD":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  const renderFrameworkCard = (framework: Framework, isRecommended = false) => {
    const isSelected = selectedFrameworks.includes(framework.id)
    const orgFramework = organizationFrameworks.find((of) => of.frameworkId === framework.id)
    const compliance = orgFramework ? frameworkService.checkCompliance(organizationId, framework.id) : null

    return (
      <Card key={framework.id} className={`relative transition-all ${isSelected ? "ring-2 ring-primary" : ""}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${getFrameworkColor(framework.type)}`}>
                {getFrameworkIcon(framework.type)}
              </div>
              <div>
                <CardTitle className="text-lg">{framework.name}</CardTitle>
                <CardDescription className="text-sm">
                  Version {framework.version} • {framework.type}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isRecommended && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  Recommended
                </Badge>
              )}
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleFrameworkToggle(framework.id, checked as boolean)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{framework.description}</p>

          {framework.sectors && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Applicable Sectors:</p>
              <div className="flex flex-wrap gap-1">
                {framework.sectors.slice(0, 3).map((sector) => (
                  <Badge key={sector} variant="outline" className="text-xs">
                    {sector}
                  </Badge>
                ))}
                {framework.sectors.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{framework.sectors.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {compliance && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">Compliance Progress</span>
                <span className="text-xs text-muted-foreground">
                  {compliance.completedStandards}/{compliance.totalStandards}
                </span>
              </div>
              <Progress value={compliance.compliancePercentage} className="h-2" />
              <p className="text-xs text-muted-foreground">{compliance.compliancePercentage}% complete</p>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {framework.lastUpdated.toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const recommendedFrameworks = frameworkService.getRecommendedFrameworks(sector, region)
  const otherFrameworks = availableFrameworks.filter((f) => !recommendedFrameworks.some((rf) => rf.id === f.id))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Framework Selection</h2>
          <p className="text-muted-foreground">Choose the reporting frameworks that apply to your organization</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">{selectedFrameworks.length}</div>
          <div className="text-sm text-muted-foreground">Selected</div>
        </div>
      </div>

      {sector && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Based on your sector ({sector}), we've recommended the most relevant frameworks for your industry.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="recommended" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Recommended ({recommendedFrameworks.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            All Frameworks ({availableFrameworks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          {recommendedFrameworks.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {recommendedFrameworks.map((framework) => renderFrameworkCard(framework, true))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">No specific recommendations available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {availableFrameworks.map((framework) => renderFrameworkCard(framework))}
          </div>
        </TabsContent>
      </Tabs>

      {selectedFrameworks.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Selected Frameworks</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedFrameworks.length} framework{selectedFrameworks.length !== 1 ? "s" : ""} selected
                </p>
              </div>
              <Button>Continue Setup</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
