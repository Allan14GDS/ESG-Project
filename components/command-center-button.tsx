"use client"

import { Button } from "@/components/ui/button"
import { LayoutGrid } from "lucide-react"
import Link from "next/link"

interface CommandCenterButtonProps {
  userRole?: string
}

export function CommandCenterButton({ userRole }: CommandCenterButtonProps) {
  // Only show for admin_main
  if (userRole !== "admin_main") {
    return null
  }

  return (
    <Link href="/admin/command-center">
      <Button
        variant="outline"
        size="sm"
        className="gap-2 border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary"
      >
        <LayoutGrid className="h-4 w-4" />
        Central de Comando
      </Button>
    </Link>
  )
}
