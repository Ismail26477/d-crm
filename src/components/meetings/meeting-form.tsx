"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Meeting, Lead, Caller } from "@/types/crm"

interface MeetingFormProps {
  onSubmit: (data: any) => Promise<void>
  loading?: boolean
  initialData?: Partial<Meeting>
  leads: Lead[]
  callers: Caller[]
  isEditing?: boolean
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

export const MeetingForm = ({
  onSubmit,
  loading = false,
  initialData,
  leads,
  callers,
  isEditing = false,
}: MeetingFormProps) => {
  const [formData, setFormData] = useState({
    leadId: initialData?.leadId || "",
    callerId: initialData?.callerId || "",
    title: initialData?.title || "",
    description: initialData?.description || "",
    scheduledAt: initialData?.scheduledAt ? new Date(initialData.scheduledAt).toISOString().slice(0, 16) : "",
    duration: initialData?.duration || 30,
    timezone: initialData?.timezone || "UTC",
    location: initialData?.location || "",
    notes: initialData?.notes || "",
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

    const selectedLead = leads.find((l) => l.id === formData.leadId)
    const selectedCaller = callers.find((c) => c.id === formData.callerId)

    const submitData = {
      ...formData,
      leadId: formData.leadId,
      leadName: selectedLead?.name,
      leadPhone: selectedLead?.phone,
      leadEmail: selectedLead?.email,
      callerId: formData.callerId,
      callerName: selectedCaller?.name,
      scheduledAt: new Date(formData.scheduledAt).toISOString(),
      duration: Number.parseInt(formData.duration.toString()),
    }

    await onSubmit(submitData)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Meeting" : "Schedule New Meeting"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="leadId">Lead *</Label>
              <Select value={formData.leadId} onValueChange={(value) => handleSelectChange("leadId", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  {leads.map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.name} - {lead.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="callerId">Assigned To *</Label>
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
          </div>

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

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Meeting details and context"
              rows={3}
            />
          </div>

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

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : isEditing ? "Update Meeting" : "Schedule Meeting"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
