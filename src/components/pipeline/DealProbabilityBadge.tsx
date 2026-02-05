import { cn } from "@/lib/utils"
import type { LeadStage, LeadPriority } from "@/types/crm"
import { TrendingUp } from "lucide-react"

interface DealProbabilityBadgeProps {
  stage: LeadStage
  priority: LeadPriority
  value: number
}

export const DealProbabilityBadge = ({ stage, priority, value }: DealProbabilityBadgeProps) => {
  // Calculate probability based on stage and priority
  const baseProbability = {
    new: 10,
    qualified: 25,
    proposal: 50,
    negotiation: 75,
    won: 100,
    lost: 0,
  }[stage]

  const priorityBonus = {
    hot: 15,
    warm: 5,
    cold: -10,
  }[priority]

  const probability = Math.min(100, Math.max(0, baseProbability + priorityBonus))
  const weightedValue = (value * probability) / 100

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`
    return `₹${val.toLocaleString()}`
  }

  const getProbabilityColor = (prob: number) => {
    if (prob >= 75) return "text-success"
    if (prob >= 50) return "text-warning"
    if (prob >= 25) return "text-orange-600"
    return "text-muted-foreground"
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={cn("flex items-center gap-1 font-medium", getProbabilityColor(probability))}>
        <TrendingUp className="w-3 h-3" />
        {probability}%
      </div>
      <div className="text-muted-foreground">Weighted: {formatCurrency(weightedValue)}</div>
    </div>
  )
}
