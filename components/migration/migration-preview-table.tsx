"use client"

import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import type { MigrationPreviewItem, UnmatchedRow } from "@/lib/migration/types"

interface MigrationPreviewTableProps {
  matched: MigrationPreviewItem[]
  unmatched: UnmatchedRow[]
  onToggleItem: (index: number) => void
}

function MatchTypeBadge({ type, similarity }: { type: string; similarity: number }) {
  if (type === "exact") {
    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">Exato</Badge>
  }
  if (type === "normalized") {
    return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">Normalizado</Badge>
  }
  return (
    <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs">
      Fuzzy {Math.round(similarity * 100)}%
    </Badge>
  )
}

export function MigrationPreviewTable({ matched, unmatched, onToggleItem }: MigrationPreviewTableProps) {
  return (
    <div className="space-y-6">
      {/* Matched Questions */}
      {matched.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 text-foreground">
            Questoes Encontradas ({matched.length})
          </h4>
          <div className="border rounded-lg overflow-hidden">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left w-8"></th>
                    <th className="p-2 text-left text-xs font-medium text-muted-foreground">Excel #</th>
                    <th className="p-2 text-left text-xs font-medium text-muted-foreground">Questao</th>
                    <th className="p-2 text-left text-xs font-medium text-muted-foreground">Match</th>
                    <th className="p-2 text-left text-xs font-medium text-muted-foreground">Alteracoes</th>
                  </tr>
                </thead>
                <tbody>
                  {matched.map((item, index) => (
                    <tr key={item.questionId} className={`border-t ${!item.included ? "opacity-40" : ""}`}>
                      <td className="p-2">
                        <Checkbox
                          checked={item.included}
                          onCheckedChange={() => onToggleItem(index)}
                          className="h-4 w-4"
                        />
                      </td>
                      <td className="p-2 text-xs text-muted-foreground">{item.excelRowIndex}</td>
                      <td className="p-2">
                        <p className="text-xs leading-relaxed line-clamp-2" title={item.label}>
                          {item.label}
                        </p>
                      </td>
                      <td className="p-2">
                        <MatchTypeBadge type={item.matchType} similarity={item.similarity} />
                      </td>
                      <td className="p-2">
                        {item.changes.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">Sem alteracoes</span>
                        ) : (
                          <div className="space-y-1">
                            {item.changes.slice(0, 3).map((change) => (
                              <div key={change.field} className="text-xs">
                                <span className="font-medium text-muted-foreground">{change.field}: </span>
                                {change.oldValue && (
                                  <span className="text-red-500 line-through mr-1">
                                    {String(change.oldValue).substring(0, 20)}
                                  </span>
                                )}
                                <span className="text-emerald-600">
                                  {change.newValue.substring(0, 30)}
                                </span>
                              </div>
                            ))}
                            {item.changes.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{item.changes.length - 3} mais
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Unmatched Rows */}
      {unmatched.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 text-red-600">
            Nao Encontradas no Banco ({unmatched.length})
          </h4>
          <div className="border border-red-200 rounded-lg overflow-hidden bg-red-50/30">
            <div className="max-h-[200px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-red-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left text-xs font-medium text-red-600">Excel #</th>
                    <th className="p-2 text-left text-xs font-medium text-red-600">Texto do Excel</th>
                    <th className="p-2 text-left text-xs font-medium text-red-600">Melhor Match</th>
                  </tr>
                </thead>
                <tbody>
                  {unmatched.map((row) => (
                    <tr key={row.excelRowIndex} className="border-t border-red-100">
                      <td className="p-2 text-xs text-red-500">{row.excelRowIndex}</td>
                      <td className="p-2">
                        <p className="text-xs line-clamp-2">{row.label}</p>
                      </td>
                      <td className="p-2">
                        {row.bestMatch ? (
                          <div className="text-xs">
                            <span className="text-muted-foreground">{Math.round(row.bestMatch.similarity * 100)}% - </span>
                            <span className="line-clamp-1">{row.bestMatch.label.substring(0, 50)}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Nenhum</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
