"use client"

import React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Lead, Caller } from "@/types/crm"
import { createMeeting } from "@/lib/api"

interface MeetingSchedulerDialogProps {
  isOpen: boolean
  onClose: () => void
  lead: Lead
  callers: Caller[]
  onMeetingCreated?: () => void
}

const TIMEZONES = [
  "UTC",
  "IST (GMT+5:30)",
  "GST (GMT+4)",
  "EST (GMT-5)",
  "CST (GMT-6)",
  "PST (GMT-8)",
  "GMT",
  "CET (GMT+1)",
  "EET (GMT+2)",
  "AEST (GMT+10)",
]

export const MeetingSchedulerDialog = ({
  isOpen,
  onClose,
  lead,
  callers,
  onMeetingCreated,
}: MeetingSchedulerDialogProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    scheduledAt: "",
    duration: "30",
    timezone: "IST (GMT+5:30)",
    location: "",
    notes: "",
    callerId: callers[0]?.id || "",
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const selectedCaller = callers.find((c) => c.id === formData.callerId)

      const meetingData = {
        leadId: lead.id,
        leadName: lead.name,
        leadPhone: lead.phone,
        leadEmail: lead.email,
        callerId: formData.callerId,
        callerName: selectedCaller?.name,
        title: formData.title,
        description: formData.description,
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        duration: Number.parseInt(formData.duration),
        timezone: formData.timezone,
        location: formData.location,
        notes: formData.notes,
        status: "scheduled",
      }

      await createMeeting(meetingData)

      toast({
        title: "Success",
        description: `Meeting scheduled with ${lead.name}`,
      })

      setFormData({
        title: "",
        description: "",
        scheduledAt: "",
        duration: "30",
        timezone: "IST (GMT+5:30)",
        location: "",
        notes: "",
        callerId: callers[0]?.id || "",
      })

      onMeetingCreated?.()
      onClose()
    } catch (error) {
      console.error("[v0] Error scheduling meeting:", error)
      toast({
        title: "Error",
        description: "Failed to schedule meeting",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Meeting with {lead.name}
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Lead Info - Read Only */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border">
                <div>
                  <Label className="text-xs text-slate-600">Lead Name</Label>
                  <p className="font-medium">{lead.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Phone</Label>
                  <p className="font-medium">{lead.phone}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Email</Label>
                  <p className="font-medium text-sm">{lead.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-slate-600">Lead Status</Label>
                  <p className="font-medium">{lead.stage}</p>
                </div>
              </div>

              {/* Meeting Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Meeting Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Property Viewing, Contract Discussion"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Meeting details and context"
                  rows={2}
                />
              </div>

              {/* Date & Time + Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Date & Time *</Label>
                  <Input
                    id="scheduledAt"
                    name="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    name="duration"
                    type="number"
                    min="15"
                    step="15"
                    value={formData.duration}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* Timezone + Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone *</Label>
                  <Select value={formData.timezone} onValueChange={(value) => handleSelectChange("timezone", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMEZONES.map((tz) => (
                        <SelectItem key={tz} value={tz}>
                          {tz}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location/Meeting Link</Label>
                  <Input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Zoom Link, Office Address"
                  />
                </div>
              </div>

              {/* Assigned To */}
              <div className="space-y-2">
                <Label htmlFor="callerId">Assign To Caller *</Label>
                <Select value={formData.callerId} onValueChange={(value) => handleSelectChange("callerId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select caller" />
                  </SelectTrigger>
                  <SelectContent>
                    {callers.map((caller) => (
                      <SelectItem key={caller.id} value={caller.id}>
                        {caller.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional notes for reference"
                  rows={2}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 justify-end pt-4">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Scheduling..." : "Schedule Meeting"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  )
}
