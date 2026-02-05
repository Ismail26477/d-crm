import express from "express"
import FollowUp from "../models/FollowUp.js"

const router = express.Router()

// Get pending reminders
router.get("/", async (req, res) => {
  try {
    const { status } = req.query
    const query = status ? { status } : {}

    const reminders = await FollowUp.find({
      ...query,
      status: { $in: ["pending", "completed"] },
      reminderSent: false,
      scheduledFor: { $lte: new Date() },
    })
      .populate("leadId", "name phone email")
      .sort({ scheduledFor: 1 })

    res.json(reminders)
  } catch (error) {
    res.status(500).json({ message: "Error fetching reminders", error: error.message })
  }
})

// Mark reminder as sent
router.patch("/:id", async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndUpdate(
      req.params.id,
      {
        reminderSent: true,
        reminderSentAt: new Date(),
      },
      { new: true },
    )

    if (!followUp) {
      return res.status(404).json({ message: "Reminder not found" })
    }

    res.json({ message: "Reminder marked as sent", followUp })
  } catch (error) {
    res.status(500).json({ message: "Error updating reminder", error: error.message })
  }
})

export default router
