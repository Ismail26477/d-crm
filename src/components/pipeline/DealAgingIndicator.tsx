import { cn } from "@/lib/utils"
import { Clock, AlertTriangle } from "lucide-react"

interface DealAgingIndicatorProps {
  createdAt: string
  stage: string
}

export const DealAgingIndicator = ({ createdAt, stage }: DealAgingIndicatorProps) => {
  const daysOld = Math.floor((new Date().getTime() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24))

  // Define thresholds for different stages
  const thresholds = {
    new: 7,
    qualified: 14,
    proposal: 21,
    negotiation: 30,
    won: 999,
    lost: 999,
  }

  const threshold = thresholds[stage as keyof typeof thresholds] || 14
  const isAtRisk = daysOld > threshold
  const isWarning = daysOld > threshold * 0.7

  if (stage === "won" || stage === "lost") return null

  return (
    <div
      className={cn(
        "flex items-center gap-1 text-xs px-2 py-1 rounded-full",
        isAtRisk && "bg-destructive/10 text-destructive",
        isWarning && !isAtRisk && "bg-warning/10 text-warning",
        !isWarning && !isAtRisk && "bg-muted text-muted-foreground",
      )}
    >
      {isAtRisk ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
      <span>{daysOld}d</span>
    </div>
  )
}
