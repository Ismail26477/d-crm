import { cn } from "@/lib/utils"
import type { LeadStage, LeadPriority, LeadStatus } from "@/types/crm"

interface StageBadgeProps {
  stage: LeadStage
  size?: "sm" | "md"
}

export const StageBadge = ({ stage, size = "md" }: StageBadgeProps) => {
  const stageConfig: Record<LeadStage, { label: string; className: string }> = {
    new: { label: "New Lead", className: "badge-stage-new" },
    qualified: { label: "Qualified", className: "badge-stage-qualified" },
    proposal: { label: "Proposal", className: "badge-stage-proposal" },
    negotiation: { label: "Negotiation", className: "badge-stage-negotiation" },
    won: { label: "Closed Won", className: "badge-stage-won" },
    lost: { label: "Closed Lost", className: "badge-stage-lost" },
  }

  const config = stageConfig[stage]

  if (!config) {
    console.error(`[v0] Invalid stage: ${stage}`)
    return null
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}

interface PriorityBadgeProps {
  priority: LeadPriority
  size?: "sm" | "md"
}

export const PriorityBadge = ({ priority, size = "md" }: PriorityBadgeProps) => {
  const priorityConfig: Record<LeadPriority, { label: string; className: string }> = {
    hot: { label: "🔥 Hot", className: "badge-priority-hot" },
    warm: { label: "☀️ Warm", className: "badge-priority-warm" },
    cold: { label: "❄️ Cold", className: "badge-priority-cold" },
  }

  const config = priorityConfig[priority]

  if (!config) {
    console.error(`[v0] Invalid priority: ${priority}`)
    return null
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}

interface StatusBadgeProps {
  status: LeadStatus
  size?: "sm" | "md"
}

export const StatusBadge = ({ status, size = "md" }: StatusBadgeProps) => {
  const statusConfig: Record<LeadStatus, { label: string; className: string }> = {
    active: { label: "Active", className: "bg-info/10 text-info border border-info/20" },
    inactive: { label: "Inactive", className: "bg-purple-100 text-purple-700 border border-purple-200" },
    paused: { label: "Paused", className: "bg-warning/10 text-warning border border-warning/20" },
    not_interested: {
      label: "Not Interested",
      className: "bg-destructive/10 text-destructive border border-destructive/20",
    },
  }

  const config = statusConfig[status]

  if (!config) {
    console.warn(`[v0] Invalid or missing status: ${status}, defaulting to active`)
    const defaultConfig = statusConfig["active"]
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full font-medium",
          size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
          defaultConfig.className,
        )}
      >
        {defaultConfig.label}
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.className,
      )}
    >
      {config.label}
    </span>
  )
}
