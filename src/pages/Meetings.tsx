"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Calendar, List, AlertCircle } from "lucide-react"
import { MeetingCard } from "@/components/meetings/meeting-card"
import { MeetingForm } from "@/components/meetings/meeting-form"
import { CalendarView } from "@/components/meetings/calendar-view"
import { fetchMeetings, fetchLeads, fetchCallers, createMeeting, updateMeeting, deleteMeeting } from "@/lib/api"
import type { Meeting, Lead, Caller } from "@/types/crm"
import { useToast } from "@/hooks/use-toast"

const Meetings = () => {
  const { toast } = useToast()
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [callers, setCallers] = useState<Caller[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [meetingsData, leadsData, callersData] = await Promise.all([fetchMeetings(), fetchLeads(), fetchCallers()])
      setMeetings(meetingsData)
      setLeads(leadsData)
      setCallers(callersData)
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast({
        title: "Error",
        description: "Failed to load meetings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMeeting = async (data: any) => {
    try {
      const newMeeting = await createMeeting(data)
      setMeetings((prev) => [newMeeting, ...prev])
      setIsDialogOpen(false)
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      })
      loadData()
    } catch (error) {
      console.error("[v0] Error creating meeting:", error)
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      })
    }
  }

  const handleUpdateMeeting = async (data: any) => {
    if (!selectedMeeting) return

    try {
      const updatedMeeting = await updateMeeting(selectedMeeting.id, data)
      setMeetings((prev) => prev.map((m) => (m.id === selectedMeeting.id ? updatedMeeting : m)))
      setIsDialogOpen(false)
      setIsEditing(false)
      setSelectedMeeting(null)
      toast({
        title: "Success",
        description: "Meeting updated successfully",
      })
      loadData()
    } catch (error) {
      console.error("[v0] Error updating meeting:", error)
      toast({
        title: "Error",
        description: "Failed to update meeting",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMeeting = async (id: string) => {
    if (!confirm("Are you sure you want to delete this meeting?")) return

    try {
      await deleteMeeting(id)
      setMeetings((prev) => prev.filter((m) => m.id !== id))
      toast({
        title: "Success",
        description: "Meeting deleted successfully",
      })
      loadData()
    } catch (error) {
      console.error("[v0] Error deleting meeting:", error)
      toast({
        title: "Error",
        description: "Failed to delete meeting",
        variant: "destructive",
      })
    }
  }

  const handleCompleteMeeting = async (id: string) => {
    try {
      const meeting = meetings.find((m) => m.id === id)
      if (!meeting) return

      const updatedMeeting = await updateMeeting(id, { status: "completed" })
      setMeetings((prev) => prev.map((m) => (m.id === id ? updatedMeeting : m)))
      toast({
        title: "Success",
        description: "Meeting marked as completed",
      })
      loadData()
    } catch (error) {
      console.error("[v0] Error completing meeting:", error)
      toast({
        title: "Error",
        description: "Failed to mark meeting as completed",
        variant: "destructive",
      })
    }
  }

  const handleEditMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setIsEditing(false)
    setSelectedMeeting(null)
  }

  // Filter meetings
  const filteredMeetings = meetings.filter((meeting) => {
    const statusMatch = filterStatus === "all" || meeting.status === filterStatus
    const searchMatch =
      meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      meeting.description.toLowerCase().includes(searchQuery.toLowerCase())

    return statusMatch && searchMatch
  })

  const scheduledCount = meetings.filter((m) => m.status === "scheduled").length
  const completedCount = meetings.filter((m) => m.status === "completed").length
  const upcomingCount = meetings.filter((m) => m.status === "scheduled" && new Date(m.scheduledAt) > new Date()).length

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading meetings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Meeting Scheduler</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setIsEditing(false)
                setSelectedMeeting(null)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Meeting" : "Schedule New Meeting"}</DialogTitle>
            </DialogHeader>
            <MeetingForm
              onSubmit={isEditing ? handleUpdateMeeting : handleCreateMeeting}
              initialData={selectedMeeting || undefined}
              leads={leads}
              callers={callers}
              isEditing={isEditing}
              loading={loading}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Total scheduled meetings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Upcoming (7 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Meetings in the next week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Meetings completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Input
              placeholder="Search meetings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="md:flex-1"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meetings List */}
          {filteredMeetings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredMeetings.map((meeting) => (
                <MeetingCard
                  key={meeting.id}
                  meeting={meeting}
                  onEdit={handleEditMeeting}
                  onDelete={handleDeleteMeeting}
                  onComplete={handleCompleteMeeting}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">No meetings found</p>
              <p className="text-muted-foreground">Schedule your first meeting to get started</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <CalendarView meetings={meetings} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Meetings
