import express from "express"
import CallLog from "../models/CallLog.js"

const router = express.Router()

// Get call logs for a lead
router.get("/lead/:leadId", async (req, res) => {
  try {
    const callLogs = await CallLog.find({ leadId: req.params.leadId }).sort({ createdAt: -1 })

    const formattedLogs = callLogs.map((log) => ({
      id: log._id.toString(),
      leadId: log.leadId.toString(),
      callerId: log.callerId.toString(),
      callerName: log.callerName,
      type: log.type,
      duration: log.duration,
      notes: log.notes,
      status: log.status,
      nextFollowUp: log.nextFollowUp,
      createdAt: log.createdAt,
    }))

    res.json(formattedLogs)
  } catch (error) {
    res.status(500).json({ message: "Error fetching call logs", error: error.message })
  }
})

// Get all call logs
router.get("/", async (req, res) => {
  try {
    const callLogs = await CallLog.find().sort({ createdAt: -1 })

    const formattedLogs = callLogs.map((log) => ({
      id: log._id.toString(),
      leadId: log.leadId.toString(),
      callerId: log.callerId.toString(),
      callerName: log.callerName,
      type: log.type,
      duration: log.duration,
      notes: log.notes,
      status: log.status,
      nextFollowUp: log.nextFollowUp,
      createdAt: log.createdAt,
    }))

    res.json(formattedLogs)
  } catch (error) {
    res.status(500).json({ message: "Error fetching call logs", error: error.message })
  }
})

// Create call log
router.post("/", async (req, res) => {
  try {
    const callLog = new CallLog(req.body)
    await callLog.save()

    res.status(201).json({
      id: callLog._id.toString(),
      ...callLog.toObject(),
    })
  } catch (error) {
    res.status(500).json({ message: "Error creating call log", error: error.message })
  }
})

export default router
