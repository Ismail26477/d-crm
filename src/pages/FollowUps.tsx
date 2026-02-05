"use client"

import { TabsContent } from "@/components/ui/tabs"
import { TabsTrigger } from "@/components/ui/tabs"
import { TabsList } from "@/components/ui/tabs"
import { Tabs } from "@/components/ui/tabs"
import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Clock, CheckCircle2, Calendar, Phone, Mail, X, AlertCircle, Edit2, Search } from "lucide-react"
import { fetchLeads, updateLead } from "@/lib/api"
import { format, isPast, isToday, isTomorrow, isAfter, startOfToday } from "date-fns"
import { cn } from "@/lib/utils"
import type { Lead } from "@/types/crm"
import ExternalLink from "@/components/ExternalLink" // Declare the ExternalLink component

type TabType = "all" | "today" | "upcoming" | "overdue" | "completed"

interface FollowUpItem extends Lead {
  id: string
  leadId: string
  leadName: string
  leadPhone: string
  leadEmail: string
  followUpReason: string
  notes?: string
  scheduledFor: string
  priority: string
  projectName?: string
  assignedTo?: string
  isCompleted?: boolean
}

const FollowUps = () => {
  const [allFollowUps, setAllFollowUps] = useState<FollowUpItem[]>([])
  const [filteredFollowUps, setFilteredFollowUps] = useState<FollowUpItem[]>([])
  const [callers, setCallers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCaller, setSelectedCaller] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"date" | "priority">("date")
  const [activeTab, setActiveTab] = useState<TabType>("all")
  const [selectedLead, setSelectedLead] = useState<FollowUpItem | null>(null)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)
  const [rescheduleDate, setRescheduleDate] = useState<string>("")
  const [rescheduleTime, setRescheduleTime] = useState<string>("")
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // Fetch leads and extract follow-ups
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("[v0] Fetching leads from database...")
        const leads = await fetchLeads()
        console.log("[v0] Total leads fetched:", leads.length)

        // Extract unique callers/assignees
        const uniqueCallers = Array.from(new Set(
          leads
            .filter((lead: Lead) => lead.assignedTo)
            .map((lead: Lead) => lead.assignedTo)
        )) as string[]
        setCallers(uniqueCallers.sort())
        console.log("[v0] Callers found:", uniqueCallers)

        // Build follow-ups list (including completed ones)
        const followUps = leads
          .filter((lead: Lead) => lead.nextFollowUp)
          .map((lead: Lead) => ({
            ...lead,
            id: lead.id,
            leadId: lead.id,
            leadName: lead.name,
            leadPhone: lead.phone,
            leadEmail: lead.email,
            followUpReason: lead.followUpReason || "Follow up scheduled",
            scheduledFor: lead.nextFollowUp,
            isCompleted: lead.followUpStatus === "completed",
          }))

        setAllFollowUps(followUps)
      } catch (error) {
        console.error("[v0] Error fetching leads:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter and sort follow-ups
  useEffect(() => {
    let filtered = allFollowUps

    // Filter by tab
    if (activeTab === "today") {
      filtered = filtered.filter((fu) => isToday(new Date(fu.scheduledFor)) && !fu.isCompleted)
    } else if (activeTab === "upcoming") {
      const today = startOfToday()
      filtered = filtered.filter(
        (fu) => isAfter(new Date(fu.scheduledFor), today) && !isToday(new Date(fu.scheduledFor)) && !fu.isCompleted
      )
    } else if (activeTab === "overdue") {
      filtered = filtered.filter((fu) => isPast(new Date(fu.scheduledFor)) && !fu.isCompleted)
    } else if (activeTab === "completed") {
      filtered = filtered.filter((fu) => fu.isCompleted)
    } else {
      // For "all", show all active (not completed) follow-ups
      filtered = filtered.filter((fu) => !fu.isCompleted)
    }

    // Filter by caller
    if (selectedCaller !== "all") {
      filtered = filtered.filter((fu) => fu.assignedTo === selectedCaller)
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (fu) =>
          fu.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          fu.leadPhone?.includes(searchQuery) ||
          fu.leadEmail?.includes(searchQuery) ||
          fu.followUpReason?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Sort
    if (sortBy === "priority") {
      const priorityOrder = { high: 1, medium: 2, low: 3 }
      filtered.sort((a, b) => (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - (priorityOrder[b.priority as keyof typeof priorityOrder] || 3))
    } else {
      filtered.sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime())
    }

    setFilteredFollowUps(filtered)
  }, [allFollowUps, activeTab, selectedCaller, searchQuery, sortBy])

  // Handle mark as completed
  const handleMarkCompleted = async (id: string) => {
    try {
      setUpdatingId(id)
      const lead = allFollowUps.find((fu) => fu.id === id)
      if (lead) {
        console.log("[v0] Saving to database - marking as completed for lead ID:", id)
        console.log("[v0] Lead data before update:", lead)
        
        // Call API to update the lead in database
        const result = await updateLead(id, { followUpStatus: "completed" })
        console.log("[v0] Database update result:", result)
        console.log("[v0] Successfully saved to database")
        
        // Update local state
        const updated = allFollowUps.map((fu) =>
          fu.id === id ? { ...fu, isCompleted: true, followUpStatus: "completed" } : fu
        )
        setAllFollowUps(updated)
        console.log("[v0] Local state updated. New state length:", updated.length)
        
        if (selectedLead?.id === id) {
          setSelectedLead({ ...selectedLead, isCompleted: true })
        }
        console.log("[v0] Follow-up marked as completed:", id)
      }
    } catch (error) {
      console.error("[v0] Error marking as completed:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  // Handle reschedule
  const handleReschedule = async () => {
    if (!selectedLead || !rescheduleDate || !rescheduleTime) return
    try {
      setUpdatingId(selectedLead.id)
      const newScheduledFor = `${rescheduleDate}T${rescheduleTime}`
      
      console.log("[v0] Saving to database - rescheduling follow-up:", selectedLead.id, newScheduledFor)
      // Call API to update the lead in database
      await updateLead(selectedLead.id, { nextFollowUp: newScheduledFor })
      console.log("[v0] Successfully saved to database")
      
      // Update local state
      const updated = allFollowUps.map((fu) =>
        fu.id === selectedLead.id 
          ? { ...fu, scheduledFor: newScheduledFor, nextFollowUp: newScheduledFor }
          : fu
      )
      setAllFollowUps(updated)
      setSelectedLead({ ...selectedLead, scheduledFor: newScheduledFor })
      setRescheduleDate("")
      setRescheduleTime("")
      setShowDetailDrawer(false)
      console.log("[v0] Follow-up rescheduled:", selectedLead.id, newScheduledFor)
    } catch (error) {
      console.error("[v0] Error rescheduling:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  // Get priority color
  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-orange-600 bg-orange-50"
      case "low":
        return "text-blue-600 bg-blue-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  // Get time label
  const getTimeLabel = (dateString: string) => {
    const date = new Date(dateString)
    if (isToday(date)) return "Today"
    if (isTomorrow(date)) return "Tomorrow"
    if (isPast(date)) return "Overdue"
    return format(date, "MMM d")
  }

  // Calculate stats
  const stats = {
    total: allFollowUps.filter((fu) => !fu.isCompleted).length,
    today: allFollowUps.filter((fu) => isToday(new Date(fu.scheduledFor)) && !fu.isCompleted).length,
    upcoming: allFollowUps.filter((fu) => isAfter(new Date(fu.scheduledFor), startOfToday()) && !isToday(new Date(fu.scheduledFor)) && !fu.isCompleted).length,
    overdue: allFollowUps.filter((fu) => isPast(new Date(fu.scheduledFor)) && !fu.isCompleted).length,
    completed: allFollowUps.filter((fu) => fu.isCompleted).length,
  }

  if (loading) {
    return <div className="p-8 text-center">Loading follow-ups...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Follow-ups</h1>
          <p className="text-gray-600 mt-1">Manage all your follow-up activities in one place</p>
        </div>

        {/* Stat Cards - Clickable Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <button
            onClick={() => setActiveTab("all")}
            className={cn(
              "p-6 rounded-lg border-2 transition-all text-left cursor-pointer",
              activeTab === "all"
                ? "border-purple-600 bg-purple-50 shadow-md"
                : "border-gray-200 bg-white hover:border-purple-300"
            )}
          >
            <p className="text-sm text-gray-600 mb-2">Total Follow-ups</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <Calendar className="w-8 h-8 text-purple-400 opacity-50" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab("today")}
            className={cn(
              "p-6 rounded-lg border-2 transition-all text-left cursor-pointer",
              activeTab === "today"
                ? "border-orange-600 bg-orange-50 shadow-md"
                : "border-gray-200 bg-white hover:border-orange-300"
            )}
          >
            <p className="text-sm text-gray-600 mb-2">Today</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-gray-900">{stats.today}</p>
              <Calendar className="w-8 h-8 text-orange-400 opacity-50" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab("upcoming")}
            className={cn(
              "p-6 rounded-lg border-2 transition-all text-left cursor-pointer",
              activeTab === "upcoming"
                ? "border-blue-600 bg-blue-50 shadow-md"
                : "border-gray-200 bg-white hover:border-blue-300"
            )}
          >
            <p className="text-sm text-gray-600 mb-2">Upcoming</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-gray-900">{stats.upcoming}</p>
              <Clock className="w-8 h-8 text-blue-400 opacity-50" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab("overdue")}
            className={cn(
              "p-6 rounded-lg border-2 transition-all text-left cursor-pointer",
              activeTab === "overdue"
                ? "border-red-600 bg-red-50 shadow-md"
                : "border-gray-200 bg-white hover:border-red-300"
            )}
          >
            <p className="text-sm text-gray-600 mb-2">Overdue</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-gray-900">{stats.overdue}</p>
              <AlertCircle className="w-8 h-8 text-red-400 opacity-50" />
            </div>
          </button>

          <button
            onClick={() => setActiveTab("completed")}
            className={cn(
              "p-6 rounded-lg border-2 transition-all text-left cursor-pointer",
              activeTab === "completed"
                ? "border-green-600 bg-green-50 shadow-md"
                : "border-gray-200 bg-white hover:border-green-300"
            )}
          >
            <p className="text-sm text-gray-600 mb-2">Completed</p>
            <div className="flex items-center justify-between">
              <p className="text-3xl font-bold text-gray-900">{stats.completed}</p>
              <CheckCircle2 className="w-8 h-8 text-green-400 opacity-50" />
            </div>
          </button>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="w-full md:w-64 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search name, phone, email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 text-sm"
                  />
                </div>

                <select
                  value={selectedCaller}
                  onChange={(e) => setSelectedCaller(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-white text-sm min-w-48 cursor-pointer"
                >
                  <option value="all">All Callers</option>
                  {callers.map((caller) => (
                    <option key={caller} value={caller}>
                      {caller}
                    </option>
                  ))}
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 border border-input rounded-md bg-white text-sm min-w-40 cursor-pointer"
                >
                  <option value="date">Sort by Date</option>
                  <option value="priority">Sort by Priority</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Follow-ups List */}
          <Card>
            <CardContent className="pt-6">
              {filteredFollowUps.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No follow-ups found</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {searchQuery ? "Try adjusting your search query" : "All set!"}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFollowUps.map((followUp) => (
                    <div
                      key={followUp.id}
                      className={cn(
                        "flex items-start justify-between p-4 rounded-lg border transition-all",
                        followUp.isCompleted
                          ? "border-green-200 bg-green-50"
                          : isPast(new Date(followUp.scheduledFor))
                            ? "border-red-200 bg-red-50"
                            : "border-yellow-200 bg-yellow-50"
                      )}
                    >
                      {/* Left section */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-semibold text-sm">
                              {followUp.leadName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => {
                                setSelectedLead(followUp)
                                setShowDetailDrawer(true)
                              }}
                              className="font-semibold text-gray-900 hover:text-blue-600 hover:underline transition-colors text-left"
                            >
                              {followUp.leadName}
                            </button>
                            <a href={`tel:${followUp.leadPhone}`} className="text-sm text-blue-600 hover:underline block">
                              <Phone className="w-3 h-3 inline mr-1" />
                              {followUp.leadPhone}
                            </a>
                          </div>
                        </div>

                        <p className="text-sm text-gray-700 mb-2">
                          <span className="font-medium">Reason:</span> {followUp.followUpReason}
                        </p>

                        {followUp.notes && (
                          <p className="text-xs text-gray-600 mb-2">
                            <span className="font-medium">Notes:</span> {followUp.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-2 flex-wrap">
                          {followUp.priority && (
                            <Badge
                              variant="outline"
                              className={cn("capitalize text-xs", getPriorityColor(followUp.priority))}
                            >
                              {followUp.priority === "medium" ? "Warm Priority" : `${followUp.priority} Priority`}
                            </Badge>
                          )}
                          {followUp.assignedTo && (
                            <Badge variant="secondary" className="text-xs">
                              {followUp.assignedTo}
                            </Badge>
                          )}
                          {followUp.isCompleted && (
                            <Badge className="bg-green-600 text-xs">Completed</Badge>
                          )}
                        </div>
                      </div>

                      {/* Right section */}
                      <div className="flex flex-col items-end gap-2 ml-4 flex-shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{getTimeLabel(followUp.scheduledFor)}</p>
                          <p className="text-xs text-gray-600">{format(new Date(followUp.scheduledFor), "h:mm a")}</p>
                          {isPast(new Date(followUp.scheduledFor)) && !followUp.isCompleted && (
                            <p className="text-xs text-red-600 font-medium mt-1">Overdue</p>
                          )}
                        </div>

                        <Button
                          onClick={() => {
                            setSelectedLead(followUp)
                            setShowDetailDrawer(true)
                          }}
                          size="sm"
                          variant="outline"
                          className="text-xs"
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detail Drawer */}
        {showDetailDrawer && selectedLead && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/20" onClick={() => setShowDetailDrawer(false)} />
            <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-lg flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {selectedLead.leadName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-semibold text-lg">{selectedLead.leadName}</h2>
                    <p className="text-sm text-muted-foreground">{selectedLead.isCompleted ? "Completed" : "Pending"}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailDrawer(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Contact Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-500 uppercase">Contact Information</h3>
                  {selectedLead.leadPhone && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Phone className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <a href={`tel:${selectedLead.leadPhone}`} className="text-blue-600 hover:underline font-medium">
                          {selectedLead.leadPhone}
                        </a>
                      </div>
                    </div>
                  )}
                  {selectedLead.leadEmail && (
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="text-xs text-gray-500">Email</p>
                        <a href={`mailto:${selectedLead.leadEmail}`} className="text-blue-600 hover:underline font-medium">
                          {selectedLead.leadEmail}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Follow-up Information */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-500 uppercase">Follow-up Details</h3>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Scheduled Date</p>
                        <p className="font-medium">{format(new Date(selectedLead.scheduledFor), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                      {isPast(new Date(selectedLead.scheduledFor)) && !selectedLead.isCompleted && (
                        <Badge className="bg-red-600">Overdue</Badge>
                      )}
                    </div>
                  </div>

                  {selectedLead.followUpReason && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">Reason</p>
                      <p className="text-sm font-medium">{selectedLead.followUpReason}</p>
                    </div>
                  )}
                </div>

                {/* Reschedule */}
                {!selectedLead.isCompleted && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-500 uppercase">Reschedule Follow-up</h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Date</label>
                          <input
                            type="date"
                            value={rescheduleDate}
                            onChange={(e) => setRescheduleDate(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md text-sm"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-1">Time</label>
                          <input
                            type="time"
                            value={rescheduleTime}
                            onChange={(e) => setRescheduleTime(e.target.value)}
                            className="w-full px-3 py-2 border border-input rounded-md text-sm"
                          />
                        </div>
                      </div>
                      <Button
                        onClick={handleReschedule}
                        disabled={!rescheduleDate || !rescheduleTime || updatingId === selectedLead.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Reschedule
                      </Button>
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedLead.notes && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm text-gray-500 uppercase">Notes</h3>
                    <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg">{selectedLead.notes}</p>
                  </div>
                )}

                {/* Lead Details */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm text-gray-500 uppercase">Lead Details</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {selectedLead.priority && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Priority</p>
                        <Badge variant="outline" className={cn("capitalize", getPriorityColor(selectedLead.priority))}>
                          {selectedLead.priority}
                        </Badge>
                      </div>
                    )}
                    {selectedLead.assignedTo && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-xs text-gray-500 mb-1">Assigned to</p>
                        <p className="font-medium text-sm">{selectedLead.assignedTo}</p>
                      </div>
                    )}
                    {selectedLead.projectName && (
                      <div className="p-3 bg-gray-50 rounded-lg col-span-2">
                        <p className="text-xs text-gray-500 mb-1">Project</p>
                        <p className="font-medium text-sm">{selectedLead.projectName}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            {/* Footer Actions */}
            <div className="border-t p-4 flex gap-3">
              {!selectedLead.isCompleted ? (
                <>
                  <Button
                    onClick={() => handleMarkCompleted(selectedLead.id)}
                    disabled={updatingId === selectedLead.id}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    {updatingId === selectedLead.id ? "Updating..." : "Mark as Completed"}
                  </Button>
                  <Button
                    onClick={() => setShowDetailDrawer(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </>
              ) : (
                <Button
                  onClick={() => setShowDetailDrawer(false)}
                  variant="outline"
                  className="w-full"
                >
                  Close
                </Button>
              )}
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FollowUps
