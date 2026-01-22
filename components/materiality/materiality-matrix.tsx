"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ZoomIn, ZoomOut, Download, Settings } from "lucide-react"
import type { MaterialityAssessment, MaterialityTopic } from "@/lib/materiality"
import { materialityService } from "@/lib/materiality"

interface MaterialityMatrixProps {
  assessment: MaterialityAssessment
  onTopicSelect?: (topicId: string) => void
  interactive?: boolean
}

export function MaterialityMatrix({ assessment, onTopicSelect, interactive = true }: MaterialityMatrixProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [topics, setTopics] = useState<MaterialityTopic[]>([])

  useEffect(() => {
    // Load topic details
    const topicDetails = assessment.topics
      .map((ta) => {
        const topic = materialityService.getTopicById(ta.topicId)
        return topic
      })
      .filter(Boolean) as MaterialityTopic[]

    setTopics(topicDetails)
  }, [assessment])

  useEffect(() => {
    drawMatrix()
  }, [assessment, topics, zoom, selectedTopic])

  const drawMatrix = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const width = rect.width
    const height = rect.height
    const padding = 60
    const plotWidth = width - 2 * padding
    const plotHeight = height - 2 * padding

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw background
    ctx.fillStyle = "#fafafa"
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = "#e5e5e5"
    ctx.lineWidth = 1

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / 10) * plotWidth
      ctx.beginPath()
      ctx.moveTo(x, padding)
      ctx.lineTo(x, height - padding)
      ctx.stroke()
    }

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = padding + (i / 10) * plotHeight
      ctx.beginPath()
      ctx.moveTo(padding, y)
      ctx.lineTo(width - padding, y)
      ctx.stroke()
    }

    // Draw axes
    ctx.strokeStyle = "#374151"
    ctx.lineWidth = 2

    // X-axis
    ctx.beginPath()
    ctx.moveTo(padding, height - padding)
    ctx.lineTo(width - padding, height - padding)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, height - padding)
    ctx.stroke()

    // Draw threshold lines
    const materialThreshold = assessment.matrixConfig.thresholds.material
    const priorityThreshold = assessment.matrixConfig.thresholds.highPriority
    const scale = assessment.matrixConfig.scale

    // Material threshold line (diagonal)
    ctx.strokeStyle = "#f59e0b"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    const materialX = padding + (materialThreshold / scale.max) * plotWidth
    const materialY = height - padding - (materialThreshold / scale.max) * plotHeight

    ctx.beginPath()
    ctx.moveTo(padding, materialY)
    ctx.lineTo(materialX, height - padding)
    ctx.stroke()

    // Priority threshold line
    ctx.strokeStyle = "#ef4444"
    const priorityX = padding + (priorityThreshold / scale.max) * plotWidth
    const priorityY = height - padding - (priorityThreshold / scale.max) * plotHeight

    ctx.beginPath()
    ctx.moveTo(padding, priorityY)
    ctx.lineTo(priorityX, height - padding)
    ctx.stroke()

    ctx.setLineDash([])

    // Draw quadrant labels
    ctx.fillStyle = "#6b7280"
    ctx.font = "14px Inter, sans-serif"
    ctx.textAlign = "center"

    const midX = width / 2
    const midY = height / 2

    // Top-left: Monitor
    ctx.fillText("Monitor", padding + plotWidth * 0.25, padding + plotHeight * 0.25)

    // Top-right: Material
    ctx.fillText("Material", padding + plotWidth * 0.75, padding + plotHeight * 0.25)

    // Bottom-left: Low Priority
    ctx.fillText("Low Priority", padding + plotWidth * 0.25, padding + plotHeight * 0.75)

    // Bottom-right: Manage
    ctx.fillText("Manage", padding + plotWidth * 0.75, padding + plotHeight * 0.75)

    // Draw topics
    assessment.topics.forEach((topicAssessment) => {
      const topic = topics.find((t) => t.id === topicAssessment.topicId)
      if (!topic) return

      const x = padding + (topicAssessment.businessImpact.score / scale.max) * plotWidth
      const y = height - padding - (topicAssessment.stakeholderImportance.score / scale.max) * plotHeight

      // Determine color based on category and materiality
      let color = "#9ca3af" // Default gray
      if (topicAssessment.isPriority) {
        color = "#ef4444" // Red for priority
      } else if (topicAssessment.isMaterial) {
        color = "#f59e0b" // Amber for material
      } else {
        switch (topic.category) {
          case "environmental":
            color = "#10b981"
            break
          case "social":
            color = "#3b82f6"
            break
          case "governance":
            color = "#8b5cf6"
            break
          case "economic":
            color = "#f59e0b"
            break
        }
      }

      // Draw topic circle
      const radius = selectedTopic === topic.id ? 8 : 6
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)
      ctx.fill()

      // Draw border for selected topic
      if (selectedTopic === topic.id) {
        ctx.strokeStyle = "#1f2937"
        ctx.lineWidth = 2
        ctx.stroke()
      }

      // Draw topic label (abbreviated)
      ctx.fillStyle = "#1f2937"
      ctx.font = "10px Inter, sans-serif"
      ctx.textAlign = "center"
      const label = topic.name.length > 15 ? topic.name.substring(0, 12) + "..." : topic.name
      ctx.fillText(label, x, y + radius + 12)
    })

    // Draw axis labels
    ctx.fillStyle = "#374151"
    ctx.font = "14px Inter, sans-serif"
    ctx.textAlign = "center"

    // X-axis label
    ctx.fillText(assessment.matrixConfig.xAxisLabel, width / 2, height - 20)

    // Y-axis label (rotated)
    ctx.save()
    ctx.translate(20, height / 2)
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(assessment.matrixConfig.yAxisLabel, 0, 0)
    ctx.restore()
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactive) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const padding = 60
    const plotWidth = rect.width - 2 * padding
    const plotHeight = rect.height - 2 * padding
    const scale = assessment.matrixConfig.scale

    // Find clicked topic
    let clickedTopic: string | null = null
    let minDistance = Number.POSITIVE_INFINITY

    assessment.topics.forEach((topicAssessment) => {
      const topicX = padding + (topicAssessment.businessImpact.score / scale.max) * plotWidth
      const topicY = padding + ((scale.max - topicAssessment.stakeholderImportance.score) / scale.max) * plotHeight

      const distance = Math.sqrt((x - topicX) ** 2 + (y - topicY) ** 2)

      if (distance < 15 && distance < minDistance) {
        minDistance = distance
        clickedTopic = topicAssessment.topicId
      }
    })

    if (clickedTopic) {
      setSelectedTopic(clickedTopic)
      onTopicSelect?.(clickedTopic)
    } else {
      setSelectedTopic(null)
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "environmental":
        return "bg-green-100 text-green-700 border-green-200"
      case "social":
        return "bg-blue-100 text-blue-700 border-blue-200"
      case "governance":
        return "bg-purple-100 text-purple-700 border-purple-200"
      case "economic":
        return "bg-amber-100 text-amber-700 border-amber-200"
      default:
        return "bg-gray-100 text-gray-700 border-gray-200"
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Materiality Matrix</CardTitle>
              <CardDescription>
                Visual representation of topic materiality based on business impact and stakeholder importance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-96 border rounded-lg cursor-pointer"
              onClick={handleCanvasClick}
              style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Topic Categories</h4>
              <div className="flex flex-wrap gap-2">
                <Badge className={getCategoryColor("environmental")}>Environmental</Badge>
                <Badge className={getCategoryColor("social")}>Social</Badge>
                <Badge className={getCategoryColor("governance")}>Governance</Badge>
                <Badge className={getCategoryColor("economic")}>Economic</Badge>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Materiality Levels</h4>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Priority Topics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                  <span className="text-sm">Material Topics</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm">Other Topics</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Topic Details */}
      {selectedTopic && (
        <Card>
          <CardContent className="p-4">
            {(() => {
              const topicAssessment = assessment.topics.find((ta) => ta.topicId === selectedTopic)
              const topic = topics.find((t) => t.id === selectedTopic)

              if (!topicAssessment || !topic) return null

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{topic.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge className={getCategoryColor(topic.category)}>{topic.category}</Badge>
                      {topicAssessment.isPriority && (
                        <Badge className="bg-red-100 text-red-700 border-red-200">Priority</Badge>
                      )}
                      {topicAssessment.isMaterial && !topicAssessment.isPriority && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">Material</Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">{topic.description}</p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Business Impact:</span>
                      <span className="ml-2 text-sm">{topicAssessment.businessImpact.score}/10</span>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Stakeholder Importance:</span>
                      <span className="ml-2 text-sm">{topicAssessment.stakeholderImportance.score}/10</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
