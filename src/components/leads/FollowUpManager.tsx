"use client"

import { useState, useEffect } from "react"
import { format, isPast } from "date-fns"
import { Clock, Plus, CheckCircle2, AlertCircle, XCircle, Phone, Mail, MessageCircle, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { createFollowUp, fetchFollowUps } from "@/lib/api"

const API_BASE_URL = (() => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://localhost:5000/api"
    }
  }
  return "/api"
})()

interface FollowUp {
  id: string
  leadId: string
  scheduledFor: string
  reason: string
  status: "pending" | "completed" | "missed" | "cancelled"
  type: "call" | "email" | "sms" | "whatsapp"
  notes: string
  createdByName: string
  completedAt?: string
  completedNotes?: string
  outcome?: string
  createdAt: string
  updatedAt: string
}

interface FollowUpManagerProps {
  leadId: string
  leadName: string
}

export function FollowUpManager({ leadId, leadName }: FollowUpManagerProps) {
  const { toast } = useToast()
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedFollowUp, setSelectedFollowUp] = useState<FollowUp | null>(null)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)

  const [formData, setFormData] = useState({
    scheduledFor: "",
    scheduledTime: "",
    reason: "custom" as const,
    type: "call" as const,
    notes: "",
  })

  const [completeForm, setCompleteForm] = useState({
    outcome: "",
    completedNotes: "",
  })

  const [mongodbConnected, setMongodbConnected] = useState(true)
  const [connectionError, setConnectionError] = useState("")

  // Load follow-ups
  useEffect(() => {
    const loadFollowUps = async () => {
      try {
        setIsLoading(true)
        // Check MongoDB connection first
        const healthResponse = await fetch(`${API_BASE_URL}/health`)
        const health = await healthResponse.json()
        setMongodbConnected(health.mongodb?.connected || false)
        
        if (!health.mongodb?.connected) {
          setConnectionError("MongoDB is not connected. Please check your .env file and ensure MONGODB_URI is set correctly.")
          console.warn("[v0] MongoDB not connected. Health check:", health)
        }

        // Fetch all follow-ups and filter by leadId
        const allFollowUps = await fetchFollowUps()
        const leadFollowUps = allFollowUps.filter((fu: any) => fu.leadId === leadId)
        console.log("[v0] Loaded follow-ups for lead", leadId, ":", leadFollowUps)
        setFollowUps(leadFollowUps)
      } catch (error) {
        console.error("[v0] Error loading follow-ups:", error)
        setMongodbConnected(false)
        setConnectionError("Failed to connect to backend API. Ensure the server is running on port 5000.")
      } finally {
        setIsLoading(false)
      }
    }

    loadFollowUps()
  }, [leadId])

  const handleCreateFollowUp = async () => {
    if (!formData.scheduledFor || !formData.scheduledTime) {
      toast({ title: "Missing fields", description: "Please select date and time", variant: "destructive" })
      return
    }

    try {
      const scheduledDateTime = new Date(`${formData.scheduledFor}T${formData.scheduledTime}`)

      console.log("[v0] ===== SUBMITTING FOLLOW-UP =====")
      console.log("[v0] Lead ID:", leadId)
      console.log("[v0] Lead Name:", leadName)
      console.log("[v0] Scheduled DateTime:", scheduledDateTime.toISOString())
      console.log("[v0] Reason:", formData.reason)
      console.log("[v0] Type:", formData.type)
      console.log("[v0] Notes:", formData.notes)

      const followUpPayload = {
        leadId,
        scheduledFor: scheduledDateTime.toISOString(),
        reason: formData.reason,
        type: formData.type,
        notes: formData.notes,
        createdByName: "Caller",
      }

      console.log("[v0] Full payload:", JSON.stringify(followUpPayload, null, 2))

      const newFollowUp = await createFollowUp(followUpPayload)

      console.log("[v0] ✅ Follow-up created successfully:", newFollowUp)
      setFollowUps([newFollowUp, ...followUps])
      setShowDialog(false)
      setFormData({ scheduledFor: "", scheduledTime: "", reason: "custom", type: "call", notes: "" })
      toast({ 
        title: "✅ Follow-up created", 
        description: "Follow-up scheduled successfully and saved to database" 
      })
    } catch (error) {
      console.error("[v0] ===== ERROR CREATING FOLLOW-UP =====")
      console.error("[v0] Error:", error)
      if (error instanceof Error) {
        console.error("[v0] Message:", error.message)
        console.error("[v0] Stack:", error.stack)
      }
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to create follow-up", 
        variant: "destructive" 
      })
    }
  }

  const handleCompleteFollowUp = async () => {
    if (!selectedFollowUp) return

    try {
      const url = `${API_BASE_URL}/followups/${selectedFollowUp.id}/complete`
      console.log("[v0] Completing follow-up at:", url)
      
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          outcome: completeForm.outcome,
          completedNotes: completeForm.completedNotes,
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        console.log("[v0] Follow-up completed successfully:", updated)
        setFollowUps(followUps.map((fu) => (fu.id === updated.id ? updated : fu)))
        setShowCompleteDialog(false)
        setSelectedFollowUp(null)
        setCompleteForm({ outcome: "", completedNotes: "" })
        toast({ title: "Follow-up completed", description: "Follow-up marked as completed" })
      } else {
        const errorText = await response.text()
        console.error("[v0] Error completing follow-up. Status:", response.status, "Response:", errorText)
        toast({ title: "Error", description: `Failed to complete follow-up: ${response.status}`, variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error completing follow-up:", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to complete follow-up", variant: "destructive" })
    }
  }

  const handleCancelFollowUp = async (followUpId: string) => {
    try {
      const url = `${API_BASE_URL}/followups/${followUpId}/cancel`
      console.log("[v0] Cancelling follow-up at:", url)
      
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      })

      if (response.ok) {
        const updated = await response.json()
        console.log("[v0] Follow-up cancelled successfully:", updated)
        setFollowUps(followUps.map((fu) => (fu.id === updated.id ? updated : fu)))
        toast({ title: "Follow-up cancelled", description: "Follow-up has been cancelled" })
      } else {
        const errorText = await response.text()
        console.error("[v0] Error cancelling follow-up. Status:", response.status, "Response:", errorText)
        toast({ title: "Error", description: `Failed to cancel follow-up: ${response.status}`, variant: "destructive" })
      }
    } catch (error) {
      console.error("[v0] Error cancelling follow-up:", error)
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to cancel follow-up", variant: "destructive" })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case "missed":
        return <AlertCircle className="w-5 h-5 text-orange-600" />
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-blue-600" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="w-4 h-4" />
      case "email":
        return <Mail className="w-4 h-4" />
      case "sms":
      case "whatsapp":
        return <MessageCircle className="w-4 h-4" />
      default:
        return <Calendar className="w-4 h-4" />
    }
  }

  const pendingFollowUps = followUps.filter((fu) => fu.status === "pending")
  const overdue = pendingFollowUps.filter((fu) => isPast(new Date(fu.scheduledFor)))
  const upcoming = pendingFollowUps.filter((fu) => !isPast(new Date(fu.scheduledFor)))
  const completed = followUps.filter((fu) => fu.status === "completed")

  return (
    <div className="space-y-4">
      {!mongodbConnected && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">MongoDB Connection Error</p>
                <p className="text-sm text-red-800 mt-1">{connectionError}</p>
                <p className="text-xs text-red-700 mt-2">
                  Follow-ups will NOT be saved until MongoDB is connected. See SETUP_MONGODB_NOW.md for instructions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Clock className="w-4 h-4" />
          Follow-ups for {leadName}
        </div>
        <Button size="sm" gap-1 onClick={() => setShowDialog(true)} disabled={!mongodbConnected}>
          <Plus className="w-4 h-4" />
          Add Follow-up
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Loading follow-ups...</p>
        </div>
      )}

      {!isLoading && followUps.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No follow-ups scheduled yet</p>
            <p className="text-sm text-muted-foreground mt-2">Click "Add Follow-up" to schedule one</p>
          </CardContent>
        </Card>
      )}

      {/* Overdue Follow-ups Alert */}
      {overdue.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-orange-900">
                  {overdue.length} overdue follow-up{overdue.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-orange-800 mt-1">{overdue.map((fu) => `${fu.reason}`).join(", ")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Follow-ups */}
      {upcoming.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Upcoming</p>
          {upcoming.map((followUp) => (
            <Card key={followUp.id} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {getStatusIcon(followUp.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {followUp.type}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {followUp.reason}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelFollowUp(followUp.id)}
                        className="h-6 w-6 p-0 text-xs"
                      >
                        ×
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(followUp.scheduledFor), "dd MMM yyyy, hh:mm a")}
                    </p>
                    {followUp.notes && <p className="text-xs mt-2 text-gray-700 line-clamp-2">{followUp.notes}</p>}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedFollowUp(followUp)
                      setShowCompleteDialog(true)
                    }}
                    className="shrink-0"
                  >
                    Mark Done
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Completed Follow-ups */}
      {completed.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-2 px-1">
            Completed ({completed.length})
          </summary>
          <div className="space-y-2 mt-2">
            {completed.map((followUp) => (
              <Card key={followUp.id} className="opacity-75">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(followUp.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="text-xs">
                          {followUp.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {followUp.reason}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(followUp.scheduledFor), "dd MMM yyyy, hh:mm a")}
                      </p>
                      {followUp.outcome && (
                        <p className="text-xs mt-1 text-green-700 font-medium">Outcome: {followUp.outcome}</p>
                      )}
                      {followUp.completedNotes && (
                        <p className="text-xs mt-1 text-gray-700">{followUp.completedNotes}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </details>
      )}

      {/* No Follow-ups */}
      {followUps.length === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted-foreground">No follow-ups scheduled yet</p>
            <p className="text-xs text-muted-foreground mt-1">Schedule your first follow-up to stay on track</p>
          </CardContent>
        </Card>
      )}

      {/* Create Follow-up Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schedule Follow-up for {leadName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="date" className="text-xs">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData((prev) => ({ ...prev, scheduledFor: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-xs">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData((prev) => ({ ...prev, scheduledTime: e.target.value }))}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="reason" className="text-xs">
                Reason
              </Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, reason: value as any }))}
              >
                <SelectTrigger id="reason">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on_request">On Request</SelectItem>
                  <SelectItem value="not_picked">Not Picked Up</SelectItem>
                  <SelectItem value="not_reachable">Not Reachable</SelectItem>
                  <SelectItem value="switched_off">Switched Off</SelectItem>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="high_priority">High Priority</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type" className="text-xs">
                Follow-up Type
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value as any }))}
              >
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-xs">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add any notes for this follow-up..."
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                className="h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFollowUp} className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Complete Follow-up Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Follow-up</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="outcome" className="text-xs">
                Outcome
              </Label>
              <Select
                value={completeForm.outcome}
                onValueChange={(value) => setCompleteForm((prev) => ({ ...prev, outcome: value }))}
              >
                <SelectTrigger id="outcome">
                  <SelectValue placeholder="Select outcome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="interested">Interested</SelectItem>
                  <SelectItem value="not_interested">Not Interested</SelectItem>
                  <SelectItem value="no_answer">No Answer</SelectItem>
                  <SelectItem value="callback_scheduled">Callback Scheduled</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-xs">
                Notes
              </Label>
              <Textarea
                id="notes"
                placeholder="Add notes about the follow-up outcome..."
                value={completeForm.completedNotes}
                onChange={(e) => setCompleteForm((prev) => ({ ...prev, completedNotes: e.target.value }))}
                className="h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCompleteDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCompleteFollowUp} className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Mark Completed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
