"use client"

import { useState } from "react"
import { Plus, Upload, Download, Filter, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FloatingActionMenuProps {
  onAddLead: () => void
  onImport?: () => void
  onExport?: () => void
  onFilter?: () => void
  onBulkDelete?: () => void
}

export function FloatingActionMenu({ onAddLead, onImport, onExport, onFilter, onBulkDelete }: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const actions = [
    { icon: Plus, label: "Add Lead", onClick: onAddLead, color: "bg-blue-500 hover:bg-blue-600" },
    { icon: Upload, label: "Import", onClick: onImport, color: "bg-green-500 hover:bg-green-600" },
    { icon: Download, label: "Export", onClick: onExport, color: "bg-purple-500 hover:bg-purple-600" },
    { icon: Filter, label: "Filter", onClick: onFilter, color: "bg-orange-500 hover:bg-orange-600" },
    { icon: Users, label: "Assign", onClick: onBulkDelete, color: "bg-indigo-500 hover:bg-indigo-600" },
  ]

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleActionClick = (action: () => void | undefined) => {
    if (action) {
      action()
    }
    setIsOpen(false)
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setIsOpen(false)} />}

      {/* Floating Action Menu */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse items-end gap-3">
        {/* Action Items */}
        {isOpen && (
          <div className="flex flex-col-reverse gap-3 animate-in slide-in-from-bottom-2">
            {actions.map((action, index) => (
              <div
                key={index}
                className="flex items-center gap-3 animate-in slide-in-from-bottom-1"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span className="bg-black/80 text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg">
                  {action.label}
                </span>
                <Button
                  size="icon"
                  className={cn("h-12 w-12 rounded-full shadow-lg transition-all", action.color)}
                  onClick={() => handleActionClick(action.onClick)}
                >
                  <action.icon className="h-5 w-5 text-white" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <Button
          size="icon"
          className={cn(
            "h-14 w-14 rounded-full shadow-xl transition-all",
            isOpen
              ? "bg-red-500 hover:bg-red-600 rotate-45"
              : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800",
          )}
          onClick={handleToggle}
        >
          <Plus className="h-6 w-6 text-white" />
        </Button>
      </div>
    </>
  )
}
