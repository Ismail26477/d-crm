import type { Lead, CallLog } from "@/types/crm"
import { differenceInDays } from "date-fns"

export interface LeadAnalytics {
  daysSinceCreated: number
  daysSinceLastContact: number
  callCount: number
  avgCallDuration: number
  conversionProbability: number
  suggestedFollowUpDays: number
  engagementScore: number
  recommendedMethod: "call" | "email" | "sms" | "whatsapp"
  urgencyLevel: "critical" | "high" | "medium" | "low"
}

export function analyzeLeadBehavior(lead: Lead, callLogs: CallLog[] = []): LeadAnalytics {
  const now = new Date()
  const createdDate = new Date(lead.createdAt)
  const daysSinceCreated = differenceInDays(now, createdDate)

  // Calculate days since last contact
  const lastContactDate = lead.nextFollowUp ? new Date(lead.nextFollowUp) : createdDate
  const daysSinceLastContact = differenceInDays(now, lastContactDate)

  // Call analytics
  const callCount = callLogs.length
  const avgCallDuration = callCount > 0 ? callLogs.reduce((sum, call) => sum + call.duration, 0) / callCount : 0

  // Conversion probability based on stage and priority
  const stageConversionMap = {
    new: 0.15,
    qualified: 0.35,
    proposal: 0.65,
    negotiation: 0.8,
    won: 1.0,
    lost: 0.0,
  }

  const priorityMultiplier = {
    hot: 1.3,
    warm: 1.0,
    cold: 0.7,
  }

  let conversionProbability =
    (stageConversionMap[lead.stage as keyof typeof stageConversionMap] || 0) *
    (priorityMultiplier[lead.priority as keyof typeof priorityMultiplier] || 1)

  // Decay conversion probability based on inactivity
  const decayFactor = 1 - daysSinceLastContact * 0.05 // 5% decay per day
  conversionProbability = Math.max(0, conversionProbability * decayFactor)

  // Suggested follow-up days
  let suggestedFollowUpDays = 1
  if (lead.priority === "cold") suggestedFollowUpDays = 3
  else if (lead.priority === "warm") suggestedFollowUpDays = 2
  else suggestedFollowUpDays = 0 // Hot leads need immediate follow-up

  // Engagement score (0-100)
  let engagementScore = 50
  if (callCount > 3) engagementScore += 15
  if (avgCallDuration > 300) engagementScore += 20 // 5+ min calls
  if (lead.notes) engagementScore += 10
  if (daysSinceLastContact < 2) engagementScore += 15
  engagementScore = Math.min(100, engagementScore)

  // Recommended method based on lead characteristics
  let recommendedMethod: "call" | "email" | "sms" | "whatsapp" = "email"
  if (lead.priority === "hot") {
    recommendedMethod = "call"
  } else if (lead.priority === "warm") {
    recommendedMethod = callCount > 2 ? "sms" : "call"
  } else {
    recommendedMethod = daysSinceLastContact > 7 ? "email" : "whatsapp"
  }

  // Urgency level
  let urgencyLevel: "critical" | "high" | "medium" | "low" = "low"
  if (daysSinceLastContact > 5 && (lead.stage === "proposal" || lead.stage === "negotiation")) {
    urgencyLevel = "critical"
  } else if (lead.stage === "negotiation" && daysSinceLastContact > 2) {
    urgencyLevel = "high"
  } else if (lead.value > 10000000 && daysSinceLastContact > 3) {
    urgencyLevel = "high"
  } else if (daysSinceLastContact > 3) {
    urgencyLevel = "medium"
  }

  return {
    daysSinceCreated,
    daysSinceLastContact,
    callCount,
    avgCallDuration,
    conversionProbability: Math.round(conversionProbability * 100),
    suggestedFollowUpDays,
    engagementScore,
    recommendedMethod,
    urgencyLevel,
  }
}

export function getFollowUpInsights(analytics: LeadAnalytics) {
  const insights: string[] = []

  if (analytics.urgencyLevel === "critical") {
    insights.push("This lead requires immediate attention - risk of losing deal")
  }

  if (analytics.conversionProbability > 70) {
    insights.push("High conversion probability - prioritize for closing")
  }

  if (analytics.daysSinceLastContact > 5) {
    insights.push(`No contact for ${analytics.daysSinceLastContact} days - reconnect urgently`)
  }

  if (analytics.avgCallDuration > 300) {
    insights.push("Lead shows strong engagement - highly interested")
  }

  if (analytics.engagementScore < 30) {
    insights.push("Low engagement - try different approach or nurture campaign")
  }

  return insights
}
