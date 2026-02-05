"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Calendar, Clock, MapPin, AlertCircle, Check } from "lucide-react"
import type { Lead, Meeting } from "@/types/crm"
import { useToast } from "@/hooks/use-toast"
import { createMeeting } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

interface ScheduleMeetingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lead: Lead | null
  callerName?: string
  callerId?: string
}

const TIMEZONES = [
  { label: "UTC (UTC+0)", value: "UTC" },
  { label: "IST (UTC+5:30)", value: "IST" },
  { label: "GST (UTC+4)", value: "GST" },
  { label: "EST (UTC-5)", value: "EST" },
  { label: "CST (UTC-6)", value: "CST" },
  { label: "PST (UTC-8)", value: "PST" },
  { label: "GMT (UTC+0)", value: "GMT" },
  { label: "CET (UTC+1)", value: "CET" },
  { label: "EET (UTC+2)", value: "EET" },
  { label: "AEST (UTC+10)", value: "AEST" },
]

const DURATIONS = [15, 30, 45, 60, 90, 120]

export function ScheduleMeetingDialog({
  open,
  onOpenChange,
  lead,
  callerName = "You",
  callerId = "current",
}: ScheduleMeetingDialogProps) {
  const { toast } = useToast()
  const { auth } = useAuth() // Use the useAuth hook to get auth
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [scheduled, setScheduled] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    duration: "30",
    timezone: "IST",
    location: "",
  })

  const handleReset = () => {
    setFormData({
      title: "",
      description: "",
      date: "",
      time: "",
      duration: "30",
      timezone: "IST",
      location: "",
    })
    setScheduled(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleReset()
    }
    onOpenChange(newOpen)
  }

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.date || !formData.time) {
      toast({
        title: "Missing fields",
        description: "Please fill in meeting title, date, and time",
        variant: "destructive",
      })
      return
    }

    if (!lead) return

    setIsSubmitting(true)

    try {
      // Get current user info from auth hook, fallback to admin/system user
      const currentCallerId = auth?.user?.id || "system_admin"
      const currentCallerName = auth?.user?.name || "Admin"

      console.log("[v0] Current auth user:", { currentCallerId, currentCallerName, user: auth?.user })

      const scheduledAt = `${formData.date}T${formData.time}:00`
      
      const meetingData = {
        leadId: lead.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        leadEmail: lead.email,
        callerId: currentCallerId,
        callerName: currentCallerName,
        title: formData.title,
        description: formData.description,
        scheduledAt: new Date(scheduledAt),
        duration: parseInt(formData.duration),
        timezone: formData.timezone,
        location: formData.location,
        status: "scheduled",
        notes: "",
        reminderSent: false,
      }

      console.log("[v0] Submitting meeting data:", meetingData)

      const savedMeeting = await createMeeting(meetingData)
      console.log("[v0] Meeting saved successfully:", savedMeeting)

      toast({
        title: "Meeting scheduled",
        description: `Meeting with ${lead.name} scheduled for ${format(new Date(scheduledAt), "MMM dd, yyyy 'at' hh:mm a")}`,
      })

      setScheduled(true)

      // Auto-close after showing success
      setTimeout(() => {
        handleOpenChange(false)
      }, 2000)
    } catch (error) {
      console.error("[v0] Error scheduling meeting:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to schedule meeting. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!lead) return null

  // Get minimum date (today)
  const today = new Date()
  const minDate = format(today, "yyyy-MM-dd")

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {scheduled ? "✓ Meeting Scheduled" : "Schedule Meeting"}
          </DialogTitle>
        </DialogHeader>

        {!scheduled ? (
          <div className="space-y-6 py-4">
            {/* Lead Info */}
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lead Name</p>
                    <p className="font-semibold text-lg">{lead.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="font-semibold">{lead.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-semibold">{lead.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lead Value</p>
                    <p className="font-semibold text-green-600">₹{lead.value.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Meeting Details */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title" className="text-sm font-medium">
                  Meeting Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Property Discussion, Investment Review"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Add any notes or agenda items for this meeting..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Date & Time Section */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="date" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Date *
                  </Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    min={minDate}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="time" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Time *
                  </Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Duration & Timezone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration" className="text-sm font-medium">
                    Duration (minutes)
                  </Label>
                  <Select value={formData.duration} onValueChange={(value) => setFormData({ ...formData, duration: value })}>
                    <SelectTrigger id="duration" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATIONS.map((duration) => (
                        <SelectItem key={duration} value={String(duration)}>
                          {duration} minutes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone" className="text-sm font-medium">
                    Timezone
                  </Label>
                  <Select value={formData.timezone} onValueChange={(value) => setFormData({ ...formData, timezone: value })}>
                    <SelectTrigger id="timezone" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location / Meeting Link
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Conference Room A, Google Meet link, Zoom call"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-1"
                />
              </div>

              {/* Quick Info */}
              <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="pt-4">
                  <div className="flex gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900 dark:text-blue-100">Meeting reminders will be sent</p>
                      <p className="text-blue-700 dark:text-blue-300">
                        Automatic reminders will be sent 1 day before and 15 minutes before the scheduled meeting.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-100 dark:bg-green-950/20 rounded-full blur-lg"></div>
              <div className="relative w-16 h-16 bg-green-100 dark:bg-green-950/20 rounded-full flex items-center justify-center border-2 border-green-500">
                <Check className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-xl font-semibold">Meeting Confirmed!</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Your meeting with <span className="font-medium">{lead.name}</span> is scheduled for{" "}
                <span className="font-medium">
                  {formData.date && formData.time && format(new Date(`${formData.date}T${formData.time}`), "MMM dd, yyyy 'at' hh:mm a")}
                </span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                Closing this dialog in a moment...
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          {!scheduled && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700">
                {isSubmitting ? "Scheduling..." : "Schedule Meeting"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
