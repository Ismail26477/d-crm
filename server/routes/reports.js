import express from "express"
import Lead from "../models/Lead.js"
import CallLog from "../models/CallLog.js"
import Caller from "../models/Caller.js"

const router = express.Router()

// Get comprehensive report stats
router.get("/stats", async (req, res) => {
  try {
    const leads = await Lead.find()
    const callLogs = await CallLog.find()
    const callers = await Caller.find().select("-password")

    // Caller performance
    const callerPerformance = await Promise.all(
      callers.map(async (caller) => {
        const assignedLeads = leads.filter((l) => l.assignedCaller?.toString() === caller._id.toString())
        const callerCalls = callLogs.filter((c) => c.callerId?.toString() === caller._id.toString())
        const wonDeals = assignedLeads.filter((l) => l.stage === "won")
        const totalValue = wonDeals.reduce((sum, lead) => sum + lead.value, 0)
        const avgCallDuration =
          callerCalls.length > 0 ? callerCalls.reduce((sum, call) => sum + call.duration, 0) / callerCalls.length : 0
        const conversionRate = assignedLeads.length > 0 ? (wonDeals.length / assignedLeads.length) * 100 : 0
        const activeLeads = assignedLeads.filter((l) => l.status === "active")
        const followUpsScheduled = assignedLeads.filter((l) => l.nextFollowUp)

        return {
          id: caller._id.toString(),
          name: caller.name,
          leadsAssigned: assignedLeads.length,
          callsMade: callerCalls.length,
          dealsWon: wonDeals.length,
          totalValue,
          avgCallDuration: Math.round(avgCallDuration),
          conversionRate: Math.round(conversionRate),
          activeLeads: activeLeads.length,
          followUpsScheduled: followUpsScheduled.length,
        }
      }),
    )

    // Lead source distribution
    const sourceData = {}
    leads.forEach((lead) => {
      sourceData[lead.source] = (sourceData[lead.source] || 0) + 1
    })

    // Stage distribution
    const stageData = [
      { name: "New Lead", value: leads.filter((l) => l.stage === "new").length, color: "#0EA5E9" },
      { name: "Qualified", value: leads.filter((l) => l.stage === "qualified").length, color: "#8B5CF6" },
      { name: "Proposal", value: leads.filter((l) => l.stage === "proposal").length, color: "#F59E0B" },
      { name: "Negotiation", value: leads.filter((l) => l.stage === "negotiation").length, color: "#F97316" },
      { name: "Won", value: leads.filter((l) => l.stage === "won").length, color: "#22C55E" },
      { name: "Lost", value: leads.filter((l) => l.stage === "lost").length, color: "#EF4444" },
    ]

    // Priority distribution
    const priorityData = [
      { name: "Hot", value: leads.filter((l) => l.priority === "hot").length, color: "#EF4444" },
      { name: "Warm", value: leads.filter((l) => l.priority === "warm").length, color: "#F97316" },
      { name: "Cold", value: leads.filter((l) => l.priority === "cold").length, color: "#0EA5E9" },
    ]

    // Revenue by category
    const revenueByCategory = [
      {
        name: "Dubai Property",
        value: leads
          .filter((l) => l.category === "dubai_property" && l.stage === "won")
          .reduce((sum, l) => sum + l.value, 0),
      },
      {
        name: "India Property",
        value: leads
          .filter((l) => l.category === "india_property" && l.stage === "won")
          .reduce((sum, l) => sum + l.value, 0),
      },
      {
        name: "Australia Property",
        value: leads
          .filter((l) => l.category === "australia_property" && l.stage === "won")
          .reduce((sum, l) => sum + l.value, 0),
      },
      {
        name: "Loans",
        value: leads.filter((l) => l.category === "loans" && l.stage === "won").reduce((sum, l) => sum + l.value, 0),
      },
    ].filter((item) => item.value > 0)

    // Call analytics
    const callAnalytics = {
      totalCalls: callLogs.length,
      avgCallDuration:
        callLogs.length > 0 ? Math.round(callLogs.reduce((sum, call) => sum + call.duration, 0) / callLogs.length) : 0,
      completedCalls: callLogs.filter((c) => c.status === "completed").length,
      followUpsScheduled: callLogs.filter((c) => c.nextFollowUp).length,
    }

    // Quick stats
    const stats = {
      activeListings: leads.filter((l) => l.status === "active").length,
      pipelineValue: leads.reduce((sum, l) => sum + l.value, 0),
      soldThisMonth: leads.filter((l) => l.stage === "won").length,
      avgDaysOnMarket: 28, // This could be calculated from lead creation dates
      totalCalls: callAnalytics.totalCalls,
      activeCallers: callers.filter((c) => c.status === "active").length,
    }

    // Monthly trend (mock for now, can be calculated from actual dates)
    const monthlyData = [
      { month: "Jul", leads: 45, deals: 8, value: 12500000, calls: 180 },
      { month: "Aug", leads: 52, deals: 12, value: 18000000, calls: 220 },
      { month: "Sep", leads: 48, deals: 10, value: 15500000, calls: 195 },
      { month: "Oct", leads: 65, deals: 15, value: 22000000, calls: 280 },
      { month: "Nov", leads: 58, deals: 11, value: 17500000, calls: 240 },
      {
        month: "Dec",
        leads: leads.length,
        deals: leads.filter((l) => l.stage === "won").length,
        value: stats.pipelineValue,
        calls: callLogs.length,
      },
    ]

    res.json({
      callerPerformance,
      sourceData,
      stageData,
      priorityData,
      revenueByCategory,
      callAnalytics,
      stats,
      monthlyData,
    })
  } catch (error) {
    console.error("Error fetching report stats:", error)
    res.status(500).json({ message: "Error fetching report stats", error: error.message })
  }
})

export default router
