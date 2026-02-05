"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { fetchLeads, updateLead } from "@/lib/api"
import type { Lead, LeadStage } from "@/types/crm"
import { PriorityBadge } from "@/components/ui/stage-badge"
import { Button } from "@/components/ui/button"
import { Phone, IndianRupee, User, GripVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { PipelineAnalytics } from "@/components/pipeline/PipelineAnalytics"
import { DealProbabilityBadge } from "@/components/pipeline/DealProbabilityBadge"
import { DealAgingIndicator } from "@/components/pipeline/DealAgingIndicator"
import { AdvancedPipelineFilters, type PipelineFilters } from "@/components/pipeline/AdvancedPipelineFilters"

const leadSourceLabels: Record<string, string> = {
  website: "Website",
  google_ads: "Google Ads",
  referral: "Referral",
  social_media: "Social Media",
  walk_in: "Walk-in",
  other: "Other",
}

const stages: { id: LeadStage; label: string; color: string }[] = [
  { id: "new", label: "New Lead", color: "border-t-info" },
  { id: "qualified", label: "Qualified", color: "border-t-purple-500" },
  { id: "proposal", label: "Proposal", color: "border-t-warning" },
  { id: "negotiation", label: "Negotiation", color: "border-t-orange-500" },
  { id: "won", label: "Closed Won", color: "border-t-success" },
  { id: "lost", label: "Closed Lost", color: "border-t-destructive" },
]

const Pipeline = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<PipelineFilters>({
    priority: "all",
    source: "all",
    assignedCaller: "all",
    minValue: null,
    maxValue: null,
    searchQuery: "",
  })
  const { toast } = useToast()

  useEffect(() => {
    const loadLeads = async () => {
      try {
        const data = await fetchLeads()
        setLeads(data)
      } catch (error) {
        console.error("[v0] Error fetching leads:", error)
        toast({
          title: "Error",
          description: "Failed to load leads",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadLeads()
  }, [toast])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading pipeline...</p>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }

  const getLeadsByStage = (stage: LeadStage) => {
    return leads.filter((lead) => {
      if (lead.stage !== stage) return false

      // Priority filter
      if (filters.priority !== "all" && lead.priority !== filters.priority) return false

      // Source filter
      if (filters.source !== "all" && lead.source !== filters.source) return false

      // Assigned caller filter
      if (filters.assignedCaller !== "all" && lead.assignedCaller !== filters.assignedCaller) return false

      // Value range filter
      if (filters.minValue !== null && lead.value < filters.minValue) return false
      if (filters.maxValue !== null && lead.value > filters.maxValue) return false

      // Search query filter
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        return (
          lead.name.toLowerCase().includes(query) ||
          lead.email.toLowerCase().includes(query) ||
          lead.phone.includes(query) ||
          lead.city.toLowerCase().includes(query)
        )
      }

      return true
    })
  }

  const getStageValue = (stage: LeadStage) => {
    return getLeadsByStage(stage).reduce((sum, lead) => sum + lead.value, 0)
  }

  const getWeightedStageValue = (stage: LeadStage) => {
    const stageLeads = getLeadsByStage(stage)
    const baseProbability = {
      new: 10,
      qualified: 25,
      proposal: 50,
      negotiation: 75,
      won: 100,
      lost: 0,
    }[stage]

    return stageLeads.reduce((sum, lead) => {
      const priorityBonus = { hot: 15, warm: 5, cold: -10 }[lead.priority]
      const probability = Math.min(100, Math.max(0, baseProbability + priorityBonus))
      return sum + (lead.value * probability) / 100
    }, 0)
  }

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    setDraggingId(leadId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = async (e: React.DragEvent, newStage: LeadStage) => {
    e.preventDefault()
    if (!draggingId) return

    const lead = leads.find((l) => l.id === draggingId)
    if (lead && lead.stage !== newStage) {
      try {
        // Optimistically update UI
        setLeads((prev) =>
          prev.map((l) => (l.id === draggingId ? { ...l, stage: newStage, updatedAt: new Date().toISOString() } : l)),
        )

        // Update in database
        await updateLead(draggingId, { stage: newStage })

        toast({
          title: "Lead moved",
          description: `${lead.name} moved to ${stages.find((s) => s.id === newStage)?.label}`,
        })
      } catch (error) {
        console.error("[v0] Error updating lead:", error)
        // Revert optimistic update
        setLeads((prev) => prev.map((l) => (l.id === draggingId ? lead : l)))
        toast({
          title: "Error",
          description: "Failed to move lead",
          variant: "destructive",
        })
      }
    }
    setDraggingId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-display text-foreground">Pipeline</h1>
          <p className="text-muted-foreground mt-1">Drag and drop leads between stages</p>
        </div>
        <div className="flex items-center gap-3">
          <AdvancedPipelineFilters filters={filters} onFiltersChange={setFilters} />
        </div>
      </div>

      <PipelineAnalytics leads={leads} />

      {/* Pipeline Board */}
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {stages.map((stage) => {
          const stageLeads = getLeadsByStage(stage.id)
          const stageValue = getStageValue(stage.id)
          const weightedValue = getWeightedStageValue(stage.id)

          return (
            <div
              key={stage.id}
              className={cn("kanban-column min-w-[320px] flex-shrink-0 border-t-4", stage.color)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{stage.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {stageLeads.length} leads • {formatCurrency(stageValue)}
                  </p>
                  {stage.id !== "won" && stage.id !== "lost" && (
                    <p className="text-xs text-muted-foreground mt-0.5">Weighted: {formatCurrency(weightedValue)}</p>
                  )}
                </div>
                <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium text-muted-foreground">
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-3">
                {stageLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className={cn("kanban-card", draggingId === lead.id && "opacity-50 ring-2 ring-primary")}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                          <span className="text-xs font-medium text-accent-foreground">{lead.name.charAt(0)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={lead.priority} size="sm" />
                        <DealAgingIndicator createdAt={lead.createdAt} stage={lead.stage} />
                      </div>
                    </div>

                    <h4 className="font-medium text-foreground mb-1">{lead.name}</h4>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <IndianRupee className="w-3.5 h-3.5" />
                        <span className="font-medium text-foreground">{formatCurrency(lead.value)}</span>
                      </div>

                      <DealProbabilityBadge stage={lead.stage} priority={lead.priority} value={lead.value} />

                      {lead.projectName && <p className="text-muted-foreground truncate">{lead.projectName}</p>}

                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="px-2 py-0.5 rounded-full bg-muted text-xs">
                          {leadSourceLabels[lead.source]}
                        </span>
                      </div>

                      {lead.assignedCallerName && (
                        <div className="flex items-center gap-2 text-muted-foreground pt-2 border-t border-border mt-2">
                          <User className="w-3.5 h-3.5" />
                          <span className="text-xs">{lead.assignedCallerName}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 h-8"
                        onClick={() => window.open(`tel:${lead.phone}`)}
                      >
                        <Phone className="w-3.5 h-3.5 mr-1.5" />
                        Call
                      </Button>
                    </div>
                  </div>
                ))}

                {stageLeads.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground text-sm">No leads in this stage</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Pipeline
