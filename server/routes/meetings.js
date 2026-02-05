import express from "express"
import Meeting from "../models/Meeting.js"
import Activity from "../models/Activity.js"

const router = express.Router()

// Get all meetings
router.get("/", async (req, res) => {
  try {
    const meetings = await Meeting.find().sort({ scheduledAt: 1 })

    const formattedMeetings = meetings.map((meeting) => ({
      id: meeting._id.toString(),
      leadId: meeting.leadId?.toString(),
      leadName: meeting.leadName,
      leadPhone: meeting.leadPhone,
      leadEmail: meeting.leadEmail,
      callerId: meeting.callerId?.toString(),
      callerName: meeting.callerName,
      title: meeting.title,
      description: meeting.description,
      scheduledAt: meeting.scheduledAt,
      duration: meeting.duration,
      timezone: meeting.timezone,
      location: meeting.location,
      status: meeting.status,
      notes: meeting.notes,
      reminderSent: meeting.reminderSent,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    }))

    res.json(formattedMeetings)
  } catch (error) {
    res.status(500).json({ message: "Error fetching meetings", error: error.message })
  }
})

// Get meetings for a caller
router.get("/caller/:callerId", async (req, res) => {
  try {
    const meetings = await Meeting.find({
      callerId: req.params.callerId,
      status: "scheduled",
      scheduledAt: { $gte: new Date() },
    }).sort({ scheduledAt: 1 })

    const formattedMeetings = meetings.map((meeting) => ({
      id: meeting._id.toString(),
      leadId: meeting.leadId?.toString(),
      leadName: meeting.leadName,
      leadPhone: meeting.leadPhone,
      leadEmail: meeting.leadEmail,
      callerId: meeting.callerId?.toString(),
      callerName: meeting.callerName,
      title: meeting.title,
      description: meeting.description,
      scheduledAt: meeting.scheduledAt,
      duration: meeting.duration,
      timezone: meeting.timezone,
      location: meeting.location,
      status: meeting.status,
      notes: meeting.notes,
      reminderSent: meeting.reminderSent,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    }))

    res.json(formattedMeetings)
  } catch (error) {
    res.status(500).json({ message: "Error fetching caller meetings", error: error.message })
  }
})

// Get meetings for a lead
router.get("/lead/:leadId", async (req, res) => {
  try {
    const meetings = await Meeting.find({ leadId: req.params.leadId }).sort({ scheduledAt: -1 })

    const formattedMeetings = meetings.map((meeting) => ({
      id: meeting._id.toString(),
      leadId: meeting.leadId?.toString(),
      leadName: meeting.leadName,
      leadPhone: meeting.leadPhone,
      leadEmail: meeting.leadEmail,
      callerId: meeting.callerId?.toString(),
      callerName: meeting.callerName,
      title: meeting.title,
      description: meeting.description,
      scheduledAt: meeting.scheduledAt,
      duration: meeting.duration,
      timezone: meeting.timezone,
      location: meeting.location,
      status: meeting.status,
      notes: meeting.notes,
      reminderSent: meeting.reminderSent,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    }))

    res.json(formattedMeetings)
  } catch (error) {
    res.status(500).json({ message: "Error fetching lead meetings", error: error.message })
  }
})

// Create new meeting
router.post("/", async (req, res) => {
  try {
    console.log("[v0] Creating meeting with data:", req.body)

    const meeting = new Meeting(req.body)
    await meeting.save()

    console.log("[v0] Meeting created successfully:", meeting._id)

    // Create activity
    const activity = new Activity({
      leadId: meeting.leadId,
      type: "created",
      description: `Meeting scheduled: "${meeting.title}" on ${new Date(meeting.scheduledAt).toLocaleString()}`,
      userName: meeting.callerName,
    })
    await activity.save()

    res.status(201).json({
      id: meeting._id.toString(),
      ...meeting.toObject(),
    })
  } catch (error) {
    console.error("[v0] Error creating meeting:", error)
    res.status(500).json({ message: "Error creating meeting", error: error.message })
  }
})

// Update meeting
router.put("/:id", async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(req.params.id, req.body, { new: true })

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" })
    }

    // Create activity if status changed
    if (req.body.status && req.body.status !== meeting.status) {
      const activity = new Activity({
        leadId: meeting.leadId,
        type: "updated",
        description: `Meeting status changed to: ${req.body.status}`,
        userName: "System",
      })
      await activity.save()
    }

    res.json({
      id: meeting._id.toString(),
      ...meeting.toObject(),
    })
  } catch (error) {
    res.status(500).json({ message: "Error updating meeting", error: error.message })
  }
})

// Delete meeting
router.delete("/:id", async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id)

    if (!meeting) {
      return res.status(404).json({ message: "Meeting not found" })
    }

    res.json({ message: "Meeting deleted successfully" })
  } catch (error) {
    res.status(500).json({ message: "Error deleting meeting", error: error.message })
  }
})

// Get upcoming meetings (next 7 days)
router.get("/upcoming/all", async (req, res) => {
  try {
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const meetings = await Meeting.find({
      status: "scheduled",
      scheduledAt: {
        $gte: now,
        $lte: sevenDaysFromNow,
      },
    }).sort({ scheduledAt: 1 })

    const formattedMeetings = meetings.map((meeting) => ({
      id: meeting._id.toString(),
      leadId: meeting.leadId?.toString(),
      leadName: meeting.leadName,
      leadPhone: meeting.leadPhone,
      leadEmail: meeting.leadEmail,
      callerId: meeting.callerId?.toString(),
      callerName: meeting.callerName,
      title: meeting.title,
      description: meeting.description,
      scheduledAt: meeting.scheduledAt,
      duration: meeting.duration,
      timezone: meeting.timezone,
      location: meeting.location,
      status: meeting.status,
      notes: meeting.notes,
      reminderSent: meeting.reminderSent,
      createdAt: meeting.createdAt,
      updatedAt: meeting.updatedAt,
    }))

    res.json(formattedMeetings)
  } catch (error) {
    res.status(500).json({ message: "Error fetching upcoming meetings", error: error.message })
  }
})

export default router
