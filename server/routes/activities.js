import express from "express"
import Activity from "../models/Activity.js"

const router = express.Router()

// Get activities for a lead
router.get("/lead/:leadId", async (req, res) => {
  try {
    const activities = await Activity.find({ leadId: req.params.leadId }).sort({ createdAt: -1 })

    const formattedActivities = activities.map((activity) => ({
      id: activity._id.toString(),
      leadId: activity.leadId.toString(),
      type: activity.type,
      description: activity.description,
      userId: activity.userId?.toString(),
      userName: activity.userName,
      createdAt: activity.createdAt,
    }))

    res.json(formattedActivities)
  } catch (error) {
    res.status(500).json({ message: "Error fetching activities", error: error.message })
  }
})

// Get all activities
router.get("/", async (req, res) => {
  try {
    const activities = await Activity.find().sort({ createdAt: -1 }).limit(50)

    const formattedActivities = activities.map((activity) => ({
      id: activity._id.toString(),
      leadId: activity.leadId.toString(),
      type: activity.type,
      description: activity.description,
      userId: activity.userId?.toString(),
      userName: activity.userName,
      createdAt: activity.createdAt,
    }))

    res.json(formattedActivities)
  } catch (error) {
    res.status(500).json({ message: "Error fetching activities", error: error.message })
  }
})

// Create activity
router.post("/", async (req, res) => {
  try {
    const activity = new Activity(req.body)
    await activity.save()

    res.status(201).json({
      id: activity._id.toString(),
      ...activity.toObject(),
    })
  } catch (error) {
    res.status(500).json({ message: "Error creating activity", error: error.message })
  }
})

export default router
