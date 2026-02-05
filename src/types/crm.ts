export type LeadStage = "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost"
export type LeadPriority = "hot" | "warm" | "cold"
export type LeadStatus = "interested" | "callback" | "not_interested" | "active" | "inactive" | "paused"
export type LeadSource = "website" | "google_ads" | "referral" | "social_media" | "walk_in" | "other"
export type LeadCategory = "property" | "loans" | "other"
export type LeadSubcategory =
  | "india_property"
  | "australia_property"
  | "dubai_property"
  | "personal_loan"
  | "home_loan"
  | "business_loan"
  | "other"
export type UserRole = "admin" | "caller"
export type CallbackReason = "on_request" | "not_picked" | "not_reachable" | "switched_off" | "other"
export type NotInterestedReason =
  | "low_budget"
  | "not_a_property_seeker"
  | "location_mismatch"
  | "dnd"
  | "already_bought"
  | "other"
export type MeetingStatus = "scheduled" | "completed" | "cancelled" | "no_show"

export interface Lead {
  id: string
  name: string
  phone: string
  email: string
  city: string
  value: number
  source: LeadSource
  stage: LeadStage
  priority: LeadPriority
  status: LeadStatus
  category: LeadCategory
  subcategory: LeadSubcategory
  assignedCaller?: string
  assignedCallerName?: string
  assignedBroker?: string
  assignedBrokerName?: string
  projectName?: string
  nextFollowUp?: string
  followUpReason?: string
  callbackReason?: CallbackReason
  callbackScheduledAt?: string
  notInterestedReason?: NotInterestedReason
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface Caller {
  id: string
  username: string
  name: string
  email: string
  phone: string
  role: UserRole
  status: "active" | "inactive"
  createdAt: string
  dailyStats?: CallerDailyStats
  weeklyStats?: CallerWeeklyStats
  monthlyStats?: CallerMonthlyStats
}

export interface CallerDailyStats {
  date: string
  leadsImported: number
  leadsAssigned: number
  callsMade: number
  callDuration: number // in seconds
  leadsConverted: number
  dealsWon: number
  revenue: number
  followUpsScheduled: number
  lastActivityAt?: string
}

export interface CallerWeeklyStats {
  weekStart: string
  leadsImported: number
  callsMade: number
  dealsWon: number
  revenue: number
  avgCallDuration: number
  conversionRate: number
}

export interface CallerMonthlyStats {
  month: string
  leadsImported: number
  callsMade: number
  dealsWon: number
  revenue: number
  target: number
  achievement: number // percentage
}

export interface CallLog {
  id: string
  leadId: string
  callerId: string
  callerName: string
  type: "inbound" | "outbound"
  duration: number
  notes: string
  status: "completed" | "missed" | "in_progress"
  nextFollowUp?: string
  createdAt: string
}

export interface Activity {
  id: string
  leadId: string
  type: "created" | "assigned" | "stage_changed" | "call_logged" | "note_added" | "edited" | "deleted"
  description: string
  userId: string
  userName: string
  createdAt: string
}

export interface DashboardStats {
  activeLeads: number
  propertiesListed?: number
  dealsClosed: number
  scheduledViewings?: number
  newToday: number
  thisMonthDeals: number
  totalValue?: number
  hotLeads: number
  hotLeadsThisWeek?: number
  pipelineValue: number
  lastMonthActiveLeads?: number
  lastMonthPipelineValue?: number
  trendData?: Array<{
    day: string
    leads: number
    calls: number
    conversions: number
  }>
  revenueData?: Array<{
    month: string
    revenue: number
  }>
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  callerId?: string
}

export interface Meeting {
  id: string
  leadId: string
  leadName: string
  leadPhone: string
  leadEmail: string
  callerId: string
  callerName: string
  title: string
  description: string
  scheduledAt: string
  duration: number // in minutes
  timezone: string
  location?: string
  status: MeetingStatus
  notes?: string
  reminderSent: boolean
  createdAt: string
  updatedAt: string
}

export type BrokerStatus = "active" | "inactive"

export interface Broker {
  id: string
  name: string
  email?: string
  phone?: string
  company?: string
  commissionPercentage: number
  status: BrokerStatus
  notes?: string
  createdAt: string
  updatedAt: string
}
