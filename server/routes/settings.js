import express from "express"
import Settings from "../models/Settings.js"

const router = express.Router()

// Get settings
router.get("/", async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: "global" })

    // Create default settings if none exist
    if (!settings) {
      settings = new Settings({
        type: "global",
        emailConfig: {
          smtpServer: "smtp.gmail.com",
          smtpPort: "587",
          senderEmail: "",
          senderPassword: "",
          enableNotifications: false,
          notifyOnAssignment: false,
          notifyOnStageChange: false,
        },
        leadAssignment: {
          autoAssign: false,
          roundRobin: false,
          defaultStage: "new",
          defaultCallType: "outbound",
          defaultFollowUpHours: 24,
        },
      })
      await settings.save()
    }

    res.json(settings)
  } catch (error) {
    res.status(500).json({ message: "Error fetching settings", error: error.message })
  }
})

// Update email settings
router.put("/email", async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: "global" })

    if (!settings) {
      settings = new Settings({ type: "global" })
    }

    settings.emailConfig = {
      ...settings.emailConfig,
      ...req.body,
    }

    await settings.save()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ message: "Error updating email settings", error: error.message })
  }
})

// Update lead assignment settings
router.put("/lead-assignment", async (req, res) => {
  try {
    let settings = await Settings.findOne({ type: "global" })

    if (!settings) {
      settings = new Settings({ type: "global" })
    }

    settings.leadAssignment = {
      ...settings.leadAssignment,
      ...req.body,
    }

    await settings.save()
    res.json(settings)
  } catch (error) {
    res.status(500).json({ message: "Error updating lead assignment settings", error: error.message })
  }
})

export default router
