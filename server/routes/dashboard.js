import express from "express"
import Lead from "../models/Lead.js"
import CallLog from "../models/CallLog.js"

const router = express.Router()

// Get dashboard statistics
router.get("/stats", async (req, res) => {
  try {
    console.log("[v0] Fetching dashboard stats...")

    const activeLeads = await Lead.countDocuments({ status: "active" })
    const dealsClosed = await Lead.countDocuments({ stage: "won" })
    const hotLeads = await Lead.countDocuments({ priority: "hot", status: "active" })

    // Get today's leads
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const newToday = await Lead.countDocuments({
      createdAt: { $gte: today },
    })

    // Get this week's hot leads
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const hotLeadsThisWeek = await Lead.countDocuments({
      priority: "hot",
      createdAt: { $gte: oneWeekAgo },
    })

    // Get this month's deals
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const thisMonthDeals = await Lead.countDocuments({
      stage: "won",
      updatedAt: { $gte: firstDayOfMonth },
    })

    // Calculate total pipeline value (all active leads)
    const activeLeadsData = await Lead.find({ status: "active" })
    const pipelineValue = activeLeadsData.reduce((sum, lead) => sum + (lead.value || 0), 0)

    // Get last month stats for comparison
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    const lastMonthActiveLeads = await Lead.countDocuments({
      status: "active",
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    })

    const lastMonthLeadsData = await Lead.find({
      status: "active",
      createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd },
    })
    const lastMonthPipelineValue = lastMonthLeadsData.reduce((sum, lead) => sum + (lead.value || 0), 0)

    const trendData = []
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(nextDate.getDate() + 1)

      const dayLeads = await Lead.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      })

      const dayCalls = await CallLog.countDocuments({
        createdAt: { $gte: date, $lt: nextDate },
      })

      const dayConversions = await Lead.countDocuments({
        stage: "won",
        updatedAt: { $gte: date, $lt: nextDate },
      })

      trendData.push({
        day: days[date.getDay()],
        leads: dayLeads,
        calls: dayCalls,
        conversions: dayConversions,
      })
    }

    const revenueData = []
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1)
      const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 0)

      const monthWonLeads = await Lead.find({
        stage: "won",
        updatedAt: { $gte: monthStart, $lte: monthEnd },
      })

      const monthRevenue = monthWonLeads.reduce((sum, lead) => sum + (lead.value || 0), 0) / 100000 // Convert to lakhs

      revenueData.push({
        month: months[monthStart.getMonth()],
        revenue: Math.round(monthRevenue),
      })
    }

    console.log("[v0] Dashboard stats:", {
      activeLeads,
      hotLeads,
      dealsClosed,
      pipelineValue,
      trendDataPoints: trendData.length,
      revenueDataPoints: revenueData.length,
    })

    res.json({
      activeLeads,
      hotLeads,
      hotLeadsThisWeek,
      dealsClosed,
      thisMonthDeals,
      pipelineValue,
      newToday,
      lastMonthActiveLeads,
      lastMonthPipelineValue,
      trendData,
      revenueData,
    })
  } catch (error) {
    console.error("[v0] Error fetching dashboard stats:", error)
    res.status(500).json({ message: "Error fetching dashboard stats", error: error.message })
  }
})

export default router
