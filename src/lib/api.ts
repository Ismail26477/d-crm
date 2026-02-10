const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    console.log("[v0] Current hostname:", hostname)

    // Local development - connect to backend server on port 5000
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      console.log("[v0] Localhost detected, connecting to backend on port 5000")
      return "http://localhost:5000/api"
    }

    // Production - use environment variable
    console.log("[v0] Production detected, checking VITE_API_URL")
    const envUrl = import.meta.env.VITE_API_URL
    if (envUrl) {
      console.log("[v0] Using VITE_API_URL:", envUrl)
      return envUrl
    }

    // Fallback if not set
    console.log("[v0] VITE_API_URL not set, using relative /api path")
    return "/api"
  }

  // Server-side fallback
  const envUrl = import.meta.env.VITE_API_URL
  return envUrl || "/api"
}

const API_BASE_URL = getApiBaseUrl()
console.log("[v0] Final API_BASE_URL:", API_BASE_URL)

// Leads
export const fetchLeads = async () => {
  const response = await fetch(`${API_BASE_URL}/leads`)
  if (!response.ok) throw new Error("Failed to fetch leads")
  const data = await response.json()
  // Normalize data to ensure all required string fields have default values
  return data.map((lead: any) => ({
    ...lead,
    name: lead.name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    city: lead.city || "",
  }))
}

export const createLead = async (leadData: any) => {
  // Ensure category and subcategory always have default values
  const dataWithDefaults = {
    ...leadData,
    category: leadData.category || "property",
    subcategory: leadData.subcategory || "india_property",
  }
  
  // Remove undefined and empty string values
  const cleanedData = Object.fromEntries(
    Object.entries(dataWithDefaults).filter(([_, v]) => v !== undefined && v !== "")
  )
  
  console.log("[v0] Sending to API:", cleanedData)
  
  const response = await fetch(`${API_BASE_URL}/leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cleanedData),
  })
  if (!response.ok) throw new Error("Failed to create lead")
  const result = await response.json()
  console.log("[v0] API response:", result)
  return result
}

export const updateLead = async (id: string, leadData: any) => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadData),
  })
  if (!response.ok) throw new Error("Failed to update lead")
  return response.json()
}

export const deleteLead = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/leads/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete lead")
  return response.json()
}

export const mergeDuplicateLeads = async (duplicateIds: string[], keepId: string) => {
  const response = await fetch(`${API_BASE_URL}/leads/merge-duplicates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ duplicateIds, keepId }),
  })
  if (!response.ok) throw new Error("Failed to merge duplicate leads")
  return response.json()
}

// Callers
export const fetchCallers = async () => {
  const response = await fetch(`${API_BASE_URL}/callers`)
  if (!response.ok) throw new Error("Failed to fetch callers")
  return response.json()
}

export const createCaller = async (callerData: any) => {
  const response = await fetch(`${API_BASE_URL}/callers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(callerData),
  })
  if (!response.ok) throw new Error("Failed to create caller")
  return response.json()
}

// Activities
export const fetchActivities = async () => {
  const response = await fetch(`${API_BASE_URL}/activities`)
  if (!response.ok) throw new Error("Failed to fetch activities")
  return response.json()
}

export const fetchLeadActivities = async (leadId: string) => {
  const response = await fetch(`${API_BASE_URL}/activities/lead/${leadId}`)
  if (!response.ok) throw new Error("Failed to fetch lead activities")
  return response.json()
}

// Call Logs
export const fetchCallLogs = async () => {
  const response = await fetch(`${API_BASE_URL}/call-logs`)
  if (!response.ok) throw new Error("Failed to fetch call logs")
  return response.json()
}

export const fetchLeadCallLogs = async (leadId: string) => {
  const response = await fetch(`${API_BASE_URL}/call-logs/lead/${leadId}`)
  if (!response.ok) throw new Error("Failed to fetch lead call logs")
  return response.json()
}

export const createCallLog = async (callLogData: any) => {
  const response = await fetch(`${API_BASE_URL}/call-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(callLogData),
  })
  if (!response.ok) throw new Error("Failed to create call log")
  return response.json()
}

// Dashboard
export const fetchDashboardStats = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`)
  if (!response.ok) throw new Error("Failed to fetch dashboard stats")
  return response.json()
}

// Reports
export const fetchReportStats = async () => {
  const response = await fetch(`${API_BASE_URL}/reports/stats`)
  if (!response.ok) throw new Error("Failed to fetch report stats")
  return response.json()
}

// Auth
export const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error("Invalid credentials")
  return response.json()
}

// Settings
export const fetchSettings = async () => {
  const response = await fetch(`${API_BASE_URL}/settings`)
  if (!response.ok) throw new Error("Failed to fetch settings")
  return response.json()
}

export const updateEmailSettings = async (emailConfig: any) => {
  const response = await fetch(`${API_BASE_URL}/settings/email`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailConfig),
  })
  if (!response.ok) throw new Error("Failed to update email settings")
  return response.json()
}

export const updateLeadAssignmentSettings = async (leadAssignment: any) => {
  const response = await fetch(`${API_BASE_URL}/settings/lead-assignment`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leadAssignment),
  })
  if (!response.ok) throw new Error("Failed to update lead assignment settings")
  return response.json()
}

// Meetings
export const fetchMeetings = async () => {
  const response = await fetch(`${API_BASE_URL}/meetings`)
  if (!response.ok) throw new Error("Failed to fetch meetings")
  return response.json()
}

export const fetchCallerMeetings = async (callerId: string) => {
  const response = await fetch(`${API_BASE_URL}/meetings/caller/${callerId}`)
  if (!response.ok) throw new Error("Failed to fetch caller meetings")
  return response.json()
}

export const fetchLeadMeetings = async (leadId: string) => {
  const response = await fetch(`${API_BASE_URL}/meetings/lead/${leadId}`)
  if (!response.ok) throw new Error("Failed to fetch lead meetings")
  return response.json()
}

export const fetchUpcomingMeetings = async () => {
  const response = await fetch(`${API_BASE_URL}/meetings/upcoming/all`)
  if (!response.ok) throw new Error("Failed to fetch upcoming meetings")
  return response.json()
}

export const createMeeting = async (meetingData: any) => {
  const response = await fetch(`${API_BASE_URL}/meetings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meetingData),
  })
  if (!response.ok) throw new Error("Failed to create meeting")
  return response.json()
}

export const updateMeeting = async (id: string, meetingData: any) => {
  const response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meetingData),
  })
  if (!response.ok) throw new Error("Failed to update meeting")
  return response.json()
}

export const deleteMeeting = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/meetings/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete meeting")
  return response.json()
}

// Currency Formatting
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

// Integrations
export const fetchIntegrations = async () => {
  const response = await fetch(`${API_BASE_URL}/integrations`)
  if (!response.ok) throw new Error("Failed to fetch integrations")
  return response.json()
}

export const fetchIntegration = async (type: string) => {
  const response = await fetch(`${API_BASE_URL}/integrations/${type}`)
  if (!response.ok) throw new Error("Failed to fetch integration")
  return response.json()
}

export const connectIntegration = async (type: string, credentials: any, config: any) => {
  const response = await fetch(`${API_BASE_URL}/integrations/${type}/connect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentials, config }),
  })
  if (!response.ok) throw new Error("Failed to connect integration")
  return response.json()
}

export const disconnectIntegration = async (type: string) => {
  const response = await fetch(`${API_BASE_URL}/integrations/${type}/disconnect`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  if (!response.ok) throw new Error("Failed to disconnect integration")
  return response.json()
}

export const syncIntegration = async (type: string) => {
  const response = await fetch(`${API_BASE_URL}/integrations/${type}/sync`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
  if (!response.ok) throw new Error("Failed to sync integration")
  return response.json()
}

// Follow-ups
export const fetchFollowUps = async () => {
  const url = `${API_BASE_URL}/followups`
  console.log("[v0] Fetching follow-ups from:", url)
  const response = await fetch(url)
  if (!response.ok) {
    console.error("[v0] Failed to fetch follow-ups. Status:", response.status)
    throw new Error("Failed to fetch follow-ups")
  }
  const followUps = await response.json()
  console.log("[v0] Fetched follow-ups:", followUps.length)
  
  // Sort by scheduled date, upcoming first
  return followUps.sort((a: any, b: any) => {
    const dateA = new Date(a.scheduledFor).getTime()
    const dateB = new Date(b.scheduledFor).getTime()
    return dateA - dateB
  })
}

export const fetchLeadFollowUps = async (leadId: string) => {
  const url = `${API_BASE_URL}/followups/lead/${leadId}`
  console.log("[v0] Fetching lead follow-ups from:", url)
  const response = await fetch(url)
  if (!response.ok) {
    console.error("[v0] Failed to fetch lead follow-ups. Status:", response.status)
    throw new Error("Failed to fetch lead follow-ups")
  }
  return response.json()
}

export const createFollowUp = async (followUpData: any) => {
  const url = `${API_BASE_URL}/followups`
  console.log("[v0] Creating follow-up at URL:", url)
  console.log("[v0] Payload:", JSON.stringify(followUpData, null, 2))
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(followUpData),
  })
  
  console.log("[v0] Response status:", response.status)
  console.log("[v0] Response headers:", {
    contentType: response.headers.get("content-type"),
    contentLength: response.headers.get("content-length"),
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error("[v0] Failed to create follow-up. Status:", response.status)
    console.error("[v0] Error response:", errorText)
    throw new Error(`Failed to create follow-up (${response.status}): ${errorText}`)
  }
  
  const result = await response.json()
  console.log("[v0] ✅ Follow-up created successfully:", result)
  return result
}

export const updateFollowUp = async (id: string, followUpData: any) => {
  const response = await fetch(`${API_BASE_URL}/followups/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(followUpData),
  })
  if (!response.ok) throw new Error("Failed to update follow-up")
  return response.json()
}

export const deleteFollowUp = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/followups/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete follow-up")
  return response.json()
}

// Brokers
export const fetchBrokers = async () => {
  const response = await fetch(`${API_BASE_URL}/brokers`)
  if (!response.ok) throw new Error("Failed to fetch brokers")
  const brokers = await response.json()
  console.log("[v0] Raw brokers from API:", brokers)
  
  // Map _id to id for consistency
  const mappedBrokers = brokers.map((broker: any) => ({
    ...broker,
    id: broker._id || broker.id,
  }))
  console.log("[v0] Mapped brokers:", mappedBrokers)
  return mappedBrokers
}

export const createBroker = async (brokerData: any) => {
  const response = await fetch(`${API_BASE_URL}/brokers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brokerData),
  })
  if (!response.ok) throw new Error("Failed to create broker")
  return response.json()
}

export const updateBroker = async (id: string, brokerData: any) => {
  const response = await fetch(`${API_BASE_URL}/brokers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(brokerData),
  })
  if (!response.ok) throw new Error("Failed to update broker")
  return response.json()
}

export const deleteBroker = async (id: string) => {
  const response = await fetch(`${API_BASE_URL}/brokers/${id}`, {
    method: "DELETE",
  })
  if (!response.ok) throw new Error("Failed to delete broker")
  return response.json()
}

export const assignBrokerToLead = async (brokerId: string, leadId: string) => {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/assign-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId }),
  })
  if (!response.ok) throw new Error("Failed to assign broker to lead")
  return response.json()
}

export const removeBrokerFromLead = async (brokerId: string, leadId: string) => {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/remove-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId }),
  })
  if (!response.ok) throw new Error("Failed to remove broker from lead")
  return response.json()
}

export const fetchBrokerLeads = async (brokerId: string) => {
  const response = await fetch(`${API_BASE_URL}/brokers/${brokerId}/leads`)
  if (!response.ok) throw new Error("Failed to fetch broker leads")
  return response.json()
}
