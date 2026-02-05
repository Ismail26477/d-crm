import express from "express"
import CallLog from "../models/CallLog.js"
import Lead from "../models/Lead.js"

const router = express.Router()

// Get daily stats for a specific caller
router.get("/caller/:callerId/daily", async (req, res) => {
  try {
    const { callerId } = req.params
    const days = req.query.days ? parseInt(req.query.days) : 7

    console.log("[v0] Fetching daily stats for caller:", callerId, "days:", days)

    // Get date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch call logs for this caller
    const callLogs = await CallLog.find({
      callerId: callerId,
      createdAt: { $gte: startDate, $lte: endDate },
    })

    // Fetch leads assigned to this caller
    const leads = await Lead.find({
      assignedCaller: callerId,
      createdAt: { $gte: startDate, $lte: endDate },
    })

    // Group call logs by date
    const dailyStats = {}
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(endDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split("T")[0]

      dailyStats[dateStr] = {
        date: dateStr,
        dayName: date.toLocaleDateString("en-US", { weekday: "short" }),
        callsCount: 0,
        completedCalls: 0,
        missedCalls: 0,
        cancelledCalls: 0,
        totalDuration: 0,
        leadsImported: 0,
        leadsWon: 0,
        revenue: 0,
      }
    }

    // Count calls per date
    callLogs.forEach((call) => {
      const dateStr = call.createdAt.toISOString().split("T")[0]
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].callsCount += 1
        dailyStats[dateStr].totalDuration += call.duration || 0

        // Count by status
        if (call.status === "completed") {
          dailyStats[dateStr].completedCalls += 1
        } else if (call.status === "missed") {
          dailyStats[dateStr].missedCalls += 1
        } else if (call.status === "cancelled") {
          dailyStats[dateStr].cancelledCalls += 1
        }
      }
    })

    // Count leads per date
    leads.forEach((lead) => {
      const dateStr = lead.createdAt.toISOString().split("T")[0]
      if (dailyStats[dateStr]) {
        dailyStats[dateStr].leadsImported += 1
        // Count won leads (assuming there's a stage field)
        if (lead.stage === "won") {
          dailyStats[dateStr].leadsWon += 1
          dailyStats[dateStr].revenue += lead.value || 0
        }
      }
    })

    const statsArray = Object.values(dailyStats).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    )

    console.log("[v0] Daily stats calculated:", statsArray)
    res.json(statsArray)
  } catch (error) {
    console.error("[v0] Error fetching daily stats:", error)
    res.status(500).json({ error: error.message })
  }
})

// Get today's stats for a caller
router.get("/caller/:callerId/today", async (req, res) => {
  try {
    const { callerId } = req.params

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    console.log("[v0] Fetching today's stats for caller:", callerId)

    const todayCallLogs = await CallLog.find({
      callerId: callerId,
      createdAt: { $gte: today, $lt: tomorrow },
    })

    const todayLeads = await Lead.find({
      assignedCaller: callerId,
      createdAt: { $gte: today, $lt: tomorrow },
    })

    const todayWonLeads = todayLeads.filter((l) => l.stage === "won")

    const stats = {
      date: today.toISOString().split("T")[0],
      callsCount: todayCallLogs.length,
      completedCalls: todayCallLogs.filter((c) => c.status === "completed").length,
      missedCalls: todayCallLogs.filter((c) => c.status === "missed").length,
      cancelledCalls: todayCallLogs.filter((c) => c.status === "cancelled").length,
      totalDuration: todayCallLogs.reduce((sum, c) => sum + (c.duration || 0), 0),
      leadsImported: todayLeads.length,
      leadsWon: todayWonLeads.length,
      revenue: todayWonLeads.reduce((sum, l) => sum + (l.value || 0), 0),
    }

    console.log("[v0] Today's stats:", stats)
    res.json(stats)
  } catch (error) {
    console.error("[v0] Error fetching today's stats:", error)
    res.status(500).json({ error: error.message })
  }
})

export default router
