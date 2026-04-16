"use client"

import { useRouter } from "next/navigation"
import { CalendarDays } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface YearFilterProps {
  initialYear: number
}

export function YearFilter({ initialYear }: YearFilterProps) {
  const router = useRouter()

  return (
    <div className="flex items-center gap-2">
      <CalendarDays className="h-4 w-4 text-muted-foreground" />
      <Select
        defaultValue={String(initialYear)}
        onValueChange={(value) => router.push(`?year=${value}`)}
      >
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="Ano de Referência" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="2026">2026 (Atual)</SelectItem>
          <SelectItem value="2025">2025</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
