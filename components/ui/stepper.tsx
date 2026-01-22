import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface Step {
  title: string
  description?: string
  status: "pending" | "current" | "complete"
}

interface StepperProps {
  steps: Step[]
  className?: string
}

export function Stepper({ steps, className }: StepperProps) {
  return (
    <nav className={cn("flex items-center justify-center", className)}>
      <ol className="flex items-center space-x-2 md:space-x-4">
        {steps.map((step, index) => (
          <li key={index} className="flex items-center">
            <div className="flex items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                  step.status === "complete" && "border-primary bg-primary text-primary-foreground",
                  step.status === "current" && "border-primary bg-background text-primary",
                  step.status === "pending" && "border-muted-foreground bg-background text-muted-foreground",
                )}
              >
                {step.status === "complete" ? <Check className="h-4 w-4" /> : <span>{index + 1}</span>}
              </div>
              <div className="ml-2 hidden md:block">
                <div
                  className={cn(
                    "text-sm font-medium",
                    step.status === "current" && "text-primary",
                    step.status === "complete" && "text-foreground",
                    step.status === "pending" && "text-muted-foreground",
                  )}
                >
                  {step.title}
                </div>
                {step.description && <div className="text-xs text-muted-foreground">{step.description}</div>}
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "ml-2 h-0.5 w-8 md:w-16",
                  index < steps.findIndex((s) => s.status === "current") ? "bg-primary" : "bg-muted",
                )}
              />
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
