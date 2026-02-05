"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { differenceInDays } from "date-fns"
import { Lightbulb, Zap, TrendingUp, Clock, MessageSquare, Phone, Mail, CheckCircle2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Lead } from "@/types/crm"

interface Recommendation {
  id: string
  type: "timing" | "method" | "priority" | "pattern" | "urgency"
  title: string
  description: string
  action: string
  confidence: "high" | "medium" | "low"
  icon: React.ReactNode
  actionLabel: string
  reason: string
}

interface FollowUpRecommendationsProps {
  lead: Lead
  lastContactDate?: string
  callHistory?: { date: string; duration: number }[]
  conversionRate?: number
  onApplyRecommendation?: (recommendation: Recommendation) => void
}

export function FollowUpRecommendations({
  lead,
  lastContactDate,
  callHistory = [],
  conversionRate = 0.35,
  onApplyRecommendation,
}: FollowUpRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // AI-powered recommendations based on lead behavior
    const generateRecommendations = () => {
      const recs: Recommendation[] = []
      const now = new Date()

      // Calculate days since last contact
      const daysSinceContact = lastContactDate ? differenceInDays(now, new Date(lastContactDate)) : 99

      // 1. TIMING RECOMMENDATION
      if (daysSinceContact > 3) {
        recs.push({
          id: "timing-urgent",
          type: "timing",
          title: "Urgent Follow-up Needed",
          description: `No contact for ${daysSinceContact} days. Leads lose interest after 4+ days.`,
          action: `Contact within 24 hours`,
          confidence: "high",
          icon: <Zap className="w-5 h-5" />,
          actionLabel: "Schedule Now",
          reason: "Lead engagement research shows conversion drops 70% after 4+ days of inactivity",
        })
      } else if (daysSinceContact > 1) {
        recs.push({
          id: "timing-follow",
          type: "timing",
          title: "Schedule Follow-up",
          description: `Best follow-up window is ${2 - daysSinceContact} days from now.`,
          action: `Follow up tomorrow`,
          confidence: "medium",
          icon: <Clock className="w-5 h-5" />,
          actionLabel: "Schedule",
          reason: "Studies show optimal follow-up is within 24-48 hours",
        })
      }

      // 2. METHOD RECOMMENDATION
      if (lead.priority === "hot") {
        recs.push({
          id: "method-call",
          type: "method",
          title: "Use Phone Call",
          description: "Hot leads respond best to direct calls (82% connection rate).",
          action: "Make a personalized call",
          confidence: "high",
          icon: <Phone className="w-5 h-5" />,
          actionLabel: "Call Lead",
          reason: "Hot leads have immediate interest - calls are 3x more effective than email",
        })
      } else if (lead.priority === "warm") {
        recs.push({
          id: "method-whatsapp",
          type: "method",
          title: "Try WhatsApp Message",
          description: "Warm leads prefer quick messages (65% response rate).",
          action: "Send personalized WhatsApp",
          confidence: "high",
          icon: <MessageSquare className="w-5 h-5" />,
          actionLabel: "Send WhatsApp",
          reason: "WhatsApp has 65% response rate vs 12% for email for warm leads",
        })
      } else {
        recs.push({
          id: "method-email",
          type: "method",
          title: "Send Educational Email",
          description: "Cold leads need nurturing (email can be 5x cheaper).",
          action: "Share relevant property insights",
          confidence: "medium",
          icon: <Mail className="w-5 h-5" />,
          actionLabel: "Send Email",
          reason: "Cold leads benefit from educational content before direct contact",
        })
      }

      // 3. PRIORITY RECOMMENDATION
      if (lead.stage === "proposal" || lead.stage === "negotiation") {
        recs.push({
          id: "priority-closing",
          type: "priority",
          title: "Closing is Key Now",
          description: "Lead is in final stages. Every day delay reduces conversion by 5%.",
          action: "Daily follow-up until closure",
          confidence: "high",
          icon: <TrendingUp className="w-5 h-5" />,
          actionLabel: "Prioritize",
          reason: "At proposal stage, daily contact increases close rate from 45% to 78%",
        })
      } else if (lead.stage === "qualified") {
        recs.push({
          id: "priority-qualify",
          type: "priority",
          title: "Move to Proposal",
          description: "Lead is ready. Send proposal within 48 hours to maintain momentum.",
          action: "Prepare and send proposal",
          confidence: "high",
          icon: <TrendingUp className="w-5 h-5" />,
          actionLabel: "Create Proposal",
          reason: "Qualified leads close 3x faster with proposal sent within 48 hours",
        })
      }

      // 4. PATTERN RECOMMENDATION
      if (callHistory.length >= 2) {
        const avgDuration = callHistory.reduce((sum, call) => sum + call.duration, 0) / callHistory.length
        if (avgDuration > 300) {
          // More than 5 minutes
          recs.push({
            id: "pattern-engaged",
            type: "pattern",
            title: "Highly Engaged Lead",
            description: `Average call duration is ${Math.round(avgDuration / 60)} mins. Lead is genuinely interested.`,
            action: "Accelerate sales process",
            confidence: "high",
            icon: <CheckCircle2 className="w-5 h-5" />,
            actionLabel: "Send Proposal",
            reason: "Calls over 5 minutes indicate strong buying intent",
          })
        }
      }

      // 5. URGENCY RECOMMENDATION
      if (lead.value > 5000000 && daysSinceContact > 2) {
        recs.push({
          id: "urgency-high-value",
          type: "urgency",
          title: "High-Value Lead Stalling",
          description: `Lead worth ₹${(lead.value / 10000000).toFixed(1)} Cr. Requires immediate attention.`,
          action: "Escalate to senior team member",
          confidence: "high",
          icon: <Zap className="w-5 h-5" />,
          actionLabel: "Escalate",
          reason: "High-value leads have more decision-makers; requires senior involvement",
        })
      }

      setRecommendations(recs.sort((a, b) => (a.confidence === "high" ? -1 : 1)))
    }

    generateRecommendations()
    setIsLoading(false)
  }, [lead, lastContactDate, callHistory])

  const confidenceColor = {
    high: "bg-green-100 text-green-800 border-green-300",
    medium: "bg-blue-100 text-blue-800 border-blue-300",
    low: "bg-gray-100 text-gray-800 border-gray-300",
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-sm font-medium">All Set!</p>
          <p className="text-xs text-muted-foreground mt-1">No immediate recommendations for this lead</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {recommendations.map((rec) => (
        <Card key={rec.id} className="overflow-hidden hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header with icon and title */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  {rec.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <p className="font-medium text-sm text-foreground">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.description}</p>
                    </div>
                    <Badge className={`shrink-0 border text-xs ${confidenceColor[rec.confidence]}`} variant="outline">
                      {rec.confidence}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Reasoning */}
              <Alert className="bg-blue-50 border-blue-200">
                <Lightbulb className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-xs text-blue-900 ml-2">{rec.reason}</AlertDescription>
              </Alert>

              {/* Action Button */}
              <Button size="sm" onClick={() => onApplyRecommendation?.(rec)} className="w-full gap-2 text-xs h-8">
                <Zap className="w-3 h-3" />
                {rec.actionLabel}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
