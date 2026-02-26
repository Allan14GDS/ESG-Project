"use client"

import { Card, CardContent } from "@/components/ui/card"

interface EnrichmentStatusCardProps {
  label: string
  value: string | number
  description?: string
  icon: React.ReactNode
  color?: string
}

export function EnrichmentStatusCard({ label, value, description, icon, color = "text-emerald-600" }: EnrichmentStatusCardProps) {
  return (
    <Card className="border border-border/50">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/50 border border-border/30 ${color}`}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold tracking-tight mt-0.5">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
