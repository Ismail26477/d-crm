"use client"

import type React from "react"

import { ChevronDown, Sparkles, CheckCircle2, FileText, Handshake, Trophy, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LeadStage } from "@/types/crm"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AdvancedStageSelectorProps {
  value: LeadStage
  onChange: (stage: LeadStage) => void
  disabled?: boolean
}

const stageConfig: Record<
  LeadStage,
  {
    label: string
    description: string
    icon: React.ReactNode
    color: string
    bgColor: string
    borderColor: string
  }
> = {
  new: {
    label: "New Lead",
    description: "Just entered the system",
    icon: <Sparkles className="w-4 h-4" />,
    color: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  qualified: {
    label: "Qualified",
    description: "Meets our criteria",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  proposal: {
    label: "Proposal",
    description: "Proposal sent",
    icon: <FileText className="w-4 h-4" />,
    color: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  negotiation: {
    label: "Negotiation",
    description: "Terms being discussed",
    icon: <Handshake className="w-4 h-4" />,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  won: {
    label: "Closed Won",
    description: "Deal completed",
    icon: <Trophy className="w-4 h-4" />,
    color: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  lost: {
    label: "Closed Lost",
    description: "Deal lost",
    icon: <XCircle className="w-4 h-4" />,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
  },
}

export const AdvancedStageSelector = ({ value, onChange, disabled }: AdvancedStageSelectorProps) => {
  const currentStage = stageConfig[value]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all duration-200",
            "hover:scale-105 active:scale-95",
            currentStage.bgColor,
            currentStage.borderColor,
            "cursor-pointer font-medium text-sm",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <span className={currentStage.color}>{currentStage.icon}</span>
          <span className="text-foreground">{currentStage.label}</span>
          <ChevronDown className="w-3 h-3 transition-transform data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Change Stage</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(stageConfig).map(([key, config]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onChange(key as LeadStage)}
            className={cn(
              "flex items-start gap-3 p-3 cursor-pointer transition-all duration-150",
              "hover:bg-accent rounded-md my-1",
              value === key && "bg-accent/50 border-l-2 border-primary",
            )}
          >
            <div className={cn("flex-shrink-0 mt-0.5", config.color)}>{config.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-sm">{config.label}</div>
              <div className="text-xs text-muted-foreground">{config.description}</div>
            </div>
            {value === key && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
