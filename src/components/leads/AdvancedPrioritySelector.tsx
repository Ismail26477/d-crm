"use client"

import type React from "react"

import { ChevronDown, Flame, Sun, Snowflake, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { LeadPriority } from "@/types/crm"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AdvancedPrioritySelectorProps {
  value: LeadPriority
  onChange: (priority: LeadPriority) => void
  disabled?: boolean
}

const priorityConfig: Record<
  LeadPriority,
  {
    label: string
    description: string
    icon: React.ReactNode
    color: string
    bgColor: string
    borderColor: string
    dotColor: string
  }
> = {
  hot: {
    label: "Hot",
    description: "Urgent - High conversion chance",
    icon: <Flame className="w-4 h-4" />,
    color: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    dotColor: "bg-red-500",
  },
  warm: {
    label: "Warm",
    description: "Medium priority - Engaging",
    icon: <Sun className="w-4 h-4" />,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
    dotColor: "bg-amber-500",
  },
  cold: {
    label: "Cold",
    description: "Low priority - Monitor",
    icon: <Snowflake className="w-4 h-4" />,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    dotColor: "bg-blue-500",
  },
}

export const AdvancedPrioritySelector = ({ value, onChange, disabled }: AdvancedPrioritySelectorProps) => {
  const currentPriority = priorityConfig[value]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <button
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all duration-200",
            "hover:scale-105 active:scale-95",
            currentPriority.bgColor,
            currentPriority.borderColor,
            "cursor-pointer font-medium text-sm",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <div className={cn("flex items-center justify-center", currentPriority.color)}>
            <div className={cn("w-2 h-2 rounded-full animate-pulse", currentPriority.dotColor)} />
          </div>
          <span className="text-foreground">{currentPriority.label}</span>
          <ChevronDown className="w-3 h-3 transition-transform data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-52" align="start">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Set Priority</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {Object.entries(priorityConfig).map(([key, config]) => (
          <DropdownMenuItem
            key={key}
            onClick={() => onChange(key as LeadPriority)}
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
