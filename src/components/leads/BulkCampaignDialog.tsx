"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, MessageSquare, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface BulkCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onSend: (type: "email" | "sms", data: { subject?: string; message: string; template?: string }) => void
}

const emailTemplates = {
  introduction: {
    subject: "Welcome to Our Services",
    message:
      "Hi [Name],\n\nThank you for your interest in our services. We'd love to help you find your dream property...",
  },
  followup: {
    subject: "Following Up on Your Interest",
    message: "Hi [Name],\n\nI wanted to follow up on our previous conversation about [Project]...",
  },
  offer: {
    subject: "Exclusive Offer Just for You",
    message: "Hi [Name],\n\nWe have an exclusive offer on [Project] that I think you'll love...",
  },
}

const smsTemplates = {
  introduction:
    "Hi [Name], thank you for your interest! We have some amazing properties to show you. Reply YES to learn more.",
  followup: "Hi [Name], just checking in about your interest in [Project]. Can we schedule a visit? Reply YES.",
  offer: "Hi [Name], special offer on [Project]! Limited time only. Call us at [Phone] to book now.",
}

export function BulkCampaignDialog({ open, onOpenChange, selectedCount, onSend }: BulkCampaignDialogProps) {
  const [campaignType, setCampaignType] = useState<"email" | "sms">("email")
  const [emailSubject, setEmailSubject] = useState("")
  const [message, setMessage] = useState("")
  const [template, setTemplate] = useState<string>("")
  const { toast } = useToast()

  const handleTemplateChange = (templateKey: string) => {
    setTemplate(templateKey)
    if (campaignType === "email") {
      const selectedTemplate = emailTemplates[templateKey as keyof typeof emailTemplates]
      setEmailSubject(selectedTemplate.subject)
      setMessage(selectedTemplate.message)
    } else {
      setMessage(smsTemplates[templateKey as keyof typeof smsTemplates])
    }
  }

  const handleSend = () => {
    if (!message.trim()) {
      toast({
        title: "Error",
        description: "Please enter a message",
        variant: "destructive",
      })
      return
    }

    if (campaignType === "email" && !emailSubject.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email subject",
        variant: "destructive",
      })
      return
    }

    onSend(campaignType, {
      subject: campaignType === "email" ? emailSubject : undefined,
      message,
      template,
    })

    setEmailSubject("")
    setMessage("")
    setTemplate("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Campaign</DialogTitle>
          <DialogDescription>
            Send a campaign to {selectedCount} selected lead{selectedCount !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={campaignType} onValueChange={(v) => setCampaignType(v as "email" | "sms")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="email" className="gap-2">
              <Mail className="w-4 h-4" />
              Email Campaign
            </TabsTrigger>
            <TabsTrigger value="sms" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              SMS Campaign
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="introduction">Introduction</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="offer">Special Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-subject">Subject</Label>
              <Input
                id="email-subject"
                placeholder="Email subject"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email-message">Message</Label>
              <Textarea
                id="email-message"
                placeholder="Email message... Use [Name], [Project], [Phone] for personalization"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
              />
              <p className="text-xs text-muted-foreground">
                Tip: Use [Name], [Project], [City] to personalize messages
              </p>
            </div>
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <div className="space-y-2">
              <Label>Template</Label>
              <Select value={template} onValueChange={handleTemplateChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a template (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="introduction">Introduction</SelectItem>
                  <SelectItem value="followup">Follow-up</SelectItem>
                  <SelectItem value="offer">Special Offer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sms-message">Message</Label>
              <Textarea
                id="sms-message"
                placeholder="SMS message... Use [Name], [Project], [Phone] for personalization"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                maxLength={160}
              />
              <p className="text-xs text-muted-foreground">
                {message.length}/160 characters • Tip: Use [Name], [Project], [Phone] to personalize
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSend} className="gap-2">
            <Send className="w-4 h-4" />
            Send to {selectedCount} Lead{selectedCount !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
