"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users2 } from "lucide-react"
import type { NonEmployeeWorkers } from "@/lib/employee-data"

interface NonEmployeeFormProps {
  initialData?: NonEmployeeWorkers
  onSubmit: (data: NonEmployeeWorkers) => void
  onBack: () => void
}

export function NonEmployeeForm({ initialData, onSubmit, onBack }: NonEmployeeFormProps) {
  const [contractors, setContractors] = useState(initialData?.contractors || 0)
  const [freelancers, setFreelancers] = useState(initialData?.freelancers || 0)
  const [temporaryWorkers, setTemporaryWorkers] = useState(initialData?.temporaryWorkers || 0)
  const [error, setError] = useState("")
  const [showExamples, setShowExamples] = useState(true)

  const total = contractors + freelancers + temporaryWorkers

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (contractors < 0 || freelancers < 0 || temporaryWorkers < 0) {
      setError("Values cannot be negative")
      return
    }

    const nonEmployeeData: NonEmployeeWorkers = {
      contractors,
      freelancers,
      temporaryWorkers,
      total,
    }

    onSubmit(nonEmployeeData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
            <Users2 className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex-1">
            <CardTitle>Non-Employee Workers</CardTitle>
            <CardDescription>Workers who are not employees but work for the organization (GRI 2-8)</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-secondary">{total}</div>
            <div className="text-sm text-muted-foreground">Total Workers</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showExamples && (
            <Alert>
              <Users2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-medium">Examples of non-employee workers to include:</p>
                  <div className="grid gap-3 text-sm">
                    <div>
                      <strong>Contractors/Outsourced:</strong> Security guards, cleaning staff, IT support, maintenance
                      workers provided by external companies
                    </div>
                    <div>
                      <strong>Freelancers/Independent:</strong> Consultants, designers, writers, specialists hired
                      directly
                    </div>
                    <div>
                      <strong>Temporary Workers:</strong> Seasonal staff, project-based workers, temporary replacements
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowExamples(false)} className="mt-2 h-6 text-xs">
                    Hide Examples
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6">
            <div className="space-y-3">
              <Label htmlFor="contractors" className="text-base font-medium">
                Contractors / Outsourced Workers
              </Label>
              <Input
                id="contractors"
                type="number"
                min="0"
                value={contractors || ""}
                onChange={(e) => setContractors(Number.parseInt(e.target.value) || 0)}
                placeholder="Enter number of contractors"
                className="text-lg h-12"
                style={{
                  backgroundColor: contractors > 0 ? "rgb(34 197 94 / 0.1)" : undefined,
                  borderColor: contractors > 0 ? "rgb(34 197 94 / 0.3)" : undefined,
                }}
              />
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Include:</strong> Workers provided by third-party contractors or outsourcing companies
                </p>
                <p className="text-xs text-muted-foreground">
                  Examples: Security guards, cleaning staff, IT support, maintenance workers, catering staff
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="freelancers" className="text-base font-medium">
                Freelancers / Independent Contractors
              </Label>
              <Input
                id="freelancers"
                type="number"
                min="0"
                value={freelancers || ""}
                onChange={(e) => setFreelancers(Number.parseInt(e.target.value) || 0)}
                placeholder="Enter number of freelancers"
                className="text-lg h-12"
                style={{
                  backgroundColor: freelancers > 0 ? "rgb(34 197 94 / 0.1)" : undefined,
                  borderColor: freelancers > 0 ? "rgb(34 197 94 / 0.3)" : undefined,
                }}
              />
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Include:</strong> Independent contractors, consultants, and freelance workers
                </p>
                <p className="text-xs text-muted-foreground">
                  Examples: Business consultants, graphic designers, writers, specialists, advisors
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="temporaryWorkers" className="text-base font-medium">
                Temporary Workers
              </Label>
              <Input
                id="temporaryWorkers"
                type="number"
                min="0"
                value={temporaryWorkers || ""}
                onChange={(e) => setTemporaryWorkers(Number.parseInt(e.target.value) || 0)}
                placeholder="Enter number of temporary workers"
                className="text-lg h-12"
                style={{
                  backgroundColor: temporaryWorkers > 0 ? "rgb(34 197 94 / 0.1)" : undefined,
                  borderColor: temporaryWorkers > 0 ? "rgb(34 197 94 / 0.3)" : undefined,
                }}
              />
              <div className="bg-muted/30 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">
                  <strong>Include:</strong> Temporary staff, seasonal workers, and short-term contractors
                </p>
                <p className="text-xs text-muted-foreground">
                  Examples: Holiday season workers, project-based staff, temporary replacements, interns
                </p>
              </div>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-secondary/10 to-secondary/5 border-secondary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-medium">Total Non-Employee Workers</h3>
                  <p className="text-sm text-muted-foreground">All categories combined</p>
                </div>
                <div className="text-3xl font-bold text-secondary">{total}</div>
              </div>
              {total > 0 && (
                <div className="grid grid-cols-3 gap-4 pt-3 border-t border-secondary/20">
                  <div className="text-center">
                    <div className="text-lg font-medium">{contractors}</div>
                    <div className="text-xs text-muted-foreground">Contractors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-medium">{freelancers}</div>
                    <div className="text-xs text-muted-foreground">Freelancers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-medium">{temporaryWorkers}</div>
                    <div className="text-xs text-muted-foreground">Temporary</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-6">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit" className="px-8">
              Complete Employee Data
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
