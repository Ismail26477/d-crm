"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { User, Phone, Mail, MapPin, Target, Flame, Users, FileText, X, Briefcase } from "lucide-react"
import type { Lead, LeadStage, LeadPriority } from "@/types/crm"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { fetchCallers, fetchBrokers } from "@/lib/api"

interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddLead: (lead: Lead) => void
}

export function AddLeadDialog({ open, onOpenChange, onAddLead }: AddLeadDialogProps) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [callers, setCallers] = useState<any[]>([])
  const [brokers, setBrokers] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    requirement: "",
    stage: "new" as LeadStage,
    priority: "warm" as LeadPriority,
    assignedCaller: "unassigned",
    assignedBroker: "unassigned",
    notes: "",
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const [callersData, brokersData] = await Promise.all([fetchCallers(), fetchBrokers()])
        
        const activeUsers = callersData.filter(
          (u: any) => (u.role === "caller" || u.role === "admin") && u.status !== "inactive",
        )
        setCallers(activeUsers)
        
        console.log("[v0] Brokers data received:", brokersData)
        
        // Filter for active brokers, but include all if status field doesn't exist
        const activeBrokers = brokersData.filter((b: any) => !b.status || b.status === "active")
        console.log("[v0] Active brokers after filter:", activeBrokers)
        setBrokers(activeBrokers)

        // Auto-assign to current caller if they are logged in as a caller
        if (user?.callerId && activeUsers.some((c: any) => c.id === user.callerId)) {
          setFormData((prev) => ({
            ...prev,
            assignedCaller: user.callerId || "unassigned",
          }))
        }
      } catch (error) {
        console.error("[v0] Error loading data:", error)
        toast({ title: "Error", description: "Failed to load brokers and callers", variant: "destructive" })
      }
    }
    if (open) {
      loadData()
    }
  }, [open, user?.callerId, user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" })
      return
    }
    if (!formData.phone.trim()) {
      toast({ title: "Error", description: "Phone number is required", variant: "destructive" })
      return
    }

    // Optional: Suggest assignment if not selected
    if (formData.assignedCaller === "unassigned" && callers.length > 0) {
      toast({
        title: "Tip",
        description: "Lead is unassigned. Consider assigning it to a caller for better tracking.",
        variant: "default",
      })
    }

    const assignedCaller = callers.find((c) => c.id === formData.assignedCaller)
    const assignedBroker = brokers.find((b) => b.id === formData.assignedBroker)

    console.log("[v0] Form submission - assignedBroker ID:", formData.assignedBroker)
    console.log("[v0] Found broker:", assignedBroker)
    console.log("[v0] Brokers list:", brokers)

    const newLead: Lead = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim() || undefined,
      city: formData.city.trim() || "Not specified",
      projectName: formData.requirement.trim() || undefined,
      stage: formData.stage,
      priority: formData.priority,
      assignedCaller: formData.assignedCaller !== "unassigned" ? formData.assignedCaller : undefined,
      assignedCallerName: assignedCaller?.name,
      assignedBroker: formData.assignedBroker !== "unassigned" ? formData.assignedBroker : undefined,
      assignedBrokerName: formData.assignedBroker !== "unassigned" ? assignedBroker?.name : undefined,
      notes: formData.notes.trim() || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    console.log("[v0] New lead being submitted:", newLead)
    onAddLead(newLead)

    // Reset form but keep caller assignment if user is a caller
    setFormData({
      name: "",
      phone: "",
      email: "",
      city: "",
      requirement: "",
      stage: "new",
      priority: "warm",
      assignedCaller: user?.callerId || "unassigned",
      assignedBroker: "unassigned",
      notes: "",
    })

    onOpenChange(false)
    toast({ title: "Success!", description: "Lead has been added successfully" })
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto w-[98vw] sm:w-full rounded-2xl border border-primary/10 bg-gradient-to-br from-background via-background to-accent/30 shadow-2xl">
        <DialogHeader className="pb-6 border-b border-primary/10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Add New Lead
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-2">Create a new lead account with essential details</p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Close dialog"
            >
              <X size={20} className="text-muted-foreground" />
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User size={18} className="text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">Basic Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <span>Full Name</span>
                  <span className="text-destructive text-lg">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  placeholder="John Doe"
                  required
                  className="rounded-lg border border-input/50 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-card/50 backdrop-blur-sm transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone size={16} className="text-primary/60" />
                  <span>Phone Number</span>
                  <span className="text-destructive text-lg">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="rounded-lg border border-input/50 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-card/50 backdrop-blur-sm transition-colors"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                <Mail size={16} className="text-primary/60" />
                <span>Email Address</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="john@example.com"
                className="rounded-lg border border-input/50 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-card/50 backdrop-blur-sm transition-colors"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
                  <MapPin size={16} className="text-primary/60" />
                  <span>City</span>
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="New Delhi"
                  className="rounded-lg border border-input/50 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-card/50 backdrop-blur-sm transition-colors"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="requirement" className="text-sm font-medium">
                  Requirement
                </Label>
                <Input
                  id="requirement"
                  value={formData.requirement}
                  onChange={(e) => handleChange("requirement", e.target.value)}
                  placeholder="Looking for 2BHK apartment"
                  className="rounded-lg border border-input/50 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-card/50 backdrop-blur-sm transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Lead Details Section */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Target size={18} className="text-secondary" />
              </div>
              <h3 className="font-semibold text-foreground">Lead Status</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="stage" className="text-sm font-medium">
                  Stage
                </Label>
                <Select value={formData.stage} onValueChange={(val) => handleChange("stage", val)}>
                  <SelectTrigger
                    id="stage"
                    className="rounded-lg border-input/50 bg-card/50 backdrop-blur-sm hover:border-primary focus:ring-1 focus:ring-primary/20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium flex items-center gap-2">
                  <Flame size={16} className="text-orange-500" />
                  <span>Priority</span>
                </Label>
                <Select value={formData.priority} onValueChange={(val) => handleChange("priority", val)}>
                  <SelectTrigger
                    id="priority"
                    className="rounded-lg border-input/50 bg-card/50 backdrop-blur-sm hover:border-primary focus:ring-1 focus:ring-primary/20"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hot">Hot</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cold">Cold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className={`space-y-2 p-4 rounded-lg border ${
              formData.assignedBroker !== "unassigned"
                ? "bg-primary/5 border-primary/20"
                : "bg-muted/5 border-muted/20"
            }`}>
              <Label htmlFor="assignedBroker" className="text-sm font-medium flex items-center gap-2">
                <Briefcase size={16} className={formData.assignedBroker !== "unassigned" ? "text-primary" : "text-muted-foreground"} />
                <span>Assign to Broker</span>
              </Label>
              <Select value={formData.assignedBroker} onValueChange={(val) => handleChange("assignedBroker", val)}>
                <SelectTrigger
                  id="assignedBroker"
                  className="rounded-lg border-input/50 bg-white dark:bg-card/50 backdrop-blur-sm hover:border-primary focus:ring-1 focus:ring-primary/20 font-medium"
                >
                  {formData.assignedBroker !== "unassigned" ? (
                    <span className="text-foreground font-medium">
                      {brokers.find(b => b.id === formData.assignedBroker)?.name || "Select a broker (optional)"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {formData.assignedBroker === "unassigned" ? "No Broker" : "Select a broker (optional)"}
                    </span>
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="unassigned">No Broker</SelectItem>
                  {brokers.length > 0 ? (
                    brokers.map((broker) => (
                      <SelectItem key={broker.id} value={broker.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-primary"></div>
                          {broker.name}
                          {broker.company && <span className="text-xs text-muted-foreground">({broker.company})</span>}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No brokers available</div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-2">
                Optionally assign a broker to manage this lead.
              </p>
            </div>

          {/* Assignment & Notes Section */}
          <div className="space-y-4 pt-2 border-t border-primary/10 mt-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-info/10 rounded-lg">
                <Users size={18} className="text-info" />
              </div>
              <h3 className="font-semibold text-foreground text-lg">Lead Assignment</h3>
              <span className="text-xs bg-info/20 text-info px-2 py-1 rounded-full ml-auto">Required for tracking</span>
            </div>

            <div className={`space-y-2 p-4 rounded-lg border ${
              user?.callerId && formData.assignedCaller !== "unassigned"
                ? "bg-success/5 border-success/20"
                : "bg-info/5 border-info/20"
            }`}>
              <Label htmlFor="assignedCaller" className="text-sm font-medium flex items-center gap-2">
                <Users size={16} className={user?.callerId && formData.assignedCaller !== "unassigned" ? "text-success" : "text-info"} />
                <span>Assign to Caller</span>
                <span className="text-destructive text-lg">*</span>
              </Label>
              <Select value={formData.assignedCaller} onValueChange={(val) => handleChange("assignedCaller", val)}>
                <SelectTrigger
                  id="assignedCaller"
                  className="rounded-lg border-input/50 bg-white dark:bg-card/50 backdrop-blur-sm hover:border-info focus:ring-1 focus:ring-info/20 font-medium"
                >
                  {formData.assignedCaller !== "unassigned" ? (
                    <span className="text-foreground font-medium">
                      {callers.find(c => c.id === formData.assignedCaller)?.name || "Select a caller name"}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">
                      {formData.assignedCaller === "unassigned" ? "Unassigned" : "Select a caller name"}
                    </span>
                  )}
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {callers.length > 0 ? (
                    callers.map((caller) => (
                      <SelectItem key={caller.id} value={caller.id}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            caller.id === user?.callerId ? "bg-success" : "bg-green-500"
                          }`}></div>
                          {caller.name}
                          {caller.id === user?.callerId && <span className="text-xs ml-2 text-success font-semibold">(You)</span>}
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-2 py-1.5 text-sm text-muted-foreground">No callers available</div>
                  )}
                </SelectContent>
              </Select>
              {user?.callerId && formData.assignedCaller === user.callerId ? (
                <p className="text-xs text-success mt-2 flex items-center gap-1">
                  <span className="text-lg">✓</span>
                  This lead will be assigned to you automatically.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-2">
                  Select a caller to assign this lead directly. The caller will be notified automatically.
                </p>
              )}
            </div>

            

            <div className="space-y-2 pt-6 border-t border-primary/10">
              <Label htmlFor="notes" className="text-sm font-medium flex items-center gap-2">
                <FileText size={16} className="text-primary/60" />
                <span>Notes</span>
              </Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Add any additional notes or requirements..."
                rows={3}
                className="rounded-lg border border-input/50 focus:border-primary focus:ring-1 focus:ring-primary/20 bg-card/50 backdrop-blur-sm transition-colors resize-none"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-primary/10">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-lg font-medium border-input/50 hover:bg-muted/50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-gradient-primary rounded-lg font-medium px-8 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Create Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
