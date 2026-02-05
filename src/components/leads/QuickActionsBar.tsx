"use client"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Upload, Download, Filter, UserPlus, Mail } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickActionsBarProps {
  onAddLead: () => void
  onImport: () => void
  onExport: () => void
  onFilter: () => void
  onBulkAssign: () => void
  onBulkEmail: () => void
  className?: string
}

export function QuickActionsBar({
  onAddLead,
  onImport,
  onExport,
  onFilter,
  onBulkAssign,
  onBulkEmail,
  className,
}: QuickActionsBarProps) {
  const actions = [
    {
      icon: Plus,
      label: "Add Lead",
      onClick: onAddLead,
      color: "bg-blue-600 text-white hover:bg-blue-700",
      primary: true,
    },
    { icon: Upload, label: "Import", onClick: onImport, color: "bg-white text-gray-700 hover:bg-gray-50" },
    { icon: Download, label: "Export", onClick: onExport, color: "bg-white text-gray-700 hover:bg-gray-50" },
    { icon: Filter, label: "Filter", onClick: onFilter, color: "bg-white text-gray-700 hover:bg-gray-50" },
    { icon: UserPlus, label: "Bulk Assign", onClick: onBulkAssign, color: "bg-white text-gray-700 hover:bg-gray-50" },
    { icon: Mail, label: "Bulk Email", onClick: onBulkEmail, color: "bg-white text-gray-700 hover:bg-gray-50" },
  ]

  return (
    <div
      className={cn(
        "fixed bottom-8 right-8 z-50 flex flex-col gap-3 p-3 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl",
        className,
      )}
    >
      <TooltipProvider>
        {actions.map((action, index) => (
          <Tooltip key={index}>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className={cn(
                  "w-14 h-14 rounded-full shadow-md transition-all duration-200 hover:scale-110 hover:shadow-lg border",
                  action.primary ? "border-blue-600" : "border-gray-200",
                  action.color,
                )}
                onClick={action.onClick}
              >
                <action.icon className="w-5 h-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="bg-gray-900 text-white">
              <p>{action.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </div>
  )
}
