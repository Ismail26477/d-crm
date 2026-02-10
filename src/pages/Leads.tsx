"use client"

import type React from "react"

import { getFirstLineOfNotes } from "@/lib/noteUtils"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { useMemo } from "react"

import { useState, useEffect } from "react"
import { format, subDays, startOfDay, endOfDay, isWithinInterval, parseISO, differenceInDays } from "date-fns"
import {
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Grid3X3,
  List,
  Phone,
  MoreVertical,
  Trash2,
  Eye,
  MessageCircle,
  MessageSquare,
  Users,
  Flame,
  IndianRupee,
  Calendar,
  TrendingUp,
  X,
  ChevronDown,
  ArrowUpDown,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  FileText,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { leadSourceLabels } from "@/data/mockData"
import { StageBadge, PriorityBadge } from "@/components/ui/stage-badge"
import type { Lead, LeadStage, LeadPriority, LeadSource, Caller } from "@/types/crm"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { ImportLeadsDialog } from "@/components/leads/ImportLeadsDialog"
import { LeadDetailDrawer } from "@/components/leads/LeadDetailDrawer"
import { IntegrationImportDialog } from "@/components/leads/IntegrationImportDialog"
import { AddLeadDialog } from "@/components/leads/AddLeadDialog"
import { DialPadModal } from "@/components/leads/DialPadModal"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts"
import { BulkCampaignDialog } from "@/components/leads/BulkCampaignDialog"
import { calculateLeadScore } from "@/components/leads/LeadScoreIndicator"
import { DuplicateDetector } from "@/components/leads/DuplicateDetector"
import { FloatingActionMenu } from "@/components/leads/FloatingActionMenu"
import { FloatingNotificationChat } from "@/components/leads/FloatingNotificationChat"
import { fetchLeads, fetchCallers, createLead, updateLead, deleteLead, mergeDuplicateLeads } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"
import { AdvancedStageSelector } from "@/components/leads/AdvancedStageSelector"
import { AdvancedPrioritySelector } from "@/components/leads/AdvancedPrioritySelector"
import { useIsMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

type DateFilter = "all" | "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "custom"
type SortField = "name" | "createdAt" | "value" | "priority"
type SortOrder = "asc" | "desc"

const getLeadAgeClass = (createdAt: string | Date) => {
  const created = typeof createdAt === "string" ? new Date(createdAt) : createdAt
  const today = new Date()
  const daysOld = differenceInDays(today, created)

  // Ensure we're counting from start of day for accuracy
  const createdStart = startOfDay(created)
  const todayStart = startOfDay(today)
  const actualDaysOld = differenceInDays(todayStart, createdStart)

  if (actualDaysOld === 0) {
    // NEW (created today) - bright green
    return "bg-green-100 hover:bg-green-100/80 text-gray-900"
  } else if (actualDaysOld === 1) {
    // 1 day old - light green
    return "bg-green-50 hover:bg-green-50/80 text-gray-900"
  } else if (actualDaysOld >= 2 && actualDaysOld <= 3) {
    // 2-3 days old - yellow
    return "bg-yellow-50 hover:bg-yellow-50/80 text-gray-900"
  } else if (actualDaysOld >= 4 && actualDaysOld <= 5) {
    // 4-5 days old - orange
    return "bg-orange-50 hover:bg-orange-50/80 text-gray-900"
  } else if (actualDaysOld >= 6 && actualDaysOld <= 7) {
    // 6-7 days old - light red
    return "bg-red-50 hover:bg-red-50/80 text-gray-900"
  } else {
    // More than 7 days old - dark red
    return "bg-red-100 hover:bg-red-100/80 text-gray-900"
  }
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([])
  const [callers, setCallers] = useState<Caller[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")
  const [selectedLeads, setSelectedLeads] = useState<string[]>([])
  const [stageFilter, setStageFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [callerFilter, setCallerFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<DateFilter>("all")
  const [dialPadOpen, setDialPadOpen] = useState(false)
  const [dialPadNumber, setDialPadNumber] = useState("")
  const [customDateRange, setCustomDateRange] = useState<{ from?: Date; to?: Date }>({})
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [valueRange, setValueRange] = useState({ min: "", max: "" })
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [integrationDialogOpen, setIntegrationDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
  const [addLeadDialogOpen, setAddLeadDialogOpen] = useState(false)
  const [bulkCampaignDialogOpen, setBulkCampaignDialogOpen] = useState(false)
  const [mobileDetailModalOpen, setMobileDetailModalOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState({
    srNo: true,
    lead: true,
    // Keeping only: srNo, lead (name), number in Call/WhatsApp, followUp, notes, broker, stage, priority, assignedTo, createdAt
    callWhatsapp: true,
    followUp: true,
    notes: true,
    broker: true,
    stage: true,
    priority: true,
    assignedTo: true,
    createdAt: true,
  })
  const { toast } = useToast()
  const { user } = useAuth()
  const isMobile = useIsMobile()

  useEffect(() => {
    const loadData = async () => {
      try {
        const [leadsData, callersData] = await Promise.all([fetchLeads(), fetchCallers()])
        console.log("[v0] Loaded leads:", leadsData.length)
        console.log("[v0] Loaded callers:", callersData.length)
        setLeads(leadsData)
        setCallers(callersData)
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        toast({
          title: "Error",
          description: "Failed to load leads data",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [toast])

  const handleImportLeads = async (importedLeads: Partial<Lead>[]) => {
    try {
      const newLeads = await Promise.all(
        importedLeads.map((lead) =>
          createLead({
            ...lead,
            status: lead.status || "active",
            stage: lead.stage || "new",
            priority: lead.priority || "warm",
            value: lead.value || 0,
            source: lead.source || "other",
          }),
        ),
      )

      setLeads((prev) => [...newLeads, ...prev])
      toast({
        title: "Import successful!",
        description: `${newLeads.length} leads have been added to your list`,
      })
    } catch (error) {
      console.error("[v0] Error importing leads:", error)
      toast({
        title: "Error",
        description: "Failed to import leads",
        variant: "destructive",
      })
    }
  }

  const handleAddLead = async (newLead: Lead) => {
    try {
      const createdLead = await createLead(newLead)
      setLeads((prev) => [createdLead, ...prev])
      toast({
        title: "Lead added successfully!",
        description: `Lead "${newLead.name}" has been added to your list`,
      })
    } catch (error) {
      console.error("[v0] Error adding lead:", error)
      toast({
        title: "Error",
        description: "Failed to add lead",
        variant: "destructive",
      })
    }
  }

  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Phone",
      "Email",
      "City",
      "Value",
      "Source",
      "Stage",
      "Priority",
      "Status",

      "Assigned To",
      "Created At",
    ]
    const csvContent = [
      headers.join(","),
      ...filteredLeads.map((lead) =>
        [
          `"${lead.name}"`,
          `"${lead.phone}"`,
          `"${lead.email}"`,
          `"${lead.city}"`,
          lead.value,
          leadSourceLabels[lead.source] || lead.source,
          lead.stage,
          lead.priority,
          lead.status,
          `"${lead.assignedCallerName || ""}"`,
          lead.createdAt,
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = `leads_export_${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    toast({ title: "Export complete", description: `${filteredLeads.length} leads exported to CSV` })
  }

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`
    return `₹${value.toLocaleString()}`
  }

  const getDateRange = (filter: DateFilter): { start: Date; end: Date } | null => {
    const now = new Date()
    const today = startOfDay(now)

    switch (filter) {
      case "today":
        return { start: today, end: endOfDay(now) }
      case "yesterday":
        return { start: startOfDay(subDays(now, 1)), end: endOfDay(subDays(now, 1)) }
      case "last7days":
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) }
      case "last30days":
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) }
      case "thisMonth":
        return { start: startOfDay(new Date(now.getFullYear(), now.getMonth(), 1)), end: endOfDay(now) }
      case "custom":
        if (customDateRange.from && customDateRange.to) {
          return { start: startOfDay(customDateRange.from), end: endOfDay(customDateRange.to) }
        }
        return null
      default:
        return null
    }
  }

  const filteredLeads = useMemo(() => {
    const filtered = leads.filter((lead) => {
      if (user?.role === "caller" && user?.callerId) {
        if (lead.assignedCaller !== user.callerId) {
          return false
        }
      }

      const matchesSearch =
        searchQuery === "" ||
        (lead.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (lead.email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (lead.phone || "").includes(searchQuery) ||
        (lead.city?.toLowerCase() || "").includes(searchQuery.toLowerCase())

      const matchesStage = stageFilter === "all" || lead.stage === stageFilter
      const matchesPriority = priorityFilter === "all" || lead.priority === priorityFilter
      const matchesCaller = callerFilter === "all" || lead.assignedCaller === callerFilter
      const matchesStatus = statusFilter === "all" || lead.status === statusFilter
      const matchesSource = sourceFilter === "all" || lead.source === sourceFilter


      const dateRange = getDateRange(dateFilter)
      const matchesDate = !dateRange || isWithinInterval(parseISO(lead.createdAt), dateRange)

      const minValue = valueRange.min ? Number.parseFloat(valueRange.min) : 0
      const maxValue = valueRange.max ? Number.parseFloat(valueRange.max) : Number.POSITIVE_INFINITY
      const matchesValue = lead.value >= minValue && lead.value <= maxValue

      return (
        matchesSearch &&
        matchesStage &&
        matchesPriority &&
        matchesCaller &&
        matchesStatus &&
        matchesSource &&
        matchesDate &&
        matchesValue
      )
    })

    filtered.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "")
          break
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "value":
          comparison = a.value - b.value
          break
        case "priority":
          const priorityOrder = { hot: 3, warm: 2, cold: 1 }
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })

    return filtered
  }, [
    leads,
    searchQuery,
    stageFilter,
    priorityFilter,
    callerFilter,
    statusFilter,
    sourceFilter,

    dateFilter,
    customDateRange,
    valueRange,
    sortField,
    sortOrder,
    user, // Added user to dependency array
  ])

  const stats = {
    total: filteredLeads.length,
    newToday: filteredLeads.filter((l) => new Date(l.createdAt).toDateString() === new Date().toDateString()).length,
    hot: filteredLeads.filter((l) => l.priority === "hot").length,
    totalValue: filteredLeads.reduce((sum, l) => sum + l.value, 0),
    followUpToday: filteredLeads.filter(
      (l) => l.nextFollowUp && new Date(l.nextFollowUp).toDateString() === new Date().toDateString(),
    ).length,
    overdue: filteredLeads.filter((l) => l.nextFollowUp && new Date(l.nextFollowUp) < new Date()).length,
  }

  const sourceDistribution = useMemo(() => {
    const distribution: Record<string, number> = {}
    filteredLeads.forEach((lead) => {
      distribution[lead.source] = (distribution[lead.source] || 0) + 1
    })
    return Object.entries(distribution).map(([source, count]) => ({
      name: leadSourceLabels[source as LeadSource] || source,
      value: count,
    }))
  }, [filteredLeads])

  const upcomingFollowUps = useMemo(() => {
    return filteredLeads
      .filter((l) => l.nextFollowUp)
      .sort((a, b) => new Date(a.nextFollowUp!).getTime() - new Date(b.nextFollowUp!).getTime())
      .slice(0, 5)
  }, [filteredLeads])

  const conversionData = useMemo(() => {
    return [
      { stage: "New", count: filteredLeads.filter((l) => l.stage === "new").length, color: "#0EA5E9" },
      { stage: "Qualified", count: filteredLeads.filter((l) => l.stage === "qualified").length, color: "#8B5CF6" },
      { stage: "Proposal", count: filteredLeads.filter((l) => l.stage === "proposal").length, color: "#F59E0B" },
      { stage: "Won", count: filteredLeads.filter((l) => l.stage === "won").length, color: "#22C55E" },
    ]
  }, [filteredLeads])

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    try {
      const updatedLead = await updateLead(leadId, { stage: newStage, updatedAt: new Date().toISOString() })
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? updatedLead : lead)))
      toast({ title: "Stage updated", description: `Lead stage changed to ${newStage}` })
    } catch (error) {
      console.error("[v0] Error updating stage:", error)
      toast({
        title: "Error",
        description: "Failed to update lead stage",
        variant: "destructive",
      })
    }
  }

  const handlePriorityChange = async (leadId: string, newPriority: LeadPriority) => {
    try {
      const updatedLead = await updateLead(leadId, { priority: newPriority, updatedAt: new Date().toISOString() })
      setLeads((prev) => prev.map((lead) => (lead.id === leadId ? updatedLead : lead)))
      toast({ title: "Priority updated", description: `Lead priority changed to ${newPriority}` })
    } catch (error) {
      console.error("[v0] Error updating priority:", error)
      toast({
        title: "Error",
        description: "Failed to update lead priority",
        variant: "destructive",
      })
    }
  }

  const handleUpdateLead = async (updatedLead: Lead) => {
    try {
      const lead = await updateLead(updatedLead.id, updatedLead)
      setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)))
      setSelectedLead(lead)
      toast({ title: "Lead updated successfully!" })
    } catch (error) {
      console.error("[v0] Error updating lead:", error)
      toast({
        title: "Error",
        description: "Failed to update lead",
        variant: "destructive",
      })
    }
  }

  const openLeadDetail = (lead: Lead) => {
    setSelectedLead(lead)
    setDetailDrawerOpen(true)
  }

  const handleSelectAll = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map((l) => l.id))
    }
  }

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedLeads.map((id) => deleteLead(id)))
      setLeads((prev) => prev.filter((l) => !selectedLeads.includes(l.id)))
      toast({ title: "Leads deleted", description: `${selectedLeads.length} leads removed` })
      setSelectedLeads([])
    } catch (error) {
      console.error("[v0] Error bulk deleting leads:", error)
      toast({
        title: "Error",
        description: "Failed to delete leads",
        variant: "destructive",
      })
    }
  }

  const handleDeleteLead = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteLead(leadId)
      setLeads((prev) => prev.filter((l) => l.id !== leadId))
      toast({ title: "Lead deleted", description: "Lead has been removed" })
    } catch (error) {
      console.error("[v0] Error deleting lead:", error)
      toast({
        title: "Error",
        description: "Failed to delete lead",
        variant: "destructive",
      })
    }
  }

  const handleBulkAssign = (callerId: string) => {
    const caller = callers.find((c) => c.id === callerId)

    Promise.all(
      selectedLeads.map((leadId) => {
        const lead = leads.find((l) => l.id === leadId)
        if (lead) {
          return updateLead(leadId, {
            ...lead,
            assignedCaller: callerId,
            assignedCallerName: caller?.name,
            updatedAt: new Date().toISOString(),
          })
        }
        return Promise.resolve() // Return a resolved promise if lead is not found
      }),
    )
      .then((updatedLeads) => {
        setLeads((prev) =>
          prev.map((lead) =>
            selectedLeads.includes(lead.id)
              ? {
                  ...lead,
                  assignedCaller: callerId,
                  assignedCallerName: caller?.name,
                  updatedAt: new Date().toISOString(),
                }
              : lead,
          ),
        )
        toast({
          title: "Bulk assignment successful",
          description: `${selectedLeads.length} leads assigned to ${caller?.name}`,
        })
        setSelectedLeads([])
      })
      .catch((error) => {
        console.error("[v0] Error bulk assigning:", error)
        toast({
          title: "Error",
          description: "Failed to assign leads",
          variant: "destructive",
        })
      })
  }

  const handleBulkStageChange = async (stage: LeadStage) => {
    try {
      await Promise.all(
        selectedLeads.map((leadId) => updateLead(leadId, { stage, updatedAt: new Date().toISOString() })),
      )
      setLeads((prev) =>
        prev.map((lead) =>
          selectedLeads.includes(lead.id) ? { ...lead, stage, updatedAt: new Date().toISOString() } : lead,
        ),
      )
      toast({ title: "Stage updated", description: `${selectedLeads.length} leads moved to ${stage}` })
      setSelectedLeads([])
    } catch (error) {
      console.error("[v0] Error bulk changing stage:", error)
      toast({
        title: "Error",
        description: "Failed to update lead stages",
        variant: "destructive",
      })
    }
  }

  const handleBulkPriorityChange = async (priority: LeadPriority) => {
    try {
      await Promise.all(
        selectedLeads.map((leadId) => updateLead(leadId, { priority, updatedAt: new Date().toISOString() })),
      )
      setLeads((prev) =>
        prev.map((lead) =>
          selectedLeads.includes(lead.id) ? { ...lead, priority, updatedAt: new Date().toISOString() } : lead,
        ),
      )
      toast({ title: "Priority updated", description: `${selectedLeads.length} leads marked as ${priority}` })
      setSelectedLeads([])
    } catch (error) {
      console.error("[v0] Error bulk changing priority:", error)
      toast({
        title: "Error",
        description: "Failed to update lead priorities",
        variant: "destructive",
      })
    }
  }

  const handleBulkCampaign = (
    type: "email" | "sms",
    data: { subject?: string; message: string; template?: string },
  ) => {
    const selectedLeadsList = leads.filter((lead) => selectedLeads.includes(lead.id))

    toast({
      title: `${type === "email" ? "Email" : "SMS"} Campaign Sent`,
      description: `Successfully sent ${type} to ${selectedLeadsList.length} lead(s)`,
    })

    console.log(`[v0] Sending ${type} campaign to ${selectedLeadsList.length} leads:`, data)
  }

  const handleMergeDuplicates = async (duplicateIds: string[], keepId: string) => {
    try {
      await mergeDuplicateLeads(duplicateIds, keepId)

      setLeads((prev) => prev.filter((lead) => !duplicateIds.includes(lead.id)))

      toast({
        title: "Duplicates Merged",
        description: `Successfully merged ${duplicateIds.length} duplicate lead(s)`,
      })
    } catch (error) {
      console.error("[v0] Error merging duplicates:", error)
      toast({
        title: "Error",
        description: "Failed to merge duplicates",
        variant: "destructive",
      })
    }
  }

  const copyPhone = (phone: string) => {
    navigator.clipboard.writeText(phone)
    toast({ title: "Copied!", description: "Phone number copied to clipboard" })
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setStageFilter("all")
    setPriorityFilter("all")
    setCallerFilter("all")
    setStatusFilter("all")
    setSourceFilter("all")

    setDateFilter("all")
    setCustomDateRange({})
    setValueRange({ min: "", max: "" })
    toast({ title: "Filters cleared", description: "All filters have been reset" })
  }

  const activeFiltersCount = [
    searchQuery !== "",
    stageFilter !== "all",
    priorityFilter !== "all",
    callerFilter !== "all",
    statusFilter !== "all",
    sourceFilter !== "all",

    dateFilter !== "all",
    valueRange.min !== "" || valueRange.max !== "",
  ].filter(Boolean).length

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  // Renamed for clarity and consistency with updates
  const exportLeads = handleExportCSV

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Loading leads...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-auto bg-gradient-to-br from-background to-background/50">
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Leads</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">Manage and track your sales leads</p>
            </div>

            {/* Action Buttons - Desktop Only */}
            <div className="hidden md:flex gap-2">
              <Button variant="outline" className="gap-2 bg-transparent" onClick={() => setImportDialogOpen(true)}>
                <Upload className="w-4 h-4" />
                Import
              </Button>
              <Button variant="outline" className="gap-2 bg-transparent" onClick={handleExportCSV}>
                <Download className="w-4 h-4" />
                Export
              </Button>
              <Button className="btn-gradient-primary gap-2" onClick={() => setAddLeadDialogOpen(true)}>
                <Plus className="w-4 h-4" />
                Add Lead
              </Button>
            </div>
          </div>

          {/* Mobile Action Buttons - Compact */}
          <div className="flex md:hidden gap-2">
            <Button 
              size="sm"
              className="btn-gradient-primary gap-1.5 flex-1" 
              onClick={() => setAddLeadDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Lead</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button 
              size="sm"
              variant="outline" 
              className="gap-1.5 bg-transparent" 
              onClick={() => setImportDialogOpen(true)}
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button 
              size="sm"
              variant="outline" 
              className="gap-1.5 bg-transparent" 
              onClick={handleExportCSV}
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          <Card className="stat-card">
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex-shrink-0 bg-primary/10 flex items-center justify-center">
                <Users className="w-4 sm:w-5 h-4 sm:h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Total</p>
                <p className="text-lg sm:text-xl font-bold font-display">{stats.total}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex-shrink-0 bg-info/10 flex items-center justify-center">
                <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-info" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">New</p>
                <p className="text-lg sm:text-xl font-bold font-display">{stats.newToday}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="stat-card hidden sm:block">
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex-shrink-0 bg-secondary/10 flex items-center justify-center">
                <IndianRupee className="w-4 sm:w-5 h-4 sm:h-5 text-secondary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Value</p>
                <p className="text-lg sm:text-xl font-bold font-display">{formatCurrency(stats.totalValue)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex-shrink-0 bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 sm:w-5 h-4 sm:h-5 text-success" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Follow-up</p>
                <p className="text-lg sm:text-xl font-bold font-display">{stats.followUpToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="stat-card">
            <CardContent className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg flex-shrink-0 bg-warning/10 flex items-center justify-center">
                <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-warning" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">Overdue</p>
                <p className="text-lg sm:text-xl font-bold font-display">{stats.overdue}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Card className="md:col-span-2 lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-semibold">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 sm:space-y-2.5">
                {conversionData.map((item, index) => (
                  <div key={item.stage} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="text-muted-foreground text-xs">{item.stage}</span>
                      <span className="font-semibold text-xs sm:text-sm">{item.count}</span>
                    </div>
                    <div className="h-2.5 sm:h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(item.count / stats.total) * 100}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-secondary" />
                Upcoming Follow-ups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingFollowUps.length > 0 ? (
                <div className="space-y-2">
                  {upcomingFollowUps.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-border/50 text-xs sm:text-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                          <span className="text-xs sm:text-sm font-semibold text-accent-foreground">
                            {lead.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-foreground text-xs sm:text-sm truncate">{lead.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{lead.projectName || "No project"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                        <PriorityBadge priority={lead.priority} size="sm" />
                        <div className="text-right text-xs">
                          <p className="font-medium text-foreground">
                            {new Date(lead.nextFollowUp!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-xs sm:text-sm text-muted-foreground">No upcoming follow-ups</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search leads..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>

              <div className="flex items-center gap-0.5 w-full overflow-x-auto pb-1">
                {/* Date Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-1 bg-transparent text-xs h-8 px-2 flex-shrink-0" size="sm">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-xs whitespace-nowrap">
                        {dateFilter === "all"
                          ? "All"
                          : dateFilter === "today"
                            ? "Today"
                            : dateFilter === "yesterday"
                              ? "Yest"
                              : "Date"}
                      </span>
                      <ChevronDown className="w-2.5 h-2.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuItem onClick={() => setDateFilter("all")}>All Time</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("today")}>Today</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("yesterday")}>Yesterday</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("last7days")}>Last 7 Days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("last30days")}>Last 30 Days</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setDateFilter("thisMonth")}>This Month</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <Popover>
                      <PopoverTrigger asChild>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>Custom Range...</DropdownMenuItem>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="range"
                          selected={{ from: customDateRange.from, to: customDateRange.to }}
                          onSelect={(range) => {
                            setCustomDateRange({ from: range?.from, to: range?.to })
                            if (range?.from && range?.to) {
                              setDateFilter("custom")
                            }
                          }}
                          numberOfMonths={2}
                        />
                      </PopoverContent>
                    </Popover>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Lead Status Filter */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="text-xs h-8 w-20 px-2 min-w-max flex-shrink-0 whitespace-nowrap border-r-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="interested">Interested</SelectItem>
                    <SelectItem value="callback">Callback</SelectItem>
                    <SelectItem value="not_interested">Not Interested</SelectItem>
                  </SelectContent>
                </Select>

                {/* Follow-up Date Filter */}
                <Select value={stageFilter} onValueChange={setStageFilter}>
                  <SelectTrigger className="text-xs h-8 w-20 px-2 min-w-max flex-shrink-0 whitespace-nowrap border-r-0">
                    <SelectValue placeholder="Follow-up" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="new">Today</SelectItem>
                    <SelectItem value="qualified">Tomorrow</SelectItem>
                    <SelectItem value="proposal">Next 7 Days</SelectItem>
                    <SelectItem value="negotiation">Next 30 Days</SelectItem>
                    <SelectItem value="won">This Month</SelectItem>
                    <SelectItem value="lost">Overdue</SelectItem>
                  </SelectContent>
                </Select>

                {/* Assigned Caller Filter */}
                <Select value={callerFilter} onValueChange={setCallerFilter}>
                  <SelectTrigger className="text-xs h-8 w-20 px-2 min-w-max flex-shrink-0 whitespace-nowrap">
                    <SelectValue placeholder="Caller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Callers</SelectItem>
                    {callers
                      .filter((c) => c.role === "caller")
                      .map((caller) => (
                        <SelectItem key={caller.id} value={caller.id}>
                          {caller.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>

                {/* Clear Filters Button */}
                {activeFiltersCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-xs h-8 flex-shrink-0 ml-auto">
                    <X className="w-3 h-3" />
                  </Button>
                )}

                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-9 bg-transparent">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel className="text-xs">Columns</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.entries(visibleColumns).map(([key, value]) => (
                        <DropdownMenuCheckboxItem
                          key={key}
                          checked={value}
                          onCheckedChange={(checked) => setVisibleColumns((prev) => ({ ...prev, [key]: checked }))}
                          className="text-xs"
                        >
                          {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, " $1")}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-9"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    className="h-9"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>



              {selectedLeads.length > 0 && (
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">{selectedLeads.length} selected</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <UserPlus className="w-4 h-4" />
                        Assign To
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {callers
                        .filter((c) => c.role === "caller")
                        .map((caller) => (
                          <DropdownMenuItem key={caller.id} onClick={() => handleBulkAssign(caller.id)}>
                            {caller.name}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <TrendingUp className="w-4 h-4" />
                        Change Stage
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("new")}>New Lead</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("qualified")}>Qualified</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("proposal")}>Proposal</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("negotiation")}>
                        Negotiation
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("won")}>Closed Won</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkStageChange("lost")}>Closed Lost</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                        <Flame className="w-4 h-4" />
                        Change Priority
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkPriorityChange("hot")}>Hot</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkPriorityChange("warm")}>Warm</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkPriorityChange("cold")}>Cold</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete} className="gap-2">
                    <Trash2 className="w-4 h-4" />
                    Delete Selected
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <DuplicateDetector leads={leads} onMergeDuplicates={handleMergeDuplicates} />

        {isMobile ? (
          <div className="space-y-3 pb-4">
            {filteredLeads.map((lead, index) => {
              const isNewLead = new Date(lead.createdAt).getTime() > new Date().getTime() - 7 * 24 * 60 * 60 * 1000
              const daysOld = Math.floor((new Date().getTime() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24))
              const hasFollowUp = lead.nextFollowUp && new Date(lead.nextFollowUp) > new Date()
              const followUpDate = lead.nextFollowUp ? format(new Date(lead.nextFollowUp), "dd MMM") : null
              const daysUntilFollowUp = lead.nextFollowUp 
                ? Math.ceil((new Date(lead.nextFollowUp).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                : null

              return (
                <div
                  key={lead.id}
                  className={cn(
                    "bg-card border-2 rounded-lg p-4 shadow-sm hover:shadow-md transition-all",
                    isNewLead ? "border-green-400 bg-green-50/30" : "border-border",
                    hasFollowUp ? "ring-1 ring-blue-200" : ""
                  )}
                >
                  {/* Top row with Sr No, Name and Lead Age Badge */}
                  <button
                    onClick={() => {
                      setSelectedLead(lead)
                      setMobileDetailModalOpen(true)
                    }}
                    className="w-full text-left mb-3 group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{index + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate group-hover:text-blue-600 transition-colors">
                            {lead.name}
                          </p>
                          <p className="text-xs text-muted-foreground">{lead.phone}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        {isNewLead && (
                          <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs">New</Badge>
                        )}
                        {!isNewLead && (
                          <Badge variant="outline" className="text-xs">{daysOld}d old</Badge>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Follow-up indicator */}
                  {hasFollowUp && (
                    <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-blue-900">Follow-up Due</p>
                        <p className="text-xs text-blue-700">{followUpDate} {daysUntilFollowUp !== null && `(${daysUntilFollowUp === 0 ? 'Today' : daysUntilFollowUp === 1 ? 'Tomorrow' : daysUntilFollowUp > 0 ? `in ${daysUntilFollowUp}d` : `${Math.abs(daysUntilFollowUp)}d ago`})`}</p>
                      </div>
                    </div>
                  )}

                  {/* Stage and Priority badges */}
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <StageBadge stage={lead.stage} />
                    <PriorityBadge priority={lead.priority} />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        if (lead.phone) {
                          window.location.href = `tel:${lead.phone}`
                        } else {
                          toast({
                            title: "No phone number",
                            description: "Phone number not available for this lead",
                            variant: "destructive",
                          })
                        }
                      }}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant={hasFollowUp ? "default" : "outline"}
                      className={hasFollowUp ? "" : "bg-transparent"}
                      onClick={() => {
                        setSelectedLead(lead)
                        setDetailDrawerOpen(true)
                      }}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Follow Up
                    </Button>
                  </div>
                </div>
              )
            })}
            {filteredLeads.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No leads found</p>
              </div>
            )}
          </div>
        ) : viewMode === "list" ? (
          <Card>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="table-header">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {visibleColumns.srNo && <TableHead className="w-16">SR NO</TableHead>}
                    {visibleColumns.lead && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("name")}
                          className="gap-2 h-auto p-0 hover:bg-transparent"
                        >
                          Name
                          <ArrowUpDown className="w-3 h-3" />
                        </Button>
                      </TableHead>
                    )}
                    <TableHead>Number</TableHead>
                    {visibleColumns.callWhatsapp && <TableHead>Call / WhatsApp</TableHead>}
                    {visibleColumns.followUp && <TableHead>Follow Up</TableHead>}
                    {visibleColumns.notes && <TableHead>Notes</TableHead>}
                    {visibleColumns.broker && <TableHead>Broker</TableHead>}
                    {visibleColumns.stage && (
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 hover:bg-transparent">
                              Stage
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by Stage</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "all"}
                              onCheckedChange={() => setStageFilter("all")}
                            >
                              All Stages
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "new"}
                              onCheckedChange={() => setStageFilter("new")}
                            >
                              New Lead
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "qualified"}
                              onCheckedChange={() => setStageFilter("qualified")}
                            >
                              Qualified
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "proposal"}
                              onCheckedChange={() => setStageFilter("proposal")}
                            >
                              Proposal
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "negotiation"}
                              onCheckedChange={() => setStageFilter("negotiation")}
                            >
                              Negotiation
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "won"}
                              onCheckedChange={() => setStageFilter("won")}
                            >
                              Closed Won
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={stageFilter === "lost"}
                              onCheckedChange={() => setStageFilter("lost")}
                            >
                              Closed Lost
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                    )}
                    {visibleColumns.priority && (
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 hover:bg-transparent">
                              Priority
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by Priority</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={priorityFilter === "all"}
                              onCheckedChange={() => setPriorityFilter("all")}
                            >
                              All Priorities
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={priorityFilter === "hot"}
                              onCheckedChange={() => setPriorityFilter("hot")}
                            >
                              🔥 Hot
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={priorityFilter === "warm"}
                              onCheckedChange={() => setPriorityFilter("warm")}
                            >
                              🟡 Warm
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={priorityFilter === "cold"}
                              onCheckedChange={() => setPriorityFilter("cold")}
                            >
                              ❄️ Cold
                            </DropdownMenuCheckboxItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                    )}
                    {visibleColumns.assignedTo && (
                      <TableHead>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-2 h-auto p-0 hover:bg-transparent">
                              Assign Caller
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuLabel>Filter by Caller</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                              checked={callerFilter === "all"}
                              onCheckedChange={() => setCallerFilter("all")}
                            >
                              All Callers
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={callerFilter === "Not Assigned"}
                              onCheckedChange={() => setCallerFilter("Not Assigned")}
                            >
                              Not Assigned
                            </DropdownMenuCheckboxItem>
                            {callers
                              .filter((c) => c.role === "caller")
                              .map((caller) => (
                                <DropdownMenuCheckboxItem
                                  key={caller.id}
                                  checked={callerFilter === caller.id}
                                  onCheckedChange={() => setCallerFilter(caller.id)}
                                >
                                  {caller.name}
                                </DropdownMenuCheckboxItem>
                              ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableHead>
                    )}
                    {visibleColumns.createdAt && (
                      <TableHead>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSort("createdAt")}
                          className="gap-2 h-auto p-0 hover:bg-transparent"
                        >
                          Created Date
                          <ArrowUpDown className="w-3 h-3" />
                        </Button>
                      </TableHead>
                    )}
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.map((lead, index) => {
                    const isOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date()
                    const isToday =
                      lead.nextFollowUp && new Date(lead.nextFollowUp).toDateString() === new Date().toDateString()
                    const leadScore = calculateLeadScore(lead)

                    return (
                      <TableRow
                        key={lead.id}
                        className={cn(
                          getLeadAgeClass(lead.createdAt),
                          "transition-colors cursor-pointer",
                          isOverdue && "border-l-4 border-destructive",
                        )}
                        onClick={() => openLeadDetail(lead)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedLeads.includes(lead.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLeads((prev) => [...prev, lead.id])
                              } else {
                                setSelectedLeads((prev) => prev.filter((id) => id !== lead.id))
                              }
                            }}
                          />
                        </TableCell>
                        {visibleColumns.srNo && (
                          <TableCell>
                            <span className="text-sm text-muted-foreground font-medium">{index + 1}</span>
                          </TableCell>
                        )}
                        {visibleColumns.lead && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div
                              className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => openLeadDetail(lead)}
                            >
                              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center relative">
                                <span className="text-sm font-medium text-accent-foreground">
                                  {lead.name.charAt(0)}
                                </span>
                                {(isOverdue || isToday) && (
                                  <div
                                    className={cn(
                                      "absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-background",
                                      isOverdue ? "bg-destructive" : "bg-success",
                                    )}
                                  />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-foreground">{lead.name}</p>
                                <p className="text-sm text-muted-foreground">{lead.city}</p>
                              </div>
                            </div>
                          </TableCell>
                        )}
                        {/* Removed: Score cell */}
                        {/* Combined Phone, Call, WhatsApp, Copy into Number and Call/WhatsApp cells */}
                        <TableCell>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              copyPhone(lead.phone)
                            }}
                            className="text-sm font-medium text-foreground whitespace-nowrap hover:text-primary cursor-pointer transition-colors"
                            title="Click to copy"
                          >
                            {lead.phone}
                          </button>
                        </TableCell>
                        {visibleColumns.callWhatsapp && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-4"
                                onClick={() => {
                                  setDialPadNumber(lead.phone)
                                  setDialPadOpen(true)
                                }}
                                title="Open dial pad"
                              >
                                <Phone className="w-4 h-4 text-success" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\s/g, "")}`)}
                              >
                                <MessageCircle className="w-4 h-4 text-success" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                        {/* Removed: Value, Source, Status, Category, Subcategory cells */}
                        {visibleColumns.followUp && (
                          <TableCell>
                            {lead.nextFollowUp ? (
                              <div className="space-y-1">
                                {lead.followUpReason && (
                                  <p className="text-sm font-medium text-foreground line-clamp-1">
                                    {lead.followUpReason}
                                  </p>
                                )}
                                <span
                                  className={cn(
                                    "text-sm font-medium",
                                    isOverdue ? "text-destructive" : isToday ? "text-success" : "text-foreground",
                                  )}
                                >
                                  {format(parseISO(lead.nextFollowUp), "dd MMM yyyy, hh:mm a")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.notes && (
                          <TableCell>
                            {lead.notes ? (
                              <p className="text-sm text-muted-foreground line-clamp-2 max-w-[200px]">
                                {getFirstLineOfNotes(lead.notes)}
                              </p>
                            ) : (
                              <span className="text-sm text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        {visibleColumns.broker && (
                          <TableCell>
                            <span className="text-sm text-foreground">{lead.assignedBrokerName || "-"}</span>
                          </TableCell>
                        )}
                        {visibleColumns.stage && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <AdvancedStageSelector
                              value={lead.stage}
                              onChange={(value) => handleStageChange(lead.id, value)}
                            />
                          </TableCell>
                        )}
                        {visibleColumns.priority && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <AdvancedPrioritySelector
                              value={lead.priority}
                              onChange={(value) => handlePriorityChange(lead.id, value)}
                            />
                          </TableCell>
                        )}
                        {/* Removed: Source, Status, Category, Subcategory cells */}
                        {visibleColumns.assignedTo && (
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <span className="text-sm text-foreground">{lead.assignedCallerName || "-"}</span>
                          </TableCell>
                        )}
                        {visibleColumns.createdAt && (
                          <TableCell>
                            <span className="text-sm text-muted-foreground">
                              {format(parseISO(lead.createdAt), "dd MMM yyyy")}
                            </span>
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:text-destructive"
                              onClick={(e) => handleDeleteLead(lead.id, e)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation()
                                openLeadDetail(lead)
                              }}
                            >
                              <Eye className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
              {filteredLeads.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-lg font-medium">No leads found</p>
                  <p className="text-sm mt-1">Try adjusting your filters or add new leads</p>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredLeads.map((lead) => {
              const isOverdue = lead.nextFollowUp && new Date(lead.nextFollowUp) < new Date()
              const isToday =
                lead.nextFollowUp && new Date(lead.nextFollowUp).toDateString() === new Date().toDateString()

              return (
                <Card
                  key={lead.id}
                  className={cn(
                    "hover:shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer",
                    isOverdue && "border-l-4 border-destructive",
                    getLeadAgeClass(lead.createdAt), // Use the new function here
                  )}
                  onClick={() => openLeadDetail(lead)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center text-white text-xs font-semibold">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{lead.name}</p>
                          <p className="text-sm text-muted-foreground">{lead.city}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={lead.priority} size="sm" />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-8 w-8 bg-transparent">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openLeadDetail(lead)}>
                              <Eye className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`tel:${lead.phone}`)
                              }}
                            >
                              <Phone className="mr-2 h-4 w-4 text-success" />
                              <span>Call</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                window.open(`https://wa.me/${lead.phone.replace(/\s/g, "")}`)
                              }}
                            >
                              <MessageCircle className="mr-2 h-4 w-4 text-success" />
                              <span>WhatsApp</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDeleteLead(lead.id, e)}>
                              <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Removed: Value, Source, Category, Subcategory */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Stage</span>
                        <StageBadge stage={lead.stage} size="sm" />
                      </div>
                      {lead.nextFollowUp && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Follow-up</span>
                          <span
                            className={cn(
                              "text-sm font-medium",
                              isOverdue ? "text-destructive" : isToday ? "text-success" : "text-foreground",
                            )}
                          >
                            {format(parseISO(lead.nextFollowUp), "dd MMM yyyy")}
                          </span>
                        </div>
                      )}
                      {lead.notes && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Notes</span>
                          <p className="text-sm text-foreground line-clamp-1 max-w-[180px]">{lead.notes}</p>
                        </div>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2 mt-4 pt-4 border-t border-border"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 bg-transparent"
                        onClick={() => window.open(`tel:${lead.phone}`)}
                      >
                        <Phone className="w-4 h-4" />
                        Call
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 gap-1 bg-transparent"
                        onClick={() => window.open(`https://wa.me/${lead.phone.replace(/\s/g, "")}`)}
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            {filteredLeads.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-lg font-medium">No leads found</p>
                <p className="text-sm mt-1">Try adjusting your filters or add new leads</p>
              </div>
            )}
          </div>
        )}

        <ImportLeadsDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} onImport={handleImportLeads} />

        <LeadDetailDrawer
          lead={selectedLead}
          open={detailDrawerOpen}
          onOpenChange={setDetailDrawerOpen}
          onUpdateLead={handleUpdateLead}
        />

        <IntegrationImportDialog
          open={integrationDialogOpen}
          onOpenChange={setIntegrationDialogOpen}
          onImport={handleImportLeads}
        />

        <AddLeadDialog open={addLeadDialogOpen} onOpenChange={setAddLeadDialogOpen} onAddLead={handleAddLead} />

        <BulkCampaignDialog
          isOpen={bulkCampaignDialogOpen}
          onOpenChange={setBulkCampaignDialogOpen}
          selectedLeads={selectedLeads}
          onSend={handleBulkCampaign}
        />
        </div>
      </div>

      {/* Mobile Floating Action Menu */}
      {isMobile && (
        <FloatingActionMenu
          onAddLead={() => setAddLeadDialogOpen(true)}
          onImport={() => setImportDialogOpen(true)}
          onExport={handleExportCSV}
          onFilter={() => setShowAdvancedFilters(!showAdvancedFilters)}
          onBulkDelete={selectedLeads.length > 0 ? handleBulkDelete : undefined}
        />
      )}

        {/* Mobile Detail Modal */}
        <Dialog open={mobileDetailModalOpen} onOpenChange={setMobileDetailModalOpen}>
          <DialogContent className="w-full max-h-[90vh] overflow-y-auto">
            {selectedLead && (
              <>
                <DialogHeader className="flex flex-row items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-lg font-semibold text-accent-foreground">
                      {selectedLead.name.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-xl">{selectedLead.name}</DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1">{selectedLead.email}</p>
                  </div>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* Section 1: Basic Details */}
                  <div className="border rounded-lg p-4 bg-card">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Basic Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Phone</span>
                        <span className="font-medium">{selectedLead.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">City</span>
                        <span className="font-medium">{selectedLead.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Deal Value</span>
                        <span className="font-medium">{formatCurrency(selectedLead.value)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Created</span>
                        <span className="font-medium">{format(new Date(selectedLead.createdAt), "dd MMM yyyy")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Pipeline & Priority */}
                  <div className="border rounded-lg p-4 bg-card">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Pipeline & Priority
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Stage</span>
                        <StageBadge stage={selectedLead.stage} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Priority</span>
                        <PriorityBadge priority={selectedLead.priority} />
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Source</span>
                        <Badge variant="outline">{leadSourceLabels[selectedLead.source]}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground text-sm">Assigned To</span>
                        <span className="font-medium text-sm">{selectedLead.assignedCallerName || "Not Assigned"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Follow-up & Status */}
                  <div className="border rounded-lg p-4 bg-card">
                    <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Follow-up & Status
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Next Follow-up</span>
                        <span className="font-medium">
                          {selectedLead.nextFollowUp ? format(new Date(selectedLead.nextFollowUp), "dd MMM yyyy") : "Not set"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge
                          variant={
                            selectedLead.status === "interested"
                              ? "default"
                              : selectedLead.status === "callback"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {selectedLead.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {selectedLead.notes && (
                        <div className="mt-3 p-3 bg-muted rounded">
                          <p className="text-xs text-muted-foreground mb-1 font-medium">Latest Note:</p>
                          <p className="text-sm text-foreground line-clamp-2">{selectedLead.notes.split("\n").pop()}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={() => {
                        setMobileDetailModalOpen(false)
                        setSelectedLead(selectedLead)
                        setDetailDrawerOpen(true)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Full Details
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={() => {
                        setMobileDetailModalOpen(false)
                      }}
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

      {/* Dial Pad Modal */}
      <DialPadModal
        open={dialPadOpen}
        onOpenChange={setDialPadOpen}
        initialNumber={dialPadNumber}
      />

      <FloatingNotificationChat />
    </div>
  )
}

export default Leads
