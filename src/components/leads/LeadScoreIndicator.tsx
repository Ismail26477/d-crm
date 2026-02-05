import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"

interface LeadScoreIndicatorProps {
  score: number
  size?: "sm" | "md" | "lg"
}

export function calculateLeadScore(lead: {
  value: number
  priority: string
  stage: string
  nextFollowUp?: string
  assignedCaller?: string
  createdAt: string
}): number {
  let score = 0

  // Value score (0-30 points)
  if (lead.value >= 100) score += 30
  else if (lead.value >= 75) score += 25
  else if (lead.value >= 50) score += 20
  else if (lead.value >= 25) score += 15
  else score += 10

  // Priority score (0-25 points)
  if (lead.priority === "hot") score += 25
  else if (lead.priority === "warm") score += 15
  else score += 5

  // Stage score (0-20 points)
  if (lead.stage === "qualified") score += 20
  else if (lead.stage === "negotiation") score += 18
  else if (lead.stage === "proposal") score += 15
  else if (lead.stage === "contacted") score += 12
  else if (lead.stage === "new") score += 8

  // Follow-up scheduled (0-15 points)
  if (lead.nextFollowUp) {
    const followUpDate = new Date(lead.nextFollowUp)
    const now = new Date()
    if (followUpDate > now) score += 15
    else score += 5
  }

  // Assigned caller (0-10 points)
  if (lead.assignedCaller) score += 10

  return Math.min(score, 100)
}

export function LeadScoreIndicator({ score, size = "md" }: LeadScoreIndicatorProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50 border-green-200"
    if (score >= 60) return "text-blue-600 bg-blue-50 border-blue-200"
    if (score >= 40) return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-red-600 bg-red-50 border-red-200"
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent"
    if (score >= 60) return "Good"
    if (score >= 40) return "Fair"
    return "Low"
  }

  const getScoreIcon = (score: number) => {
    if (score >= 60) return <TrendingUp className="w-3 h-3" />
    if (score >= 40) return <Minus className="w-3 h-3" />
    return <TrendingDown className="w-3 h-3" />
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-base px-3 py-1.5",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn("font-semibold gap-1 cursor-help", getScoreColor(score), sizeClasses[size])}
          >
            {getScoreIcon(score)}
            {score}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs space-y-1">
            <p className="font-semibold">{getScoreLabel(score)} Lead Score</p>
            <p className="text-muted-foreground">Based on value, priority, stage, and engagement</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
