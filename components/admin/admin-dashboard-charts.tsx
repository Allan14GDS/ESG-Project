"use client"

import { Card, CardContent } from "@/components/ui/card"
import { useMemo } from "react"

interface AnswersByDay {
  date: string
  count: number
}

interface CompanyProgress {
  name: string
  answered: number
  total: number
  percentage: number
}

interface AdminDashboardChartsProps {
  answersByDay: AnswersByDay[]
  companyProgress: CompanyProgress[]
}

export function AdminDashboardCharts({ answersByDay, companyProgress }: AdminDashboardChartsProps) {
  const chartData = useMemo(() => {
    if (answersByDay.length === 0) return { bars: [], maxCount: 0 }

    const maxCount = Math.max(...answersByDay.map((d) => d.count), 1)
    const bars = answersByDay.map((d) => ({
      ...d,
      height: (d.count / maxCount) * 100,
      label: new Date(d.date + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }),
    }))

    return { bars, maxCount }
  }, [answersByDay])

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Answers Velocity Chart */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Respostas por Dia
          </h3>
          <p className="text-xs text-muted-foreground mb-4">Ultimos 30 dias</p>

          {chartData.bars.length > 0 ? (
            <div className="flex items-end gap-[3px] h-40">
              {chartData.bars.map((bar) => (
                <div
                  key={bar.date}
                  className="group relative flex-1 flex flex-col items-center justify-end h-full"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block z-10">
                    <div className="bg-foreground text-background text-xs px-2 py-1 rounded whitespace-nowrap">
                      {bar.label}: {bar.count}
                    </div>
                  </div>
                  <div
                    className="w-full rounded-t-sm bg-primary/70 hover:bg-primary transition-colors min-h-[2px]"
                    style={{ height: `${Math.max(bar.height, 2)}%` }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Nenhuma resposta registrada nos ultimos 30 dias
            </div>
          )}

          {chartData.bars.length > 0 && (
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{chartData.bars[0]?.label}</span>
              <span>{chartData.bars[Math.floor(chartData.bars.length / 2)]?.label}</span>
              <span>{chartData.bars[chartData.bars.length - 1]?.label}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Progress */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">
            Progresso por Empresa
          </h3>
          <p className="text-xs text-muted-foreground mb-4">
            Questoes respondidas / total
          </p>

          {companyProgress.length > 0 ? (
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
              {companyProgress.map((company) => (
                <div key={company.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium truncate mr-2">{company.name}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {company.answered}/{company.total} ({company.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        company.percentage === 100
                          ? "bg-emerald-500"
                          : company.percentage > 50
                          ? "bg-blue-500"
                          : company.percentage > 0
                          ? "bg-amber-500"
                          : "bg-muted-foreground/20"
                      }`}
                      style={{ width: `${company.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Nenhuma empresa com cadernos atribuidos
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
